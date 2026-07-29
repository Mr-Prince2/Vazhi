import { ClerkLoaded, ClerkProvider } from "@clerk/expo";
import { Stack } from "expo-router";
import * as SecureStore from "expo-secure-store";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { StatusBar, View } from "react-native";
import { LanguageProvider } from "../assets/theme/LanguageContext";
import { ThemeProvider, useTheme } from "../assets/theme/ThemeContext";

// Maintain splash screen visibility during critical engine mount cycles
SplashScreen.preventAutoHideAsync().catch(() => {});

const tokenCache = {
  async getToken(key: string) {
    try {
      const item = await SecureStore.getItemAsync(key);
      return item;
    } catch (error) {
      console.error("SecureStore get item error: ", error);
      await SecureStore.deleteItemAsync(key);
      return null;
    }
  },
  async saveToken(key: string, value: string) {
    try {
      return SecureStore.setItemAsync(key, value);
    } catch (err) {
      return;
    }
  },
};

const publishableKey =
  process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ||
  "pk_test_cG9ldGljLWNvd2JveS0xNS5jbGVyay5hY2NvdW50cy5kZXYk";

function RootLayoutContent() {
  const themeContext = useTheme();

  // Strict non-null color parameters shield against rendering collapses
  const currentTheme = themeContext?.theme || { bg: "#F8FAFC" };
  const isDarkMode = themeContext?.isDarkMode || false;

  return (
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
  useEffect(() => {
    // Dismiss splash screen immediately on root layout mount
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  return (
    <ClerkProvider tokenCache={tokenCache as any} publishableKey={publishableKey}>
      <LanguageProvider>
        <ThemeProvider>
          <RootLayoutContent />
        </ThemeProvider>
      </LanguageProvider>
    </ClerkProvider>
  );
}
