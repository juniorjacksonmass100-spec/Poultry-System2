import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { Database, Copy, Check, RefreshCw, X, Code, ExternalLink } from 'lucide-react';
import { POULTRY_SCHEMA_SQL } from '../../lib/schemaSql';

interface SchemaSetupNoticeProps {
  onRefresh: () => void;
}

export const SchemaSetupNotice: React.FC<SchemaSetupNoticeProps> = ({ onRefresh }) => {
  const { lang } = useLanguage();
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const isSw = lang === 'sw';

  const [copied, setCopied] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [showSqlModal, setShowSqlModal] = useState(false);

  const handleCopySchema = async () => {
    try {
      await navigator.clipboard.writeText(POULTRY_SCHEMA_SQL);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const handleRefreshClick = async () => {
    setIsRefreshing(true);
    await onRefresh();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  if (isDismissed) return null;

  return (
    <>
      <div
        className={`mb-6 p-4 sm:p-5 border rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-colors ${
          isLight
            ? 'bg-teal-50/80 border-teal-300 text-slate-800 shadow-md'
            : 'bg-gradient-to-r from-[#041416] to-[#082226] border-[#00f5c4]/45 text-white shadow-[0_0_25px_rgba(0,245,196,0.18)]'
        }`}
      >
        <div className="flex items-start gap-3.5">
          <div
            className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 shadow-md ${
              isLight
                ? 'bg-teal-100 text-teal-800 border-teal-300'
                : 'bg-[#00f5c4]/20 border-[#00f5c4]/40 text-[#00f5c4] shadow-[0_0_14px_rgba(0,245,196,0.35)]'
            }`}
          >
            <Database className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className={`text-xs sm:text-sm font-bold flex items-center gap-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                <span>{isSw ? 'Jedwali za Hifadhidata Ziko Tayari Kuanzishwa' : 'Database Tables Ready for Initialization'}</span>
              </h4>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  isLight
                    ? 'text-teal-800 bg-teal-100 border-teal-300'
                    : 'text-[#00f5c4] bg-[#00f5c4]/15 border-[#00f5c4]/30 shadow-[0_0_8px_rgba(0,245,196,0.25)]'
                }`}
              >
                {isSw ? 'Uhamisho Rahisi' : '1-Click Migration'}
              </span>
            </div>
            <p className={`text-xs mt-1 leading-relaxed max-w-2xl ${isLight ? 'text-slate-600' : 'text-[#a3d4d0]'}`}>
              {isSw
                ? 'Ili kuhifadhi kuku, mayai, mauzo na matumizi moja kwa moja, nakili msimbo wa SQL (schema) na ubandike kwenye Supabase SQL Editor yako kisha bonyeza RUN.'
                : 'Connected to Supabase! To persist flock, egg, sales & brooding records, copy the ready-to-run SQL schema into your Supabase SQL Editor and click RUN.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end flex-wrap sm:flex-nowrap">
          <button
            onClick={() => setShowSqlModal(true)}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
              isLight
                ? 'text-teal-800 bg-white hover:bg-teal-50 border-teal-300'
                : 'text-[#00f5c4] bg-[#0b2b2e] hover:bg-[#0f373b] border-[#00f5c4]/30 hover:border-[#00f5c4]'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            <span>{isSw ? 'Tazama SQL' : 'View SQL'}</span>
          </button>

          <button
            onClick={handleCopySchema}
            className={`flex items-center gap-1.5 px-3.5 py-2 font-bold text-xs rounded-xl transition-all cursor-pointer ${
              isLight
                ? 'bg-teal-600 hover:bg-teal-500 text-white shadow-sm'
                : 'bg-[#00f5c4] hover:bg-[#15ffd1] text-[#02211b] shadow-[0_0_15px_rgba(0,245,196,0.35)]'
            }`}
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? (isSw ? 'Imenakiliwa!' : 'Copied!') : (isSw ? 'Nakili SQL Schema' : 'Copy SQL Schema')}</span>
          </button>

          <button
            onClick={handleRefreshClick}
            disabled={isRefreshing}
            className={`p-2 rounded-xl border transition-colors cursor-pointer ${
              isLight
                ? 'text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border-slate-300'
                : 'text-[#8fbdb8] hover:text-white bg-[#0b2b2e] hover:bg-[#0f373b] border-[#00f5c4]/30'
            }`}
            title={isSw ? 'Pakia upya' : 'Refresh tables'}
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-[#00f5c4]' : ''}`} />
          </button>

          <button
            onClick={() => setIsDismissed(true)}
            className={`p-1.5 transition-colors cursor-pointer ${
              isLight ? 'text-slate-400 hover:text-slate-700' : 'text-[#8fbdb8] hover:text-white'
            }`}
            title={isSw ? 'Funga' : 'Dismiss'}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {showSqlModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div
            className={`border rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl relative ${
              isLight
                ? 'bg-white border-teal-300 text-slate-900'
                : 'bg-[#051315] border-[#00f5c4]/45 text-white shadow-[0_0_40px_rgba(0,245,196,0.25)]'
            }`}
          >
            <div className={`p-4 border-b flex items-center justify-between ${isLight ? 'border-slate-200' : 'border-[#00f5c4]/20'}`}>
              <div className="flex items-center gap-2">
                <Database className={`w-4 h-4 ${isLight ? 'text-teal-600' : 'text-[#00f5c4]'}`} />
                <h3 className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  {isSw ? 'SQL Schema ya KukuTrack' : 'KukuTrack Supabase Database Schema'}
                </h3>
              </div>
              <button
                onClick={() => setShowSqlModal(false)}
                className="text-neutral-400 hover:text-slate-800 dark:hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto flex-1">
              <pre className={`text-[11px] font-mono p-4 rounded-xl overflow-x-auto whitespace-pre leading-relaxed border ${
                isLight ? 'bg-slate-900 text-emerald-300 border-slate-700' : 'bg-[#020708] border-[#00f5c4]/20 text-[#a2dcd6]'
              }`}>
                {POULTRY_SCHEMA_SQL}
              </pre>
            </div>

            <div className={`p-4 border-t flex items-center justify-between gap-3 ${isLight ? 'border-slate-200' : 'border-[#00f5c4]/20'}`}>
              <a
                href="https://supabase.com/dashboard"
                target="_blank"
                rel="noreferrer"
                className={`text-xs font-semibold hover:underline flex items-center gap-1 ${
                  isLight ? 'text-teal-700' : 'text-[#00f5c4]'
                }`}
              >
                <span>Supabase Dashboard</span>
                <ExternalLink className="w-3 h-3" />
              </a>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowSqlModal(false)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition-colors cursor-pointer ${
                    isLight
                      ? 'text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border-slate-300'
                      : 'text-neutral-300 hover:text-white bg-[#0b2222] border-[#00f5c4]/20'
                  }`}
                >
                  {isSw ? 'Funga' : 'Close'}
                </button>
                <button
                  onClick={handleCopySchema}
                  className={`flex items-center gap-1.5 px-4 py-1.5 font-bold text-xs rounded-xl transition-all cursor-pointer ${
                    isLight
                      ? 'bg-teal-600 hover:bg-teal-500 text-white shadow-sm'
                      : 'bg-[#00f5c4] hover:bg-[#15ffd1] text-[#02211b] shadow-[0_0_15px_rgba(0,245,196,0.35)]'
                  }`}
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? (isSw ? 'Imenakiliwa!' : 'Copied!') : (isSw ? 'Nakili SQL' : 'Copy SQL')}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
