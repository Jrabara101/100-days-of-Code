# Android Deployment Guide: Neon Flap // Cyber Arcade

To package and deploy this HTML5 Canvas game as a native Android app, the modern industry standard is **Capacitor** (by Ionic). Capacitor is the modern successor to Apache Cordova; it is faster, easier to maintain, and integrates directly with Android Studio as a native app container.

---

## 📋 Prerequisites

Before you start, make sure you have the following installed on your machine:
1. **Node.js** (LTS version)
2. **Android Studio** (with the Android SDK, Command Line Tools, and a Virtual Device/Emulator configured)
3. **Java Development Kit (JDK 17)** (usually bundled with Android Studio)

---

## 🚀 Step-by-Step Package Setup

Because Capacitor wraps web assets, we need to structure the directory so Capacitor knows where to find the game files.

### Step 1: Initialize the npm Project
Open your terminal in `c:\Users\Admin\100-days-of-Code\Game\Flappy Bird` and initialize a Node project if you haven't already:
```bash
npm init -y
```

### Step 2: Install Capacitor CLI & Core
Install the core Capacitor libraries:
```bash
npm install @capacitor/core @capacitor/cli
```

### Step 3: Initialize Capacitor
Initialize your Capacitor configuration. Choose an app name (e.g. `NeonFlap`) and a unique package ID (e.g. `com.cyberarcade.neonflap`):
```bash
npx cap init "Neon Flap" "com.cyberarcade.neonflap" --web-dir=www
```
*Note: We set `--web-dir=www` to instruct Capacitor to look inside a folder named `www` for our web build.*

### Step 4: Restructure Your Web Files
Capacitor requires your web files to reside inside the defined web directory (`www`).
1. Create a folder named `www` in your project directory.
2. Move your `index.html` file into the `www` folder.

Your folder structure should look like this:
```text
Flappy Bird/
├── node_modules/
├── www/
│   └── index.html
├── package.json
├── package-lock.json
├── capacitor.config.json
└── DEPLOYMENT.md (this guide)
```

### Step 5: Add the Android Platform
Install the Android SDK integration wrapper and add the platform project:
```bash
npm install @capacitor/android
npx cap add android
```
This command creates a fully native Android Studio project inside a folder named `android/`.

---

## 🛠️ Copying Assets & Building the App

Whenever you make changes to `index.html` inside the `www` directory, you need to copy those assets into the Android native project and compile them.

### Step 1: Sync Web Assets
```bash
npx cap copy
```

### Step 2: Open in Android Studio
```bash
npx cap open android
```
This will open Android Studio automatically, targeting the generated native Android project folder.

### Step 3: Run / Build the App
In Android Studio:
1. Wait for Gradle to finish sync (this may take a minute on the first launch).
2. Select your device or emulator from the top toolbar.
3. Click the green **Run (Play)** button to compile and install the app on your device.
4. To build a standalone APK, select **Build > Build Bundle(s) / APK(s) > Build APK(s)** from the top menu.

---

## ⚡ Live Reload (Speed Up Development)

Instead of running `npx cap copy` every time you edit your HTML/CSS/JS code, you can use live reloading to stream changes directly to your device or emulator.

1. Ensure your computer and your testing phone are on the same Wi-Fi network.
2. Find your computer's local IP address (e.g. `192.168.1.50`).
3. Open `capacitor.config.json` and add the `server` configuration pointing to your local development server:
   ```json
   {
     "appId": "com.cyberarcade.neonflap",
     "appName": "Neon Flap",
     "webDir": "www",
     "bundledWebRuntime": false,
     "server": {
       "url": "http://192.168.1.50:5500",
       "cleartext": true
     }
   }
   ```
4. Run a local development server (such as Live Server at port 5500).
5. Sync the configuration changes:
   ```bash
   npx cap sync
   ```
6. Run the app in Android Studio. Now, any file edit you save will instantly reload on the device.
7. **Important**: Remember to remove the `"server"` config block before building your final production APK!

---

## 📱 Mobile Considerations checklist

Your Flappy Bird code is already architected with native mobile compatibility in mind:
* **WebGL Rendering**: Phaser is configured with `type: Phaser.AUTO` which automatically uses WebGL for high-performance GPU-accelerated graphics on mobile devices.
* **Touch Event Listeners**: Jump/Flap and Restarts are mapped to `pointerdown` events. In Phaser, `pointerdown` seamlessly translates to touch taps on Android devices.
* **Mobile Audio Activation**: Modern Android WebViews block audio synthesis until the user interacts with the page. Your code already handles this by binding `resumeAudioContext` to the first tap event:
  ```javascript
  document.addEventListener('click', resumeAudioContext);
  document.addEventListener('keydown', resumeAudioContext);
  ```
* **Aspect Ratio Scaling**: The CSS wrapper aligns the cabinet layout nicely. When wrapped inside Capacitor, the game canvas (`400x600`) will scale dynamically to fit the height or width of the mobile device.
