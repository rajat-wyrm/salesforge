import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const ThemeContext = createContext(null);
const STORAGE_KEY = "theme";
const MEDIA_QUERY = "(prefers-color-scheme: dark)";

const getSystemTheme = () => {
  if (typeof window === "undefined" || !window.matchMedia) {
    return "light";
  }

  return window.matchMedia(MEDIA_QUERY).matches ? "dark" : "light";
};

const getStoredTheme = () => {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const savedTheme = window.localStorage.getItem(STORAGE_KEY);
    return savedTheme === "light" || savedTheme === "dark" ? savedTheme : null;
  } catch {
    return null;
  }
};

const applyTheme = (theme) => {
  if (typeof document === "undefined") {
    return;
  }

  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.classList.toggle("light", theme === "light");
  root.style.colorScheme = theme;
};

export const initializeTheme = () => {
  const resolvedTheme = getStoredTheme() ?? getSystemTheme();
  applyTheme(resolvedTheme);
  return resolvedTheme;
};

export const ThemeProvider = ({ children }) => {
  const [themePreference, setThemePreference] = useState(() => getStoredTheme());
  const [systemTheme, setSystemTheme] = useState(() => getSystemTheme());

  const currentTheme = themePreference ?? systemTheme;

  useEffect(() => {
    initializeTheme();
  }, []);

  useEffect(() => {
    applyTheme(currentTheme);
  }, [currentTheme]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    try {
      if (themePreference) {
        window.localStorage.setItem(STORAGE_KEY, themePreference);
      } else {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      // Ignore storage failures so the UI still updates in-memory.
    }

    return undefined;
  }, [themePreference]);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) {
      return undefined;
    }

    const mediaQuery = window.matchMedia(MEDIA_QUERY);
    const handleChange = (event) => {
      setSystemTheme(event.matches ? "dark" : "light");
    };

    setSystemTheme(mediaQuery.matches ? "dark" : "light");

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }

    mediaQuery.addListener(handleChange);
    return () => mediaQuery.removeListener(handleChange);
  }, []);

  const setTheme = useCallback((nextTheme) => {
    if (nextTheme === "dark" || nextTheme === "light") {
      setThemePreference(nextTheme);
      return;
    }

    setThemePreference(null);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemePreference((previousPreference) => {
      const activeTheme = previousPreference ?? systemTheme;
      return activeTheme === "dark" ? "light" : "dark";
    });
  }, [systemTheme]);

  const value = useMemo(
    () => ({
      theme: currentTheme,
      currentTheme,
      themePreference: themePreference ?? "system",
      setTheme,
      toggleTheme,
    }),
    [currentTheme, setTheme, themePreference, toggleTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }

  return context;
};
