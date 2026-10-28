"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export type ThemeName = "blue" | "dark" | "purple" | "red" | "orange" | "green";

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
  initialTheme?: string;
}) {
  const normalizeTheme = (t?: string | null): ThemeName => {
    if (!t) return "blue";
    if (t === "coral") return "orange";
    if (t === "ocean") return "blue";
    const validThemes: ThemeName[] = ["blue", "dark", "purple", "red", "orange", "green"];
    return validThemes.includes(t as ThemeName) ? (t as ThemeName) : "blue";
  };

  const [theme, setThemeState] = useState<ThemeName>(normalizeTheme(initialTheme));

  useEffect(() => {
    // Carrega tema salvo em localStorage com normalização segura
    const saved = localStorage.getItem("clube_cota_theme");
    const resolvedTheme = normalizeTheme(saved || initialTheme);
    setThemeState(resolvedTheme);
    applyThemeClass(resolvedTheme);
  }, [initialTheme]);

  const setTheme = (newTheme: ThemeName) => {
    const normalized = normalizeTheme(newTheme);
    setThemeState(normalized);
    localStorage.setItem("clube_cota_theme", normalized);
    applyThemeClass(normalized);
  };

  const applyThemeClass = (t: ThemeName) => {
    document.body.classList.remove(
      "theme-blue",
      "theme-dark",
      "theme-purple",
      "theme-red",
      "theme-orange",
      "theme-green",
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
