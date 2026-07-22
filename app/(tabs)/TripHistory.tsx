import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Platform,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";
import { useTranslation } from "../../assets/theme/LanguageContext";
import { useTheme } from "../../assets/theme/ThemeContext";
import { getCarbonEquivalency } from "../../lib/carbon";
import { createTrip } from "../../lib/trips";

interface TripData {
  id: string;
  from_location?: string;
  to_location?: string;
  from_coords?: { lat: number; lon: number };
  to_coords?: { lat: number; lon: number };
  distance: string;
  duration: number;
  mode: string;
  purpose?: string;
  companions?: string;
  cost?: string;
  frequency?: string;
  startedAt: string;
  endedAt: string;
  savedAt: string;
  synced: boolean;
  xpEarned?: number;
  coords?: Array<{ latitude: number; longitude: number }>;
}

interface ThemeProps {
  bg: string;
  bgCard: string;
  bgElevated: string;
  bgInput: string;
  border: string;
  borderAccent: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  accent: string;
  accentSoft: string;
  accentGlow: string;
  teal: string;
  tealSoft: string;
  gold: string;
  goldSoft: string;
  tabBar: string;
  shadow: string;
  sakura: string;
  navyDeep: string;
}

const MODE_META: Record<string, { icon: string; color: string; bg: string }> = {
  Bus: { icon: "bus-outline", color: "#185FA5", bg: "#E8F1FA" },
  Car: { icon: "car-outline", color: "#854F0B", bg: "#FEF3C7" },
  Auto: { icon: "car-sport-outline", color: "#D48800", bg: "#FFF8E1" },
  Walk: { icon: "walk-outline", color: "#16A34A", bg: "#DCFCE7" },
  Bike: { icon: "bicycle-outline", color: "#16A34A", bg: "#DCFCE7" },
  Train: { icon: "train-outline", color: "#533AB7", bg: "#EDE9FE" },
  Metro: { icon: "subway-outline", color: "#0891B2", bg: "#CFFAFE" },
};

const PURPOSE_ICON: Record<string, string> = {
  Work: "briefcase-outline",
  Education: "school-outline",
  Shopping: "bag-outline",
  Healthcare: "medkit-outline",
  Recreation: "game-controller-outline",
  Personal: "person-outline",
  Other: "ellipsis-horizontal-outline",
};

const formatDuration = (sec: number): string => {
  if (!sec) return "—";
  const m = Math.floor(sec / 60),
    h = Math.floor(m / 60);
  return h > 0 ? `${h}h ${m % 60}m` : `${m}m`;
};

const formatDate = (iso: string): string => {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const CO2_SAVED: Record<string, number> = {
  Walk: 0.21,
  Bike: 0.21,
  Bus: 0.089,
  Auto: 0.058,
  Car: 0,
  Train: 0.041,
  Metro: 0.041,
};
const calcCO2 = (mode: string, km: string): string =>
  ((CO2_SAVED[mode] ?? 0) * parseFloat(km || "0")).toFixed(2);

interface CardProps {
  trip: TripData;
  theme: ThemeProps;
  onDelete: (id: string) => void;
  t: any;
  index: number;
}

function TripCard({ trip, theme, onDelete, t, index }: CardProps) {
  const meta = MODE_META[trip.mode] ?? {
    icon: "navigate-outline",
    color: theme.accent,
    bg: theme.accentSoft,
  };
  const co2 = calcCO2(trip.mode, trip.distance);
  const [expanded, setExpanded] = useState(false);
  const expandAnim = useRef(new Animated.Value(0)).current;

  const toggleExpand = () => {
    const toVal = expanded ? 0 : 1;
    Animated.spring(expandAnim, {
      toValue: toVal,
      useNativeDriver: false,
      tension: 80,
      friction: 10,
    }).start();
    setExpanded(!expanded);
  };

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.bgCard, borderColor: theme.border },
      ]}
    >
      <TouchableOpacity
        style={styles.cardTop}
        onPress={toggleExpand}
        activeOpacity={0.85}
      >
        {/* Left: mode icon */}
        <View style={[styles.modeCircle, { backgroundColor: meta.bg }]}>
          <Ionicons name={meta.icon as any} size={22} color={meta.color} />
        </View>

        {/* Center: route */}
        <View style={styles.cardRouteCol}>
          <Text
            style={[styles.cardOrigin, { color: theme.textPrimary }]}
            numberOfLines={1}
          >
            {trip.from_location?.split(",")[0] ?? "—"}
          </Text>
          <View style={styles.arrowRow}>
            <View
              style={[styles.routeLine, { backgroundColor: meta.color + "40" }]}
            />
            <View style={[styles.arrowDot, { backgroundColor: meta.color }]} />
          </View>
          <Text
            style={[styles.cardDest, { color: theme.textSecondary }]}
            numberOfLines={1}
          >
            {trip.to_location?.split(",")[0] ?? "—"}
          </Text>
        </View>

        {/* Right: distance + time + badge */}
        <View style={styles.cardRight}>
          <Text style={[styles.cardDist, { color: theme.textPrimary }]}>
            {trip.distance ?? "—"} km
          </Text>
          <Text style={[styles.cardTime, { color: theme.textMuted }]}>
            {formatDate(trip.startedAt)}
          </Text>
          <View style={styles.badgeRow}>
            <View
              style={[
                styles.syncBadge,
                { backgroundColor: trip.synced ? "#DCFCE7" : theme.accentSoft },
              ]}
            >
              <Text
                style={[
                  styles.syncText,
                  { color: trip.synced ? "#16A34A" : theme.accent },
                ]}
              >
                {trip.synced ? "✓ Synced" : "Local"}
              </Text>
            </View>
          </View>
        </View>

        <Ionicons
          name={expanded ? "chevron-up" : "chevron-down"}
          size={14}
          color={theme.textMuted}
          style={{ marginLeft: 4 }}
        />
      </TouchableOpacity>

      {expanded && (
        <View
          style={[styles.expandedSection, { borderTopColor: theme.border }]}
        >
          {/* Stats grid */}
          <View style={styles.detailGrid}>
            {[
              {
                icon: "time-outline",
                label: t.duration,
                val: formatDuration(trip.duration),
                color: theme.accent,
              },
              {
                icon: (PURPOSE_ICON[trip.purpose || "Other"] ??
                  "flag-outline") as string,
                label: t.tripPurpose,
                val: trip.purpose || "—",
                color: "#D48800",
              },
              {
                icon: "people-outline",
                label: t.companions,
                val: `${trip.companions || "0"} people`,
                color: "#533AB7",
              },
              {
                icon: "cash-outline",
                label: t.cost,
                val: trip.cost ? `₹${trip.cost}` : "Free",
                color: "#16A34A",
              },
              {
                icon: "repeat-outline",
                label: "Frequency",
                val: trip.frequency || "—",
                color: theme.textSecondary,
              },
              {
                icon: "leaf-outline",
                label: "CO₂ Saved",
                val: `${co2} kg`,
                color: "#16A34A",
              },
            ].map(({ icon, label, val, color }) => (
              <View
                key={label}
                style={[
                  styles.detailItem,
                  { backgroundColor: theme.bgInput, borderColor: theme.border },
                ]}
              >
                <Ionicons name={icon as any} size={14} color={color} />
                <View>
                  <Text
                    style={[styles.detailLabel, { color: theme.textMuted }]}
                  >
                    {label}
                  </Text>
                  <Text
                    style={[styles.detailVal, { color: theme.textPrimary }]}
                  >
                    {val}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          {trip.coords && trip.coords.length > 0 && (
            <View style={styles.historyMapContainer}>
              <Text
                style={[styles.diaryMapLabel, { color: theme.textSecondary }]}
              >
                {t.travelDiary}
              </Text>
              <View
                style={[styles.mapWrapperHidden, { borderColor: theme.border }]}
              >
                <MapView
                  style={styles.historyMiniMap}
                  scrollEnabled={false}
                  zoomEnabled={false}
                  pitchEnabled={false}
                  rotateEnabled={false}
                  cacheEnabled={true}
                  initialRegion={{
                    latitude: trip.coords[0].latitude,
                    longitude: trip.coords[0].longitude,
                    latitudeDelta: 0.02,
                    longitudeDelta: 0.02,
                  }}
                >
                  <Marker coordinate={trip.coords[0]} pinColor="#16A34A" />
                  <Marker
                    coordinate={trip.coords[trip.coords.length - 1]}
                    pinColor={theme.accent}
                  />
                  <Polyline
                    coordinates={trip.coords}
                    strokeWidth={3}
                    strokeColor={theme.accent}
                  />
                </MapView>
              </View>
            </View>
          )}

          <TouchableOpacity
            style={[
              styles.deleteBtn,
              { borderColor: "#FCA5A5", backgroundColor: "#FEF2F2" },
            ]}
            onPress={() =>
              Alert.alert(t.deleteTripTitle, t.deleteTripSub, [
                { text: t.cancel, style: "cancel" },
                {
                  text: t.delete,
                  style: "destructive",
                  onPress: () => onDelete(trip.id),
                },
              ])
            }
          >
            <Ionicons name="trash-outline" size={13} color="#DC2626" />
            <Text style={[styles.deleteBtnText, { color: "#DC2626" }]}>
              {t.delete} Trip
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

export default function TripHistoryScreen() {
  const { theme } = useTheme() as { theme: ThemeProps };
  const { t } = useTranslation();
  const [trips, setTrips] = useState<TripData[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string>("All");

  const FILTER_OPTIONS = [
    "All",
    "Bus",
    "Car",
    "Walk",
    "Bike",
    "Train",
    "Auto",
    "Metro",
  ];

  const syncOfflineTrips = async (localTrips: TripData[]): Promise<void> => {
    const unsyncedList = localTrips.filter((t) => !t.synced);
    if (unsyncedList.length === 0) return;
    setSyncing(true);
    let databaseUpdated = false;
    try {
      const reconciledList = await Promise.all(
        localTrips.map(async (trip) => {
          if (trip.synced) return trip;
          try {
            await createTrip({
              startLat: trip.from_coords?.lat ?? 0,
              startLng: trip.from_coords?.lon ?? 0,
              endLat: trip.to_coords?.lat ?? 0,
              endLng: trip.to_coords?.lon ?? 0,
              distance: parseFloat(trip.distance),
              durationSec: trip.duration,
              mode: trip.mode,
              purpose: trip.purpose || "Other",
              companions: parseInt(trip.companions || "0", 10),
              startedAt: trip.startedAt,
              endedAt: trip.endedAt,
              clientId: trip.id,
            });
            databaseUpdated = true;
            return { ...trip, synced: true };
          } catch (err: any) {
            return trip;
          }
        }),
      );
      if (databaseUpdated) {
        await AsyncStorage.setItem(
          "vazhi:trips",
          JSON.stringify(reconciledList),
        );
        setTrips(reconciledList);
      }
    } catch (globalErr) {
      console.error(globalErr);
    } finally {
      setSyncing(false);
    }
  };

  const loadTrips = async () => {
    setLoading(true);
    try {
      const raw = await AsyncStorage.getItem("vazhi:trips");
      const parsedTrips: TripData[] = raw ? JSON.parse(raw) : [];
      setTrips(parsedTrips);
      setLoading(false);
      syncOfflineTrips(parsedTrips);
    } catch {
      setTrips([]);
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadTrips();
    }, []),
  );

  const deleteTrip = async (id: string) => {
    const updated = trips.filter((t) => t.id !== id);
    setTrips(updated);
    await AsyncStorage.setItem("vazhi:trips", JSON.stringify(updated));
  };

  const filteredTrips =
    activeFilter === "All"
      ? trips
      : trips.filter((t) => t.mode === activeFilter);

  const totalKm = trips
    .reduce((acc, t) => acc + parseFloat(t.distance || "0"), 0)
    .toFixed(1);
  const totalCO2 = trips
    .reduce((acc, t) => acc + parseFloat(calcCO2(t.mode, t.distance)), 0)
    .toFixed(2);
  const totalCost = trips.reduce(
    (acc, t) => acc + parseFloat(t.cost || "0"),
    0,
  );
  const modeCounts = trips.reduce((acc: Record<string, number>, t) => {
    acc[t.mode] = (acc[t.mode] || 0) + 1;
    return acc;
  }, {});
  const topMode =
    Object.entries(modeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";

  if (!loading && trips.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
        <View style={styles.header}>
          <Text style={[styles.screenTitle, { color: theme.textPrimary }]}>
            {t.journeyLog}
          </Text>
          <Text style={[styles.screenSub, { color: theme.textSecondary }]}>
            {t.travelHistory}
          </Text>
        </View>
        <View style={styles.emptyState}>
          <View
            style={[
              styles.emptyCircle,
              { backgroundColor: theme.accentSoft, borderColor: theme.border },
            ]}
          >
            <Ionicons name="map-outline" size={44} color={theme.accent} />
          </View>
          <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>
            {t.noJourneysYet}
          </Text>
          <Text style={[styles.emptySub, { color: theme.textSecondary }]}>
            {t.startFirstTrip}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={loadTrips}
            tintColor={theme.accent}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.header, { paddingHorizontal: 16 }]}>
          <Text style={[styles.screenTitle, { color: theme.textPrimary }]}>
            {t.journeyLog}
          </Text>
          <View style={styles.headerSubRow}>
            <Text style={[styles.screenSub, { color: theme.textSecondary }]}>
              {trips.length} {t.tripsRecorded}
            </Text>
            {syncing && (
              <View
                style={[
                  styles.syncingBadge,
                  { backgroundColor: theme.accentSoft },
                ]}
              >
                <Ionicons name="sync-outline" size={11} color={theme.accent} />
                <Text style={[styles.syncingText, { color: theme.accent }]}>
                  Syncing
                </Text>
              </View>
            )}
          </View>
        </View>

        <View
          style={[
            styles.accentBar,
            { backgroundColor: theme.accent, marginHorizontal: 16 },
          ]}
        />

        {/* Stats Row */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.statsScrollRow}
        >
          {[
            {
              label: t.totalTrips,
              val: trips.length.toString(),
              icon: "navigate-outline",
              color: theme.accent,
              bg: theme.accentSoft,
            },
            {
              label: t.distance,
              val: `${totalKm}`,
              unit: "km",
              icon: "speedometer-outline",
              color: "#533AB7",
              bg: "#EDE9FE",
            },
            {
              label: "CO₂ Saved",
              val: `${totalCO2}`,
              unit: "kg",
              icon: "leaf-outline",
              color: "#16A34A",
              bg: "#DCFCE7",
            },
            {
              label: "Spent",
              val: `₹${totalCost.toFixed(0)}`,
              icon: "cash-outline",
              color: "#D48800",
              bg: "#FFF8E1",
            },
            {
              label: t.topMode,
              val: topMode,
              icon: "star-outline",
              color: "#854F0B",
              bg: "#FEF3C7",
            },
          ].map(({ label, val, unit, icon, color, bg }) => (
            <View
              key={label}
              style={[
                styles.statCard,
                { backgroundColor: bg, borderColor: color + "30" },
              ]}
            >
              <View
                style={[styles.statIconBg, { backgroundColor: color + "20" }]}
              >
                <Ionicons name={icon as any} size={16} color={color} />
              </View>
              <Text style={[styles.statVal, { color: color }]}>
                {val}
                {unit ? <Text style={{ fontSize: 11 }}> {unit}</Text> : null}
              </Text>
              <Text style={[styles.statLabel, { color: color + "AA" }]}>
                {label}
              </Text>
            </View>
          ))}
        </ScrollView>

        {/* Eco Widget */}
        {trips.length > 0 && (
          <View
            style={[
              styles.ecoWidget,
              {
                backgroundColor: theme.bgCard,
                borderColor: "#DCFCE7",
                marginHorizontal: 16,
              },
            ]}
          >
            <View style={styles.ecoWidgetHeader}>
              <View style={[styles.ecoIconBg, { backgroundColor: "#DCFCE7" }]}>
                <Ionicons name="leaf" size={16} color="#16A34A" />
              </View>
              <Text
                style={[styles.ecoWidgetTitle, { color: theme.textPrimary }]}
              >
                {t.ecoWidgetTitle}
              </Text>
            </View>
            <Text style={[styles.ecoWidgetSub, { color: theme.textSecondary }]}>
              {t.ecoWidgetSub}
            </Text>
            <View style={styles.ecoAnalogyGrid}>
              {[
                {
                  emoji: "🌳",
                  val: `${getCarbonEquivalency(parseFloat(totalCO2)).treesSaved}`,
                  unit: t.trees,
                  sub: t.yearlyAbs,
                },
                {
                  emoji: "🔋",
                  val: getCarbonEquivalency(
                    parseFloat(totalCO2),
                  ).smartphoneCharges.toLocaleString(),
                  unit: "",
                  sub: t.phoneCharges,
                },
              ].map(({ emoji, val, unit, sub }) => (
                <View
                  key={sub}
                  style={[
                    styles.ecoCard,
                    { backgroundColor: "#F0FDF4", borderColor: "#BBF7D0" },
                  ]}
                >
                  <Text style={styles.ecoEmoji}>{emoji}</Text>
                  <View>
                    <Text style={[styles.ecoVal, { color: "#16A34A" }]}>
                      {val} {unit}
                    </Text>
                    <Text style={[styles.ecoLabel, { color: "#4ADE80" }]}>
                      {sub}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Mode Breakdown */}
        {Object.keys(modeCounts).length > 0 && (
          <View
            style={[
              styles.modeBreakdown,
              {
                backgroundColor: theme.bgCard,
                borderColor: theme.border,
                marginHorizontal: 16,
              },
            ]}
          >
            <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
              {t.modeBreakdown}
            </Text>
            <View style={styles.modeBars}>
              {Object.entries(modeCounts)
                .sort((a, b) => b[1] - a[1])
                .map(([mode, count]) => {
                  const meta = MODE_META[mode] ?? {
                    icon: "navigate-outline",
                    color: theme.accent,
                    bg: theme.accentSoft,
                  };
                  const pct = Math.round((count / trips.length) * 100);
                  return (
                    <View key={mode} style={styles.modeBarRow}>
                      <View
                        style={[
                          styles.modeBarIcon,
                          { backgroundColor: meta.bg },
                        ]}
                      >
                        <Ionicons
                          name={meta.icon as any}
                          size={12}
                          color={meta.color}
                        />
                      </View>
                      <Text
                        style={[
                          styles.modeBarLabel,
                          { color: theme.textPrimary },
                        ]}
                      >
                        {mode}
                      </Text>
                      <View style={styles.modeBarTrack}>
                        <View
                          style={[
                            styles.modeBarFill,
                            {
                              width: `${pct}%` as any,
                              backgroundColor: meta.color,
                            },
                          ]}
                        />
                      </View>
                      <Text style={[styles.modeBarPct, { color: meta.color }]}>
                        {pct}%
                      </Text>
                    </View>
                  );
                })}
            </View>
          </View>
        )}

        {/* Filter Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {FILTER_OPTIONS.filter((f) => f === "All" || modeCounts[f]).map(
            (filter) => {
              const meta = filter !== "All" ? MODE_META[filter] : null;
              const active = activeFilter === filter;
              return (
                <TouchableOpacity
                  key={filter}
                  style={[
                    styles.filterPill,
                    {
                      backgroundColor: active
                        ? (meta?.color ?? theme.accent)
                        : theme.bgCard,
                      borderColor: active
                        ? (meta?.color ?? theme.accent)
                        : theme.border,
                    },
                  ]}
                  onPress={() => setActiveFilter(filter)}
                >
                  {meta && (
                    <Ionicons
                      name={meta.icon as any}
                      size={12}
                      color={active ? "#fff" : meta.color}
                    />
                  )}
                  <Text
                    style={[
                      styles.filterPillText,
                      { color: active ? "#fff" : theme.textSecondary },
                    ]}
                  >
                    {filter}
                  </Text>
                  {filter !== "All" && modeCounts[filter] && (
                    <Text
                      style={[
                        styles.filterPillCount,
                        {
                          color: active
                            ? "rgba(255,255,255,0.7)"
                            : theme.textMuted,
                        },
                      ]}
                    >
                      {modeCounts[filter]}
                    </Text>
                  )}
                </TouchableOpacity>
              );
            },
          )}
        </ScrollView>

        {/* Trip Cards */}
        <View style={{ paddingHorizontal: 16 }}>
          <View style={styles.tripsHeader}>
            <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
              {t.recentJourneys}
            </Text>
            <Text style={[styles.tripsCount, { color: theme.textMuted }]}>
              {filteredTrips.length} trips
            </Text>
          </View>
          {filteredTrips.map((trip, index) => (
            <TripCard
              key={trip.id}
              trip={trip}
              theme={theme}
              onDelete={deleteTrip}
              t={t}
              index={index}
            />
          ))}
          {filteredTrips.length === 0 && (
            <View
              style={[
                styles.emptyFilter,
                { backgroundColor: theme.bgCard, borderColor: theme.border },
              ]}
            >
              <Text style={[{ fontSize: 13, color: theme.textMuted }]}>
                No {activeFilter} trips recorded yet.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: Platform.OS === "ios" ? 54 : 40, paddingBottom: 4 },
  screenTitle: { fontSize: 28, fontWeight: "800", letterSpacing: -0.5 },
  headerSubRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 2,
  },
  screenSub: { fontSize: 13 },
  syncingBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  syncingText: { fontSize: 10, fontWeight: "600" },
  accentBar: {
    height: 2,
    width: 32,
    borderRadius: 1,
    marginBottom: 16,
    marginTop: 4,
  },

  statsScrollRow: { paddingHorizontal: 16, paddingBottom: 12, gap: 10 },
  statCard: {
    borderRadius: 14,
    borderWidth: 0.5,
    padding: 14,
    alignItems: "center",
    minWidth: 90,
    gap: 6,
  },
  statIconBg: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  statVal: { fontSize: 16, fontWeight: "800" },
  statLabel: { fontSize: 10, fontWeight: "600", textAlign: "center" },

  ecoWidget: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
    marginTop: 4,
  },
  ecoWidgetHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 6,
  },
  ecoIconBg: {
    width: 30,
    height: 30,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  ecoWidgetTitle: { fontSize: 15, fontWeight: "700" },
  ecoWidgetSub: { fontSize: 12, lineHeight: 18, marginBottom: 14 },
  ecoAnalogyGrid: { flexDirection: "row", gap: 10 },
  ecoCard: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
  },
  ecoEmoji: { fontSize: 22 },
  ecoVal: { fontSize: 14, fontWeight: "700" },
  ecoLabel: { fontSize: 10, marginTop: 1 },

  modeBreakdown: {
    borderRadius: 14,
    borderWidth: 0.5,
    padding: 14,
    marginBottom: 4,
  },
  modeBars: { marginTop: 12, gap: 10 },
  modeBarRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  modeBarIcon: {
    width: 24,
    height: 24,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
  },
  modeBarLabel: { fontSize: 12, fontWeight: "600", width: 44 },
  modeBarTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(0,0,0,0.06)",
    overflow: "hidden",
  },
  modeBarFill: { height: "100%", borderRadius: 3 },
  modeBarPct: {
    fontSize: 11,
    fontWeight: "700",
    width: 34,
    textAlign: "right",
  },

  filterRow: { paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  filterPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 0.5,
  },
  filterPillText: { fontSize: 12, fontWeight: "600" },
  filterPillCount: { fontSize: 10, marginLeft: 1 },

  tripsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  tripsCount: { fontSize: 11 },

  card: {
    borderRadius: 16,
    borderWidth: 0.5,
    marginBottom: 10,
    overflow: "hidden",
  },
  cardTop: { flexDirection: "row", alignItems: "center", padding: 14, gap: 12 },
  modeCircle: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  cardRouteCol: { flex: 1 },
  cardOrigin: { fontSize: 14, fontWeight: "700" },
  arrowRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 5,
    gap: 0,
  },
  routeLine: { flex: 1, height: 2, borderRadius: 1 },
  arrowDot: { width: 7, height: 7, borderRadius: 3.5, marginLeft: 2 },
  cardDest: { fontSize: 13 },
  cardRight: { alignItems: "flex-end", gap: 4 },
  cardDist: { fontSize: 16, fontWeight: "800" },
  cardTime: { fontSize: 10 },
  badgeRow: { flexDirection: "row", gap: 4 },
  syncBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
  syncText: { fontSize: 9, fontWeight: "700" },

  expandedSection: {
    borderTopWidth: 0.5,
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 12,
  },
  detailGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 4,
  },
  detailItem: {
    width: "47%",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 10,
    borderRadius: 10,
    borderWidth: 0.5,
  },
  detailLabel: { fontSize: 10, fontWeight: "600", letterSpacing: 0.2 },
  detailVal: { fontSize: 12, fontWeight: "700", marginTop: 1 },

  historyMapContainer: { marginTop: 12, marginBottom: 6 },
  diaryMapLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.4,
    marginBottom: 6,
    textTransform: "uppercase",
  },
  mapWrapperHidden: {
    height: 130,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 0.5,
  },
  historyMiniMap: { flex: 1 },

  deleteBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    alignSelf: "flex-end",
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 10,
  },
  deleteBtnText: { fontSize: 12, fontWeight: "600" },

  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
  },
  emptyCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  emptyTitle: { fontSize: 20, fontWeight: "700", marginBottom: 10 },
  emptySub: { fontSize: 14, textAlign: "center", lineHeight: 22 },

  emptyFilter: {
    borderRadius: 12,
    borderWidth: 0.5,
    padding: 16,
    alignItems: "center",
  },
});
