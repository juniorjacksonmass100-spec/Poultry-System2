import React, { createContext, useContext, useState, useEffect } from 'react';
import { Language, translations, Translations } from '../lib/i18n';

interface LanguageContextType {
  lang: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLang] = useState<Language>(() => {
    const saved = localStorage.getItem('kukutrack_lang');
    return (saved === 'sw' || saved === 'en') ? saved : 'en';
  });

  const setLanguage = (newLang: Language) => {
    setLang(newLang);
    localStorage.setItem('kukutrack_lang', newLang);
  };

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  return (
    <LanguageContext.Provider value={{ lang, setLanguage, t: translations[lang] }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
