import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronUp, ChevronDown, ZoomIn, ZoomOut, ShieldAlert, Loader2 } from 'lucide-react';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import { Book } from '../../types';
import { fetchBookBytes } from '../../services/bookService';
import { setSecureScreen } from '../../lib/secureScreen';
import { useLanguage } from '../../context/LanguageContext';

interface BookReaderProps {
  book: Book;
  /** Printed faintly on every page: who is reading (discourages sharing screenshots) */
  readerLabel: string;
  userId: string;
  onClose: () => void;
}

const progressKey = (userId: string, bookId: string) => `kukutrack_book_page:${userId}:${bookId}`;

/** Draws the reader's name across the page so a leaked screenshot can be traced back. */
const stampWatermark = (ctx: CanvasRenderingContext2D, w: number, h: number, label: string) => {
  ctx.save();
  ctx.globalAlpha = 0.13;
  ctx.fillStyle = '#334155';
  const size = Math.max(14, Math.round(w / 28));
  ctx.font = `600 ${size}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.translate(w / 2, h / 2);
  ctx.rotate(-Math.PI / 6);
  const stepY = size * 5;
  const reach = Math.hypot(w, h);
  for (let y = -reach; y < reach; y += stepY) {
    for (let x = -reach; x < reach; x += size * label.length * 0.9 + size * 3) {
      ctx.fillText(label, x, y);
    }
  }
  ctx.restore();
};

interface PageProps {
  pdf: PDFDocumentProxy;
  pageNumber: number;
  width: number;
  ratio: number;
  label: string;
  onVisible: (n: number) => void;
}

/** One page, drawn to a canvas only while it is near the screen (keeps memory low on phones). */
const PageCanvas: React.FC<PageProps> = ({ pdf, pageNumber, width, ratio, label, onVisible }) => {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [near, setNear] = useState(pageNumber <= 2);
  const [height, setHeight] = useState(Math.round(width * ratio));

  useEffect(() => {
    setHeight(Math.round(width * ratio));
  }, [width, ratio]);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const near = new IntersectionObserver((entries) => setNear(entries.some((e) => e.isIntersecting)), { rootMargin: '900px 0px' });
    const seen = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting && e.intersectionRatio >= 0.5)) onVisible(pageNumber);
      },
      { threshold: [0.5] }
    );
    near.observe(el);
    seen.observe(el);
    return () => {
      near.disconnect();
      seen.disconnect();
    };
  }, [pageNumber, onVisible]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (!near) {
      // Free the memory of pages that are far away
      canvas.width = 0;
      canvas.height = 0;
      return;
    }
    let cancelled = false;
    let task: { cancel: () => void; promise: Promise<unknown> } | null = null;
    (async () => {
      try {
        const page = await pdf.getPage(pageNumber);
        if (cancelled) return;
        const base = page.getViewport({ scale: 1 });
        const cssScale = width / base.width;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const viewport = page.getViewport({ scale: cssScale * dpr });
        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);
        canvas.style.width = `${Math.floor(width)}px`;
        canvas.style.height = `${Math.floor(viewport.height / dpr)}px`;
        setHeight(Math.floor(viewport.height / dpr));
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        task = page.render({ canvas, canvasContext: ctx, viewport });
        await task.promise;
        if (!cancelled) stampWatermark(ctx, canvas.width, canvas.height, label);
      } catch {
        // cancelled or failed render: the placeholder stays
      }
    })();
    return () => {
      cancelled = true;
      try {
        task?.cancel();
      } catch {
        // already finished
      }
    };
  }, [near, pdf, pageNumber, width, label]);

  return (
    <div
      ref={wrapRef}
      data-page={pageNumber}
      className="mx-auto bg-white shadow-lg overflow-hidden"
      style={{ width, height, maxWidth: '100%' }}
    >
      {/* pointer-events none: no long-press "save image", no dragging */}
      <canvas ref={canvasRef} draggable={false} style={{ pointerEvents: 'none', display: 'block' }} aria-label={`Page ${pageNumber}`} />
    </div>
  );
};

export const BookReader: React.FC<BookReaderProps> = ({ book, readerLabel, userId, onClose }) => {
  const { lang } = useLanguage();
  const isSw = lang === 'sw';

  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [error, setError] = useState('');
  const [pdf, setPdf] = useState<PDFDocumentProxy | null>(null);
  const [ratio, setRatio] = useState(1.414);
  const [page, setPage] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [containerWidth, setContainerWidth] = useState(0);
  const [shielded, setShielded] = useState(false);
  // Tap the page to hide the toolbar for the most reading room
  const [barVisible, setBarVisible] = useState(true);

  const scrollRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const restored = useRef(false);

  // ---- Android: block screenshots and screen recording while a book is open
  useEffect(() => {
    void setSecureScreen(true);
    return () => {
      void setSecureScreen(false);
    };
  }, []);

  // ---- Load the PDF into memory only (no file, no link, no download)
  useEffect(() => {
    let cancelled = false;
    let loadingTask: { destroy: () => Promise<void> } | null = null;
    (async () => {
      try {
        const [pdfjs, worker, bytes] = await Promise.all([
          import('pdfjs-dist/legacy/build/pdf.mjs'),
          import('pdfjs-dist/legacy/build/pdf.worker.min.mjs?url'),
          fetchBookBytes(book.storage_path),
        ]);
        pdfjs.GlobalWorkerOptions.workerSrc = (worker as { default: string }).default;
        const task = pdfjs.getDocument({
          data: new Uint8Array(bytes),
          enableXfa: false,
        });
        loadingTask = task;
        const loaded = await task.promise;
        if (cancelled) {
          void task.destroy();
          return;
        }
        const first = await loaded.getPage(1);
        const vp = first.getViewport({ scale: 1 });
        setRatio(vp.height / vp.width);
        setPdf(loaded);
        setStatus('ready');
      } catch (err: any) {
        if (cancelled) return;
        setError(err?.message || (isSw ? 'Imeshindwa kufungua kitabu.' : 'Could not open this book.'));
        setStatus('error');
      }
    })();
    return () => {
      cancelled = true;
      // Throws the book out of memory
      void loadingTask?.destroy();
    };
  }, [book.storage_path, isSw]);

  // ---- Page width follows the screen
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    // Phones: the page uses the whole screen width. Bigger screens: a comfortable reading width, centred.
    const measure = () => {
      const w = el.clientWidth;
      setContainerWidth(w < 700 ? w : Math.min(w - 48, 1100));
    };
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [status]);

  const pageWidth = Math.round(containerWidth * zoom);

  // ---- Remember where the reader stopped
  const onVisible = useCallback(
    (n: number) => {
      setPage(n);
      try {
        localStorage.setItem(progressKey(userId, book.id), String(n));
      } catch {
        // storage unavailable
      }
    },
    [userId, book.id]
  );

  useEffect(() => {
    if (status !== 'ready' || restored.current || pageWidth === 0) return;
    restored.current = true;
    let saved = 1;
    try {
      saved = Number(localStorage.getItem(progressKey(userId, book.id))) || 1;
    } catch {
      saved = 1;
    }
    if (saved > 1) {
      window.setTimeout(() => {
        scrollRef.current?.querySelector(`[data-page="${saved}"]`)?.scrollIntoView({ block: 'start' });
      }, 120);
    }
  }, [status, pageWidth, userId, book.id]);

  const goTo = (n: number) => {
    const total = pdf?.numPages || 1;
    const target = Math.min(Math.max(1, n), total);
    scrollRef.current?.querySelector(`[data-page="${target}"]`)?.scrollIntoView({ block: 'start', behavior: 'smooth' });
  };

  // ---- Copy / save / print protection (deterrents; see the notes in the library screen)
  useEffect(() => {
    const blockKeys = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey;
      const k = e.key.toLowerCase();
      if (mod && ['s', 'p', 'c', 'x', 'a', 'u'].includes(k)) {
        e.preventDefault();
        e.stopPropagation();
      }
      if (k === 'printscreen') {
        setShielded(true);
        try {
          void navigator.clipboard?.writeText('');
        } catch {
          // clipboard not available
        }
      }
      if (k === 'escape') onClose();
    };
    const afterKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'printscreen') {
        try {
          void navigator.clipboard?.writeText('');
        } catch {
          // clipboard not available
        }
        window.setTimeout(() => setShielded(false), 800);
      }
    };
    // Leaving the window / tab hides the pages until the reader comes back
    const hide = () => setShielded(true);
    const show = () => window.setTimeout(() => setShielded(document.visibilityState === 'hidden'), 150);
    const onVis = () => (document.visibilityState === 'hidden' ? hide() : show());

    document.addEventListener('keydown', blockKeys, true);
    document.addEventListener('keyup', afterKey, true);
    window.addEventListener('blur', hide);
    window.addEventListener('focus', show);
    document.addEventListener('visibilitychange', onVis);
    return () => {
      document.removeEventListener('keydown', blockKeys, true);
      document.removeEventListener('keyup', afterKey, true);
      window.removeEventListener('blur', hide);
      window.removeEventListener('focus', show);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [onClose]);

  const pages = useMemo(() => Array.from({ length: pdf?.numPages || 0 }, (_, i) => i + 1), [pdf]);
  const block = (e: React.SyntheticEvent) => e.preventDefault();

  const reader = (
    <div
      ref={rootRef}
      className="kuku-secure-reader fixed inset-0 z-[110] flex flex-col bg-[#0b1213] text-white select-none"
      data-testid="book-reader"
      style={{ WebkitUserSelect: 'none', userSelect: 'none', WebkitTouchCallout: 'none' }}
      onContextMenu={block}
      onCopy={block}
      onCut={block}
      onDragStart={block}
      role="dialog"
      aria-modal="true"
      aria-label={book.title}
    >
      {/* Top bar (tap the page to hide or show it) */}
      <div
        className={`shrink-0 flex items-center gap-2 px-2 pb-2 bg-[#101c1d] border-b border-white/10 ${barVisible ? '' : 'hidden'}`}
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 8px)' }}
      >
        <button type="button" onClick={onClose} className="w-12 h-12 rounded-xl flex items-center justify-center text-white/90" aria-label={isSw ? 'Funga' : 'Close'}>
          <X className="w-6 h-6" />
        </button>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-bold truncate">{book.title}</div>
          {status === 'ready' && pdf && (
            <div className="text-[11px] text-white/60">
              {isSw ? 'Ukurasa' : 'Page'} {page} / {pdf.numPages}
            </div>
          )}
        </div>
        {status === 'ready' && (
          <div className="flex items-center gap-1.5">
            <button type="button" onClick={() => setZoom((z) => Math.max(0.6, +(z - 0.2).toFixed(1)))} className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center" aria-label="Zoom out">
              <ZoomOut className="w-5 h-5" />
            </button>
            <button type="button" onClick={() => setZoom((z) => Math.min(2.6, +(z + 0.2).toFixed(1)))} className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center" aria-label="Zoom in">
              <ZoomIn className="w-5 h-5" />
            </button>
            <button type="button" onClick={() => goTo(page - 1)} className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center" aria-label="Previous page">
              <ChevronUp className="w-5 h-5" />
            </button>
            <button type="button" onClick={() => goTo(page + 1)} className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center" aria-label="Next page">
              <ChevronDown className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      {/* Pages */}
      <div className="relative flex-1 min-h-0">
        <div
          ref={scrollRef}
          onClick={() => setBarVisible((v) => !v)}
          className="absolute inset-0 overflow-auto py-2 space-y-2 kuku-reader-pages"
        >
          {status === 'loading' && (
            <div className="h-full flex flex-col items-center justify-center gap-3 text-white/70">
              <Loader2 className="w-8 h-8 kuku-spin" />
              <div className="text-sm">{isSw ? 'Inafungua kitabu...' : 'Opening the book...'}</div>
            </div>
          )}
          {status === 'error' && (
            <div className="h-full flex flex-col items-center justify-center gap-3 px-8 text-center">
              <ShieldAlert className="w-8 h-8 text-rose-400" />
              <div className="text-sm text-rose-200">{error}</div>
              <button type="button" onClick={onClose} className="h-12 px-6 rounded-xl bg-white/10 text-sm font-bold">
                {isSw ? 'Funga' : 'Close'}
              </button>
            </div>
          )}
          {status === 'ready' &&
            pdf &&
            pageWidth > 0 &&
            pages.map((n) => (
              <PageCanvas key={n} pdf={pdf} pageNumber={n} width={pageWidth} ratio={ratio} label={readerLabel} onVisible={onVisible} />
            ))}
        </div>

        {/* While the toolbar is hidden a small close button stays reachable */}
        {!barVisible && (
          <button
            type="button"
            onClick={onClose}
            className="absolute z-20 left-2 w-11 h-11 rounded-full bg-black/55 flex items-center justify-center text-white"
            style={{ top: 'calc(env(safe-area-inset-top, 0px) + 8px)' }}
            aria-label={isSw ? 'Funga' : 'Close'}
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Privacy shield: pages are hidden whenever the app loses focus */}
        {shielded && (
          <div className="absolute inset-0 z-10 bg-[#0b1213] flex flex-col items-center justify-center gap-2 text-center px-8">
            <ShieldAlert className="w-9 h-9 text-amber-400" />
            <div className="text-sm font-bold">{isSw ? 'Usomaji umesitishwa' : 'Reading paused'}</div>
            <div className="text-xs text-white/60">
              {isSw ? 'Rudi kwenye programu kuendelea.' : 'Return to the app to continue.'}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // At the top of the page, never inside the screen content, so it always covers the whole screen
  return createPortal(reader, document.body);
};
