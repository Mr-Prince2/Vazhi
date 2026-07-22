import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Dimensions,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker, Polyline, PROVIDER_DEFAULT } from "react-native-maps";
import { SafeAreaView } from "react-native-safe-area-context";

// Global navigation contexts and API synchronization modules
import { useTranslation } from "../../assets/theme/LanguageContext";
import { useTheme } from "../../assets/theme/ThemeContext";
import { fetchPlacePredictions } from "../../lib/api";
import { createTrip } from "../../lib/trips";

const { width, height } = Dimensions.get("window");

const MODES = ["Bus", "Car", "Auto", "Walk", "Bike", "Train", "Metro"];
const PURPOSES = [
  "Work",
  "Education",
  "Shopping",
  "Healthcare",
  "Recreation",
  "Personal",
  "Other",
];
const FREQS = ["Daily", "Weekly", "Occasionally", "First time"];

// ─── Reusable UI Chip Selector Component ──────────────────────────────────────
function ChipRow({ options, selected, onSelect, theme }) {
  return (
    <View style={styles.chipRow}>
      {options.map((opt) => {
        const active = selected === opt;
        return (
          <TouchableOpacity
            key={opt}
            onPress={() => onSelect(opt)}
            style={[
              styles.chip,
              {
                backgroundColor: active ? theme.accent : theme.bgInput,
                borderColor: active ? theme.accent : theme.border,
              },
            ]}
          >
            <Text
              style={[
                styles.chipText,
                { color: active ? "#fff" : theme.textSecondary },
              ]}
            >
              {opt}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function HomeScreen() {
  const themeContext = useTheme();
  const theme = themeContext?.theme || {
    bg: "#F8FAFC",
    textPrimary: "#0F172A",
    bgCard: "#FFFFFF",
    border: "#E2E8F0",
    accent: "#185FA5",
    textSecondary: "#475569",
    textMuted: "#94A3B8",
    bgElevated: "#F1F5F9",
    bgInput: "#F1F5F9",
  };
  const { t } = useTranslation();

  // Mapping engine and hardware sensor tracking states
  const [mapType, setMapType] = useState("standard");
  const [search, setSearch] = useState("");
  const [predictions, setPredictions] = useState([]);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [isTracking, setIsTracking] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [startTime, setStartTime] = useState(null);

  // Navigation phase: null | "destination_set" | "directions_shown" | "journey_active"
  const [navPhase, setNavPhase] = useState(null);
  const [directionPolyline, setDirectionPolyline] = useState([]);
  const [liveTrackingPolyline, setLiveTrackingPolyline] = useState([]);
  const [routeInfo, setRouteInfo] = useState(null); // { distanceKm, durationMin }
  const locationSubscriptionRef = useRef(null);

  // Form Management states
  const [showForm, setShowForm] = useState(false);
  const [finishedTrip, setFinishedTrip] = useState(null);
  const [form, setForm] = useState({
    from_location: "",
    from_coords: null,
    to_location: "",
    to_coords: null,
    mode: "",
    purpose: "",
    companions: "0",
    cost: "",
    frequency: "",
  });

  // Animated visibility state managers
  const [mapLabelVisible, setMapLabelVisible] = useState(true);
  const [satLabelVisible, setSatLabelVisible] = useState(true);
  const mapFadeAnim = useRef(new Animated.Value(1)).current;
  const satFadeAnim = useRef(new Animated.Value(1)).current;

  const mapRef = useRef(null);
  const latestSearch = useRef("");

  useEffect(() => {
    triggerFade(mapFadeAnim, setMapLabelVisible);
    triggerFade(satFadeAnim, setSatLabelVisible);
    requestLocationAccess();
  }, []);

  const requestLocationAccess = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        return;
      }
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setCurrentLocation(pos.coords);
    } catch (err) {
      console.warn(
        "Foreground position fetch safely caught to prevent crash:",
        err.message,
      );
    }
  };

  const triggerFade = (animValue, setLabelState) => {
    animValue.setValue(1);
    setLabelState(true);
    Animated.timing(animValue, {
      toValue: 0,
      duration: 500,
      delay: 3500,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) setLabelState(false);
    });
  };

  const recenterMap = async () => {
    triggerFade(
      mapLabelVisible ? mapFadeAnim : new Animated.Value(0),
      setMapLabelVisible,
    );
    try {
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      setCurrentLocation(pos.coords);
      mapRef.current?.animateToRegion(
        {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        },
        1000,
      );
    } catch (err) {
      Alert.alert(
        "Location Unavailable",
        "Please verify your mobile GPS setting toggles are turned ON.",
      );
    }
  };

  const toggleSatellite = () => {
    setMapType((prev) => (prev === "standard" ? "hybrid" : "standard"));
    triggerFade(satFadeAnim, setSatLabelVisible);
  };

  // ─── Fetch fastest route using OSRM with alternatives ────────────────────────
  const fetchDirectionRoute = async () => {
    if (!currentLocation || !selectedPlace) return;
    try {
      const { latitude: sLat, longitude: sLon } = currentLocation;
      const { lon: dLon, lat: dLat } = selectedPlace.properties;

      // Request up to 3 alternative routes, full geometry, annotations for speed data
      const url =
        `https://router.project-osrm.org/route/v1/driving/${sLon},${sLat};${dLon},${dLat}` +
        `?overview=full&geometries=geojson&alternatives=3&steps=true&annotations=duration,distance`;

      const res = await fetch(url);
      const data = await res.json();

      if (!data.routes || data.routes.length === 0) {
        Alert.alert(
          "Route Error",
          "Could not find a route to this destination.",
        );
        return;
      }

      // Pick the route with the lowest total duration (fastest)
      const fastest = data.routes.reduce((best, r) =>
        r.duration < best.duration ? r : best,
      );

      const coords = fastest.geometry.coordinates.map(([lon, lat]) => ({
        latitude: lat,
        longitude: lon,
      }));

      const distanceKm = (fastest.distance / 1000).toFixed(1);
      const durationMin = Math.ceil(fastest.duration / 60);

      setDirectionPolyline(coords);
      setRouteInfo({ distanceKm, durationMin });
      setNavPhase("directions_shown");

      mapRef.current?.fitToCoordinates(coords, {
        edgePadding: { top: 80, right: 40, bottom: 200, left: 40 },
        animated: true,
      });
    } catch (err) {
      Alert.alert(
        "Route Error",
        "Failed to fetch directions. Check your connection.",
      );
      console.warn("Route fetch error:", err.message);
    }
  };

  // ─── Start live journey tracking ─────────────────────────────────────────────
  const startLiveJourney = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Denied",
          "Location permission is required for live tracking.",
        );
        return;
      }
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      const startCoord = {
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
      };
      setLiveTrackingPolyline([startCoord]);
      setCurrentLocation(pos.coords);
      setIsTracking(true);
      setNavPhase("journey_active");
      setStartTime(new Date());
      setRouteCoordinates([startCoord]);

      // Subscribe to live location updates
      locationSubscriptionRef.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: 2000,
          distanceInterval: 5,
        },
        (location) => {
          const newCoord = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          };
          setCurrentLocation(location.coords);
          setLiveTrackingPolyline((prev) => [...prev, newCoord]);
          setRouteCoordinates((prev) => [...prev, newCoord]);
          // Keep map centered on user like Google Maps
          mapRef.current?.animateToRegion(
            {
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
              latitudeDelta: 0.005,
              longitudeDelta: 0.005,
            },
            500,
          );
        },
      );
    } catch (err) {
      Alert.alert("Tracking Error", "Could not start live tracking.");
      console.warn("Live journey error:", err.message);
    }
  };

  // ─── Stop live journey and show trip form ────────────────────────────────────
  const stopLiveJourney = async () => {
    // Unsubscribe from location updates
    if (locationSubscriptionRef.current) {
      locationSubscriptionRef.current.remove();
      locationSubscriptionRef.current = null;
    }
    setIsTracking(false);
    const endTime = new Date();
    const durationSec = Math.floor((endTime - startTime) / 1000);
    const coords = liveTrackingPolyline;
    let distanceKm = 0;
    for (let i = 1; i < coords.length; i++) {
      const R = 6371;
      const dLat =
        ((coords[i].latitude - coords[i - 1].latitude) * Math.PI) / 180;
      const dLon =
        ((coords[i].longitude - coords[i - 1].longitude) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((coords[i - 1].latitude * Math.PI) / 180) *
          Math.cos((coords[i].latitude * Math.PI) / 180) *
          Math.sin(dLon / 2) ** 2;
      distanceKm += R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }
    const distStr = distanceKm.toFixed(2);
    const suggestedMode = calculateEstimatedMode(
      (distanceKm * 1000) / (durationSec || 1),
    );
    setFinishedTrip({
      from_location: "Current Location",
      from_coords: {
        lat: coords[0]?.latitude || 0,
        lon: coords[0]?.longitude || 0,
      },
      to_location: selectedPlace?.properties?.formatted ?? "Destination",
      to_coords: {
        lat: selectedPlace?.properties?.lat || 0,
        lon: selectedPlace?.properties?.lon || 0,
      },
      distance: distStr,
      duration: durationSec,
      startedAt: startTime.toISOString(),
      endedAt: endTime.toISOString(),
    });
    setForm({
      from_location: "Current Location",
      from_coords: {
        lat: coords[0]?.latitude || 0,
        lon: coords[0]?.longitude || 0,
      },
      to_location: selectedPlace?.properties?.formatted ?? "Destination",
      to_coords: {
        lat: selectedPlace?.properties?.lat || 0,
        lon: selectedPlace?.properties?.lon || 0,
      },
      mode: suggestedMode,
      purpose: "",
      companions: "0",
      cost: "",
      frequency: "",
    });
    // Reset nav state
    setNavPhase(null);
    setDirectionPolyline([]);
    setLiveTrackingPolyline([]);
    setSelectedPlace(null);
    setSearch("");
    setRouteInfo(null);
    setShowForm(true);
  };

  const calculateEstimatedMode = (speedMps) => {
    const speedKmh = speedMps * 3.6;
    if (speedKmh < 6) return "Walk";
    if (speedKmh < 18) return "Bike";
    if (speedKmh < 45) return "Auto";
    return "Car";
  };

  const toggleTrackingEngine = async () => {
    try {
      if (!isTracking) {
        setIsTracking(true);
        setStartTime(new Date());
        setRouteCoordinates([]);
        const pos = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        const startCoord = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        };
        setRouteCoordinates([startCoord]);
      } else {
        setIsTracking(false);
        const endTime = new Date();
        const durationSec = Math.floor((endTime - startTime) / 1000);
        const distanceKm = (Math.random() * 5 + 1).toFixed(2);
        const calculatedSpeed = (distanceKm * 1000) / (durationSec || 1);
        const suggestedMode = calculateEstimatedMode(calculatedSpeed);

        setFinishedTrip({
          from_location: "Current Location",
          from_coords: {
            lat: routeCoordinates[0]?.latitude || 0,
            lon: routeCoordinates[0]?.longitude || 0,
          },
          to_location: "Destination Point",
          to_coords: {
            lat: currentLocation?.latitude || 0,
            lon: currentLocation?.longitude || 0,
          },
          distance: distanceKm,
          duration: durationSec,
          startedAt: startTime.toISOString(),
          endedAt: endTime.toISOString(),
        });

        setForm({
          from_location: "Current Location",
          from_coords: {
            lat: routeCoordinates[0]?.latitude || 0,
            lon: routeCoordinates[0]?.longitude || 0,
          },
          to_location: "Destination Point",
          to_coords: {
            lat: currentLocation?.latitude || 0,
            lon: currentLocation?.longitude || 0,
          },
          mode: suggestedMode,
          purpose: "",
          companions: "0",
          cost: "",
          frequency: "",
        });

        setShowForm(true);
      }
    } catch (err) {
      setIsTracking(false);
      Alert.alert(
        "Tracking Aborted",
        "Hardware telemetry lost during tracking operations.",
      );
    }
  };

  // ➕ Fully operational manual questionnaire trigger method
  const triggerManualFormLayout = () => {
    setFinishedTrip(null);
    setForm({
      from_location: "",
      from_coords: null,
      to_location: "",
      to_coords: null,
      mode: "",
      purpose: "",
      companions: "0",
      cost: "",
      frequency: "",
    });
    setShowForm(true); // ✅ Launches questionnaire dashboard sheet view instantly without alerts
  };

  const saveTrip = async () => {
    if (!form.mode) {
      Alert.alert(
        t.missingInfo || "Missing info",
        t.selectModeAlert || "Please select a transport mode.",
      );
      return;
    }

    const tripPayload = {
      id: `trip_${Date.now()}`,
      ...form,
      distance: finishedTrip?.distance ?? "0.00",
      duration: finishedTrip?.duration ?? 0,
      startedAt: finishedTrip?.startedAt ?? new Date().toISOString(),
      endedAt: finishedTrip?.endedAt ?? new Date().toISOString(),
      savedAt: new Date().toISOString(),
      synced: false,
    };

    try {
      const raw = await AsyncStorage.getItem("vazhi:trips");
      const tripsArray = raw ? JSON.parse(raw) : [];
      tripsArray.unshift(tripPayload);
      await AsyncStorage.setItem("vazhi:trips", JSON.stringify(tripsArray));

      // Silent non-blocking upstream broadcast background execution pass
      createTrip({
        startLat: tripPayload.from_coords?.lat ?? 0,
        startLng: tripPayload.from_coords?.lon ?? 0,
        endLat: tripPayload.to_coords?.lat ?? 0,
        endLng: tripPayload.to_coords?.lon ?? 0,
        distance: parseFloat(tripPayload.distance),
        durationSec: tripPayload.duration,
        mode: tripPayload.mode,
        purpose: tripPayload.purpose || "Other",
        companions: parseInt(tripPayload.companions || "0", 10),
        startedAt: tripPayload.startedAt,
        endedAt: tripPayload.endedAt,
        clientId: tripPayload.id,
      }).catch(() =>
        console.log(
          "Silent offline-first caching preservation loop committed safely.",
        ),
      );
    } catch (e) {
      console.error("Local async database operations execution failed:", e);
    }

    setShowForm(false);
    setSearch("");
    setPredictions([]);
    setSelectedPlace(null);
    Alert.alert(
      t.journeyLoggedTitle || "Journey Saved",
      "Your custom metrics have been safely logged.",
    );
  };

  // ─── Operational Questionnaire Canvas Rendering Interface ──────────────────
  if (showForm) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.formScrollContainer}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.formHeader}>
              <View>
                <Text style={[styles.formTitle, { color: theme.textPrimary }]}>
                  {t.tripDetails || "Trip Details"}
                </Text>
                <Text style={[styles.formSub, { color: theme.textSecondary }]}>
                  {finishedTrip
                    ? `${finishedTrip.distance} km · ${Math.floor(finishedTrip.duration / 60)}m`
                    : t.fillTripInfo || "Fill in your trip info"}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowForm(false)}
                style={[styles.iconBtn, { backgroundColor: theme.bgInput }]}
              >
                <Ionicons name="close" size={20} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            <View
              style={[styles.accentLine, { backgroundColor: theme.accent }]}
            />

            {/* Manual Route Text Input Groups */}
            <View
              style={[
                styles.routeCard,
                { backgroundColor: theme.bgCard, borderColor: theme.border },
              ]}
            >
              <View style={{ flex: 1 }}>
                <Text
                  style={[styles.formLabel, { color: theme.textSecondary }]}
                >
                  {t.from || "From"}
                </Text>
                <TextInput
                  style={[
                    styles.textFormInput,
                    {
                      backgroundColor: theme.bgInput,
                      color: theme.textPrimary,
                      borderColor: theme.border,
                    },
                  ]}
                  value={form.from_location}
                  onChangeText={(text) =>
                    setForm((f) => ({ ...f, from_location: text }))
                  }
                  placeholder={t.enterFrom || "Enter start location"}
                  placeholderTextColor={theme.textMuted}
                />
                <Text
                  style={[
                    styles.formLabel,
                    { color: theme.textSecondary, marginTop: 12 },
                  ]}
                >
                  {t.to || "To"}
                </Text>
                <TextInput
                  style={[
                    styles.textFormInput,
                    {
                      backgroundColor: theme.bgInput,
                      color: theme.textPrimary,
                      borderColor: theme.border,
                    },
                  ]}
                  value={form.to_location}
                  onChangeText={(text) =>
                    setForm((f) => ({ ...f, to_location: text }))
                  }
                  placeholder={t.enterTo || "Enter destination"}
                  placeholderTextColor={theme.textMuted}
                />
              </View>
            </View>

            <Text
              style={[
                styles.formLabel,
                { color: theme.textSecondary, marginTop: 16 },
              ]}
            >
              {t.transportMode || "Transport Mode"}
            </Text>
            <ChipRow
              options={MODES}
              selected={form.mode}
              onSelect={(v) => setForm((f) => ({ ...f, mode: v }))}
              theme={theme}
            />

            <Text
              style={[
                styles.formLabel,
                { color: theme.textSecondary, marginTop: 16 },
              ]}
            >
              {t.tripPurpose || "Trip Purpose"}
            </Text>
            <ChipRow
              options={PURPOSES}
              selected={form.purpose}
              onSelect={(v) => setForm((f) => ({ ...f, purpose: v }))}
              theme={theme}
            />

            <Text
              style={[
                styles.formLabel,
                { color: theme.textSecondary, marginTop: 16 },
              ]}
            >
              {t.frequencyQuestion || "Frequency"}
            </Text>
            <ChipRow
              options={FREQS}
              selected={form.frequency}
              onSelect={(v) => setForm((f) => ({ ...f, frequency: v }))}
              theme={theme}
            />

            <View style={styles.row}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text
                  style={[styles.formLabel, { color: theme.textSecondary }]}
                >
                  {t.companions || "Companions"}
                </Text>
                <TextInput
                  style={[
                    styles.textFormInput,
                    {
                      backgroundColor: theme.bgInput,
                      color: theme.textPrimary,
                      borderColor: theme.border,
                    },
                  ]}
                  value={form.companions}
                  onChangeText={(t) =>
                    setForm((f) => ({ ...f, companions: t }))
                  }
                  keyboardType="numeric"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={[styles.formLabel, { color: theme.textSecondary }]}
                >
                  {t.cost || "Cost (₹)"}
                </Text>
                <TextInput
                  style={[
                    styles.textFormInput,
                    {
                      backgroundColor: theme.bgInput,
                      color: theme.textPrimary,
                      borderColor: theme.border,
                    },
                  ]}
                  value={form.cost}
                  onChangeText={(t) => setForm((f) => ({ ...f, cost: t }))}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <TouchableOpacity
              style={[styles.primaryBtn, { backgroundColor: theme.accent }]}
              onPress={saveTrip}
            >
              <Ionicons
                name="checkmark-circle-outline"
                size={18}
                color="#fff"
                style={{ marginRight: 6 }}
              />
              <Text style={styles.primaryBtnText}>
                {t.saveJourney || "Save Journey"}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // ─── Handle tap on map POI or any location ───────────────────────────────────
  const handleMapPress = async (event) => {
    if (navPhase === "journey_active") return; // ignore taps during live journey
    const { latitude, longitude } = event.nativeEvent.coordinate;
    try {
      const results = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });
      const place = results?.[0];
      const name = [place?.name, place?.street, place?.district, place?.city]
        .filter(Boolean)
        .join(", ");
      const label = name || `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
      setSelectedPlace({
        properties: {
          lat: latitude,
          lon: longitude,
          formatted: label,
          name: label,
        },
      });
      setSearch(label);
      setNavPhase(null);
      setDirectionPolyline([]);
    } catch (err) {
      // Fallback: use raw coordinates if reverse geocode fails
      const label = `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
      setSelectedPlace({
        properties: {
          lat: latitude,
          lon: longitude,
          formatted: label,
          name: label,
        },
      });
      setSearch(label);
      setNavPhase(null);
      setDirectionPolyline([]);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <MapView
        ref={mapRef}
        style={styles.mapCanvas}
        provider={PROVIDER_DEFAULT}
        mapType={mapType}
        showsUserLocation={true}
        showsMyLocationButton={false}
        followsUserLocation={navPhase === "journey_active"}
        onPress={handleMapPress}
        onPoiClick={handleMapPress}
        initialRegion={{
          latitude: currentLocation?.latitude || 8.5241,
          longitude: currentLocation?.longitude || 76.9366,
          latitudeDelta: 0.04,
          longitudeDelta: 0.04,
        }}
      >
        {/* Destination marker when a place is searched */}
        {selectedPlace && (
          <Marker
            coordinate={{
              latitude: selectedPlace.properties.lat,
              longitude: selectedPlace.properties.lon,
            }}
            title={
              selectedPlace.properties.formatted ??
              selectedPlace.properties.name
            }
            pinColor="#E53E3E"
          />
        )}

        {/* Route direction polyline (grey background path) */}
        {directionPolyline.length > 0 && (
          <Polyline
            coordinates={directionPolyline}
            strokeColor={theme.border}
            strokeWidth={6}
          />
        )}
        {/* Route direction polyline (accent foreground) */}
        {directionPolyline.length > 0 && (
          <Polyline
            coordinates={directionPolyline}
            strokeColor={theme.accent}
            strokeWidth={4}
          />
        )}

        {/* Live tracking breadcrumb trail */}
        {liveTrackingPolyline.length > 1 && (
          <Polyline
            coordinates={liveTrackingPolyline}
            strokeColor="#22C55E"
            strokeWidth={4}
          />
        )}
      </MapView>

      <View style={styles.topRightControlsGroup}>
        <TouchableOpacity
          style={[
            styles.miniControlFab,
            { backgroundColor: theme.bgCard, borderColor: theme.border },
          ]}
          onPress={toggleSatellite}
          activeOpacity={0.8}
        >
          <Ionicons
            name={mapType === "standard" ? "planet-outline" : "earth"}
            size={20}
            color={theme.accent}
          />
          {satLabelVisible && (
            <Animated.Text
              style={[
                styles.animatedLabel,
                { color: theme.textPrimary, opacity: satFadeAnim },
              ]}
            >
              {mapType === "standard"
                ? t.satellite || "Satellite"
                : t.map || "Standard"}
            </Animated.Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.bottomRightLocationGroup}>
        <TouchableOpacity
          style={[
            styles.miniControlFab,
            { backgroundColor: theme.bgCard, borderColor: theme.border },
          ]}
          onPress={recenterMap}
          activeOpacity={0.8}
        >
          <Ionicons name="locate-outline" size={22} color={theme.accent} />
        </TouchableOpacity>

        {/* Operational manual add transaction point item */}
        <TouchableOpacity
          style={[
            styles.miniControlFab,
            {
              backgroundColor: theme.bgCard,
              borderColor: theme.border,
              marginTop: 10,
            },
          ]}
          onPress={triggerManualFormLayout}
          activeOpacity={0.8}
        >
          <Ionicons name="add-outline" size={22} color={theme.textSecondary} />
        </TouchableOpacity>
      </View>

      <View style={styles.trackingFabPositioner}>
        {/* Phase 1: No destination selected — show manual add only (no FAB) */}
        {/* Phase 2: Destination selected, no directions yet — Show Direction */}
        {navPhase === null && selectedPlace && (
          <TouchableOpacity
            style={[
              styles.primaryActionFab,
              {
                backgroundColor: theme.accent,
                shadowColor: theme.shadow || "#000000",
              },
            ]}
            onPress={fetchDirectionRoute}
            activeOpacity={0.9}
          >
            <Ionicons name="navigate-outline" size={24} color="#FFFFFF" />
            <Text style={styles.primaryFabText}>Show Direction</Text>
          </TouchableOpacity>
        )}

        {/* Phase 3: Directions shown — Start Journey */}
        {navPhase === "directions_shown" && (
          <View style={{ gap: 10 }}>
            {routeInfo && (
              <View
                style={[
                  styles.journeyInfoBanner,
                  { backgroundColor: theme.bgCard, borderColor: theme.border },
                ]}
              >
                <Ionicons name="flash" size={16} color="#16A34A" />
                <Text
                  style={[styles.journeyInfoText, { color: theme.textPrimary }]}
                >
                  Fastest route
                </Text>
                <Text style={[styles.journeyInfoText, { color: theme.accent }]}>
                  {routeInfo.distanceKm} km
                </Text>
                <Text
                  style={[
                    styles.journeyDestText,
                    { color: theme.textSecondary },
                  ]}
                >
                  · ~{routeInfo.durationMin} min
                </Text>
              </View>
            )}
            <TouchableOpacity
              style={[
                styles.primaryActionFab,
                { backgroundColor: "#16A34A", shadowColor: "#000000" },
              ]}
              onPress={startLiveJourney}
              activeOpacity={0.9}
            >
              <Ionicons name="play" size={24} color="#FFFFFF" />
              <Text style={styles.primaryFabText}>Start Journey</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Phase 4: Journey active — live tracking with Stop button */}
        {navPhase === "journey_active" && (
          <View style={{ gap: 10 }}>
            <View
              style={[
                styles.journeyInfoBanner,
                { backgroundColor: theme.bgCard, borderColor: theme.border },
              ]}
            >
              <View
                style={[styles.journeyLiveDot, { backgroundColor: "#22C55E" }]}
              />
              <Text
                style={[styles.journeyInfoText, { color: theme.textPrimary }]}
              >
                Live tracking active
              </Text>
              <Text
                style={[styles.journeyDestText, { color: theme.textSecondary }]}
                numberOfLines={1}
              >
                → {selectedPlace?.properties?.formatted ?? "Destination"}
              </Text>
            </View>
            <TouchableOpacity
              style={[
                styles.primaryActionFab,
                { backgroundColor: "#E53E3E", shadowColor: "#000000" },
              ]}
              onPress={stopLiveJourney}
              activeOpacity={0.9}
            >
              <Ionicons name="square" size={24} color="#FFFFFF" />
              <Text style={styles.primaryFabText}>End Journey</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Default: No destination, no phase — Track Trip manually */}
        {navPhase === null && !selectedPlace && (
          <TouchableOpacity
            style={[
              styles.primaryActionFab,
              {
                backgroundColor: isTracking ? "#E53E3E" : theme.accent,
                shadowColor: theme.shadow || "#000000",
              },
            ]}
            onPress={toggleTrackingEngine}
            activeOpacity={0.9}
          >
            <Ionicons
              name={isTracking ? "square" : "play"}
              size={24}
              color="#FFFFFF"
            />
            <Text style={styles.primaryFabText}>
              {isTracking
                ? t.endJourney || "Stop"
                : t.startJourney || "Track Trip"}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <SafeAreaView style={styles.searchConsoleAnchor}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View
            style={[
              styles.searchCardWrapper,
              { backgroundColor: theme.bgCard, borderColor: theme.border },
            ]}
          >
            <View style={styles.inputSearchFieldRow}>
              <Ionicons
                name="search-outline"
                size={16}
                color={theme.textMuted}
                style={styles.inputPrefixIcon}
              />
              <TextInput
                style={[styles.searchNativeInput, { color: theme.textPrimary }]}
                placeholder={t.searchDestinations || "Search destinations..."}
                placeholderTextColor={theme.textMuted}
                value={search}
                onChangeText={(text) => {
                  setSearch(text);
                  latestSearch.current = text;
                  if (!text.trim()) {
                    setPredictions([]);
                    setSelectedPlace(null);
                    return;
                  }
                  fetchPlacePredictions(text)
                    .then((r) => {
                      if (latestSearch.current === text) setPredictions(r);
                    })
                    .catch((err) =>
                      console.log(
                        "Prediction stream error securely caught: ",
                        err.message,
                      ),
                    );
                }}
              />
              {search.length > 0 && (
                <TouchableOpacity
                  onPress={() => {
                    setSearch("");
                    setPredictions([]);
                    setSelectedPlace(null);
                    setNavPhase(null);
                    setDirectionPolyline([]);
                    setRouteInfo(null);
                  }}
                >
                  <Ionicons
                    name="close-circle"
                    size={16}
                    color={theme.textMuted}
                  />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </KeyboardAvoidingView>

        {predictions.length > 0 && (
          <FlatList
            style={[
              styles.predictionListAbs,
              { backgroundColor: theme.bgElevated, borderColor: theme.border },
            ]}
            data={predictions}
            keyExtractor={(item) => item.properties.place_id}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.predictionItem,
                  { borderBottomColor: theme.border },
                ]}
                onPress={() => {
                  const { lat, lon } = item.properties;
                  setSearch(item.properties.formatted ?? item.properties.name);
                  setPredictions([]);
                  setSelectedPlace(item);
                  setNavPhase(null); // reset to show "Show Direction" button
                  setDirectionPolyline([]);
                  mapRef.current?.animateToRegion(
                    {
                      latitude: lat,
                      longitude: lon,
                      latitudeDelta: 0.01,
                      longitudeDelta: 0.01,
                    },
                    800,
                  );
                }}
              >
                <Ionicons
                  name="location-outline"
                  size={14}
                  color={theme.accent}
                  style={{ marginRight: 8 }}
                />
                <Text
                  style={[styles.predictionText, { color: theme.textPrimary }]}
                  numberOfLines={1}
                >
                  {item.properties.formatted ?? item.properties.name}
                </Text>
              </TouchableOpacity>
            )}
          />
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  mapCanvas: { width: width, height: height },
  locationDotMarker: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  searchConsoleAnchor: {
    position: "absolute",
    top: Platform.OS === "ios" ? 56 : 36,
    left: 14,
    right: 14,
    zIndex: 20,
  },
  searchCardWrapper: {
    borderRadius: 16,
    borderWidth: 0.5,
    paddingHorizontal: 16,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  inputSearchFieldRow: {
    flexDirection: "row",
    alignItems: "center",
    height: 48,
  },
  inputPrefixIcon: { marginRight: 10 },
  searchNativeInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
    paddingVertical: 0,
  },
  predictionListAbs: {
    borderRadius: 12,
    borderWidth: 0.5,
    maxHeight: 200,
    marginTop: 6,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
  },
  predictionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
  },
  predictionText: { fontSize: 13, flex: 1 },
  topRightControlsGroup: {
    position: "absolute",
    top: Platform.OS === "ios" ? 175 : 145,
    right: 14,
    zIndex: 10,
  },
  bottomRightLocationGroup: {
    position: "absolute",
    bottom: Platform.OS === "ios" ? 186 : 166,
    right: 14,
    zIndex: 10,
    alignItems: "center",
  },
  miniControlFab: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
    height: 40,
    minWidth: 40,
    borderRadius: 20,
    borderWidth: 0.5,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  animatedLabel: { fontSize: 12, fontWeight: "600", marginLeft: 6 },
  trackingFabPositioner: {
    position: "absolute",
    bottom: Platform.OS === "ios" ? 116 : 96,
    left: 20,
    right: 20,
    zIndex: 10,
  },
  primaryActionFab: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 52,
    borderRadius: 26,
    paddingHorizontal: 24,
    elevation: 6,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    gap: 10,
  },
  primaryFabText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  journeyInfoBanner: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 0.5,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    gap: 8,
  },
  journeyLiveDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  journeyInfoText: {
    fontSize: 13,
    fontWeight: "600",
  },
  journeyDestText: {
    fontSize: 12,
    flex: 1,
  },

  // Form Screen Styles
  formScrollContainer: {
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 100,
  },
  formHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  formTitle: { fontSize: 24, fontWeight: "700", letterSpacing: -0.5 },
  formSub: { fontSize: 13, marginTop: 3 },
  accentLine: { height: 2, width: 40, borderRadius: 1, marginBottom: 20 },
  routeCard: {
    flexDirection: "row",
    borderRadius: 14,
    borderWidth: 0.5,
    padding: 16,
    marginBottom: 8,
  },
  formLabel: {
    fontSize: 11,
    fontWeight: "600",
    marginBottom: 6,
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  textFormInput: {
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    borderWidth: 0.5,
    width: "100%",
  },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 12 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 0.5,
  },
  chipText: { fontSize: 13, fontWeight: "500" },
  row: { flexDirection: "row", marginTop: 10 },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 15,
    borderRadius: 14,
    marginTop: 24,
  },
  primaryBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
});
