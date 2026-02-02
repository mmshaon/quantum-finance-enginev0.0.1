'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { SUPPORTED_LANGUAGES } from '@quantum-finance/config';

type LanguageCode = keyof typeof SUPPORTED_LANGUAGES;

const STORAGE_KEY = 'qfe_lang';

const LanguageContext = createContext<{
  lang: LanguageCode;
  setLang: (l: LanguageCode) => void;
} | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<LanguageCode>('en');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = (localStorage.getItem(STORAGE_KEY) as LanguageCode) || 'en';
    if (['en', 'bn', 'ar'].includes(stored)) {
      setLangState(stored);
      document.documentElement.lang = stored;
      document.documentElement.dir = SUPPORTED_LANGUAGES[stored].dir;
    }
    setMounted(true);
  }, []);

  const setLang = (l: LanguageCode) => {
    setLangState(l);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, l);
      document.documentElement.lang = l;
      document.documentElement.dir = SUPPORTED_LANGUAGES[l].dir;
    }
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}
