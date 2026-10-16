import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import {
  DEFAULT_FONT_ID,
  FONT_STACK_STORAGE_KEY,
  FONT_STORAGE_KEY,
  FontOption,
  getFontOption,
  loadFont,
} from '../lib/fonts';

interface FontContextType {
  fontId: string;
  font: FontOption;
  setFontId: (id: string) => void;
}

const FontContext = createContext<FontContextType | undefined>(undefined);

const readSaved = (): string => {
  try {
    return getFontOption(localStorage.getItem(FONT_STORAGE_KEY)).id;
  } catch {
    return DEFAULT_FONT_ID;
  }
};

export const FontProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [fontId, setFontIdState] = useState<string>(readSaved);
  const font = getFontOption(fontId);

  // Apply the font to the whole app (index.css reads --font-sans) and load its files
  useEffect(() => {
    document.documentElement.style.setProperty('--font-sans', font.stack);
    void loadFont(font);
  }, [font]);

  const setFontId = useCallback((id: string) => {
    const next = getFontOption(id);
    setFontIdState(next.id);
    try {
      localStorage.setItem(FONT_STORAGE_KEY, next.id);
      // The stack is saved too so index.html can apply it before the first paint
      localStorage.setItem(FONT_STACK_STORAGE_KEY, next.stack);
    } catch {
      // storage unavailable - the choice still applies for this session
    }
  }, []);

  return <FontContext.Provider value={{ fontId, font, setFontId }}>{children}</FontContext.Provider>;
};

export const useFont = (): FontContextType => {
  const ctx = useContext(FontContext);
  if (!ctx) throw new Error('useFont must be used within a FontProvider');
  return ctx;
};
