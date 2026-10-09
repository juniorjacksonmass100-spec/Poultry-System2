import React, { useRef, useState } from 'react';
import { BookOpen, Upload, Eye, EyeOff, Trash2, ShieldCheck, X, FileText, Loader2 } from 'lucide-react';
import { Book } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../context/ToastContext';
import { MAX_BOOK_BYTES } from '../../services/bookService';
import { BookReader } from './BookReader';

interface LibraryViewProps {
  books: Book[];
  isAdmin: boolean;
  userId: string;
  readerLabel: string;
  onUpload: (file: File, title: string, description: string) => Promise<void>;
  onTogglePublished: (book: Book) => Promise<void>;
  onDelete: (book: Book) => Promise<void>;
}

const mb = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(bytes > 10 * 1024 * 1024 ? 0 : 1)} MB`;

export const LibraryView: React.FC<LibraryViewProps> = ({
  books,
  isAdmin,
  userId,
  readerLabel,
  onUpload,
  onTogglePublished,
  onDelete,
}) => {
  const { theme } = useTheme();
  const { lang } = useLanguage();
  const { notify } = useToast();
  const isLight = theme === 'light';
  const isSw = lang === 'sw';

  const [reading, setReading] = useState<Book | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [uploading, setUploading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const muted = isLight ? 'text-slate-500' : 'text-[#8fbdb8]';
  const card = `border rounded-2xl p-4 ${isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#071a1c] border-[#00f5c4]/20'}`;
  const input = `w-full rounded-xl border px-3 text-sm focus:outline-hidden ${
    isLight ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-teal-500' : 'bg-[#040c0c] border-[#00f5c4]/25 text-white focus:border-[#00f5c4]'
  }`;

  const pick = (f: File | null) => {
    if (!f) return;
    if (f.size > MAX_BOOK_BYTES) {
      notify('error', isSw ? 'Faili ni kubwa mno (kikomo MB 50).' : 'That file is too large (limit 50 MB).');
      return;
    }
    setFile(f);
    if (!title.trim()) setTitle(f.name.replace(/\.pdf$/i, '').replace(/[_-]+/g, ' ').trim());
  };

  const resetForm = () => {
    setUploadOpen(false);
    setFile(null);
    setTitle('');
    setDescription('');
    if (fileRef.current) fileRef.current.value = '';
  };

  const submit = async () => {
    if (!file || !title.trim() || uploading) return;
    setUploading(true);
    try {
      await onUpload(file, title, description);
      notify('success', isSw ? 'Kitabu kimepakiwa.' : 'Book uploaded.');
      resetForm();
    } catch (err: any) {
      notify('error', err?.message || (isSw ? 'Imeshindwa kupakia.' : 'Upload failed.'));
    } finally {
      setUploading(false);
    }
  };

  const del = async (book: Book) => {
    if (confirmDelete !== book.id) {
      setConfirmDelete(book.id);
      window.setTimeout(() => setConfirmDelete((c) => (c === book.id ? null : c)), 3500);
      return;
    }
    setConfirmDelete(null);
    try {
      await onDelete(book);
      notify('success', isSw ? 'Kitabu kimefutwa.' : 'Book deleted.');
    } catch (err: any) {
      notify('error', err?.message || (isSw ? 'Imeshindwa kufuta.' : 'Could not delete.'));
    }
  };

  const toggle = async (book: Book) => {
    try {
      await onTogglePublished(book);
      notify('success', book.is_published ? (isSw ? 'Kitabu kimefichwa kwa wakulima.' : 'Hidden from farmers.') : isSw ? 'Kitabu kinaonekana kwa wakulima.' : 'Now visible to farmers.');
    } catch (err: any) {
      notify('error', err?.message || 'Could not update.');
    }
  };

  return (
    <div className="space-y-5">
      <div className={`${card} flex flex-col sm:flex-row sm:items-center justify-between gap-3`}>
        <div className="flex items-start gap-3">
          <span className={`shrink-0 w-11 h-11 rounded-xl flex items-center justify-center ${isLight ? 'bg-teal-100 text-teal-800' : 'bg-[#00f5c4]/15 text-[#00f5c4]'}`}>
            <BookOpen className="w-5 h-5" />
          </span>
          <div>
            <div className={`text-base font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{isSw ? 'Maktaba ya Vitabu' : 'Book Library'}</div>
            <div className={`text-xs mt-0.5 flex items-start gap-1.5 ${muted}`}>
              <ShieldCheck className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              {isSw
                ? 'Vitabu vinasomwa ndani ya KukuTrack pekee. Haviwezi kupakuliwa wala kunakiliwa.'
                : 'Books can only be read inside KukuTrack. They cannot be downloaded or copied.'}
            </div>
          </div>
        </div>
        {isAdmin && (
          <button
            type="button"
            onClick={() => setUploadOpen(true)}
            className={`h-12 px-5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 ${isLight ? 'bg-teal-600 text-white' : 'bg-[#00f5c4] text-[#02211b]'}`}
          >
            <Upload className="w-4 h-4" />
            {isSw ? 'Pakia kitabu (PDF)' : 'Upload a book (PDF)'}
          </button>
        )}
      </div>

      {books.length === 0 ? (
        <div className={`${card} text-center py-12 space-y-2`}>
          <FileText className={`w-9 h-9 mx-auto ${muted}`} />
          <div className={`text-sm ${muted}`}>
            {isAdmin
              ? isSw ? 'Hujapakia kitabu chochote. Bonyeza "Pakia kitabu" kuanza.' : 'No books yet. Tap "Upload a book" to add the first one.'
              : isSw ? 'Hakuna vitabu bado. Msimamizi atavipakia hapa.' : 'No books yet. The admin will add them here.'}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {books.map((b) => (
            <div key={b.id} className={`${card} flex flex-col gap-3 ${!b.is_published ? 'opacity-75' : ''}`}>
              <div className="flex items-start gap-3">
                <span className={`shrink-0 w-12 h-16 rounded-lg flex items-center justify-center ${isLight ? 'bg-amber-100 text-amber-800' : 'bg-amber-400/15 text-amber-300'}`}>
                  <BookOpen className="w-6 h-6" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className={`text-sm font-bold leading-snug ${isLight ? 'text-slate-900' : 'text-white'}`}>{b.title}</div>
                  {b.description && <div className={`text-xs mt-1 line-clamp-3 ${muted}`}>{b.description}</div>}
                  <div className={`text-[11px] mt-1.5 ${muted}`}>
                    {mb(b.file_size)} · {new Date(b.created_at).toLocaleDateString()}
                    {!b.is_published && <span className="ml-2 font-bold text-amber-500">{isSw ? 'IMEFICHWA' : 'HIDDEN'}</span>}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setReading(b)}
                className={`h-12 rounded-xl text-sm font-bold flex items-center justify-center gap-2 ${isLight ? 'bg-teal-600 text-white' : 'bg-[#00f5c4] text-[#02211b]'}`}
              >
                <BookOpen className="w-4 h-4" />
                {isSw ? 'Soma' : 'Read'}
              </button>
              {isAdmin && (
                <div className="flex gap-2.5">
                  <button
                    type="button"
                    onClick={() => void toggle(b)}
                    className={`flex-1 h-11 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 ${isLight ? 'border-slate-300 text-slate-700' : 'border-[#00f5c4]/30 text-[#c4dedc]'}`}
                  >
                    {b.is_published ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    {b.is_published ? (isSw ? 'Ficha' : 'Hide') : isSw ? 'Onyesha' : 'Show'}
                  </button>
                  <button
                    type="button"
                    onClick={() => void del(b)}
                    className={`flex-1 h-11 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 ${
                      confirmDelete === b.id ? 'bg-rose-600 text-white border-rose-600' : isLight ? 'border-rose-300 text-rose-700' : 'border-rose-400/50 text-rose-300'
                    }`}
                  >
                    <Trash2 className="w-4 h-4" />
                    {confirmDelete === b.id ? (isSw ? 'Gusa tena kufuta' : 'Tap again to delete') : isSw ? 'Futa' : 'Delete'}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Admin: upload */}
      {uploadOpen && isAdmin && (
        <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80" onClick={() => !uploading && resetForm()}>
          <div
            onClick={(e) => e.stopPropagation()}
            className={`w-full sm:max-w-md max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-2xl border p-5 space-y-4 ${
              isLight ? 'bg-white border-teal-300 text-slate-900' : 'bg-[#081515] border-[#00f5c4]/30 text-white'
            }`}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold">{isSw ? 'Pakia kitabu' : 'Upload a book'}</h3>
              <button type="button" onClick={resetForm} disabled={uploading} className="w-11 h-11 -mr-2 flex items-center justify-center" aria-label="Close">
                <X className="w-5 h-5" />
              </button>
            </div>

            <input ref={fileRef} type="file" accept="application/pdf,.pdf" className="hidden" onChange={(e) => pick(e.target.files?.[0] || null)} />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className={`w-full min-h-[72px] rounded-xl border-2 border-dashed px-4 py-3 flex items-center gap-3 text-left ${
                isLight ? 'border-teal-300 bg-teal-50/50' : 'border-[#00f5c4]/40 bg-[#00f5c4]/5'
              }`}
            >
              <FileText className={`w-7 h-7 shrink-0 ${isLight ? 'text-teal-700' : 'text-[#00f5c4]'}`} />
              <span className="min-w-0">
                <span className="block text-sm font-semibold truncate">{file ? file.name : isSw ? 'Chagua faili la PDF' : 'Choose a PDF file'}</span>
                <span className={`block text-[11px] ${muted}`}>{file ? mb(file.size) : isSw ? 'PDF pekee, hadi MB 50' : 'PDF only, up to 50 MB'}</span>
              </span>
            </button>

            <div>
              <label className={`block text-xs font-semibold mb-1 ${muted}`}>{isSw ? 'Kichwa cha kitabu' : 'Book title'}</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} className={`${input} h-12`} />
            </div>
            <div>
              <label className={`block text-xs font-semibold mb-1 ${muted}`}>{isSw ? 'Maelezo mafupi (hiari)' : 'Short description (optional)'}</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} maxLength={500} className={`${input} py-3 resize-none`} />
            </div>

            <button
              type="button"
              onClick={() => void submit()}
              disabled={!file || !title.trim() || uploading}
              className={`w-full h-12 rounded-xl text-sm font-bold flex items-center justify-center gap-2 ${isLight ? 'bg-teal-600 text-white' : 'bg-[#00f5c4] text-[#02211b]'}`}
            >
              {uploading ? <Loader2 className="w-4 h-4 kuku-spin" /> : <Upload className="w-4 h-4" />}
              {uploading ? (isSw ? 'Inapakia...' : 'Uploading...') : isSw ? 'Pakia' : 'Upload'}
            </button>
            {uploading && <p className={`text-[11px] text-center ${muted}`}>{isSw ? 'Subiri, faili kubwa huchukua muda.' : 'Please wait, large files take a moment.'}</p>}
          </div>
        </div>
      )}

      {reading && <BookReader book={reading} readerLabel={readerLabel} userId={userId} onClose={() => setReading(null)} />}
    </div>
  );
};
