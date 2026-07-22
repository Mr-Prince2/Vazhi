import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "expo-router";
import {
  Bell,
  BookOpen,
  Car,
  ChevronRight,
  Download,
  FileCheck2,
  HelpCircle,
  Info,
  Key,
  Languages,
  Leaf,
  MapPin,
  Palette,
  RadioTower,
  Ruler,
  ScanLine,
  Trash2,
  User,
} from "lucide-react-native";
import React, { useCallback, useState } from "react";
import {
  Alert,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  Share,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useTranslation } from "../../assets/theme/LanguageContext";
import { useTheme } from "../../assets/theme/ThemeContext";
import { evaluateUserLevel } from "../../lib/gamification";
import { LANGUAGE_OPTIONS } from "../../lib/languages";

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

interface SettingItemProps {
  Icon: React.ComponentType<{ size: number; color: string }>;
  title: string;
  subtitle?: string;
  toggle?: boolean;
  value?: boolean;
  onValueChange?: (val: boolean) => void;
  onPress?: () => void;
  accent?: boolean;
  danger?: boolean;
  badge?: string;
}

const SettingItem: React.FC<SettingItemProps> = ({
  Icon,
  title,
  subtitle,
  toggle,
  value,
  onValueChange,
  onPress,
  accent,
  danger,
  badge,
}) => {
  const { theme } = useTheme() as { theme: ThemeProps };
  const iconBg = danger ? "#FEE2E2" : accent ? theme.accentSoft : theme.bgInput;
  const iconColor = danger
    ? "#DC2626"
    : accent
      ? theme.accent
      : theme.textSecondary;
  return (
    <TouchableOpacity
      style={[styles.item, { borderBottomColor: theme.border }]}
      activeOpacity={toggle ? 1 : 0.7}
      onPress={toggle ? undefined : onPress}
    >
      <View style={[styles.itemIconWrap, { backgroundColor: iconBg }]}>
        {Icon && <Icon size={17} color={iconColor} />}
      </View>
      <View style={styles.itemBody}>
        <Text
          style={[
            styles.itemTitle,
            { color: danger ? "#DC2626" : theme.textPrimary },
          ]}
        >
          {title}
        </Text>
        {subtitle && (
          <Text style={[styles.itemSub, { color: theme.textMuted }]}>
            {subtitle}
          </Text>
        )}
      </View>
      {badge && (
        <View style={[styles.badge, { backgroundColor: theme.accent }]}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      )}
      {toggle ? (
        <Switch
          value={value}
          onValueChange={onValueChange}
          trackColor={{ false: theme.border, true: theme.accent + "88" }}
          thumbColor={value ? theme.accent : theme.textMuted}
          ios_backgroundColor={theme.border}
        />
      ) : (
        <ChevronRight size={16} color={theme.textMuted} />
      )}
    </TouchableOpacity>
  );
};

const Section: React.FC<{
  title: string;
  children: React.ReactNode;
  theme: ThemeProps;
}> = ({ title, children, theme }) => (
  <View style={{ marginBottom: 24 }}>
    <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
      {title}
    </Text>
    <View
      style={[
        styles.sectionCard,
        { backgroundColor: theme.bgCard, borderColor: theme.border },
      ]}
    >
      {children}
    </View>
  </View>
);

const ExpandBox: React.FC<{ children: React.ReactNode; theme: ThemeProps }> = ({
  children,
  theme,
}) => (
  <View
    style={[
      styles.expandBox,
      { backgroundColor: theme.bgElevated, borderColor: theme.border },
    ]}
  >
    {children}
  </View>
);

const FAQ: React.FC<{ q: string; a: string; theme: ThemeProps }> = ({
  q,
  a,
  theme,
}) => (
  <View style={{ marginBottom: 12 }}>
    <Text style={[styles.faqQ, { color: theme.textPrimary }]}>{q}</Text>
    <Text style={[styles.faqA, { color: theme.textSecondary }]}>{a}</Text>
  </View>
);

// Generic Sheet Modal
const BottomSheetModal: React.FC<{
  visible: boolean;
  onClose: () => void;
  title: string;
  theme: ThemeProps;
  children: React.ReactNode;
}> = ({ visible, onClose, title, theme, children }) => (
  <Modal
    visible={visible}
    transparent
    animationType="slide"
    onRequestClose={onClose}
  >
    <TouchableOpacity
      style={styles.modalOverlay}
      activeOpacity={1}
      onPress={onClose}
    />
    <View style={[styles.modalSheet, { backgroundColor: theme.bgCard }]}>
      <View style={[styles.modalHandle, { backgroundColor: theme.border }]} />
      <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>
        {title}
      </Text>
      <View style={[styles.modalDivider, { backgroundColor: theme.border }]} />
      {children}
    </View>
  </Modal>
);

const TRANSPORT_MODES = [
  "Auto-detect",
  "Bus",
  "Car",
  "Auto",
  "Walk",
  "Bike",
  "Train",
  "Metro",
];
const UNIT_OPTIONS = ["Metric (km)", "Imperial (mi)"];

export default function SettingsScreen() {
  const { theme, isDarkMode, toggleTheme } = useTheme() as {
    theme: ThemeProps;
    isDarkMode: boolean;
    toggleTheme: () => void;
  };
  const { currentLang, t, changeLanguage } = useTranslation();

  const [profileProgress, setProfileProgress] = useState({
    xp: 0,
    level: 1,
    nextLevelXp: 100,
    rankTitle: "Novice Pathfinder",
  });
  const [autoDetection, setAutoDetection] = useState(true);
  const [locationEnabled, setLocationEnabled] = useState(true);
  const [backgroundTracking, setBackgroundTracking] = useState(false);
  const [carbonTracking, setCarbonTracking] = useState(true);
  const [diaryEnabled, setDiaryEnabled] = useState(true);
  const [monthlyReport, setMonthlyReport] = useState(false);
  const [twoFactor, setTwoFactor] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [openSection, setOpenSection] = useState<string | null>(null);

  // Modal states
  const [showNotifModal, setShowNotifModal] = useState(false);
  const [showUnitsModal, setShowUnitsModal] = useState(false);
  const [showDefaultModeModal, setShowDefaultModeModal] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);

  // Persisted preferences
  const [selectedUnit, setSelectedUnit] = useState("Metric (km)");
  const [selectedDefaultMode, setSelectedDefaultMode] = useState("Auto-detect");
  const [notifJourneyReminder, setNotifJourneyReminder] = useState(true);
  const [notifWeeklySummary, setNotifWeeklySummary] = useState(true);
  const [notifSyncAlerts, setNotifSyncAlerts] = useState(false);
  const [notifCarbonMilestone, setNotifCarbonMilestone] = useState(true);

  const toggle = (key: string) =>
    setOpenSection((prev) => (prev === key ? null : key));

  const loadActivePreferences = async () => {
    try {
      const xpRaw = await AsyncStorage.getItem("vazhi:total_xp");
      const aggregateXp = xpRaw ? parseInt(xpRaw, 10) : 0;
      setProfileProgress(evaluateUserLevel(aggregateXp));

      const boolKeys: [
        string,
        React.Dispatch<React.SetStateAction<boolean>>,
        boolean,
      ][] = [
        ["vazhi:autoDetection", setAutoDetection, true],
        ["vazhi:locationEnabled", setLocationEnabled, true],
        ["vazhi:backgroundTracking", setBackgroundTracking, false],
        ["vazhi:carbonTracking", setCarbonTracking, true],
        ["vazhi:diaryEnabled", setDiaryEnabled, true],
        ["vazhi:monthlyReport", setMonthlyReport, false],
        ["vazhi:twoFactor", setTwoFactor, false],
        ["vazhi:notifications", setNotifications, true],
        ["vazhi:notifJourneyReminder", setNotifJourneyReminder, true],
        ["vazhi:notifWeeklySummary", setNotifWeeklySummary, true],
        ["vazhi:notifSyncAlerts", setNotifSyncAlerts, false],
        ["vazhi:notifCarbonMilestone", setNotifCarbonMilestone, true],
      ];

      for (const [key, stateSetter, defaultVal] of boolKeys) {
        const stored = await AsyncStorage.getItem(key);
        if (stored !== null) stateSetter(stored === "true");
        else stateSetter(defaultVal);
      }

      const unit = await AsyncStorage.getItem("vazhi:unit");
      if (unit) setSelectedUnit(unit);
      const mode = await AsyncStorage.getItem("vazhi:defaultMode");
      if (mode) setSelectedDefaultMode(mode);
    } catch (err) {
      console.error("Failed loading preferences:", err);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadActivePreferences();
    }, []),
  );

  const savePreference = async (
    key: string,
    value: boolean,
    stateSetter: (val: boolean) => void,
  ) => {
    stateSetter(value);
    try {
      await AsyncStorage.setItem(key, String(value));
    } catch (err) {
      console.error(err);
    }
  };

  const saveStringPref = async (key: string, value: string) => {
    try {
      await AsyncStorage.setItem(key, value);
    } catch (err) {
      console.error(err);
    }
  };

  const handleLanguageChange = () => {
    const promptButtons = LANGUAGE_OPTIONS.map((lang) => ({
      text: `${lang.label} (${lang.sub})`,
      onPress: () => changeLanguage(lang.code),
    }));
    Alert.alert("Select Language", "Choose your preferred language:", [
      ...promptButtons,
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const handleExportData = async () => {
    try {
      const rawTrips = await AsyncStorage.getItem("vazhi:trips");
      if (!rawTrips || JSON.parse(rawTrips).length === 0) {
        Alert.alert("No Data", "No journeys recorded yet.");
        return;
      }
      await Share.share({ title: "Vazhi Data Export", message: rawTrips });
    } catch (error: any) {
      Alert.alert("Export Error", error.message);
    }
  };

  const showDataConsentDialog = () => {
    Alert.alert(
      "KSCSTE-NATPAC Data Consent",
      "Vazhi uses anonymized transit metrics to support public transportation planning. Personal identifying details are removed before any data is uploaded.\n\nStatus: Policy Guidelines Active.",
      [{ text: "Understood", style: "default" }],
    );
  };

  const handleClearAllData = () => {
    Alert.alert(
      "Erase All Data?",
      "This permanently deletes your offline trips, level progress, and all settings. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Erase Everything",
          style: "destructive",
          onPress: async () => {
            await AsyncStorage.clear();
            setAutoDetection(true);
            setLocationEnabled(true);
            setBackgroundTracking(false);
            setCarbonTracking(true);
            setDiaryEnabled(true);
            setMonthlyReport(false);
            setTwoFactor(false);
            setNotifications(true);
            setSelectedUnit("Metric (km)");
            setSelectedDefaultMode("Auto-detect");
            setProfileProgress({
              xp: 0,
              level: 1,
              nextLevelXp: 100,
              rankTitle: "Novice Pathfinder",
            });
            Alert.alert("Cleared", "All local data has been erased.");
          },
        },
      ],
    );
  };

  const currentLangLabel =
    LANGUAGE_OPTIONS.find((l) => l.code === currentLang)?.label ?? "English";

  const xpProgress =
    profileProgress.nextLevelXp > 0
      ? Math.min(profileProgress.xp / profileProgress.nextLevelXp, 1)
      : 0;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View>
            <Text style={[styles.screenTitle, { color: theme.textPrimary }]}>
              {t.profile}
            </Text>
            <Text style={[styles.screenSub, { color: theme.textSecondary }]}>
              {t.settingsSub}
            </Text>
          </View>
          <TouchableOpacity
            onPress={toggleTheme}
            style={[
              styles.themePill,
              {
                backgroundColor: isDarkMode ? "#1E293B" : "#F1F5F9",
                borderColor: theme.border,
              },
            ]}
          >
            <Text style={{ fontSize: 16 }}>{isDarkMode ? "🌙" : "☀️"}</Text>
            <Text
              style={[styles.themePillLabel, { color: theme.textSecondary }]}
            >
              {isDarkMode ? "Dark" : "Light"}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.accentBar, { backgroundColor: theme.accent }]} />

        {/* Profile Card */}
        <TouchableOpacity
          style={[
            styles.profileCard,
            { backgroundColor: theme.bgCard, borderColor: theme.border },
          ]}
          onPress={() => setShowAccountModal(true)}
          activeOpacity={0.85}
        >
          <View
            style={[
              styles.avatar,
              { backgroundColor: theme.accentSoft, borderColor: theme.accent },
            ]}
          >
            <Text style={[styles.avatarText, { color: theme.accent }]}>V</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.profileName, { color: theme.textPrimary }]}>
              Vazhi User
            </Text>
            <Text style={[styles.profileId, { color: theme.textMuted }]}>
              {profileProgress.rankTitle}
            </Text>
            <View style={styles.xpBarWrapper}>
              <View style={[styles.xpBarBg, { backgroundColor: theme.border }]}>
                <View
                  style={[
                    styles.xpBarFill,
                    {
                      backgroundColor: theme.accent,
                      width: `${xpProgress * 100}%` as any,
                    },
                  ]}
                />
              </View>
              <Text style={[styles.xpLabel, { color: theme.textMuted }]}>
                {profileProgress.xp} / {profileProgress.nextLevelXp} XP
              </Text>
            </View>
          </View>
          <View
            style={[styles.levelBadge, { backgroundColor: theme.accentSoft }]}
          >
            <Text style={[styles.levelText, { color: theme.accent }]}>
              Lvl {profileProgress.level}
            </Text>
          </View>
        </TouchableOpacity>

        <Section title={t.general} theme={theme}>
          <SettingItem
            Icon={User}
            title={t.accountStatus}
            subtitle={t.anonProfile}
            onPress={() => setShowAccountModal(true)}
          />
          <SettingItem
            Icon={HelpCircle}
            title={t.helpSupport}
            subtitle="FAQs & resources"
            onPress={() => toggle("help")}
          />
          {openSection === "help" && (
            <ExpandBox theme={theme}>
              <FAQ
                q="Why track my trips?"
                a="Your anonymized data supports transportation planning for KSCSTE-NATPAC, helping improve public transit in Kerala."
                theme={theme}
              />
              <FAQ
                q="Is my data private?"
                a="Yes. Location data is anonymized before any upload and is never linked to personal identifiers."
                theme={theme}
              />
              <FAQ
                q="How is CO₂ calculated?"
                a="We use standardized emission factors per transport mode, measuring the carbon saved vs. private car usage."
                theme={theme}
              />
            </ExpandBox>
          )}
          <SettingItem
            Icon={Info}
            title={t.aboutApp}
            subtitle="Credits & Info"
            onPress={() => toggle("about")}
          />
          {openSection === "about" && (
            <ExpandBox theme={theme}>
              <Text style={[styles.faqQ, { color: theme.textPrimary }]}>
                Vazhi v1.0.0
              </Text>
              <Text
                style={[
                  styles.faqA,
                  { color: theme.textSecondary, marginTop: 4 },
                ]}
              >
                Developed for KSCSTE-NATPAC, Kerala State Council for Science,
                Technology and Environment — National Transportation Planning
                and Cybermap Centre.
              </Text>
            </ExpandBox>
          )}
        </Section>

        <Section title={t.personalization} theme={theme}>
          <SettingItem
            Icon={Palette}
            title={t.themePalette}
            subtitle={isDarkMode ? t.darkMode : t.lightMode}
            toggle
            value={isDarkMode}
            onValueChange={toggleTheme}
            accent
          />
          <SettingItem
            Icon={Languages}
            title={t.language}
            subtitle={currentLangLabel}
            onPress={handleLanguageChange}
          />
          <SettingItem
            Icon={Bell}
            title={t.notifications}
            subtitle={notifications ? "Enabled — tap to configure" : "Disabled"}
            onPress={() => setShowNotifModal(true)}
            badge={notifications ? "On" : undefined}
          />
          <SettingItem
            Icon={Ruler}
            title={t.units}
            subtitle={selectedUnit}
            onPress={() => setShowUnitsModal(true)}
          />
        </Section>

        <Section title={t.tripPrefs} theme={theme}>
          <SettingItem
            Icon={ScanLine}
            title={t.autoDetect}
            subtitle="Detect transport mode via speed"
            toggle
            value={autoDetection}
            onValueChange={(v) =>
              savePreference("vazhi:autoDetection", v, setAutoDetection)
            }
            accent
          />
          <SettingItem
            Icon={Car}
            title={t.defaultMode}
            subtitle={selectedDefaultMode}
            onPress={() => setShowDefaultModeModal(true)}
          />
        </Section>

        <Section title={t.privacyData} theme={theme}>
          <SettingItem
            Icon={FileCheck2}
            title={t.dataConsent}
            subtitle="Authorized frameworks active"
            onPress={showDataConsentDialog}
          />
          <SettingItem
            Icon={Download}
            title={t.exportLogs}
            subtitle="Share trip data as JSON"
            onPress={handleExportData}
          />
          <SettingItem
            Icon={MapPin}
            title={t.locationPerms}
            subtitle={locationEnabled ? "Enabled" : "Disabled"}
            toggle
            value={locationEnabled}
            onValueChange={(v) =>
              savePreference("vazhi:locationEnabled", v, setLocationEnabled)
            }
          />
          <SettingItem
            Icon={RadioTower}
            title={t.backgroundAggr}
            subtitle={
              backgroundTracking
                ? "Active — tracks when app is closed"
                : "Disabled"
            }
            toggle
            value={backgroundTracking}
            onValueChange={(v) =>
              savePreference(
                "vazhi:backgroundTracking",
                v,
                setBackgroundTracking,
              )
            }
          />
          <SettingItem
            Icon={Trash2}
            title={t.clearCache}
            subtitle="Permanently erase all local data"
            onPress={handleClearAllData}
            danger
          />
        </Section>

        <Section title={t.insights} theme={theme}>
          <SettingItem
            Icon={BookOpen}
            title={t.travelDiary}
            subtitle="Show route map in trip history"
            toggle
            value={diaryEnabled}
            onValueChange={(v) =>
              savePreference("vazhi:diaryEnabled", v, setDiaryEnabled)
            }
          />
          <SettingItem
            Icon={Leaf}
            title={t.co2Tracker}
            subtitle="Track carbon emissions saved"
            toggle
            value={carbonTracking}
            onValueChange={(v) =>
              savePreference("vazhi:carbonTracking", v, setCarbonTracking)
            }
            accent
          />
        </Section>

        <Section title={t.security} theme={theme}>
          <SettingItem
            Icon={Key}
            title={t.twoFactor}
            subtitle={
              twoFactor
                ? "Extra layer of account protection active"
                : "Tap to enable 2FA"
            }
            toggle
            value={twoFactor}
            onValueChange={(v) => {
              if (v) {
                Alert.alert(
                  "Enable 2FA",
                  "Two-factor authentication adds an extra security layer. You will need a verification code at each login.",
                  [
                    { text: "Cancel", style: "cancel" },
                    {
                      text: "Enable",
                      onPress: () =>
                        savePreference("vazhi:twoFactor", true, setTwoFactor),
                    },
                  ],
                );
              } else {
                savePreference("vazhi:twoFactor", false, setTwoFactor);
              }
            }}
          />
        </Section>

        <Text style={[styles.footer, { color: theme.textMuted }]}>
          Vazhi · Built for KSCSTE-NATPAC · Kerala
        </Text>
      </ScrollView>

      {/* Notifications Modal */}
      <BottomSheetModal
        visible={showNotifModal}
        onClose={() => setShowNotifModal(false)}
        title="Notifications"
        theme={theme}
      >
        <View style={{ padding: 16, gap: 0 }}>
          {[
            {
              label: "Master Switch",
              sub: "Enable all notifications",
              val: notifications,
              key: "vazhi:notifications",
              setter: setNotifications,
            },
            {
              label: "Journey Reminders",
              sub: "Prompt to log trips",
              val: notifJourneyReminder,
              key: "vazhi:notifJourneyReminder",
              setter: setNotifJourneyReminder,
            },
            {
              label: "Weekly Summary",
              sub: "Your stats every Sunday",
              val: notifWeeklySummary,
              key: "vazhi:notifWeeklySummary",
              setter: setNotifWeeklySummary,
            },
            {
              label: "Sync Alerts",
              sub: "When data syncs to server",
              val: notifSyncAlerts,
              key: "vazhi:notifSyncAlerts",
              setter: setNotifSyncAlerts,
            },
            {
              label: "CO₂ Milestones",
              sub: "Celebrate green achievements",
              val: notifCarbonMilestone,
              key: "vazhi:notifCarbonMilestone",
              setter: setNotifCarbonMilestone,
            },
          ].map(({ label, sub, val, key, setter }) => (
            <View
              key={label}
              style={[styles.modalRow, { borderBottomColor: theme.border }]}
            >
              <View style={{ flex: 1 }}>
                <Text
                  style={[
                    { fontSize: 14, fontWeight: "600" },
                    { color: theme.textPrimary },
                  ]}
                >
                  {label}
                </Text>
                <Text
                  style={[
                    { fontSize: 11, marginTop: 1 },
                    { color: theme.textMuted },
                  ]}
                >
                  {sub}
                </Text>
              </View>
              <Switch
                value={val}
                onValueChange={(v) => savePreference(key, v, setter)}
                trackColor={{ false: theme.border, true: theme.accent + "88" }}
                thumbColor={val ? theme.accent : theme.textMuted}
                ios_backgroundColor={theme.border}
              />
            </View>
          ))}
        </View>
      </BottomSheetModal>

      {/* Units Modal */}
      <BottomSheetModal
        visible={showUnitsModal}
        onClose={() => setShowUnitsModal(false)}
        title="Distance Units"
        theme={theme}
      >
        <View style={{ padding: 12 }}>
          {UNIT_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt}
              style={[styles.optionRow, { borderBottomColor: theme.border }]}
              onPress={() => {
                setSelectedUnit(opt);
                saveStringPref("vazhi:unit", opt);
                setShowUnitsModal(false);
              }}
            >
              <Text style={[styles.optionText, { color: theme.textPrimary }]}>
                {opt}
              </Text>
              {selectedUnit === opt && (
                <View
                  style={[
                    styles.checkCircle,
                    { backgroundColor: theme.accent },
                  ]}
                >
                  <Text style={{ fontSize: 10, color: "#fff" }}>✓</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </BottomSheetModal>

      {/* Default Mode Modal */}
      <BottomSheetModal
        visible={showDefaultModeModal}
        onClose={() => setShowDefaultModeModal(false)}
        title="Default Transport Mode"
        theme={theme}
      >
        <View style={{ padding: 12 }}>
          {TRANSPORT_MODES.map((mode) => (
            <TouchableOpacity
              key={mode}
              style={[styles.optionRow, { borderBottomColor: theme.border }]}
              onPress={() => {
                setSelectedDefaultMode(mode);
                saveStringPref("vazhi:defaultMode", mode);
                if (mode === "Auto-detect") {
                  savePreference("vazhi:autoDetection", true, setAutoDetection);
                }
                setShowDefaultModeModal(false);
              }}
            >
              <Text style={[styles.optionText, { color: theme.textPrimary }]}>
                {mode}
              </Text>
              {selectedDefaultMode === mode && (
                <View
                  style={[
                    styles.checkCircle,
                    { backgroundColor: theme.accent },
                  ]}
                >
                  <Text style={{ fontSize: 10, color: "#fff" }}>✓</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </BottomSheetModal>

      {/* Account Modal */}
      <BottomSheetModal
        visible={showAccountModal}
        onClose={() => setShowAccountModal(false)}
        title="Account"
        theme={theme}
      >
        <View style={{ padding: 20 }}>
          <View
            style={[
              styles.accountInfoRow,
              { backgroundColor: theme.bgElevated, borderColor: theme.border },
            ]}
          >
            <View
              style={[
                styles.avatar,
                {
                  backgroundColor: theme.accentSoft,
                  borderColor: theme.accent,
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                },
              ]}
            >
              <Text
                style={[
                  styles.avatarText,
                  { color: theme.accent, fontSize: 18 },
                ]}
              >
                V
              </Text>
            </View>
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text
                style={[
                  { fontSize: 16, fontWeight: "700" },
                  { color: theme.textPrimary },
                ]}
              >
                Vazhi User
              </Text>
              <Text
                style={[
                  { fontSize: 12, marginTop: 2 },
                  { color: theme.textMuted },
                ]}
              >
                Anonymous profile · No sign-in required
              </Text>
            </View>
          </View>
          <View style={{ marginTop: 16, gap: 10 }}>
            {[
              { label: "Profile Type", value: "Anonymous" },
              { label: "Rank", value: profileProgress.rankTitle },
              { label: "Level", value: `${profileProgress.level}` },
              { label: "Total XP", value: `${profileProgress.xp}` },
              { label: "Data Storage", value: "Local device only" },
            ].map(({ label, value }) => (
              <View
                key={label}
                style={[
                  styles.accountStatRow,
                  { borderBottomColor: theme.border },
                ]}
              >
                <Text
                  style={[{ fontSize: 13 }, { color: theme.textSecondary }]}
                >
                  {label}
                </Text>
                <Text
                  style={[
                    { fontSize: 13, fontWeight: "600" },
                    { color: theme.textPrimary },
                  ]}
                >
                  {value}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </BottomSheetModal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: Platform.OS === "ios" ? 54 : 40,
    paddingBottom: 8,
  },
  screenTitle: { fontSize: 28, fontWeight: "800", letterSpacing: -0.5 },
  screenSub: { fontSize: 13, marginTop: 2 },
  accentBar: { height: 2, width: 32, borderRadius: 1, marginBottom: 20 },
  themePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    borderRadius: 20,
    borderWidth: 0.5,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  themePillLabel: { fontSize: 13, fontWeight: "600" },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 0.5,
    padding: 16,
    marginBottom: 24,
    gap: 14,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 22, fontWeight: "800" },
  profileName: { fontSize: 16, fontWeight: "700" },
  profileId: { fontSize: 12, marginTop: 2 },
  xpBarWrapper: { marginTop: 8, gap: 4 },
  xpBarBg: { height: 4, borderRadius: 2, width: "100%", overflow: "hidden" },
  xpBarFill: { height: "100%", borderRadius: 2 },
  xpLabel: { fontSize: 10 },
  levelBadge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 10 },
  levelText: { fontSize: 12, fontWeight: "700" },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  sectionCard: { borderRadius: 16, borderWidth: 0.5, overflow: "hidden" },
  item: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 13,
    paddingHorizontal: 14,
    borderBottomWidth: 0.5,
    gap: 12,
  },
  itemIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  itemBody: { flex: 1 },
  itemTitle: { fontSize: 14, fontWeight: "500" },
  itemSub: { fontSize: 11, marginTop: 1 },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginRight: 4,
  },
  badgeText: { fontSize: 10, color: "#fff", fontWeight: "700" },
  expandBox: {
    margin: 10,
    marginTop: 0,
    borderRadius: 10,
    borderWidth: 0.5,
    padding: 14,
  },
  faqQ: { fontSize: 13, fontWeight: "600", marginBottom: 3 },
  faqA: { fontSize: 13, lineHeight: 19 },
  footer: {
    textAlign: "center",
    fontSize: 11,
    paddingTop: 8,
    paddingBottom: 24,
  },

  // Modal styles
  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  modalSheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: Platform.OS === "ios" ? 34 : 16,
    maxHeight: "80%",
    elevation: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  modalDivider: { height: 0.5, marginHorizontal: 20, marginBottom: 4 },
  modalRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 13,
    borderBottomWidth: 0.5,
    gap: 12,
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 6,
    borderBottomWidth: 0.5,
  },
  optionText: { fontSize: 15, fontWeight: "500" },
  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  accountInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 0.5,
    padding: 14,
  },
  accountStatRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 0.5,
  },
});
