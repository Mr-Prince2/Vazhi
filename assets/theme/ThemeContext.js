import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";

export const LIGHT_THEME = {
  bg: "#F2F2F7",
  bgCard: "#FFFFFF",
  bgElevated: "#FFFFFF",
  bgInput: "#E5E5EA",
  border: "#C6C6C8",
  borderAccent: "#C6C6C8",
  textPrimary: "#000000",
  textSecondary: "#3A3A3C",
  textMuted: "#8E8E93",
  accent: "#007AFF",
  accentSoft: "#E5F1FF",
  accentGlow: "#80BFFF",
  teal: "#34C759",
  tealSoft: "#E8F8EE",
  gold: "#FF9500",
  goldSoft: "#FFF4E5",
  tabBar: "#FFFFFF",
  shadow: "#000000",
  sakura: "#FF2D55",
  navyDeep: "#000000",
};

export const DARK_THEME = {
  bg: "#000000",
  bgCard: "#1C1C1E",
  bgElevated: "#2C2C2E",
  bgInput: "#3A3A3C",
  border: "#38383A",
  borderAccent: "#48484A",
  textPrimary: "#FFFFFF",
  textSecondary: "#EBEBF5",
  textMuted: "#8E8E93",
  accent: "#0A84FF",
  accentSoft: "#003A70",
  accentGlow: "#0055A4",
  teal: "#30D158",
  tealSoft: "#0A3818",
  gold: "#FF9F0A",
  goldSoft: "#4A2F00",
  tabBar: "#1C1C1E",
  shadow: "#000000",
  sakura: "#FF375F",
  navyDeep: "#000000",
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
