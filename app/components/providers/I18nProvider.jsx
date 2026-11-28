"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
} from "react";
import { translate } from "@/app/lib/dictionary";
import {
  LANG_STORAGE_KEY,
  formatClock as fmtClock,
  formatDate as fmtDate,
  formatDateTime as fmtDateTime,
  formatDue as fmtDue,
  formatWeekdayDate as fmtWeekdayDate,
} from "@/app/lib/format";

const I18nContext = createContext(null);
const LANG_EVENT = "tm-lang-change";

let langFallback = "ar";

const readLang = () => {
  try {
    const saved = localStorage.getItem(LANG_STORAGE_KEY);
    return saved === "en" ? "en" : "ar";
  } catch {
    return langFallback;
  }
};

const subscribeToLang = (callback) => {
  window.addEventListener("storage", callback);
  window.addEventListener(LANG_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(LANG_EVENT, callback);
  };
};

const applyDocumentLanguage = (lang) => {
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
};

export function I18nProvider({ children }) {
  const lang = useSyncExternalStore(subscribeToLang, readLang, () => "ar");

  useEffect(() => {
    applyDocumentLanguage(lang);
  }, [lang]);

  const setLang = useCallback((next) => {
    const value = next === "en" ? "en" : "ar";
    langFallback = value;
    try {
      localStorage.setItem(LANG_STORAGE_KEY, value);
    } catch {
      // Storage can be unavailable in private mode; the language still applies.
    }
    window.dispatchEvent(new Event(LANG_EVENT));
  }, []);

  const toggleLang = useCallback(() => {
    setLang(readLang() === "ar" ? "en" : "ar");
  }, [setLang]);

  const value = useMemo(() => {
    const t = (key, vars) => translate(lang, key, vars);

    return {
      lang,
      isRTL: lang === "ar",
      dir: lang === "ar" ? "rtl" : "ltr",
      t,
      setLang,
      toggleLang,
      formatDate: (date, options) => fmtDate(date, lang, options),
      formatWeekdayDate: (date) => fmtWeekdayDate(date, lang),
      formatDateTime: (date) => fmtDateTime(date, lang),
      formatClock: (time) => fmtClock(time, lang),
      formatDue: (date, time) => fmtDue(date, time, lang),
    };
  }, [lang, setLang, toggleLang]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export const useI18n = () => {
  const context = useContext(I18nContext);
  if (!context) throw new Error("useI18n must be used inside I18nProvider");
  return context;
};
