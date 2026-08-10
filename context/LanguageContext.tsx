'use client';
import { createContext, useContext, useState, ReactNode } from 'react';
import { translations, Translations, Language } from './translations';

interface LanguageContextType {
  lang: Language;
  toggleLang: () => void;
  tr: Translations;
}

const LanguageContext = createContext<LanguageContextType>({} as LanguageContextType);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Language>('pt');

  const toggleLang = () => setLang((l) => (l === 'pt' ? 'en' : 'pt'));

  return (
    <LanguageContext.Provider value={{ lang, toggleLang, tr: translations[lang] }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext);
