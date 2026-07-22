import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { StatusBar, View } from "react-native";
import { LanguageProvider } from "../assets/theme/LanguageContext";
import { ThemeProvider, useTheme } from "../assets/theme/ThemeContext";

// Maintain splash screen visibility during critical engine mount cycles
SplashScreen.preventAutoHideAsync().catch(() => {});

function RootLayoutContent() {
  const themeContext = useTheme();

  // Strict non-null color parameters shield against rendering collapses
  const currentTheme = themeContext?.theme || { bg: "#F8FAFC" };
  const isDarkMode = themeContext?.isDarkMode || false;

  useEffect(() => {
    // Dismiss splash locks immediately once navigation nodes are attached
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  return (
    // Flex: 1 combined with explicit percent metrics forces full-screen expansion on Windows/Android builds
    <View
      style={{
        flex: 1,
        height: "100%",
        width: "100%",
        backgroundColor: currentTheme.bg || "#F8FAFC",
      }}
    >
      <StatusBar
        barStyle={isDarkMode ? "light-content" : "dark-content"}
        backgroundColor={currentTheme.bg || "#F8FAFC"}
      />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </View>
  );
}

export default function RootLayout() {
  return (
    <LanguageProvider>
      <ThemeProvider>
        <RootLayoutContent />
      </ThemeProvider>
    </LanguageProvider>
  );
}
