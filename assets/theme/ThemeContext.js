import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";

export const LIGHT_THEME = {
  bg: "#F8FAFC",
  bgCard: "#FFFFFF",
  bgElevated: "#F1F5F9",
  bgInput: "#F1F5F9",
  border: "#E2E8F0",
  borderAccent: "#CBD5E1",
  textPrimary: "#0F172A",
  textSecondary: "#475569",
  textMuted: "#94A3B8",
  accent: "#185FA5",
  accentSoft: "#E8F1FA",
  accentGlow: "#CBD5E1",
  teal: "#3B6D11",
  tealSoft: "#EEF6E8",
  gold: "#D48800",
  goldSoft: "#FFFBE6",
  tabBar: "#FFFFFF",
  shadow: "#000000",
  sakura: "#FFB7C5",
  navyDeep: "#0A2540",
};

export const DARK_THEME = {
  bg: "#0F172A",
  bgCard: "#1E293B",
  bgElevated: "#334155",
  bgInput: "#1E293B",
  border: "#334155",
  borderAccent: "#475569",
  textPrimary: "#F8FAFC",
  textSecondary: "#E2E8F0",
  textMuted: "#64748B",
  accent: "#38BDF8",
  accentSoft: "#0C4A6E",
  accentGlow: "#0284C7",
  teal: "#44ADE80",
  tealSoft: "#064E3B",
  gold: "#FADB14",
  goldSoft: "#2B2111",
  tabBar: "#1E293B",
  shadow: "#000000",
  sakura: "#F472B6",
  navyDeep: "#030712",
};

export const ThemeContext = createContext(undefined);

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const savedTheme = await AsyncStorage.getItem("vazhi:theme");
        if (savedTheme !== null) {
          setIsDarkMode(savedTheme === "dark");
        }
      } catch (e) {
        console.warn("Failed to load theme state caches:", e);
      }
    })();
  }, []);

  const toggleTheme = async () => {
    try {
      const nextMode = !isDarkMode;
      setIsDarkMode(nextMode);
      await AsyncStorage.setItem("vazhi:theme", nextMode ? "dark" : "light");
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <ThemeContext.Provider
      value={{
        isDarkMode,
        theme: isDarkMode ? DARK_THEME : LIGHT_THEME,
        toggleTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    return { isDarkMode: false, theme: LIGHT_THEME, toggleTheme: () => {} };
  }
  return context;
};
