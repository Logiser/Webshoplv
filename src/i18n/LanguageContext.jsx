import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { TRANSLATIONS, LANGUAGES, DEFAULT_LANG } from './translations';

// Nyelvi kontextus. A választott nyelv localStorage-ban marad meg,
// és a <html lang> attribútumot is beállítja (SEO + képernyőolvasók).

const LanguageContext = createContext({ lang: DEFAULT_LANG, setLang: () => {}, t: (k) => k });

const STORAGE_KEY = 'ms_lang';

const detectInitial = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && TRANSLATIONS[saved]) return saved;
  } catch (e) {}
  try {
    const nav = (navigator.language || '').slice(0, 2).toLowerCase();
    if (TRANSLATIONS[nav]) return nav;
  } catch (e) {}
  return DEFAULT_LANG;
};

export const LanguageProvider = ({ children }) => {
  const [lang, setLangState] = useState(detectInitial);

  useEffect(() => {
    document.documentElement.lang = lang;
    try { localStorage.setItem(STORAGE_KEY, lang); } catch (e) {}
  }, [lang]);

  const setLang = useCallback((next) => {
    if (TRANSLATIONS[next]) setLangState(next);
  }, []);

  // Fordítás: ha az adott nyelven nincs kulcs, magyarra esik vissza,
  // végső esetben magát a kulcsot adja (így sosem lesz üres felirat)
  const t = useCallback((key) => {
    const dict = TRANSLATIONS[lang] || {};
    if (dict[key] != null) return dict[key];
    const fallback = TRANSLATIONS[DEFAULT_LANG] || {};
    return fallback[key] != null ? fallback[key] : key;
  }, [lang]);

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, languages: LANGUAGES }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLang = () => useContext(LanguageContext);
