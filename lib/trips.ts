import { api } from "./api";
import { getTravelId } from "./travelId";

export type TripPayload = {
  clientId: string;
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
  distance: number;
  durationSec: number;
  mode: string;
  purpose: string;
  companions: number;
  startedAt: string;
  endedAt: string;
};

// Properly typed default export targeting the Vazhi server endpoint
export async function createTrip(
  payload: Omit<TripPayload, "clientId"> & { clientId?: string },
) {
  const travelId = await getTravelId();
  const clientId = payload.clientId ?? `rn-${Date.now()}`;

  return api("/trips", {
    method: "POST",
    body: JSON.stringify({ travelId, clientId, ...payload }),
  });
}

export function listTrips(q: string = "") {
  return api(`/trips${q ? `?${q}` : ""}`);
}

export function nearbyPlaces() {
  return api(`/nearby_places`);
}
