import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { Database, Copy, Check, ExternalLink, KeyRound, Sparkles } from 'lucide-react';
import { POULTRY_SCHEMA_SQL } from '../../lib/schemaSql';
import { tr } from '../../lib/locale';

export const SupabaseSetupBanner: React.FC = () => {
  const { t, lang } = useLanguage();
  const isSw = lang === 'sw';
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
                {tr('Production Ready', 'Tayari kwa Matumizi')}
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
              <span>{tr('Step 1: Get your Supabase project credentials', 'Hatua ya 1: Pata taarifa za mradi wako wa Supabase')}</span>
            </div>
            <p className="text-[#8fbdb8] leading-relaxed">
              {tr('Visit', 'Tembelea')} <a href="https://supabase.com" target="_blank" rel="noreferrer" className="text-[#00f5c4] underline inline-flex items-center gap-1">supabase.com <ExternalLink className="w-3 h-3" /></a>{tr(', open your project, then copy the Project URL and the anon public key from the API settings into these two variables:', ', fungua mradi wako, kisha nakili anwani ya mradi na ufunguo wa umma (anon) kutoka kwenye mipangilio ya API uziweke kwenye vigeu hivi viwili:')}
            </p>
            <div className="bg-[#041214] p-3 rounded-lg font-mono text-[11px] text-[#00f5c4] select-all border border-[#00f5c4]/25 shadow-inner">
              VITE_SUPABASE_URL="https://your-project.supabase.co"<br />
              VITE_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
            </div>
          </div>

          <div className="p-4 bg-[#020a0b] border border-[#00f5c4]/20 rounded-xl space-y-3">
            <div className="flex items-center gap-2 text-[#00f5c4] font-bold">
              <Database className="w-4 h-4" />
              <span>{tr('Step 2: Run the database setup script', 'Hatua ya 2: Endesha hati ya kuweka hifadhidata')}</span>
            </div>
            <p className="text-[#8fbdb8] leading-relaxed">
              {tr('Paste the complete KukuTrack setup script (birds, eggs, hatching, expenses, sales, messages, books and the security rules) into the SQL Editor of your Supabase project and press Run.', 'Bandika hati kamili ya usanidi wa KukuTrack (ndege, mayai, utotoleshaji, gharama, mauzo, ujumbe, vitabu na sheria za usalama) kwenye SQL Editor ya mradi wako wa Supabase kisha bonyeza Run.')}
            </p>
            <button
              onClick={handleCopySchema}
              className="px-4 py-2 bg-[#00f5c4] hover:bg-[#1effd5] text-[#021f1a] font-bold rounded-lg transition-all flex items-center gap-2 shadow-[0_0_12px_rgba(0,245,196,0.35)] cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? tr('Script copied!', 'Hati imenakiliwa!') : tr('Copy the complete setup script', 'Nakili hati kamili ya usanidi')}</span>
            </button>
          </div>

          <div className="p-4 bg-[#020a0b] border border-[#00f5c4]/20 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-[#00f5c4] font-bold">
              <span>{tr('Step 3: Add the variables to your hosting (Render) or your local .env file', 'Hatua ya 3: Weka vigeu kwenye huduma yako ya mwenyeji (Render) au faili la .env kwenye kompyuta')}</span>
            </div>
            <p className="text-[#8fbdb8] leading-relaxed">
              {tr('Add the two variables above to the Environment settings of your Render service (or to your local .env file), then reload this page.', 'Weka vigeu viwili vilivyo hapo juu kwenye mipangilio ya Environment ya huduma yako ya Render (au faili la .env), kisha pakia ukurasa huu upya.')}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-[#00f5c4]/20">
          <span className="text-[11px] text-[#729997]">
            {tr('KukuTrack Poultry Business Management', 'KukuTrack: Usimamizi wa Biashara ya Ufugaji wa Ndege')}
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
