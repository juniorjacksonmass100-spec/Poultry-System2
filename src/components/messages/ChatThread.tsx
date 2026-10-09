import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Send, Trash2, Check, CheckCheck, Clock } from 'lucide-react';
import { DirectMessage } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../context/ToastContext';
import { dayLabel, isIncoming } from '../../lib/chat';

interface ChatThreadProps {
  threadUserId: string;
  messages: DirectMessage[];
  me: string;
  isAdmin: boolean;
  /** Small line under the title, e.g. the farmer's phone */
  emptyHint: string;
  onSend: (threadUserId: string, body: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onMarkRead: (threadUserId: string) => void;
}

const MAX = 2000;

const time = (iso: string) => new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

export const ChatThread: React.FC<ChatThreadProps> = ({
  threadUserId,
  messages,
  me,
  isAdmin,
  emptyHint,
  onSend,
  onDelete,
  onMarkRead,
}) => {
  const { theme } = useTheme();
  const { lang } = useLanguage();
  const { notify } = useToast();
  const isLight = theme === 'light';
  const isSw = lang === 'sw';

  const thread = useMemo(() => messages.filter((m) => m.thread_user_id === threadUserId), [messages, threadUserId]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const lastCount = useRef(0);

  // Messages I received in this open conversation count as read
  const unreadHere = thread.filter((m) => !m.read_at && isIncoming(m, me, isAdmin)).length;
  useEffect(() => {
    if (unreadHere === 0) return;
    if (document.visibilityState !== 'visible') return;
    onMarkRead(threadUserId);
  }, [unreadHere, threadUserId, onMarkRead]);

  // Stay at the bottom for new messages (unless the reader scrolled up to read old ones)
  useLayoutEffect(() => {
    const el = listRef.current;
    if (!el) return;
    const grew = thread.length > lastCount.current;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 160;
    const lastMine = thread.length > 0 && thread[thread.length - 1].sender_id === me;
    if (lastCount.current === 0 || (grew && (nearBottom || lastMine))) {
      endRef.current?.scrollIntoView({ block: 'end' });
    }
    lastCount.current = thread.length;
  }, [thread, me]);

  // Switching conversation starts at the bottom again
  useEffect(() => {
    lastCount.current = 0;
    setText('');
    setConfirmDelete(null);
  }, [threadUserId]);

  const submit = async () => {
    const body = text.trim();
    if (!body || sending) return;
    setSending(true);
    try {
      await onSend(threadUserId, body);
      setText('');
    } catch (err: any) {
      notify('error', err?.message || (isSw ? 'Imeshindwa kutuma.' : 'Could not send the message.'));
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirmDelete !== id) {
      setConfirmDelete(id);
      window.setTimeout(() => setConfirmDelete((c) => (c === id ? null : c)), 3500);
      return;
    }
    setConfirmDelete(null);
    try {
      await onDelete(id);
    } catch (err: any) {
      notify('error', err?.message || (isSw ? 'Imeshindwa kufuta.' : 'Could not delete the message.'));
    }
  };

  let lastDay = '';

  return (
    <div className="flex flex-col h-full min-h-0">
      <div ref={listRef} className="flex-1 min-h-0 overflow-y-auto px-3 sm:px-4 py-4 space-y-2">
        {thread.length === 0 && (
          <div className={`h-full flex items-center justify-center text-center text-sm px-6 ${isLight ? 'text-slate-500' : 'text-[#8fbdb8]'}`}>
            {emptyHint}
          </div>
        )}

        {thread.map((m) => {
          const mine = m.sender_id === me;
          const day = dayLabel(m.created_at, isSw);
          const showDay = day !== lastDay;
          lastDay = day;
          return (
            <React.Fragment key={m.id}>
              {showDay && (
                <div className="flex justify-center py-1">
                  <span className={`text-[11px] font-semibold px-3 py-1 rounded-full ${isLight ? 'bg-slate-200 text-slate-600' : 'bg-[#0c2020] text-[#8fbdb8]'}`}>
                    {day}
                  </span>
                </div>
              )}
              <div className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] sm:max-w-[70%] rounded-2xl px-3.5 py-2 shadow-sm ${
                    mine
                      ? isLight
                        ? 'bg-teal-600 text-white rounded-br-md'
                        : 'bg-[#00f5c4] text-[#02211b] rounded-br-md'
                      : isLight
                      ? 'bg-white border border-slate-200 text-slate-900 rounded-bl-md'
                      : 'bg-[#0f2a2a] text-white rounded-bl-md'
                  } ${m.pending ? 'opacity-70' : ''}`}
                >
                  <div className="text-sm whitespace-pre-wrap break-words leading-snug">{m.body}</div>
                  <div className={`mt-1 flex items-center justify-end gap-1.5 text-[10px] ${mine ? 'opacity-80' : 'opacity-60'}`}>
                    <span>{time(m.created_at)}</span>
                    {mine &&
                      (m.pending ? (
                        <Clock className="w-3 h-3" aria-label="sending" />
                      ) : m.read_at ? (
                        <CheckCheck className="w-3.5 h-3.5" aria-label="read" />
                      ) : (
                        <Check className="w-3.5 h-3.5" aria-label="sent" />
                      ))}
                    {mine && !m.pending && (
                      <button
                        type="button"
                        onClick={() => handleDelete(m.id)}
                        className={`ml-1 -my-1 min-h-[32px] px-1.5 flex items-center gap-1 rounded-md ${confirmDelete === m.id ? 'bg-rose-600 text-white opacity-100' : ''}`}
                        aria-label={isSw ? 'Futa ujumbe' : 'Delete message'}
                      >
                        <Trash2 className="w-3 h-3" />
                        {confirmDelete === m.id && <span className="font-bold">{isSw ? 'Gusa tena' : 'Tap again'}</span>}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </React.Fragment>
          );
        })}
        <div ref={endRef} />
      </div>

      {/* Composer */}
      <div
        className={`shrink-0 border-t p-3 flex items-end gap-2 ${isLight ? 'bg-white border-slate-200' : 'bg-[#071a1c] border-[#00f5c4]/20'}`}
        style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom, 0px))' }}
      >
        <div className="flex-1 min-w-0">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, MAX))}
            onKeyDown={(e) => {
              // Enter sends on a computer; on a phone Enter makes a new line (use the Send button)
              const touch = window.matchMedia?.('(pointer: coarse)').matches;
              if (e.key === 'Enter' && !e.shiftKey && !touch) {
                e.preventDefault();
                void submit();
              }
            }}
            rows={1}
            placeholder={isSw ? 'Andika ujumbe...' : 'Type a message...'}
            className={`w-full resize-none max-h-32 rounded-2xl border px-4 py-3 text-sm focus:outline-hidden ${
              isLight
                ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-teal-500'
                : 'bg-[#040c0c] border-[#00f5c4]/25 text-white focus:border-[#00f5c4]'
            }`}
            aria-label={isSw ? 'Ujumbe' : 'Message'}
          />
          {text.length > MAX - 200 && (
            <div className={`text-[10px] text-right mt-0.5 ${text.length >= MAX ? 'text-rose-500' : 'opacity-60'}`}>
              {text.length}/{MAX}
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={() => void submit()}
          disabled={!text.trim() || sending}
          className={`shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
            isLight ? 'bg-teal-600 text-white' : 'bg-[#00f5c4] text-[#02211b]'
          }`}
          aria-label={isSw ? 'Tuma' : 'Send'}
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
