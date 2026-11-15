# Vault & Stream - React Native Android Architecture

This directory contains the production-ready React Native Android source code for the **Vault & Stream** encrypted file vault and intelligent document scanner app, tailored specifically for Android devices (Google Pixel, Samsung Galaxy, and Android 8.0+ / API level 26 to API 35).

---

## 📱 Architecture Overview

The native application mirrors the 6 UI screens designed in Stitch TrustMedia and integrates native Android capabilities:

1. **Cloud Vault Screen (`CloudVaultScreen.native.tsx`)**
   - High-performance `FlatList` with cryptographic metadata chips
   - Storage allocation gauge with animated progress bar
   - Horizontal pill filters and pinned files carousel
   - Bottom Sheet modal for upload triggers

2. **Document Scanner Viewfinder (`DocumentScannerScreen.native.tsx`)**
   - Hardware camera feed via `react-native-vision-camera`
   - Real-time perspective quad polygon overlay using `react-native-svg`
   - Gyroscope leveling via device sensors
   - Edge-to-edge Android display with custom HUD and auto-capture

3. **Document Crop & OCR Review (`DocumentCropReviewScreen.native.tsx`)**
   - Interactive 4-corner polygon crop handles using `PanResponder`
   - Magnifier loupe at active corner
   - 90° rotation and planar deskew compensation
   - Clean B&W, True Color, and Grayscale Pro filters
   - Live extracted OCR text stream with export options

4. **Media Inspector & Sharing (`MediaInspectorScreen.native.tsx`)**
   - Native PDF rendering via `react-native-pdf`
   - Tabular CSV viewer with in-memory parsing
   - Deep cryptographic inspection: SHA-256 bit-rot verification, AES-256-GCM nonce, key derivation
   - Zero-knowledge sharing guardrails: dynamic forensic watermarking, view-only mode, and QR code generation

5. **Security & Storage Analytics (`SecurityAnalyticsScreen.native.tsx`)**
   - Android KeyStore / Hardware Security Module (HSM) enclave integration
   - Segmented storage allocation bar
   - One-tap Vault Pruning & deduplication engine
   - End-to-end Master Key management

6. **Uploads & Transfer Queue (`UploadsTransferScreen.native.tsx`)**
   - Foreground service support for uninterrupted background uploads
   - Real-time bit-rot verification with native SHA-256 calculation
   - P2P and TLS 1.3 encrypted data stream chunking

---

## 🛠 Android Native Packages Required

To run this in a standalone React Native Android project, install the following dependencies:

```bash
npm install @react-navigation/native @react-navigation/bottom-tabs @react-navigation/native-stack
npm install react-native-screens react-native-safe-area-context
npm install react-native-svg react-native-vector-icons
npm install react-native-vision-camera
npm install react-native-document-picker react-native-fs
npm install react-native-pdf react-native-blob-util
npm install react-native-quick-crypto
npm install react-native-qrcode-svg
```

---

## 🚀 Running on Android Device or Emulator

1. Connect your Android device via USB with USB debugging enabled, or start an Android Virtual Device (AVD).
2. Verify connection:
   ```bash
   adb devices
   ```
3. Run the application:
   ```bash
   npx react-native run-android
   ```
4. To build a signed APK or Android App Bundle (AAB):
   ```bash
   cd android && ./gradlew assembleRelease
   ```
   Output APK: `android/app/build/outputs/apk/release/app-release.apk`

