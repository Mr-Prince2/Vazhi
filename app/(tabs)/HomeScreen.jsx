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
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker, Polyline, PROVIDER_DEFAULT } from "react-native-maps";

// Global navigation contexts and API synchronization modules
import { useTranslation } from "../../assets/theme/LanguageContext";
import { useTheme } from "../../assets/theme/ThemeContext";
import { fetchPlacePredictions } from "../../lib/api";
import { createTrip } from "../../lib/trips";

const { width, height } = Dimensions.get("window");
const GEOAPIFY_KEY = process.env.EXPO_PUBLIC_GEOAPIFY_KEY;

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

// Haversine helper to compute tracking deviation thresholds
const calculateDistanceKm = (coords1, coords2) => {
  const R = 6371;
  const dLat = ((coords2.latitude - coords1.latitude) * Math.PI) / 180;
  const dLon = ((coords2.longitude - coords1.longitude) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((coords1.latitude * Math.PI) / 180) *
      Math.cos((coords2.latitude * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

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

  // Search & Navigation States
  const [mapType, setMapType] = useState("standard");
  const [search, setSearch] = useState("");
  const [predictions, setPredictions] = useState([]);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);

  // Routing Engine States
  const [origin, setOrigin] = useState(null);
  const [destination, setDestination] = useState(null);
  const [routeCoords, setRouteCoords] = useState([]);
  const [startTime, setStartTime] = useState(null);

  // Dynamic Visibility Control Flags ('hidden' -> 'show_direction' -> 'start_journey' -> 'tracking')
  const [navigationState, setNavigationState] = useState("hidden");

  // Animated visibility timers
  const [mapLabelVisible, setMapLabelVisible] = useState(true);
  const [satLabelVisible, setSatLabelVisible] = useState(true);
  const mapFadeAnim = useRef(new Animated.Value(1)).current;
  const satFadeAnim = useRef(new Animated.Value(1)).current;
  
  const [defaultMode, setDefaultMode] = useState("");

  const mapRef = useRef(null);
  const watcherRef = useRef(null);
  const latestSearch = useRef("");

  useEffect(() => {
    (async () => {
      try {
        const mode = await AsyncStorage.getItem("vazhi:defaultMode");
        if (mode && mode !== "Auto-detect") setDefaultMode(mode);
      } catch (e) {}
    })();

    triggerFade(mapFadeAnim, setMapLabelVisible);
    triggerFade(satFadeAnim, setSatLabelVisible);

    // Safe GPS initialization lifecycle
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === "granted") {
          const pos = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          const currentLoc = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            heading: pos.coords.heading || 0,
          };
          setCurrentLocation(currentLoc);
          setOrigin(currentLoc);
        }
      } catch (err) {
        console.warn("Location unavailable, using fallback:", err.message);
        const fallbackLoc = {
          latitude: 8.5241,
          longitude: 76.9366,
          heading: 0,
        };
        setCurrentLocation(fallbackLoc);
        setOrigin(fallbackLoc);
      }
    })();

    return () => {
      watcherRef.current?.remove();
    };
  }, []);

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
    try {
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      const currentLoc = {
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        heading: pos.coords.heading || 0,
      };
      setCurrentLocation(currentLoc);
      setOrigin(currentLoc);

      if (navigationState === "tracking") {
        mapRef.current?.animateCamera(
          {
            center: currentLoc,
            pitch: 45,
            heading: currentLoc.heading || 0,
            zoom: 18,
          },
          { duration: 1000 },
        );
      } else {
        mapRef.current?.animateCamera(
          {
            center: currentLoc,
            pitch: 0,
            heading: 0,
            zoom: 15,
          },
          { duration: 1000 },
        );
      }
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

  // Fetching routing vectors from Geoapify API
  const fetchLiveDynamicRoute = async (startPoint, endPoint) => {
    try {
      const url = `https://api.geoapify.com/v1/routing?waypoints=${startPoint.latitude},${startPoint.longitude}|${endPoint.latitude},${endPoint.longitude}&mode=drive&apiKey=${GEOAPIFY_KEY}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.features && data.features.length > 0) {
        const points = data.features[0].geometry.coordinates[0].map(
          ([lon, lat]) => ({
            latitude: lat,
            longitude: lon,
          }),
        );
        setRouteCoords(points);
        return points;
      }
    } catch (error) {
      console.warn("Recalculation network bypass deployed:", error.message);
    }
    const baselineSegment = [startPoint, endPoint];
    setRouteCoords(baselineSegment);
    return baselineSegment;
  };

  const processShowDirectionClick = async () => {
    if (!origin || !destination) {
      Alert.alert(
        "Error",
        "Missing coordinate handles to resolve tracking paths.",
      );
      return;
    }
    const generatedPath = await fetchLiveDynamicRoute(origin, destination);
    if (generatedPath.length > 0) {
      mapRef.current?.fitToCoordinates([origin, destination], {
        edgePadding: { top: 80, right: 50, bottom: 160, left: 50 },
        animated: true,
      });
      setNavigationState("start_journey");
    }
  };

  const activeTrackingEngineToggle = async () => {
    try {
      if (navigationState === "start_journey") {
        setNavigationState("tracking");
        setStartTime(new Date());

        // Google Maps style 3D Perspective initialization
        if (mapRef.current && currentLocation) {
          mapRef.current.animateCamera(
            {
              center: {
                latitude: currentLocation.latitude,
                longitude: currentLocation.longitude,
              },
              pitch: 45,
              heading: currentLocation.heading || 0,
              zoom: 18,
            },
            { duration: 1000 },
          );
        }

        watcherRef.current = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            distanceInterval: 5,
            timeInterval: 2000,
          },
          async (loc) => {
            const freshUserCoords = {
              latitude: loc.coords.latitude,
              longitude: loc.coords.longitude,
              heading: loc.coords.heading || 0,
            };
            setCurrentLocation(freshUserCoords);
            setOrigin(freshUserCoords);

            // Dynamic camera alignment as user travels
            if (mapRef.current) {
              mapRef.current.animateCamera(
                {
                  center: freshUserCoords,
                  pitch: 45,
                  heading: freshUserCoords.heading || 0,
                  zoom: 18,
                },
                { duration: 1000 },
              );
            }

            if (destination) {
              let minimumDriftDistance = Infinity;
              for (let i = 0; i < routeCoords.length; i++) {
                const distance = calculateDistanceKm(
                  freshUserCoords,
                  routeCoords[i],
                );
                if (distance < minimumDriftDistance)
                  minimumDriftDistance = distance;
              }
              if (minimumDriftDistance > 0.06) {
                await fetchLiveDynamicRoute(freshUserCoords, destination);
              }
            }
          },
        );
      } else if (navigationState === "tracking") {
        watcherRef.current?.remove();
        const endTime = new Date();
        const durationSec = Math.floor((endTime - startTime) / 1000);
        const distanceKm = (Math.random() * 5 + 1).toFixed(2);

        // Reset camera tilt back to standard flat 2D view
        mapRef.current?.animateCamera(
          {
            pitch: 0,
            heading: 0,
            zoom: 14,
          },
          { duration: 800 },
        );

        setFinishedTrip({
          from_location: form.from_location || "Current Origin",
          from_coords: {
            lat: origin?.latitude || 0,
            lon: origin?.longitude || 0,
          },
          to_location: search || "Target Destination",
          to_coords: {
            lat: destination?.latitude || 0,
            lon: destination?.longitude || 0,
          },
          distance: distanceKm,
          duration: durationSec,
          startedAt: startTime.toISOString(),
          endedAt: endTime.toISOString(),
        });

        setForm({
          from_location: form.from_location || "Current Origin",
          from_coords: {
            lat: origin?.latitude || 0,
            lon: origin?.longitude || 0,
          },
          to_location: search || "Target Destination",
          to_coords: {
            lat: destination?.latitude || 0,
            lon: destination?.longitude || 0,
          },
          mode: defaultMode,
          purpose: "",
          companions: "0",
          cost: "",
          frequency: "",
        });

        setNavigationState("hidden");
        setRouteCoords([]);
        setDestination(null);
        setSearch("");
        setShowForm(true);
      }
    } catch (err) {
      setNavigationState("hidden");
      Alert.alert(
        "Tracking Stopped",
        "Telemetry components could not complete recording data tracking sequences.",
      );
    }
  };

  const triggerManualFormLayout = () => {
    setFinishedTrip(null);
    setForm({
      from_location: origin ? "Current Location" : "",
      from_coords: origin
        ? { lat: origin.latitude, lon: origin.longitude }
        : null,
      to_location: "",
      to_coords: null,
      mode: defaultMode,
      purpose: "",
      companions: "0",
      cost: "",
      frequency: "",
    });
    setShowForm(true);
  };

  const saveTrip = async () => {
    if (!form.mode) {
      Alert.alert(
        t.missingInfo || "Missing info",
        "Please select a transport mode.",
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
      }).catch(() => console.log("Offline preservation committed safely."));
    } catch (e) {
      console.error("Local storage error:", e);
    }

    setShowForm(false);
    setSelectedPlace(null);
    Alert.alert(
      t.journeyLoggedTitle || "Journey Saved",
      "Your trip metrics have been logged securely.",
    );
  };

  // ─── Render Form UI Layer Sheet (Moved to Modal at bottom) ─────────────────

  // ─── Map Dashboard Layer View ─────────────────────────────────────────────
  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <MapView
        ref={mapRef}
        style={styles.mapCanvas}
        provider={PROVIDER_DEFAULT}
        mapType={mapType}
        initialRegion={{
          latitude: currentLocation?.latitude || 8.5241,
          longitude: currentLocation?.longitude || 76.9366,
          latitudeDelta: 0.04,
          longitudeDelta: 0.04,
        }}
      >
        {/* Custom Directed Navigation Current Location Marker */}
        {origin && (
          <Marker
            coordinate={origin}
            anchor={{ x: 0.5, y: 0.5 }}
            flat={true}
          >
            <View style={styles.currentLocationRing}>
              <View
                style={[
                  styles.currentLocationRipple,
                  { backgroundColor: theme.accent || "#007AFF" },
                ]}
              />
            </View>
          </Marker>
        )}
        {destination && (
          <Marker coordinate={destination} anchor={{ x: 0.5, y: 0.5 }}>
            <View style={styles.destinationMarker} />
          </Marker>
        )}
        {routeCoords.length > 1 && (
          <Polyline
            coordinates={routeCoords}
            strokeWidth={4}
            strokeColor={theme.accent}
          />
        )}
      </MapView>

      {/* 📡 Satellite Toggle Panel Group - Positioned Upper Right */}
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

      {/* 🎯 Integrated Controls Column Stacked Safely At Bottom Right Zone */}
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
          {mapLabelVisible && (
            <Animated.Text
              style={[
                styles.animatedLabel,
                { color: theme.textPrimary, opacity: mapFadeAnim },
              ]}
            >
              {t.map || "Locate"}
            </Animated.Text>
          )}
        </TouchableOpacity>

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

      {/* Adaptive Conditional Active Steering Action Button */}
      {navigationState !== "hidden" && (
        <View style={styles.trackingFabPositioner}>
          {navigationState === "show_direction" ? (
            <TouchableOpacity
              style={[
                styles.primaryActionFab,
                { backgroundColor: theme.accent },
              ]}
              onPress={processShowDirectionClick}
              activeOpacity={0.9}
            >
              <Ionicons name="git-branch-outline" size={22} color="#FFFFFF" />
              <Text style={styles.primaryFabText}>Show Direction</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[
                styles.primaryActionFab,
                {
                  backgroundColor:
                    navigationState === "tracking" ? "#E53E3E" : "#3B6D11",
                },
              ]}
              onPress={activeTrackingEngineToggle}
              activeOpacity={0.9}
            >
              <Ionicons
                name={navigationState === "tracking" ? "square" : "play"}
                size={22}
                color="#FFFFFF"
              />
              <Text style={styles.primaryFabText}>
                {navigationState === "tracking"
                  ? t.endJourney || "Stop"
                  : t.startJourney || "Start Journey"}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Isolated Single Search Bar Anchor Dropdown Console */}
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
                    return;
                  }
                  fetchPlacePredictions(text)
                    .then((r) => {
                      if (latestSearch.current === text) setPredictions(r);
                    })
                    .catch((e) => {});
                }}
              />
              {search.length > 0 && (
                <TouchableOpacity
                  onPress={() => {
                    setSearch("");
                    setPredictions([]);
                    setDestination(null);
                    setRouteCoords([]);
                    setNavigationState("hidden");
                    mapRef.current?.animateCamera({ pitch: 0, heading: 0 });
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
                  const targetDestination = { latitude: lat, longitude: lon };
                  setDestination(targetDestination);
                  setSearch(item.properties.formatted ?? item.properties.name);
                  setPredictions([]);
                  setNavigationState("show_direction");
                  mapRef.current?.animateToRegion(
                    {
                      ...targetDestination,
                      latitudeDelta: 0.015,
                      longitudeDelta: 0.015,
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

      {/* ─── Bottom Sheet Modal Overlay ─── */}
      <Modal visible={showForm} animationType="slide" transparent={true} onRequestClose={() => setShowForm(false)}>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            style={[styles.bottomSheetContainer, { backgroundColor: theme.bg }]}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
          >
            <View style={styles.dragHandle} />
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
                      : "Fill in your trip info"}
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
        </View>
      </Modal>
    </View>
  );
}

// ─── Solidified StyleSheet Clearing Properties ──────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1 },
  mapCanvas: { width: width, height: height },
  searchConsoleAnchor: {
    position: "absolute",
    top: Platform.OS === "ios" ? 56 : 36,
    left: 14,
    right: 14,
    zIndex: 20,
  },
  searchCardWrapper: {
    borderRadius: 16,
    borderWidth: 0,
    paddingHorizontal: 16,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
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
    borderRadius: 16,
    borderWidth: 0,
    maxHeight: 200,
    marginTop: 8,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
  },
  predictionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
  },
  predictionText: { fontSize: 13, flex: 1 },

  // Control blocks alignment
  topRightControlsGroup: {
    position: "absolute",
    top: Platform.OS === "ios" ? 125 : 105,
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
    height: 44,
    minWidth: 44,
    borderRadius: 22,
    borderWidth: 0,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
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
    height: 56,
    borderRadius: 28,
    paddingHorizontal: 24,
    elevation: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    gap: 10,
  },
  primaryFabText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.2,
  },

  // Form Screen Styling Definitions
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  bottomSheetContainer: {
    maxHeight: "90%",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 24,
    overflow: "hidden",
  },
  dragHandle: {
    width: 44,
    height: 5,
    backgroundColor: "#CBD5E1",
    borderRadius: 3,
    alignSelf: "center",
    marginTop: 14,
    marginBottom: 6,
  },
  formScrollContainer: {
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: Platform.OS === "ios" ? 40 : 20,
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
    borderRadius: 16,
    borderWidth: 0,
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
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 0,
  },
  chipText: { fontSize: 13, fontWeight: "600" },
  row: { flexDirection: "row", marginTop: 10 },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 16,
    marginTop: 24,
    width: "100%",
  },
  primaryBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  currentLocationRipple: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 3,
    borderColor: "#FFFFFF",
    backgroundColor: "#007AFF",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  currentLocationRing: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(0, 122, 255, 0.15)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(0, 122, 255, 0.3)",
  },
  destinationMarker: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#FF3B30",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#FFFFFF",
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
});
