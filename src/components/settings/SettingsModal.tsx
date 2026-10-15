import React, { useEffect, useState } from 'react';
import { X, Settings as SettingsIcon, Check, Type, BellRing } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { useFont } from '../../context/FontContext';
import { FONT_OPTIONS, loadFont } from '../../lib/fonts';
import { FontSizeSwitcher } from '../common/FontSizeSwitcher';
import { useBanner } from '../../context/BannerContext';
import {
  PermissionState,
  getNotificationPermission,
  requestNotificationPermission,
  showSystemNotification,
} from '../../lib/notifications';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/** App settings: font style and text size. Same screen on the website and in the Android app. */
export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { lang } = useLanguage();
  const { theme } = useTheme();
  const { fontId, setFontId } = useFont();
  const { pushBanner } = useBanner();
  const [permission, setPermission] = useState<PermissionState>('default');
  const isLight = theme === 'light';
  const isSw = lang === 'sw';
  const fontNotesSw: Record<string, string> = {
    jakarta: 'Chaguomsingi. Rafiki na wa kisasa.',
    sf: 'Herufi za mfumo wa Apple kwenye iPhone, iPad na Mac. Vifaa vingine hutumia herufi zao za kawaida.',
    inter: 'Inafanana kwa karibu na San Francisco na hufanya kazi kwenye vifaa vyote.',
    system: 'Herufi za kawaida za simu au kompyuta yako.',
    nunito: 'Laini, zenye umbo la duara na rahisi kusoma.',
    poppins: 'Muundo safi kwa vichwa vya habari.',
    montserrat: 'Nzito na maridadi.',
    dmsans: 'Fupi na wazi.',
    atkinson: 'Imeundwa kwa usomaji ulio wazi zaidi; inafaa macho yaliyochoka.',
    lora: 'Herufi za kitabu zenye mtindo wa jadi.',
  };

  // Fetch every font's files so each card can preview itself in its own style
  useEffect(() => {
    if (!isOpen) return;
    void getNotificationPermission().then(setPermission);
    FONT_OPTIONS.forEach((f) => void loadFont(f));
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className={`border rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-150 ${
          isLight ? 'bg-white border-teal-300 text-slate-900' : 'bg-[#081515] border-[#00f5c4]/30 text-white'
        }`}
        role="dialog"
        aria-modal="true"
        aria-label={isSw ? 'Mipangilio' : 'Settings'}
      >
        <div className={`flex items-center justify-between p-5 border-b shrink-0 ${isLight ? 'border-slate-200 bg-slate-50/60' : 'border-[#00f5c4]/20 bg-[#061212]/60'}`}>
          <h3 className="flex items-center gap-2 text-base font-bold">
            <SettingsIcon className={`w-5 h-5 ${isLight ? 'text-teal-700' : 'text-[#00f5c4]'}`} />
            {isSw ? 'Mipangilio' : 'Settings'}
          </h3>
          <button onClick={onClose} className="text-neutral-400 hover:text-white cursor-pointer" aria-label={isSw ? 'Funga' : 'Close'}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-6 overflow-y-auto">
          {/* Notifications */}
          <section className="space-y-2">
            <h4 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide opacity-80">
              <BellRing className="w-3.5 h-3.5" />
              {isSw ? 'Arifa' : 'Notifications'}
            </h4>
            <p className={`text-[11px] leading-relaxed ${isLight ? 'text-slate-500' : 'text-[#8fbdb8]'}`}>
              {isSw
                ? 'Pata tahadhari ya ujumbe mpya kutoka kwa msimamizi na vikumbusho vya siku ya kutotoa.'
                : 'Get an alert for new messages from the administrator and reminders on hatch day.'}
            </p>
            <div className="flex flex-wrap gap-2">
              {permission !== 'granted' && permission !== 'unsupported' && permission !== 'denied' && (
                <button
                  type="button"
                  onClick={async () => setPermission(await requestNotificationPermission(isSw))}
                  className={`px-4 py-3 rounded-xl text-xs font-bold ${isLight ? 'bg-teal-600 text-white' : 'bg-[#00f5c4] text-[#02211b]'}`}
                >
                  {isSw ? 'Washa arifa za simu' : 'Turn on phone alerts'}
                </button>
              )}
              <button
                type="button"
                onClick={async () => {
                  pushBanner({
                    title: 'KukuTrack',
                    body: isSw ? 'Hii ni arifa ya majaribio. Inafanya kazi!' : 'This is a test notification. It works!',
                    kind: 'message',
                  });
                  await showSystemNotification({ id: `test:${Date.now()}`, title: 'KukuTrack', body: isSw ? 'Arifa ya majaribio' : 'Test notification', isSw });
                }}
                className={`px-4 py-3 rounded-xl text-xs font-bold border ${isLight ? 'border-slate-300 text-slate-800' : 'border-[#00f5c4]/40 text-[#00f5c4]'}`}
              >
                {isSw ? 'Tuma arifa ya majaribio' : 'Send a test notification'}
              </button>
            </div>
            <p className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-[#8fbdb8]'}`}>
              {permission === 'granted'
                ? isSw ? 'Arifa za simu zimewashwa.' : 'Phone alerts are on.'
                : permission === 'denied'
                ? isSw ? 'Zimezuiwa. Ziruhusu kwenye mipangilio ya simu au kivinjari.' : 'Blocked. Allow them in your phone or browser settings.'
                : permission === 'unsupported'
                ? isSw ? 'Kifaa hiki hakiungi mkono arifa.' : 'This device does not support alerts.'
                : isSw ? 'Hazijawashwa bado.' : 'Not turned on yet.'}
            </p>
          </section>

          {/* Text size */}
          <section className="space-y-2">
            <h4 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide opacity-80">
              <Type className="w-3.5 h-3.5" />
              {isSw ? 'Ukubwa wa maandishi' : 'Text size'}
            </h4>
            <FontSizeSwitcher />
          </section>

          {/* Font style */}
          <section className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wide opacity-80">
              {isSw ? 'Mtindo wa herufi' : 'Font style'}
            </h4>
            <div className="grid grid-cols-1 gap-2" role="radiogroup" aria-label={isSw ? 'Mtindo wa herufi' : 'Font style'}>
              {FONT_OPTIONS.map((f) => {
                const active = f.id === fontId;
                return (
                  <button
                    key={f.id}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => setFontId(f.id)}
                    className={`text-left rounded-xl border p-3 flex items-start gap-3 ${
                      active
                        ? isLight
                          ? 'border-teal-500 bg-teal-50'
                          : 'border-[#00f5c4] bg-[#00f5c4]/10'
                        : isLight
                        ? 'border-slate-200 bg-white hover:bg-slate-50'
                        : 'border-[#00f5c4]/15 bg-[#04100f] hover:bg-[#071c1c]'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold" style={{ fontFamily: f.stack }}>
                        {f.label}
                      </div>
                      <div className="text-[13px] opacity-90 mt-0.5 truncate" style={{ fontFamily: f.stack }}>
                        {isSw ? 'KukuTrack · Kuku 1,250 · TZS 15,000' : 'KukuTrack · 1,250 chickens · TZS 15,000'}
                      </div>
                      <div className={`text-[11px] mt-1 ${isLight ? 'text-slate-500' : 'text-[#8fbdb8]'}`}>{isSw ? fontNotesSw[f.id] : f.note}</div>
                    </div>
                    <span
                      className={`shrink-0 w-5 h-5 rounded-full border flex items-center justify-center ${
                        active
                          ? isLight
                            ? 'bg-teal-600 border-teal-600 text-white'
                            : 'bg-[#00f5c4] border-[#00f5c4] text-[#02211b]'
                          : isLight
                          ? 'border-slate-300'
                          : 'border-[#00f5c4]/30'
                      }`}
                    >
                      {active && <Check className="w-3 h-3" />}
                    </span>
                  </button>
                );
              })}
            </div>
            <p className={`text-[11px] leading-relaxed ${isLight ? 'text-slate-500' : 'text-[#8fbdb8]'}`}>
              {isSw
                ? 'Chaguo lako linahifadhiwa kwenye kifaa hiki. Herufi zote (isipokuwa San Francisco na chaguo-msingi la kifaa) zimo ndani ya programu, hivyo zinafanya kazi bila intaneti.'
                : 'Your choice is saved on this device. All fonts except San Francisco and the device default are built into the app, so they also work offline.'}
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};
