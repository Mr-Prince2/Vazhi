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
    border: "#E5E5EA",
    accent: "#007AFF",
    textMuted: "#8E8E93",
  };

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.bgCard || "#FFFFFF",
          borderTopWidth: 0,
          position: "absolute",
          elevation: 15,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.08,
          shadowRadius: 16,
          height: 64,
          marginHorizontal: 30,
          marginBottom: Platform.OS === "ios" ? 34 : 24,
          borderRadius: 32,
          borderWidth: 0.5,
          borderColor: theme.border,
          paddingBottom: 0,
          paddingTop: 0,
          justifyContent: "center",
          alignItems: "center",
        },
        tabBarItemStyle: {
          paddingVertical: 8,
        },
        tabBarActiveTintColor: theme.accent || "#007AFF",
        tabBarInactiveTintColor: theme.textMuted || "#8E8E93",
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
