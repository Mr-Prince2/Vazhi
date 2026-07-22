import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React from "react";
import { Platform } from "react-native";
import { useTranslation } from "../../assets/theme/LanguageContext";
import { useTheme } from "../../assets/theme/ThemeContext";

interface ThemeProps {
  bgCard: string;
  tabBar: string;
  border: string;
  accent: string;
  textMuted: string;
}

export default function TabsLayout() {
  const themeContext = useTheme() as { theme: ThemeProps } | undefined;
  const { t } = useTranslation();

  // Static structure fallback ensures UI tab blocks initialize even before memory resolves
  const theme = themeContext?.theme || {
    bgCard: "#FFFFFF",
    tabBar: "#FFFFFF",
    border: "#E2E8F0",
    accent: "#185FA5",
    textMuted: "#94A3B8",
  };

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.bgCard || "#FFFFFF",
          borderTopColor: theme.border || "#E2E8F0",
          borderTopWidth: 0.5,
          position: "absolute",
          elevation: 8,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.08,
          shadowRadius: 4,
          height: Platform.OS === "ios" ? 88 : 64,
          paddingBottom: Platform.OS === "ios" ? 30 : 10,
          paddingTop: 10,
        },
        tabBarActiveTintColor: theme.accent || "#185FA5",
        tabBarInactiveTintColor: theme.textMuted || "#94A3B8",
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="HomeScreen"
        options={{
          title: t.map || "Map",
          tabBarLabel: t.map || "Map",
          tabBarIcon: ({ focused, color }) => (
            <Ionicons
              name={focused ? "map" : "map-outline"}
              size={22}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="TripHistory"
        options={{
          title: t.journeyLog || "Logs",
          tabBarLabel: t.journeyLog || "Logs",
          tabBarIcon: ({ focused, color }) => (
            <Ionicons
              name={focused ? "analytics" : "analytics-outline"}
              size={22}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="SettingsScreen"
        options={{
          title: t.profile || "Profile",
          tabBarLabel: t.profile || "Profile",
          tabBarIcon: ({ focused, color }) => (
            <Ionicons
              name={focused ? "person" : "person-outline"}
              size={22}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}
