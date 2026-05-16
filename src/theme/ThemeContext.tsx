import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { Appearance } from "react-native";

import { darkColors, lightColors, type ThemeColors } from "./colors";

/* ------------------------------------------------------------------ */
/*  Persistence helpers (lightweight — avoids AsyncStorage dependency) */
/* ------------------------------------------------------------------ */

// We use a module-level variable as the persistence store.
// On React Native this survives across screen re-mounts within a session.
// For true cold-start persistence we fall back to system preference.
let _persistedTheme: "dark" | "light" | null = null;

function getPersistedTheme(): "dark" | "light" {
  if (_persistedTheme) return _persistedTheme;
  return "light";
}

function persistTheme(mode: "dark" | "light") {
  _persistedTheme = mode;
}

/* ------------------------------------------------------------------ */
/*  Context definition                                                */
/* ------------------------------------------------------------------ */

export type ThemeMode = "dark" | "light";

type ThemeContextValue = {
  mode: ThemeMode;
  colors: ThemeColors;
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (mode: ThemeMode) => void;
};

const ThemeContext = createContext<ThemeContextValue>({
  mode: "light",
  colors: lightColors,
  isDark: false,
  toggleTheme: () => {},
  setTheme: () => {},
});

/* ------------------------------------------------------------------ */
/*  Provider                                                          */
/* ------------------------------------------------------------------ */

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(getPersistedTheme);

  const setTheme = useCallback((nextMode: ThemeMode) => {
    setModeState(nextMode);
    persistTheme(nextMode);
  }, []);

  const toggleTheme = useCallback(() => {
    setModeState((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      persistTheme(next);
      return next;
    });
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      mode,
      colors: mode === "dark" ? darkColors : lightColors,
      isDark: mode === "dark",
      toggleTheme,
      setTheme,
    }),
    [mode, toggleTheme, setTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

/* ------------------------------------------------------------------ */
/*  Hook                                                              */
/* ------------------------------------------------------------------ */

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}
