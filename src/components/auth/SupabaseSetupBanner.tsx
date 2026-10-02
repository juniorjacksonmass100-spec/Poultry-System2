import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { Database, Copy, Check, ExternalLink, KeyRound, Sparkles } from 'lucide-react';
import { POULTRY_SCHEMA_SQL } from '../../lib/schemaSql';

export const SupabaseSetupBanner: React.FC = () => {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);

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

  return (
    <div className="min-h-screen bg-[#020708] flex flex-col items-center justify-center p-4 sm:p-6 text-white">
      <div className="max-w-2xl w-full bg-gradient-to-b from-[#051618] to-[#030d0f] border border-[#00f5c4]/40 rounded-2xl p-6 sm:p-8 shadow-[0_0_40px_rgba(0,245,196,0.18)]">
        <div className="flex items-center gap-3.5 mb-5">
          <div className="w-12 h-12 rounded-xl bg-[#00f5c4]/20 border border-[#00f5c4]/45 flex items-center justify-center text-[#00f5c4] shadow-[0_0_15px_rgba(0,245,196,0.3)]">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-white">
                {t.supabaseSetupTitle}
              </h1>
              <span className="flex items-center gap-1 text-[10px] font-bold text-[#00f5c4] bg-[#00f5c4]/15 px-2 py-0.5 rounded-full border border-[#00f5c4]/30">
                <Sparkles className="w-3 h-3" />
                Production Ready
              </span>
            </div>
            <p className="text-xs text-[#8fbdb8] mt-0.5">
              {t.supabaseSetupDesc}
            </p>
          </div>
        </div>

        <div className="space-y-4 my-6 text-xs text-[#c4dedc]">
          <div className="p-4 bg-[#020a0b] border border-[#00f5c4]/20 rounded-xl space-y-3">
            <div className="flex items-center gap-2 text-[#00f5c4] font-bold">
              <KeyRound className="w-4 h-4" />
              <span>Step 1: Get your Supabase project credentials</span>
            </div>
            <p className="text-[#8fbdb8] leading-relaxed">
              Visit <a href="https://supabase.com" target="_blank" rel="noreferrer" className="text-[#00f5c4] underline inline-flex items-center gap-1">supabase.com <ExternalLink className="w-3 h-3" /></a>, open your project, then go to <strong>Project Settings → API</strong>.
            </p>
            <div className="bg-[#041214] p-3 rounded-lg font-mono text-[11px] text-[#00f5c4] select-all border border-[#00f5c4]/25 shadow-inner">
              VITE_SUPABASE_URL="https://your-project.supabase.co"<br />
              VITE_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
            </div>
          </div>

          <div className="p-4 bg-[#020a0b] border border-[#00f5c4]/20 rounded-xl space-y-3">
            <div className="flex items-center gap-2 text-[#00f5c4] font-bold">
              <Database className="w-4 h-4" />
              <span>Step 2: Run the production database migration script</span>
            </div>
            <p className="text-[#8fbdb8] leading-relaxed">
              Paste the complete KukuTrack schema (flock inventory, eggs, brooding, expenses, sales, RLS security policies, triggers, and RPC functions) into your <strong>Supabase SQL Editor</strong> and click Run.
            </p>
            <button
              onClick={handleCopySchema}
              className="px-4 py-2 bg-[#00f5c4] hover:bg-[#1effd5] text-[#021f1a] font-bold rounded-lg transition-all flex items-center gap-2 shadow-[0_0_12px_rgba(0,245,196,0.35)] cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'SQL Schema Copied to Clipboard!' : 'Copy Complete SQL Schema Script'}</span>
            </button>
          </div>

          <div className="p-4 bg-[#020a0b] border border-[#00f5c4]/20 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-[#00f5c4] font-bold">
              <span>Step 3: Add environment variables to Vercel or local .env</span>
            </div>
            <p className="text-[#8fbdb8] leading-relaxed">
              Add the two environment variables above into your Vercel Project Settings (or in your local <code className="text-[#00f5c4]">.env</code> file) and reload the page.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-[#00f5c4]/20">
          <span className="text-[11px] text-[#729997]">
            KukuTrack Poultry Business Management
          </span>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-[#00f5c4] hover:bg-[#1effd5] text-[#021f1a] font-bold text-xs rounded-lg transition-all shadow-[0_0_12px_rgba(0,245,196,0.35)] cursor-pointer"
          >
            {t.refresh}
          </button>
        </div>
      </div>
    </div>
  );
};
