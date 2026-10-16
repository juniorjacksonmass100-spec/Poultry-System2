import React from 'react';
import { Eye, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

/** Shown to an admin while they are looking inside another user's account. */
export const ViewAsBanner: React.FC = () => {
  const { viewAsUser, setViewAsUser } = useAuth();
  const { lang } = useLanguage();
  const isSw = lang === 'sw';
  if (!viewAsUser) return null;

  return (
    <div className="relative z-40 flex flex-wrap items-center justify-between gap-2 px-4 py-2 bg-amber-500 text-amber-950 text-xs font-bold shadow-md">
      <span className="flex items-center gap-2 min-w-0">
        <Eye className="w-4 h-4 shrink-0" />
        <span className="truncate">
          {isSw ? 'Unaangalia akaunti ya' : 'Admin view: you are inside the account of'}{' '}
          <u>{viewAsUser.full_name || viewAsUser.email}</u> ({viewAsUser.email}).{' '}
          {isSw ? 'Mabadiliko yoyote yataenda kwenye akaunti hii.' : 'Anything you add or delete here changes THEIR account.'}
        </span>
      </span>
      <button
        type="button"
        onClick={() => setViewAsUser(null)}
        className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-950 text-amber-100 hover:bg-black"
      >
        <LogOut className="w-3.5 h-3.5" />
        {isSw ? 'Toka kwenye akaunti hii' : 'Exit to my account'}
      </button>
    </div>
  );
};
