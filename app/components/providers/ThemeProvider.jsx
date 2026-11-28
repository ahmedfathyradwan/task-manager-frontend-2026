"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
} from "react";
import { THEME_STORAGE_KEY } from "@/app/lib/format";

const ThemeContext = createContext(null);
const THEME_EVENT = "tm-theme-change";

let themeFallback = "light";

const readTheme = () => {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === "dark" || saved === "light") return saved;
    return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
  } catch {
    return themeFallback;
  }
};

const subscribeToTheme = (callback) => {
  window.addEventListener("storage", callback);
  window.addEventListener(THEME_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(THEME_EVENT, callback);
  };
};

export function ThemeProvider({ children }) {
  const theme = useSyncExternalStore(subscribeToTheme, readTheme, () => "light");

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const setTheme = useCallback((next) => {
    const value = next === "dark" ? "dark" : "light";
    themeFallback = value;
    try {
      localStorage.setItem(THEME_STORAGE_KEY, value);
    } catch {
      // Storage can be unavailable in private mode; the theme still applies.
    }
    window.dispatchEvent(new Event(THEME_EVENT));
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(readTheme() === "dark" ? "light" : "dark");
  }, [setTheme]);

  const value = useMemo(
    () => ({ theme, setTheme, toggleTheme }),
    [theme, setTheme, toggleTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used inside ThemeProvider");
  return context;
};
