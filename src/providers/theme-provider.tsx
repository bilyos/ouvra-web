'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useSyncExternalStore } from 'react';
import { THEME_STORAGE_KEY } from './theme-script';

/*
  Remplace next-themes : sa balise <script> rendue depuis un composant client
  déclenche une erreur React 19 à chaque page. Ici le script anti-flash est
  rendu côté serveur par le layout racine (voir theme-script.ts).
*/

export type Theme = 'light' | 'dark' | 'system';


interface ThemeContextValue {
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: Theme | string) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function readStoredTheme(): Theme {
  try {
    const v = localStorage.getItem(THEME_STORAGE_KEY);
    return v === 'dark' || v === 'system' ? v : 'light';
  } catch {
    return 'light';
  }
}

const THEME_EVENT = 'alloservice-theme-change';

function subscribeTheme(cb: () => void) {
  window.addEventListener('storage', cb);
  window.addEventListener(THEME_EVENT, cb);
  return () => {
    window.removeEventListener('storage', cb);
    window.removeEventListener(THEME_EVENT, cb);
  };
}

function subscribeSystem(cb: () => void) {
  const mq = window.matchMedia('(prefers-color-scheme: dark)');
  mq.addEventListener('change', cb);
  return () => mq.removeEventListener('change', cb);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Valeur serveur « light » pendant l'hydratation, puis la vraie préférence : pas de décalage SSR/client
  const theme = useSyncExternalStore(subscribeTheme, readStoredTheme, () => 'light' as Theme);
  const systemDark = useSyncExternalStore(
    subscribeSystem,
    () => window.matchMedia('(prefers-color-scheme: dark)').matches,
    () => false
  );

  const hydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  const resolvedTheme: 'light' | 'dark' = theme === 'system' ? (systemDark ? 'dark' : 'light') : theme;

  useEffect(() => {
    // Avant hydratation, le script du layout a déjà posé la bonne classe : on n'y touche pas
    if (!hydrated) return;
    const root = document.documentElement;
    root.classList.toggle('dark', resolvedTheme === 'dark');
    root.style.colorScheme = resolvedTheme;
  }, [hydrated, resolvedTheme]);

  const setTheme = useCallback((next: Theme | string) => {
    const value: Theme = next === 'dark' || next === 'system' ? next : 'light';
    try {
      localStorage.setItem(THEME_STORAGE_KEY, value);
    } catch {
      // stockage indisponible (navigation privée) : le choix vaut pour la session
    }
    window.dispatchEvent(new Event(THEME_EVENT));
  }, []);

  const value = useMemo(() => ({ theme, resolvedTheme, setTheme }), [theme, resolvedTheme, setTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme doit être utilisé dans <ThemeProvider>');
  return ctx;
}
