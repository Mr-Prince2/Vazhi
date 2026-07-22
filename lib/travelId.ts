import AsyncStorage from "@react-native-async-storage/async-storage";
import { api } from "./api";

const KEY = "vazhi:travelId";

export async function getTravelId(): Promise<string> {
  const cached = await AsyncStorage.getItem(KEY);
  if (cached) return cached;

  // your backend auto-creates a travelId at /users/register
  const data = await api<{ status: string; data: { travelId: string } }>(
    "/users/register",
    { method: "POST", body: JSON.stringify({}) },
  );

  const id = data.data.travelId;
  await AsyncStorage.setItem(KEY, id);
  return id;
}
