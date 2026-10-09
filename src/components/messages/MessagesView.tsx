import React, { useMemo, useState } from 'react';
import { ArrowLeft, Search, MessageSquare, ShieldCheck } from 'lucide-react';
import { DirectMessage, UserProfile } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { buildThreads } from '../../lib/chat';
import { ChatThread } from './ChatThread';

interface MessagesViewProps {
  me: string;
  isAdmin: boolean;
  messages: DirectMessage[];
  /** Admin only: everyone who can be messaged */
  users: UserProfile[];
  /** Admin: which conversation is open (null = the inbox list) */
  openThread: string | null;
  onOpenThread: (userId: string | null) => void;
  onSend: (threadUserId: string, body: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onMarkRead: (threadUserId: string) => void;
}

const timeShort = (iso: string, isSw: boolean) => {
  const d = new Date(iso);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return d.toLocaleDateString(isSw ? 'sw-TZ' : undefined, { day: 'numeric', month: 'short' });
};

export const MessagesView: React.FC<MessagesViewProps> = ({
  me,
  isAdmin,
  messages,
  users,
  openThread,
  onOpenThread,
  onSend,
  onDelete,
  onMarkRead,
}) => {
  const { theme } = useTheme();
  const { lang } = useLanguage();
  const isLight = theme === 'light';
  const isSw = lang === 'sw';
  const [query, setQuery] = useState('');

  const frame = `flex flex-col rounded-2xl border overflow-hidden h-[calc(100dvh-230px)] min-h-[420px] ${
    isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#061516] border-[#00f5c4]/20'
  }`;

  const threads = useMemo(() => buildThreads(messages, users, me, isAdmin), [messages, users, me, isAdmin]);

  // ------------------------------------------------------------------ farmer: one conversation
  if (!isAdmin) {
    return (
      <div className={frame}>
        <div className={`shrink-0 flex items-center gap-3 px-4 py-3 border-b ${isLight ? 'bg-white border-slate-200' : 'bg-[#071a1c] border-[#00f5c4]/20'}`}>
          <span className={`w-10 h-10 rounded-full flex items-center justify-center ${isLight ? 'bg-teal-100 text-teal-800' : 'bg-[#00f5c4]/20 text-[#00f5c4]'}`}>
            <ShieldCheck className="w-5 h-5" />
          </span>
          <div>
            <div className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
              {isSw ? 'Msimamizi wa KukuTrack' : 'KukuTrack Admin'}
            </div>
            <div className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-[#8fbdb8]'}`}>
              {isSw ? 'Uliza swali, omba msaada au toa taarifa' : 'Ask a question, get help or share an update'}
            </div>
          </div>
        </div>
        <div className="flex-1 min-h-0">
          <ChatThread
            threadUserId={me}
            messages={messages}
            me={me}
            isAdmin={false}
            emptyHint={isSw ? 'Hakuna ujumbe bado. Andika ujumbe wako wa kwanza kwa msimamizi hapa chini.' : 'No messages yet. Write your first message to the admin below.'}
            onSend={onSend}
            onDelete={onDelete}
            onMarkRead={onMarkRead}
          />
        </div>
      </div>
    );
  }

  // ------------------------------------------------------------------ admin: inbox + conversation
  if (openThread) {
    const t = threads.find((x) => x.userId === openThread);
    const name = t?.user?.full_name || t?.user?.email || (isSw ? 'Mtumiaji' : 'User');
    return (
      <div className={frame}>
        <div className={`shrink-0 flex items-center gap-2 px-2 py-2 border-b ${isLight ? 'bg-white border-slate-200' : 'bg-[#071a1c] border-[#00f5c4]/20'}`}>
          <button
            type="button"
            onClick={() => onOpenThread(null)}
            className={`w-11 h-11 rounded-xl flex items-center justify-center ${isLight ? 'text-slate-700' : 'text-[#c4dedc]'}`}
            aria-label={isSw ? 'Rudi' : 'Back'}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="min-w-0">
            <div className={`text-sm font-bold truncate ${isLight ? 'text-slate-900' : 'text-white'}`}>{name}</div>
            <div className={`text-[11px] truncate ${isLight ? 'text-slate-500' : 'text-[#8fbdb8]'}`}>
              {[t?.user?.email, t?.user?.phone].filter(Boolean).join(' · ')}
            </div>
          </div>
        </div>
        <div className="flex-1 min-h-0">
          <ChatThread
            threadUserId={openThread}
            messages={messages}
            me={me}
            isAdmin
            emptyHint={isSw ? `Anza mazungumzo na ${name} hapa chini.` : `Start the conversation with ${name} below.`}
            onSend={onSend}
            onDelete={onDelete}
            onMarkRead={onMarkRead}
          />
        </div>
      </div>
    );
  }

  const q = query.trim().toLowerCase();
  const shown = q
    ? threads.filter((x) => `${x.user?.full_name || ''} ${x.user?.email || ''} ${x.user?.phone || ''}`.toLowerCase().includes(q))
    : threads;

  return (
    <div className={frame}>
      <div className={`shrink-0 p-3 border-b ${isLight ? 'bg-white border-slate-200' : 'bg-[#071a1c] border-[#00f5c4]/20'}`}>
        <div className="relative">
          <Search className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 ${isLight ? 'text-slate-400' : 'text-[#6fa5a0]'}`} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={isSw ? 'Tafuta mkulima...' : 'Search farmers...'}
            className={`w-full h-11 rounded-xl border pl-10 pr-3 text-sm focus:outline-hidden ${
              isLight ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-teal-500' : 'bg-[#040c0c] border-[#00f5c4]/25 text-white focus:border-[#00f5c4]'
            }`}
          />
        </div>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto divide-y divide-slate-300/20">
        {shown.length === 0 && (
          <div className={`h-full flex flex-col items-center justify-center gap-2 text-sm ${isLight ? 'text-slate-500' : 'text-[#8fbdb8]'}`}>
            <MessageSquare className="w-8 h-8 opacity-50" />
            {isSw ? 'Hakuna mtu aliyepatikana.' : 'No one found.'}
          </div>
        )}
        {shown.map((x) => {
          const name = x.user?.full_name || x.user?.email || (isSw ? 'Mtumiaji' : 'User');
          return (
            <button
              key={x.userId}
              type="button"
              onClick={() => onOpenThread(x.userId)}
              className={`w-full flex items-center gap-3 px-4 py-3 min-h-[68px] text-left ${isLight ? 'hover:bg-white' : 'hover:bg-[#0a1f20]'}`}
            >
              <span className={`shrink-0 w-11 h-11 rounded-full flex items-center justify-center text-base font-bold ${isLight ? 'bg-teal-100 text-teal-800' : 'bg-[#00f5c4]/20 text-[#00f5c4]'}`}>
                {name.charAt(0).toUpperCase()}
              </span>
              <span className="flex-1 min-w-0">
                <span className="flex items-baseline justify-between gap-2">
                  <span className={`text-sm truncate ${x.unread ? 'font-bold' : 'font-semibold'} ${isLight ? 'text-slate-900' : 'text-white'}`}>{name}</span>
                  {x.last && <span className={`text-[10px] shrink-0 ${isLight ? 'text-slate-500' : 'text-[#8fbdb8]'}`}>{timeShort(x.last.created_at, isSw)}</span>}
                </span>
                <span className={`block text-xs truncate ${x.unread ? (isLight ? 'text-slate-800 font-semibold' : 'text-white font-semibold') : isLight ? 'text-slate-500' : 'text-[#8fbdb8]'}`}>
                  {x.last ? `${x.last.sender_id === me ? (isSw ? 'Wewe: ' : 'You: ') : ''}${x.last.body}` : isSw ? 'Hakuna ujumbe bado' : 'No messages yet'}
                </span>
              </span>
              {x.unread > 0 && (
                <span className="shrink-0 min-w-[24px] h-6 px-1.5 rounded-full bg-emerald-500 text-white text-xs font-bold flex items-center justify-center">
                  {x.unread}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
