import React, { createContext, useContext, useEffect, useState } from 'react';

export type FontSize = 'small' | 'medium' | 'large';

interface FontSizeContextType {
  fontSize: FontSize;
  setFontSize: (size: FontSize) => void;
}

const STORAGE_KEY = 'kukutrack_font_size';
const FontSizeContext = createContext<FontSizeContextType | undefined>(undefined);

const readSaved = (): FontSize => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved === 'small' || saved === 'large' ? saved : 'medium';
  } catch {
    return 'medium';
  }
};

export const FontSizeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [fontSize, setFontSizeState] = useState<FontSize>(readSaved);

  // Apply immediately and on every change. index.css maps data-fs to text sizes.
  useEffect(() => {
    document.documentElement.setAttribute('data-fs', fontSize);
  }, [fontSize]);

  const setFontSize = (size: FontSize) => {
    setFontSizeState(size);
    try {
      localStorage.setItem(STORAGE_KEY, size);
    } catch {
      // storage unavailable - setting still applies for this session
    }
  };

  return (
    <FontSizeContext.Provider value={{ fontSize, setFontSize }}>
      {children}
    </FontSizeContext.Provider>
  );
};

export const useFontSize = (): FontSizeContextType => {
  const ctx = useContext(FontSizeContext);
  if (!ctx) throw new Error('useFontSize must be used within a FontSizeProvider');
  return ctx;
};
