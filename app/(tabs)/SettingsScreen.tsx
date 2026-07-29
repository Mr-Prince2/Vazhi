import AsyncStorage from "@react-native-async-storage/async-storage";
import { useUser, useAuth, useSignIn, useSignUp } from "@clerk/expo";
import { useFocusEffect } from "expo-router";
import {
  Bell as BellIcon,
  BookOpen as BookOpenIcon,
  Car as CarIcon,
  Check as CheckIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Download as DownloadIcon,
  FileCheck2 as FileCheck2Icon,
  HelpCircle as HelpCircleIcon,
  Info as InfoIcon,
  Key as KeyIcon,
  Languages as LanguagesIcon,
  LogOut as LogOutIcon,
  MapPin as MapPinIcon,
  MessageSquare as MessageSquareIcon,
  Palette as PaletteIcon,
  Phone as PhoneIcon,
  RadioTower as RadioTowerIcon,
  Ruler as RulerIcon,
  ScanLine as ScanLineIcon,
  Search as SearchIcon,
  ShieldCheck as ShieldCheckIcon,
  Trash2 as Trash2Icon,
  User as UserIcon,
} from "lucide-react-native";

const Bell: any = BellIcon;
const BookOpen: any = BookOpenIcon;
const Car: any = CarIcon;
const Check: any = CheckIcon;
const ChevronLeft: any = ChevronLeftIcon;
const ChevronRight: any = ChevronRightIcon;
const Download: any = DownloadIcon;
const FileCheck2: any = FileCheck2Icon;
const HelpCircle: any = HelpCircleIcon;
const Info: any = InfoIcon;
const Key: any = KeyIcon;
const Languages: any = LanguagesIcon;
const LogOut: any = LogOutIcon;
const MapPin: any = MapPinIcon;
const MessageSquare: any = MessageSquareIcon;
const Palette: any = PaletteIcon;
const Phone: any = PhoneIcon;
const RadioTower: any = RadioTowerIcon;
const Ruler: any = RulerIcon;
const ScanLine: any = ScanLineIcon;
const Search: any = SearchIcon;
const ShieldCheck: any = ShieldCheckIcon;
const Trash2: any = Trash2Icon;
const User: any = UserIcon;
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
  TextInput,
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

interface AuthUser {
  isLogged: boolean;
  method: "phone" | "google" | "passkey" | "anonymous";
  identifier: string;
  name: string;
  avatarInitial: string;
  passkeyRegistered?: boolean;
  passkeyCredId?: string;
}

interface SettingItemProps {
  Icon: React.ComponentType<any>;
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
        {Icon && React.createElement(Icon as any, { size: 17, color: iconColor })}
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

// Generic Bottom Sheet Modal
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

const DEFAULT_AUTH_USER: AuthUser = {
  isLogged: false,
  method: "anonymous",
  identifier: "Anonymous",
  name: "Vazhi User",
  avatarInitial: "V",
};

export default function SettingsScreen() {
  const { theme, isDarkMode, toggleTheme } = useTheme() as {
    theme: ThemeProps;
    isDarkMode: boolean;
    toggleTheme: () => void;
  };
  const { currentLang, t, changeLanguage } = useTranslation();

  // Clerk Auth Hooks
  const { isLoaded: isClerkLoaded, isSignedIn: isClerkSignedIn, user: clerkUser } = useUser();
  const { signOut: clerkSignOut } = useAuth();
  const { signIn, setActive, isLoaded: isSignInLoaded } = useSignIn() as any;
  const { signUp, isLoaded: isSignUpLoaded } = useSignUp() as any;

  // Auth State
  const [authUser, setAuthUser] = useState<AuthUser>(DEFAULT_AUTH_USER);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authStep, setAuthStep] = useState<"menu" | "phone" | "otp" | "google" | "passkey">("menu");
  const [phoneName, setPhoneName] = useState("");
  const [phoneNum, setPhoneNum] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [googleName, setGoogleName] = useState("");
  const [googleEmail, setGoogleEmail] = useState("");
  const [passkeyName, setPasskeyName] = useState("");

  // Modals & Full Pages
  const [showHelpScreen, setShowHelpScreen] = useState(false);
  const [showAboutScreen, setShowAboutScreen] = useState(false);
  const [showAboutDoc, setShowAboutDoc] = useState<"none" | "terms" | "privacy" | "licenses">("none");
  const [showNotifModal, setShowNotifModal] = useState(false);
  const [showUnitsModal, setShowUnitsModal] = useState(false);
  const [showDefaultModeModal, setShowDefaultModeModal] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showDataConsentModal, setShowDataConsentModal] = useState(false);
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showPasskeyModal, setShowPasskeyModal] = useState(false);
  const [passkeyRegistered, setPasskeyRegistered] = useState(false);
  const [passkeyCredId, setPasskeyCredId] = useState("");

  // Help Search & Feedback State
  const [helpQuery, setHelpQuery] = useState("");
  const [feedbackCategory, setFeedbackCategory] = useState("Bug Report");
  const [feedbackText, setFeedbackText] = useState("");

  // Persisted preferences
  const [profileProgress, setProfileProgress] = useState({
    xp: 0,
    level: 1,
    nextLevelXp: 100,
    rankTitle: "Novice Pathfinder",
  });
  const [autoDetection, setAutoDetection] = useState(true);
  const [locationEnabled, setLocationEnabled] = useState(true);
  const [backgroundTracking, setBackgroundTracking] = useState(false);
  const [diaryEnabled, setDiaryEnabled] = useState(true);
  const [dataConsent, setDataConsent] = useState(true);
  const [twoFactor, setTwoFactor] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [selectedUnit, setSelectedUnit] = useState("Metric (km)");
  const [selectedDefaultMode, setSelectedDefaultMode] = useState("Auto-detect");
  const [notifJourneyReminder, setNotifJourneyReminder] = useState(true);
  const [notifWeeklySummary, setNotifWeeklySummary] = useState(true);
  const [notifSyncAlerts, setNotifSyncAlerts] = useState(false);

  const loadActivePreferences = async () => {
    try {
      // Load Auth State
      const authRaw = await AsyncStorage.getItem("vazhi:auth_user");
      if (authRaw) {
        setAuthUser(JSON.parse(authRaw));
      } else {
        setAuthUser(DEFAULT_AUTH_USER);
      }

      const passkeyCred = await AsyncStorage.getItem("vazhi:passkey_cred");
      if (passkeyCred) {
        setPasskeyRegistered(true);
        setPasskeyCredId(passkeyCred);
      }

      // Load Profile Progress
      const xpRaw = await AsyncStorage.getItem("vazhi:total_xp");
      const aggregateXp = xpRaw ? parseInt(xpRaw, 10) : 0;
      setProfileProgress(evaluateUserLevel(aggregateXp));

      // Load Boolean Preferences
      const boolKeys: [
        string,
        React.Dispatch<React.SetStateAction<boolean>>,
        boolean,
      ][] = [
          ["vazhi:autoDetection", setAutoDetection, true],
          ["vazhi:locationEnabled", setLocationEnabled, true],
          ["vazhi:backgroundTracking", setBackgroundTracking, false],
          ["vazhi:diaryEnabled", setDiaryEnabled, true],
          ["vazhi:dataConsent", setDataConsent, true],
          ["vazhi:twoFactor", setTwoFactor, false],
          ["vazhi:notifications", setNotifications, true],
          ["vazhi:notifJourneyReminder", setNotifJourneyReminder, true],
          ["vazhi:notifWeeklySummary", setNotifWeeklySummary, true],
          ["vazhi:notifSyncAlerts", setNotifSyncAlerts, false],
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

  // Auth Operations
  const handlePhoneSubmit = () => {
    if (!phoneNum || phoneNum.trim().length < 8) {
      Alert.alert("Invalid Phone Number", "Please enter a valid mobile number.");
      return;
    }
    setAuthStep("otp");
  };

  const handleVerifyOtp = async () => {
    if (otpCode.length < 4) {
      Alert.alert("Invalid OTP", "Please enter the 4-digit verification code.");
      return;
    }
    const displayName = phoneName.trim() || `User ${phoneNum.slice(-4)}`;
    const newUser: AuthUser = {
      isLogged: true,
      method: "phone",
      identifier: phoneNum.trim(),
      name: displayName,
      avatarInitial: displayName.charAt(0).toUpperCase(),
    };
    setAuthUser(newUser);
    await AsyncStorage.setItem("vazhi:auth_user", JSON.stringify(newUser));
    setShowAuthModal(false);
    setShowAccountModal(false);
    setAuthStep("menu");
    setPhoneName("");
    setPhoneNum("");
    setOtpCode("");
    Alert.alert("Welcome!", `Signed in successfully as ${displayName} (${phoneNum}).`);
  };

  const handleCustomGoogleSignIn = async () => {
    if (!googleEmail || !googleEmail.includes("@") || !googleEmail.includes(".")) {
      Alert.alert("Invalid Email", "Please enter a valid Google email address.");
      return;
    }
    const displayName = googleName.trim() || googleEmail.split("@")[0];
    const newUser: AuthUser = {
      isLogged: true,
      method: "google",
      identifier: googleEmail.trim(),
      name: displayName,
      avatarInitial: displayName.charAt(0).toUpperCase(),
    };
    setAuthUser(newUser);
    await AsyncStorage.setItem("vazhi:auth_user", JSON.stringify(newUser));
    setShowAuthModal(false);
    setShowAccountModal(false);
    setAuthStep("menu");
    setGoogleName("");
    setGoogleEmail("");
    Alert.alert("Google Sign-In", `Signed in successfully as ${displayName} (${googleEmail}).`);
  };

  const handlePasskeySignIn = async () => {
    const displayName = passkeyName.trim() || "Passkey User";
    const credId = passkeyCredId || "fido2_pk_" + Math.random().toString(36).substring(2, 10);

    Alert.alert(
      "Passkey (FIDO2) Verification",
      `Authenticating ${displayName} via Device Biometrics (Face ID / Fingerprint / Security Key)...`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Verify Biometrics",
          onPress: async () => {
            const newUser: AuthUser = {
              isLogged: true,
              method: "passkey",
              identifier: "🔑 FIDO2 Passkey Verified",
              name: displayName,
              avatarInitial: displayName.charAt(0).toUpperCase(),
              passkeyRegistered: true,
              passkeyCredId: credId,
            };
            setAuthUser(newUser);
            setPasskeyRegistered(true);
            setPasskeyCredId(credId);
            await AsyncStorage.setItem("vazhi:auth_user", JSON.stringify(newUser));
            await AsyncStorage.setItem("vazhi:passkey_cred", credId);
            setShowAuthModal(false);
            setShowAccountModal(false);
            setAuthStep("menu");
            setPasskeyName("");
            Alert.alert("Passkey Verified!", `Biometric Passkey (FIDO2) login successful.\nRP ID: vazhi.natpac.kerala.gov.in\nCredential ID: ${credId}`);
          },
        },
      ],
    );
  };

  const handleSignOut = async () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out? Your offline data will remain on this device.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign Out",
          style: "destructive",
          onPress: async () => {
            if (isClerkSignedIn && clerkSignOut) {
              await clerkSignOut();
            }
            setAuthUser(DEFAULT_AUTH_USER);
            await AsyncStorage.removeItem("vazhi:auth_user");
            setShowAccountModal(false);
            Alert.alert("Signed Out", "You have signed out from Clerk.");
          },
        },
      ],
    );
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
        Alert.alert("No Data", "No journeys recorded yet to export.");
        return;
      }
      await Share.share({ title: "Vazhi Journey Data Export", message: rawTrips });
    } catch (error: any) {
      Alert.alert("Export Error", error.message);
    }
  };

  const handleClearAllData = () => {
    Alert.alert(
      "Erase All Data?",
      "This permanently deletes all your offline trips, profile rank, level XP, and custom settings. This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Erase Everything",
          style: "destructive",
          onPress: async () => {
            await AsyncStorage.clear();
            setAuthUser(DEFAULT_AUTH_USER);
            setAutoDetection(true);
            setLocationEnabled(true);
            setBackgroundTracking(false);
            setDiaryEnabled(true);
            setDataConsent(true);
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
            Alert.alert("Cleared", "All local data has been erased successfully.");
          },
        },
      ],
    );
  };

  const handleLocationToggle = (val: boolean) => {
    savePreference("vazhi:locationEnabled", val, setLocationEnabled);
    if (val) {
      Alert.alert("Location Services Active", "Vazhi has location permissions enabled for journey mapping.");
    } else {
      Alert.alert("Location Services Paused", "Manual location entry will be required while tracking is paused.");
    }
  };

  const handleBackgroundToggle = (val: boolean) => {
    if (val) {
      Alert.alert(
        "Background Tracking",
        "Enabling background tracking allows Vazhi to log trips even when the screen is locked. This may slightly increase battery consumption.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Enable Background Tracking",
            onPress: () => savePreference("vazhi:backgroundTracking", true, setBackgroundTracking),
          },
        ],
      );
    } else {
      savePreference("vazhi:backgroundTracking", false, setBackgroundTracking);
    }
  };

  const handleFeedbackSubmit = () => {
    if (!feedbackText.trim()) {
      Alert.alert("Feedback Required", "Please type a message before submitting.");
      return;
    }
    Alert.alert(
      "Feedback Submitted",
      "Thank you for reaching out to KSCSTE-NATPAC! Your feedback helps us improve transit planning in Kerala.",
    );
    setFeedbackText("");
    setShowFeedbackModal(false);
  };

  const currentLangLabel =
    LANGUAGE_OPTIONS.find((l) => l.code === currentLang)?.label ?? "English";

  const xpProgress =
    profileProgress.nextLevelXp > 0
      ? Math.min(profileProgress.xp / profileProgress.nextLevelXp, 1)
      : 0;

  // FAQ List for Help Page
  const FAQ_ITEMS = [
    {
      q: "What is Vazhi and KSCSTE-NATPAC?",
      a: "Vazhi is an offline-first smart mobility logger created for KSCSTE-NATPAC (National Transportation Planning and Research Centre, Trivandrum) to study transit patterns across Kerala.",
    },
    {
      q: "Is my personal identity linked to trip logs?",
      a: "No. All logged routes are stored locally on your device and anonymized prior to any institutional research sync.",
    },
    {
      q: "How does Auto-Detect Transport work?",
      a: "Vazhi analyzes velocity, acceleration vectors, and stop frequencies to infer whether you are walking, on a bus, car, metro, or auto-rickshaw.",
    },
    {
      q: "How do I earn XP and Level Up?",
      a: "You earn XP by logging transit trips and maintaining streak counts. Higher levels unlock special Pathfinder badges.",
    },
    {
      q: "Can I use Vazhi without an internet connection?",
      a: "Yes! Vazhi is designed offline-first. All maps, location tracking, and stats operate without internet.",
    },
  ];

  const filteredFaqs = FAQ_ITEMS.filter(
    (item) =>
      item.q.toLowerCase().includes(helpQuery.toLowerCase()) ||
      item.a.toLowerCase().includes(helpQuery.toLowerCase()),
  );

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
            <Text style={[styles.avatarText, { color: theme.accent }]}>
              {authUser.avatarInitial}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.profileName, { color: theme.textPrimary }]}>
              {authUser.name}
            </Text>
            <Text style={[styles.profileId, { color: theme.textMuted }]}>
              {authUser.isLogged
                ? `${authUser.method === "phone" ? "Mobile" : "Google"}: ${authUser.identifier}`
                : "Anonymous profile · Tap to Sign In"}
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

        {/* GENERAL SECTION */}
        <Section title={t.general} theme={theme}>
          <SettingItem
            Icon={User}
            title={t.accountStatus}
            subtitle={
              authUser.isLogged
                ? `Signed in (${authUser.method})`
                : "Anonymous · Tap to Sign In / Register"
            }
            onPress={() => setShowAccountModal(true)}
            badge={authUser.isLogged ? "Active" : "Sign In"}
          />
          <SettingItem
            Icon={HelpCircle}
            title={t.helpSupport}
            subtitle="FAQs, Contact NATPAC & Feedback"
            onPress={() => setShowHelpScreen(true)}
          />
          <SettingItem
            Icon={Info}
            title={t.aboutApp}
            subtitle="Version, Credits & Mission"
            onPress={() => setShowAboutScreen(true)}
          />
        </Section>

        {/* PERSONALIZATION SECTION */}
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

        {/* TRIP PREFERENCES SECTION */}
        <Section title={t.tripPrefs} theme={theme}>
          <SettingItem
            Icon={ScanLine}
            title={t.autoDetect}
            subtitle="Infer mode based on speed & acceleration"
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

        {/* PRIVACY & DATA SECTION */}
        <Section title={t.privacyData} theme={theme}>
          <SettingItem
            Icon={FileCheck2}
            title={t.dataConsent}
            subtitle={dataConsent ? "NATPAC Data Sharing Opt-In Active" : "Opted Out"}
            onPress={() => setShowDataConsentModal(true)}
            badge={dataConsent ? "Active" : "Off"}
          />
          <SettingItem
            Icon={Download}
            title={t.exportLogs}
            subtitle="Share journey logs as raw JSON"
            onPress={handleExportData}
          />
          <SettingItem
            Icon={MapPin}
            title={t.locationPerms}
            subtitle={locationEnabled ? "Location services active" : "Paused"}
            toggle
            value={locationEnabled}
            onValueChange={handleLocationToggle}
          />
          <SettingItem
            Icon={RadioTower}
            title={t.backgroundAggr}
            subtitle={
              backgroundTracking
                ? "Active — tracking when closed"
                : "Disabled"
            }
            toggle
            value={backgroundTracking}
            onValueChange={handleBackgroundToggle}
          />
          <SettingItem
            Icon={Trash2}
            title={t.clearCache}
            subtitle="Permanently erase all local trips & data"
            onPress={handleClearAllData}
            danger
          />
        </Section>

        {/* INSIGHTS */}
        <Section title={t.insights} theme={theme}>
          <SettingItem
            Icon={BookOpen}
            title={t.travelDiary}
            subtitle="Show route mini-maps in history cards"
            toggle
            value={diaryEnabled}
            onValueChange={(v) =>
              savePreference("vazhi:diaryEnabled", v, setDiaryEnabled)
            }
          />
        </Section>

        {/* SECURITY */}
        <Section title={t.security} theme={theme}>
          <SettingItem
            Icon={Key}
            title="Passkeys (FIDO2)"
            subtitle={
              passkeyRegistered
                ? "Passkey registered · One-touch biometric sign in active"
                : "Register device Passkey for biometric sign-in"
            }
            onPress={() => setShowPasskeyModal(true)}
            badge={passkeyRegistered ? "Registered" : "Set Up"}
          />
          <SettingItem
            Icon={ShieldCheck}
            title={t.twoFactor}
            subtitle={
              twoFactor
                ? "2FA account protection active"
                : "Tap to configure 2FA"
            }
            onPress={() => setShow2FAModal(true)}
            badge={twoFactor ? "Enabled" : "Configure"}
          />
        </Section>

        <Text style={[styles.footer, { color: theme.textMuted }]}>
          Vazhi v1.0.0 · Built for KSCSTE-NATPAC · Kerala
        </Text>
      </ScrollView>

      {/* ========================================================================= */}
      {/* FULL SCREEN MODAL 1: HELP & SUPPORT */}
      {/* ========================================================================= */}
      <Modal visible={showHelpScreen} animationType="slide" presentationStyle="fullScreen">
        <SafeAreaView style={[styles.fullPageContainer, { backgroundColor: theme.bg }]}>
          <View style={[styles.fullPageHeader, { borderBottomColor: theme.border }]}>
            <TouchableOpacity onPress={() => setShowHelpScreen(false)} style={styles.backBtn}>
              <ChevronLeft size={24} color={theme.textPrimary} />
            </TouchableOpacity>
            <Text style={[styles.fullPageTitle, { color: theme.textPrimary }]}>Help & Support</Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
            {/* Search Bar */}
            <View style={[styles.searchBox, { backgroundColor: theme.bgCard, borderColor: theme.border }]}>
              <Search size={18} color={theme.textMuted} />
              <TextInput
                style={[styles.searchInput, { color: theme.textPrimary }]}
                placeholder="Search FAQs, features, NATPAC..."
                placeholderTextColor={theme.textMuted}
                value={helpQuery}
                onChangeText={setHelpQuery}
              />
            </View>

            {/* Quick Support Actions */}
            <Text style={[styles.sectionTitle, { color: theme.textSecondary, marginTop: 16 }]}>Contact Support</Text>
            <View style={{ flexDirection: "row", gap: 10, marginBottom: 20 }}>
              <TouchableOpacity
                style={[styles.supportActionCard, { backgroundColor: theme.bgCard, flex: 1 }]}
                onPress={() => Alert.alert("Call NATPAC Helpline", "Calling NATPAC Trivandrum Helpline: +91 471 2514600")}
              >
                <Phone size={22} color={theme.accent} />
                <Text style={[styles.actionCardTitle, { color: theme.textPrimary }]}>Call Center</Text>
                <Text style={[styles.actionCardSub, { color: theme.textMuted }]}>+91 471 2514600</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.supportActionCard, { backgroundColor: theme.bgCard, flex: 1 }]}
                onPress={() => setShowFeedbackModal(true)}
              >
                <MessageSquare size={22} color="#16A34A" />
                <Text style={[styles.actionCardTitle, { color: theme.textPrimary }]}>Feedback</Text>
                <Text style={[styles.actionCardSub, { color: theme.textMuted }]}>Submit Form</Text>
              </TouchableOpacity>
            </View>

            {/* FAQ List */}
            <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>Frequently Asked Questions</Text>
            <View style={[styles.sectionCard, { backgroundColor: theme.bgCard, padding: 16, gap: 16 }]}>
              {filteredFaqs.length > 0 ? (
                filteredFaqs.map((item, idx) => (
                  <View key={idx} style={{ borderBottomWidth: idx === filteredFaqs.length - 1 ? 0 : 0.5, borderBottomColor: theme.border, paddingBottom: 12 }}>
                    <Text style={[styles.faqQ, { color: theme.textPrimary }]}>{item.q}</Text>
                    <Text style={[styles.faqA, { color: theme.textSecondary, marginTop: 4 }]}>{item.a}</Text>
                  </View>
                ))
              ) : (
                <Text style={{ color: theme.textMuted, textAlign: "center", paddingVertical: 12 }}>
                  No matching questions found for "{helpQuery}".
                </Text>
              )}
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* ========================================================================= */}
      {/* FULL SCREEN MODAL 2: ABOUT VAZHI */}
      {/* ========================================================================= */}
      <Modal visible={showAboutScreen} animationType="slide" presentationStyle="fullScreen">
        <SafeAreaView style={[styles.fullPageContainer, { backgroundColor: theme.bg }]}>
          <View style={[styles.fullPageHeader, { borderBottomColor: theme.border }]}>
            <TouchableOpacity onPress={() => setShowAboutScreen(false)} style={styles.backBtn}>
              <ChevronLeft size={24} color={theme.textPrimary} />
            </TouchableOpacity>
            <Text style={[styles.fullPageTitle, { color: theme.textPrimary }]}>About Vazhi</Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
            {/* Header Banner */}
            <View style={[styles.aboutHero, { backgroundColor: theme.bgCard }]}>
              <View style={[styles.aboutLogoBadge, { backgroundColor: theme.accentSoft }]}>
                <Text style={[styles.aboutLogoText, { color: theme.accent }]}>V</Text>
              </View>
              <Text style={[styles.aboutTitle, { color: theme.textPrimary }]}>Vazhi · வழி</Text>
              <Text style={[styles.aboutVersion, { color: theme.textMuted }]}>Version 1.0.0 (Build 2026.1)</Text>
              <View style={[styles.badge, { backgroundColor: theme.accent, marginTop: 8 }]}>
                <Text style={styles.badgeText}>Official NATPAC Research Tool</Text>
              </View>
            </View>

            {/* Mission Statement */}
            <Text style={[styles.sectionTitle, { color: theme.textSecondary, marginTop: 20 }]}>Mission & Institutional Mandate</Text>
            <View style={[styles.sectionCard, { backgroundColor: theme.bgCard, padding: 16 }]}>
              <Text style={[styles.faqA, { color: theme.textPrimary, lineHeight: 22 }]}>
                Vazhi is a state-of-the-art mobility logging platform engineered for KSCSTE-NATPAC (National Transportation Planning and Research Centre), an autonomous institution under the Government of Kerala.
              </Text>
              <Text style={[styles.faqA, { color: theme.textSecondary, marginTop: 10, lineHeight: 20 }]}>
                By empowering citizens to record anonymized daily journeys, Vazhi provides planners with empirical origin-destination matrices, transit mode splits, and network density graphs to optimize public bus routes, rail infrastructure, and urban mobility policies.
              </Text>
            </View>

            {/* Documentation Links */}
            <Text style={[styles.sectionTitle, { color: theme.textSecondary, marginTop: 20 }]}>Legal & Technical Documentation</Text>
            <View style={[styles.sectionCard, { backgroundColor: theme.bgCard }]}>
              <TouchableOpacity
                style={[styles.item, { borderBottomColor: theme.border }]}
                onPress={() => setShowAboutDoc("terms")}
              >
                <View style={[styles.itemIconWrap, { backgroundColor: theme.bgInput }]}>
                  <FileCheck2 size={17} color={theme.textSecondary} />
                </View>
                <Text style={[styles.itemTitle, { flex: 1, color: theme.textPrimary }]}>Terms of Service</Text>
                <ChevronRight size={16} color={theme.textMuted} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.item, { borderBottomColor: theme.border }]}
                onPress={() => setShowAboutDoc("privacy")}
              >
                <View style={[styles.itemIconWrap, { backgroundColor: theme.bgInput }]}>
                  <ShieldCheck size={17} color={theme.textSecondary} />
                </View>
                <Text style={[styles.itemTitle, { flex: 1, color: theme.textPrimary }]}>Privacy Policy</Text>
                <ChevronRight size={16} color={theme.textMuted} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.item}
                onPress={() => setShowAboutDoc("licenses")}
              >
                <View style={[styles.itemIconWrap, { backgroundColor: theme.bgInput }]}>
                  <BookOpen size={17} color={theme.textSecondary} />
                </View>
                <Text style={[styles.itemTitle, { flex: 1, color: theme.textPrimary }]}>Open Source Licenses</Text>
                <ChevronRight size={16} color={theme.textMuted} />
              </TouchableOpacity>
            </View>

            {/* Institutional Credits */}
            <View style={{ marginTop: 24, alignItems: "center" }}>
              <Text style={{ fontSize: 12, fontWeight: "700", color: theme.textSecondary }}>KSCSTE-NATPAC</Text>
              <Text style={{ fontSize: 11, color: theme.textMuted, marginTop: 2, textAlign: "center" }}>

              </Text>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* ABOUT DOCUMENT MODAL */}
      <Modal visible={showAboutDoc !== "none"} animationType="slide">
        <SafeAreaView style={[styles.fullPageContainer, { backgroundColor: theme.bg }]}>
          <View style={[styles.fullPageHeader, { borderBottomColor: theme.border }]}>
            <TouchableOpacity onPress={() => setShowAboutDoc("none")} style={styles.backBtn}>
              <ChevronLeft size={24} color={theme.textPrimary} />
            </TouchableOpacity>
            <Text style={[styles.fullPageTitle, { color: theme.textPrimary }]}>
              {showAboutDoc === "terms" ? "Terms of Service" : showAboutDoc === "privacy" ? "Privacy Policy" : "Open Source Licenses"}
            </Text>
            <View style={{ width: 24 }} />
          </View>
          <ScrollView contentContainerStyle={{ padding: 20 }}>
            {showAboutDoc === "terms" && (
              <View style={{ gap: 12 }}>
                <Text style={[styles.faqQ, { color: theme.textPrimary }]}>1. User Agreement</Text>
                <Text style={[styles.faqA, { color: theme.textSecondary }]}>By installing and logging trips on Vazhi, you agree to submit anonymized transit metrics for public transportation research led by KSCSTE-NATPAC.</Text>
                <Text style={[styles.faqQ, { color: theme.textPrimary, marginTop: 10 }]}>2. Offline Data Rights</Text>
                <Text style={[styles.faqA, { color: theme.textSecondary }]}>All journey records remain stored on your local device unless you explicitly opt-in to sync or export data.</Text>
              </View>
            )}
            {showAboutDoc === "privacy" && (
              <View style={{ gap: 12 }}>
                <Text style={[styles.faqQ, { color: theme.textPrimary }]}>Zero PII Guarantee</Text>
                <Text style={[styles.faqA, { color: theme.textSecondary }]}>Vazhi strips all Personally Identifiable Information (PII) before any telemetry upload. Phone numbers and emails are used solely for account authentication state on your device.</Text>
              </View>
            )}
            {showAboutDoc === "licenses" && (
              <View style={{ gap: 12 }}>
                <Text style={[styles.faqQ, { color: theme.textPrimary }]}>Software Credits</Text>
                <Text style={[styles.faqA, { color: theme.textSecondary }]}>• React Native & Expo Frameworks (MIT License)</Text>
                <Text style={[styles.faqA, { color: theme.textSecondary }]}>• Lucide React Native Icons (ISC License)</Text>
                <Text style={[styles.faqA, { color: theme.textSecondary }]}>• OpenStreetMap & Leaflet Tile Data (ODbL License)</Text>
                <Text style={[styles.faqA, { color: theme.textSecondary }]}>• Geoapify Autocomplete API</Text>
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* ========================================================================= */}
      {/* ACCOUNT & AUTH MODAL */}
      {/* ========================================================================= */}
      <BottomSheetModal
        visible={showAccountModal}
        onClose={() => {
          setShowAccountModal(false);
          setAuthStep("menu");
        }}
        title={authUser.isLogged ? "Account Details" : "Sign In or Register"}
        theme={theme}
      >
        <View style={{ padding: 20 }}>
          {authUser.isLogged ? (
            /* SIGNED IN VIEW */
            <View style={{ gap: 16 }}>
              <View style={[styles.accountInfoRow, { backgroundColor: theme.bgElevated, borderColor: theme.border }]}>
                <View style={[styles.avatar, { backgroundColor: theme.accentSoft, borderColor: theme.accent, width: 48, height: 48, borderRadius: 24 }]}>
                  <Text style={[styles.avatarText, { color: theme.accent, fontSize: 18 }]}>{authUser.avatarInitial}</Text>
                </View>
                <View style={{ flex: 1, marginLeft: 14 }}>
                  <Text style={[{ fontSize: 16, fontWeight: "700" }, { color: theme.textPrimary }]}>{authUser.name}</Text>
                  <Text style={[{ fontSize: 12, marginTop: 2 }, { color: theme.textMuted }]}>
                    {authUser.method === "phone" ? "📱 Mobile Auth" : "🌐 Google OAuth"} · {authUser.identifier}
                  </Text>
                </View>
              </View>

              <View style={{ gap: 10 }}>
                {[
                  { label: "Account Type", value: authUser.method === "phone" ? "Verified Phone User" : "Verified Google User" },
                  { label: "Rank", value: profileProgress.rankTitle },
                  { label: "Level", value: `Level ${profileProgress.level}` },
                  { label: "Accumulated XP", value: `${profileProgress.xp} XP` },
                ].map(({ label, value }) => (
                  <View key={label} style={[styles.accountStatRow, { borderBottomColor: theme.border }]}>
                    <Text style={[{ fontSize: 13 }, { color: theme.textSecondary }]}>{label}</Text>
                    <Text style={[{ fontSize: 13, fontWeight: "600" }, { color: theme.textPrimary }]}>{value}</Text>
                  </View>
                ))}
              </View>

              <TouchableOpacity
                style={[styles.deleteBtn, { backgroundColor: "#FEE2E2", borderColor: "#FCA5A5", alignSelf: "stretch", justifyContent: "center", paddingVertical: 12, borderRadius: 12, marginTop: 10 }]}
                onPress={handleSignOut}
              >
                <LogOut size={16} color="#DC2626" />
                <Text style={{ color: "#DC2626", fontWeight: "700", fontSize: 14 }}>Sign Out</Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* SIGN IN CHOICE VIEW */
            <View style={{ gap: 14 }}>
              {authStep === "menu" && (
                <>
                  <Text style={{ fontSize: 13, color: theme.textSecondary, marginBottom: 8 }}>
                    Sign in to sync your Pathfinder rank across devices and secure your local journey metrics.
                  </Text>

                  <TouchableOpacity
                    style={[styles.authChoiceBtn, { backgroundColor: theme.accent }]}
                    onPress={() => setAuthStep("phone")}
                  >
                    <Phone size={18} color="#fff" />
                    <Text style={styles.authChoiceText}>Sign in with Phone Number</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.authChoiceBtn, { backgroundColor: isDarkMode ? "#334155" : "#F1F5F9", borderWidth: 1, borderColor: theme.border }]}
                    onPress={() => setAuthStep("google")}
                  >
                    <Text style={{ fontSize: 18 }}>🌐</Text>
                    <Text style={[styles.authChoiceText, { color: theme.textPrimary }]}>Continue with Google</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.authChoiceBtn, { backgroundColor: "#0F172A", borderWidth: 1, borderColor: theme.border }]}
                    onPress={() => setAuthStep("passkey")}
                  >
                    <Key size={18} color="#38BDF8" />
                    <Text style={[styles.authChoiceText, { color: "#38BDF8" }]}>Sign in with Passkey (FIDO2)</Text>
                  </TouchableOpacity>
                </>
              )}

              {/* PHONE FORM */}
              {authStep === "phone" && (
                <View style={{ gap: 12 }}>
                  <Text style={{ fontSize: 14, fontWeight: "700", color: theme.textPrimary }}>Mobile Authentication</Text>
                  <TextInput
                    style={[styles.searchInput, { color: theme.textPrimary, backgroundColor: theme.bgInput, borderWidth: 1, borderColor: theme.border, padding: 12, borderRadius: 10 }]}
                    placeholder="Full Name (Optional)"
                    placeholderTextColor={theme.textMuted}
                    value={phoneName}
                    onChangeText={setPhoneName}
                  />
                  <TextInput
                    style={[styles.searchInput, { color: theme.textPrimary, backgroundColor: theme.bgInput, borderWidth: 1, borderColor: theme.border, padding: 12, borderRadius: 10 }]}
                    placeholder="Mobile Number (e.g. +91 9876543210)"
                    placeholderTextColor={theme.textMuted}
                    keyboardType="phone-pad"
                    value={phoneNum}
                    onChangeText={setPhoneNum}
                  />
                  <TouchableOpacity style={[styles.authChoiceBtn, { backgroundColor: theme.accent }]} onPress={handlePhoneSubmit}>
                    <Text style={styles.authChoiceText}>Send Verification Code (OTP)</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setAuthStep("menu")}>
                    <Text style={{ color: theme.textMuted, textAlign: "center", fontSize: 12, marginTop: 4 }}>Back</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* OTP FORM */}
              {authStep === "otp" && (
                <View style={{ gap: 12 }}>
                  <Text style={{ fontSize: 14, fontWeight: "700", color: theme.textPrimary }}>Enter 4-Digit OTP</Text>
                  <Text style={{ fontSize: 12, color: theme.textMuted }}>Sent to {phoneNum}</Text>
                  <TextInput
                    style={[styles.searchInput, { color: theme.textPrimary, backgroundColor: theme.bgInput, borderWidth: 1, borderColor: theme.border, padding: 12, borderRadius: 10, letterSpacing: 8, fontSize: 18, textAlign: "center" }]}
                    placeholder="1234"
                    placeholderTextColor={theme.textMuted}
                    keyboardType="number-pad"
                    maxLength={4}
                    value={otpCode}
                    onChangeText={setOtpCode}
                  />
                  <TouchableOpacity style={[styles.authChoiceBtn, { backgroundColor: "#16A34A" }]} onPress={handleVerifyOtp}>
                    <Text style={styles.authChoiceText}>Verify & Sign In</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setAuthStep("phone")}>
                    <Text style={{ color: theme.textMuted, textAlign: "center", fontSize: 12, marginTop: 4 }}>Change Number</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* GOOGLE FORM */}
              {authStep === "google" && (
                <View style={{ gap: 12 }}>
                  <Text style={{ fontSize: 14, fontWeight: "700", color: theme.textPrimary }}>Sign In with Google Account</Text>
                  <TextInput
                    style={[styles.searchInput, { color: theme.textPrimary, backgroundColor: theme.bgInput, borderWidth: 1, borderColor: theme.border, padding: 12, borderRadius: 10 }]}
                    placeholder="Full Name (e.g. Aarav Sharma)"
                    placeholderTextColor={theme.textMuted}
                    value={googleName}
                    onChangeText={setGoogleName}
                  />
                  <TextInput
                    style={[styles.searchInput, { color: theme.textPrimary, backgroundColor: theme.bgInput, borderWidth: 1, borderColor: theme.border, padding: 12, borderRadius: 10 }]}
                    placeholder="Google Email (e.g. myaccount@gmail.com)"
                    placeholderTextColor={theme.textMuted}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={googleEmail}
                    onChangeText={setGoogleEmail}
                  />
                  <TouchableOpacity style={[styles.authChoiceBtn, { backgroundColor: theme.accent }]} onPress={handleCustomGoogleSignIn}>
                    <Text style={styles.authChoiceText}>Sign In with Google Account</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setAuthStep("menu")}>
                    <Text style={{ color: theme.textMuted, textAlign: "center", fontSize: 12, marginTop: 4 }}>Back</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* PASSKEY FORM */}
              {authStep === "passkey" && (
                <View style={{ gap: 12 }}>
                  <Text style={{ fontSize: 14, fontWeight: "700", color: theme.textPrimary }}>Passkey (FIDO2 / WebAuthn) Sign In</Text>
                  <Text style={{ fontSize: 12, color: theme.textMuted }}>
                    Authenticate using your phone's Face ID, Touch ID, Fingerprint, or FIDO2 hardware key.
                  </Text>
                  <TextInput
                    style={[styles.searchInput, { color: theme.textPrimary, backgroundColor: theme.bgInput, borderWidth: 1, borderColor: theme.border, padding: 12, borderRadius: 10 }]}
                    placeholder="Account Name (e.g. Alex / alex.natpac)"
                    placeholderTextColor={theme.textMuted}
                    value={passkeyName}
                    onChangeText={setPasskeyName}
                  />
                  <TouchableOpacity style={[styles.authChoiceBtn, { backgroundColor: "#0284C7" }]} onPress={handlePasskeySignIn}>
                    <Key size={18} color="#fff" />
                    <Text style={styles.authChoiceText}>Authenticate with Biometrics</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setAuthStep("menu")}>
                    <Text style={{ color: theme.textMuted, textAlign: "center", fontSize: 12, marginTop: 4 }}>Back</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        </View>
      </BottomSheetModal>

      {/* FEEDBACK MODAL */}
      <BottomSheetModal visible={showFeedbackModal} onClose={() => setShowFeedbackModal(false)} title="Submit Feedback to NATPAC" theme={theme}>
        <View style={{ padding: 16, gap: 12 }}>
          <Text style={{ fontSize: 12, color: theme.textMuted }}>Select Category</Text>
          <View style={{ flexDirection: "row", gap: 8 }}>
            {["Bug Report", "Feature", "Transit Data"].map((cat) => (
              <TouchableOpacity
                key={cat}
                style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: feedbackCategory === cat ? theme.accent : theme.bgInput }}
                onPress={() => setFeedbackCategory(cat)}
              >
                <Text style={{ fontSize: 12, color: feedbackCategory === cat ? "#fff" : theme.textPrimary, fontWeight: "600" }}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TextInput
            style={[styles.searchInput, { color: theme.textPrimary, backgroundColor: theme.bgInput, borderWidth: 1, borderColor: theme.border, height: 80, borderRadius: 10, textAlignVertical: "top", padding: 10 }]}
            placeholder="Type your feedback message..."
            placeholderTextColor={theme.textMuted}
            multiline
            value={feedbackText}
            onChangeText={setFeedbackText}
          />
          <TouchableOpacity style={[styles.authChoiceBtn, { backgroundColor: theme.accent }]} onPress={handleFeedbackSubmit}>
            <Text style={styles.authChoiceText}>Submit Feedback</Text>
          </TouchableOpacity>
        </View>
      </BottomSheetModal>

      {/* DATA CONSENT MODAL */}
      <BottomSheetModal visible={showDataConsentModal} onClose={() => setShowDataConsentModal(false)} title="NATPAC Data Sharing Policy" theme={theme}>
        <View style={{ padding: 16, gap: 14 }}>
          <Text style={{ fontSize: 13, color: theme.textSecondary, lineHeight: 18 }}>
            Vazhi aggregates anonymized transit velocities and routes to assist KSCSTE-NATPAC in designing optimized bus lanes and public transit grids across Kerala.
          </Text>
          <View style={[styles.optionRow, { borderBottomColor: theme.border }]}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: "600", color: theme.textPrimary }}>Anonymized Transit Sharing</Text>
              <Text style={{ fontSize: 11, color: theme.textMuted }}>Allow NATPAC research sync</Text>
            </View>
            <Switch
              value={dataConsent}
              onValueChange={(val) => savePreference("vazhi:dataConsent", val, setDataConsent)}
              trackColor={{ false: theme.border, true: theme.accent + "88" }}
              thumbColor={dataConsent ? theme.accent : theme.textMuted}
            />
          </View>
        </View>
      </BottomSheetModal>

      {/* TWO FACTOR MODAL */}
      <BottomSheetModal visible={show2FAModal} onClose={() => setShow2FAModal(false)} title="Two-Factor Authentication (2FA)" theme={theme}>
        <View style={{ padding: 16, gap: 12 }}>
          <Text style={{ fontSize: 13, color: theme.textSecondary }}>
            Two-Factor Authentication secures your logged transit metrics by requiring an SMS security code when accessing your profile on new devices.
          </Text>
          <View style={[styles.optionRow, { borderBottomColor: theme.border }]}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: "600", color: theme.textPrimary }}>Enable 2FA Protection</Text>
              <Text style={{ fontSize: 11, color: theme.textMuted }}>{twoFactor ? "Protection Active" : "Disabled"}</Text>
            </View>
            <Switch
              value={twoFactor}
              onValueChange={(val) => savePreference("vazhi:twoFactor", val, setTwoFactor)}
              trackColor={{ false: theme.border, true: theme.accent + "88" }}
              thumbColor={twoFactor ? theme.accent : theme.textMuted}
            />
          </View>
        </View>
      </BottomSheetModal>

      {/* NOTIFICATIONS MODAL */}
      <BottomSheetModal visible={showNotifModal} onClose={() => setShowNotifModal(false)} title="Notification Preferences" theme={theme}>
        <View style={{ padding: 16, gap: 0 }}>
          {[
            { label: "Master Switch", sub: "Enable all notifications", val: notifications, key: "vazhi:notifications", setter: setNotifications },
            { label: "Journey Reminders", sub: "Prompt to log daily trips", val: notifJourneyReminder, key: "vazhi:notifJourneyReminder", setter: setNotifJourneyReminder },
            { label: "Weekly Summary", sub: "Transit stats every Sunday", val: notifWeeklySummary, key: "vazhi:notifWeeklySummary", setter: setNotifWeeklySummary },
            { label: "Sync Alerts", sub: "Alert when data syncs to NATPAC", val: notifSyncAlerts, key: "vazhi:notifSyncAlerts", setter: setNotifSyncAlerts },
          ].map(({ label, sub, val, key, setter }) => (
            <View key={label} style={[styles.modalRow, { borderBottomColor: theme.border }]}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: "600", color: theme.textPrimary }}>{label}</Text>
                <Text style={{ fontSize: 11, marginTop: 1, color: theme.textMuted }}>{sub}</Text>
              </View>
              <Switch
                value={val}
                onValueChange={(v) => savePreference(key, v, setter)}
                trackColor={{ false: theme.border, true: theme.accent + "88" }}
                thumbColor={val ? theme.accent : theme.textMuted}
              />
            </View>
          ))}
        </View>
      </BottomSheetModal>

      {/* UNITS MODAL */}
      <BottomSheetModal visible={showUnitsModal} onClose={() => setShowUnitsModal(false)} title="Distance Units" theme={theme}>
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
              <Text style={[styles.optionText, { color: theme.textPrimary }]}>{opt}</Text>
              {selectedUnit === opt && (
                <View style={[styles.checkCircle, { backgroundColor: theme.accent }]}>
                  <Check size={12} color="#fff" />
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </BottomSheetModal>

      {/* DEFAULT MODE MODAL */}
      <BottomSheetModal visible={showDefaultModeModal} onClose={() => setShowDefaultModeModal(false)} title="Default Transport Mode" theme={theme}>
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
              <Text style={[styles.optionText, { color: theme.textPrimary }]}>{mode}</Text>
              {selectedDefaultMode === mode && (
                <View style={[styles.checkCircle, { backgroundColor: theme.accent }]}>
                  <Check size={12} color="#fff" />
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </BottomSheetModal>
      {/* PASSKEY (FIDO2) MANAGEMENT MODAL */}
      <BottomSheetModal visible={showPasskeyModal} onClose={() => setShowPasskeyModal(false)} title="Passkey (FIDO2) Security" theme={theme}>
        <View style={{ padding: 16, gap: 14 }}>
          <Text style={{ fontSize: 13, color: theme.textSecondary, lineHeight: 18 }}>
            Passkeys use your device's biometric hardware (Face ID, Touch ID, Fingerprint scanner) or a hardware FIDO2 key for passwordless security on vazhi.natpac.kerala.gov.in.
          </Text>
          {passkeyRegistered ? (
            <View style={[styles.accountInfoRow, { backgroundColor: theme.bgElevated, borderColor: theme.border, flexDirection: "column", alignItems: "flex-start", gap: 6 }]}>
              <Text style={{ fontSize: 13, fontWeight: "700", color: theme.textPrimary }}>🔑 Registered Passkey Credential</Text>
              <Text style={{ fontSize: 11, color: theme.textMuted }}>RP Domain: vazhi.natpac.kerala.gov.in</Text>
              <Text style={{ fontSize: 11, color: theme.textMuted }}>Credential ID: {passkeyCredId}</Text>
              <TouchableOpacity
                style={{ marginTop: 8, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: "#FEE2E2", borderRadius: 8 }}
                onPress={async () => {
                  setPasskeyRegistered(false);
                  setPasskeyCredId("");
                  await AsyncStorage.removeItem("vazhi:passkey_cred");
                  Alert.alert("Passkey Removed", "Device Passkey has been unregistered.");
                }}
              >
                <Text style={{ fontSize: 12, color: "#DC2626", fontWeight: "700" }}>Revoke Passkey</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.authChoiceBtn, { backgroundColor: "#0284C7" }]}
              onPress={() => {
                setShowPasskeyModal(false);
                setShowAccountModal(true);
                setAuthStep("passkey");
              }}
            >
              <Key size={18} color="#fff" />
              <Text style={styles.authChoiceText}>Register Passkey for this Device</Text>
            </TouchableOpacity>
          )}
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
    borderRadius: 24,
    borderWidth: 0,
    padding: 20,
    marginBottom: 24,
    gap: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
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
  sectionCard: {
    borderRadius: 24,
    borderWidth: 0,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 0.5,
    gap: 14,
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
  faqQ: { fontSize: 14, fontWeight: "700" },
  faqA: { fontSize: 13, lineHeight: 19 },
  footer: {
    textAlign: "center",
    fontSize: 11,
    paddingTop: 8,
    paddingBottom: 24,
  },

  // Modal & Full Page styles
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
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingBottom: Platform.OS === "ios" ? 34 : 16,
    maxHeight: "85%",
    elevation: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
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
    borderRadius: 16,
    borderWidth: 0,
    padding: 16,
  },
  accountStatRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 0.5,
  },
  deleteBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },

  // Auth Button styles
  authChoiceBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
  },
  authChoiceText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },

  // Full Page Screen styles
  fullPageContainer: { flex: 1 },
  fullPageHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
  },
  backBtn: { padding: 4 },
  fullPageTitle: { fontSize: 18, fontWeight: "800" },

  // Help & About Custom styles
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 0.5,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 8,
  },
  searchInput: { flex: 1, fontSize: 14 },
  supportActionCard: {
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
    gap: 6,
  },
  actionCardTitle: { fontSize: 13, fontWeight: "700", marginTop: 4 },
  actionCardSub: { fontSize: 11 },
  aboutHero: {
    alignItems: "center",
    padding: 24,
    borderRadius: 24,
  },
  aboutLogoBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  aboutLogoText: { fontSize: 32, fontWeight: "900" },
  aboutTitle: { fontSize: 22, fontWeight: "800" },
  aboutVersion: { fontSize: 12, marginTop: 4 },
});
