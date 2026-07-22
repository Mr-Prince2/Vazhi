import { Platform } from "react-native";

// CHANGE THIS to your laptop LAN IP that works on your phone browser:
// e.g. http://192.168.29.217:5000
const LAN = "http://192.168.29.217:5000";

// Emulators:
const ANDROID_EMULATOR = "http://10.0.2.2:5000";
const IOS_SIMULATOR = "http://127.0.0.1:5000";

// Pick the right base for where the app runs.
// - Android emulator → 10.0.2.2
// - iOS simulator   → 127.0.0.1
// - Real device (Expo Go) → your LAN IP
export const BASE_URL = __DEV__
  ? Platform.OS === "android"
    ? ANDROID_EMULATOR
    : Platform.OS === "ios"
      ? IOS_SIMULATOR
      : LAN // web fallback
  : LAN;

// MUST match backend .env API_KEY
export const API_KEY = "dev-change-me-long-random";

export async function api<T = any>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": API_KEY,
      ...(init.headers || {}),
    },
    ...init,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${res.status} ${res.statusText}: ${text}`);
  }
  return res.json();
}

const GEOAPIFY_API_KEY = "95bc28e078194709b3738fc4291ad441";

export const fetchPlacePredictions = async (searchText: string) => {
  if (!searchText) return [];

  try {
    const response = await fetch(
      `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(
        searchText,
      )}&limit=5&apiKey=${GEOAPIFY_API_KEY}`,
    );
    const data = await response.json();
    return data.features || [];
  } catch (error) {
    console.error("Geoapify API Error:", error);
    return [];
  }
};
