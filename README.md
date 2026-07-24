#  Vazhi (വഴി) — Mobile Travel & Transit Data Collection App

> **Problem Statement ID:** 25082  
> **Organization:** Government of Kerala | KSCSTE – National Transportation Planning and Research Centre (NATPAC)  
> **Category:** Software  
> **Theme:** Travel & Tourism

---

##  About the Project

**Vazhi** is an intelligent, offline-first mobile application developed for **KSCSTE – NATPAC** to automate large-scale travel behavior data collection across Kerala.

It replaces traditional, expensive, and time-consuming household surveys by automatically logging real-time commuter metrics such as:

- Transit paths
- Origin & destination coordinates
- Travel duration
- Speed
- Mode of transport

Additionally, it collects qualitative trip data (purpose, companions, cost, frequency) through interactive in-app prompts.

---

##  Key Features

- ** Smart Map & 3D Live Navigation**  
  Tilted 3D driving perspective using `pitch` and `heading`, integrated with real-time compass tracking.

- ** Origin & Destination Routing**  
  Auto-detects current location, allows destination search, and renders routes using Geoapify API.

- ** Dynamic Live Rerouting**  
  Detects route deviation (>60m) and recalculates optimal paths in real time.

- ** Automated & Manual Data Logging**  
  Predicts transport mode based on speed while allowing manual input for additional trip details.

- ** Offline-First Architecture**  
  Uses `AsyncStorage` for local persistence with background sync when network is restored.

- ** Multi-Language & Theme Support**  
  Supports English/Malayalam and light/dark themes.

---

##  Tech Stack

| Component           | Technology / Library                        |
| ------------------- | ------------------------------------------- |
| **Framework**       | React Native (Expo SDK)                     |
| **Mapping & GIS**   | `react-native-maps`, Geoapify Routing API   |
| **Telemetry & GPS** | `expo-location`                             |
| **Local Storage**   | `@react-native-async-storage/async-storage` |
| **Icons & UI**      | `@expo/vector-icons` (`Ionicons`)           |
| **Build & Deploy**  | Expo Application Services (EAS), Expo Go    |

---

##  Getting Started

### Prerequisites

Make sure you have:

- Node.js (v18 or later)
- npm or yarn
- Expo Go app (Android / iOS)

---

### Installation & Setup

#### 1. Clone the Repository

```bash
git clone https://github.com/your-username/vazhi-mobile-app.git
cd vazhi-mobile-app
```

#### 2. Install Dependencies

```bash
npm install
```

#### 3. Configure Environment Variables

Create a `.env` file in the root directory:

```env
EXPO_PUBLIC_GEOAPIFY_KEY=your_geoapify_api_key_here
```

#### 4. Run the Application

```bash
npx expo start --clear
```

- Scan the QR code using Expo Go
- Or press `a` to run on Android Emulator

---

##  Distribution & Building (EAS / APK)

### Install EAS CLI

```bash
npm install -g eas-cli
```

### Configure `eas.json`

```json
{
  "cli": { "version": ">= 10.0.0" },
  "build": {
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    }
  }
}
```

### Build APK

```bash
# Cloud Build
eas build --platform android --profile preview

# Local Build
eas build --platform android --profile preview --local
```

---

## 📂 Project Structure

```
vazhi-mobile-app/
├── app/
│   ├── (tabs)/
│   │   ├── HomeScreen.jsx        # Map, telemetry, trip UI
│   │   ├── HistoryScreen.jsx     # Saved trips & sync manager
│   │   └── SettingsScreen.jsx    # Theme & language controls
│   └── _layout.jsx
├── assets/
│   └── theme/
│       ├── LanguageContext.jsx   # Localization
│       └── ThemeContext.jsx      # Theme management
├── lib/
│   ├── api.js                   # Geoapify API integration
│   └── trips.js                 # Trip sync logic
├── .env                         # Environment variables
├── app.json                     # Expo config
├── eas.json                     # Build config
└── package.json
```

---
