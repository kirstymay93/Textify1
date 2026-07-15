import { useEffect, useMemo, useState } from "react";
import type { ThemeMode } from "@/lib/editorUtils";

const THEME_STORAGE_KEY = "textify1.theme.v1";

export interface UseThemeModeReturn {
  theme: ThemeMode;
  resolvedTheme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
}

function getPreferredTheme(): ThemeMode {
  if (typeof window === "undefined") {
    return "dark";
  }

  const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (storedTheme === "light" || storedTheme === "dark") {
    return storedTheme;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function useThemeMode(): UseThemeModeReturn {
  const [theme, setThemeState] = useState<ThemeMode>(getPreferredTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  const toggleTheme = useMemo(
    () => () => setThemeState((current) => (current === "dark" ? "light" : "dark")),
    []
  );

  return {
    theme,
    resolvedTheme: theme,
    setTheme: setThemeState,
    toggleTheme,
  };
}
