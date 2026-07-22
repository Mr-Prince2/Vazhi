# 🚗 Vazhi (വഴി) — Mobile Travel & Transit Data Collection App

> **Problem Statement ID:** 25082  
> **Organization:** Government of Kerala | KSCSTE – National Transportation Planning and Research Centre (NATPAC)  
> **Category:** Software | **Theme:** Travel & Tourism

---

## 📌 About the Project

**Vazhi** is an intelligent, offline-first mobile application developed for **KSCSTE – NATPAC** to automate large-scale travel behavior data collection across Kerala. Replacing traditional, expensive, and time-consuming household surveys, Vazhi automatically logs real-time commuter metrics—including transit paths, origin/destination coordinates, duration, speed, and mode of travel—while seamlessly collecting qualitative trip data (purpose, companions, cost, frequency) through interactive user prompts.

---

## ✨ Key Features

- **🗺️ Smart Map & 3D Live Navigation:** Tilted 3D driving perspective camera (`pitch`, `heading`) with real-time hardware compass tracking and dynamic orientation.
- **📍 Origin & Destination Routing:** Automatic current location marker, destination search drop pins, and interactive polyline direction rendering powered by Geoapify Routing API.
- **⚡ Dynamic Live Rerouting:** Automatically detects route drift (>60m) during active transit and recalculates optimal paths in real-time.
- **📊 Automated & Manual Data Logging:** Automatically computes estimated transport mode based on speed vectors, paired with a questionnaire sheet for rich travel attributes.
- **💾 Offline-First Architecture:** Local transaction persistence via `AsyncStorage` with silent background sync to backend endpoints upon network restoration.
- **🌐 Multi-Language & Theme Support:** Built-in localization (English/Malayalam) and adaptive light/dark theme modes.

---

## 🛠️ Tech Stack

| Component           | Technology / Library                        |
| :------------------ | :------------------------------------------ |
| **Framework**       | React Native (Expo SDK)                     |
| **Mapping & GIS**   | `react-native-maps`, Geoapify Routing API   |
| **Telemetry & GPS** | `expo-location`                             |
| **Local Storage**   | `@react-native-async-storage/async-storage` |
| **Icons & UI**      | `@expo/vector-icons` (`Ionicons`)           |
| **Build & Deploy**  | Expo Application Services (EAS), Expo Go    |

---

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed on your development machine:

- **Node.js** (v18.x or later)
- **npm** or **yarn**
- **Expo Go** app on your physical mobile device (Android / iOS)

---

### Installation & Setup

1. **Clone the Repository:**
   ```bash
   git clone [https://github.com/your-username/vazhi-mobile-app.git](https://github.com/your-username/vazhi-mobile-app.git)
   cd vazhi-mobile-app
   Install Dependencies:
   ```

Bash
npm install
Configure Environment Variables:
Create a .env file in the root directory and add your Geoapify API key:

Code snippet
EXPO_PUBLIC_GEOAPIFY_KEY=your_geoapify_api_key_here
Run the Application:

Bash
npx expo start --clear
Scan the generated QR code using the Expo Go app on your Android/iOS device.

Or press a to run on an Android Emulator.

📦 Distribution & Building (EAS / APK)
To build a standalone, offline-installable Android APK for testing or handover:

Install EAS CLI:

Bash
npm install -g eas-cli
Configure eas.json for Direct APK Output:

JSON
{
"cli": { "version": ">= 10.0.0" },
"build": {
"preview": {
"distribution": "internal",
"android": { "buildType": "apk" }
}
}
}
Trigger Cloud or Local APK Build:

Bash

# Cloud Build

eas build --platform android --profile preview

# Local Machine Build

eas build --platform android --profile preview --local
📂 Project Structure
vazhi-mobile-app/
├── app/
│ ├── (tabs)/
│ │ ├── HomeScreen.jsx # Core map canvas, telemetry & trip form UI
│ │ ├── HistoryScreen.jsx # Saved trips & offline sync manager
│ │ └── SettingsScreen.jsx # Theme & language context toggles
│ └── \_layout.jsx
├── assets/
│ └── theme/
│ ├── LanguageContext.jsx # Multi-language translation dictionary
│ └── ThemeContext.jsx # Dark/Light theme palette provider
├── lib/
│ ├── api.js # Geoapify place search & routing services
│ └── trips.js # Backend trip sync pipeline
├── .env # Public API environment variables
├── app.json # Expo SDK app configuration
├── eas.json # Expo Application Services build profiles
└── package.json
