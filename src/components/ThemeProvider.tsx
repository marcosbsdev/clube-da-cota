"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export type ThemeName = "blue" | "dark" | "purple" | "ocean" | "coral";

interface ThemeContextType {
  theme: ThemeName;
  setTheme: (theme: ThemeName) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "blue",
  setTheme: () => {},
});

export function ThemeProvider({
  children,
  initialTheme = "blue",
}: {
  children: React.ReactNode;
  initialTheme?: ThemeName;
}) {
  const [theme, setThemeState] = useState<ThemeName>(initialTheme);

  useEffect(() => {
    // Carrega tema salvo em localStorage se disponível
    const saved = localStorage.getItem("clube_cota_theme") as ThemeName | null;
    if (saved && ["blue", "dark", "purple", "ocean", "coral"].includes(saved)) {
      setThemeState(saved);
      applyThemeClass(saved);
    } else {
      applyThemeClass(initialTheme);
    }
  }, [initialTheme]);

  const setTheme = (newTheme: ThemeName) => {
    setThemeState(newTheme);
    localStorage.setItem("clube_cota_theme", newTheme);
    applyThemeClass(newTheme);
  };

  const applyThemeClass = (t: ThemeName) => {
    document.body.classList.remove(
      "theme-blue",
      "theme-dark",
      "theme-purple",
      "theme-ocean",
      "theme-coral"
    );
    document.body.classList.add(`theme-${t}`);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
