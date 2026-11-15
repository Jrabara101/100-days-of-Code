# Vault & Stream — Encrypted Cloud File Vault & Intelligent Document Scanner

A unified **React Application with File Reading Packages** and dedicated **React Native Android Application Architecture** built from the Stitch TrustMedia File Vault design specifications and UI screens.

---

## 🌟 Key Highlights & Screen Implementation

This project unifies all 6 core Stitch TrustMedia screens into a cohesive, high-performance application:

### 1. 📂 Cloud Vault (`CloudVaultScreen`)
* **Storage Quota Glance Banner**: Zero-Knowledge Encrypted badge, real-time allocation linear gauge (34.8 GB of 100 GB used), and subscription upgrade modal.
* **Search & Filters**: Encrypted tag queries, voice input trigger, and horizontal pill filters (*All Files*, *Recent*, *Images*, *Documents*, *Videos*, *Encrypted Vault*).
* **Pinned & Recent Carousel**: Interactive cards for high-priority streams (`Cinematic_Trailer_Edit.mov`, `Client_Access_Key.pem`) with AES sync indicators.
* **All Media & Files**: Verified files with SHA-256 badges, modification dates, and direct one-click routing to the Media Inspector.
* **Floating Action Button (+ New Upload)**: Triggers the bottom slide-up modal with direct triggers for Scanner, Camera, Device File Picker, and Cloud Bridge.

### 2. 📸 Document Scanner Viewfinder (`DocumentScannerScreen`)
* **Camera Sensor Feed**: Real webcam support via `navigator.mediaDevices.getUserMedia` or high-resolution simulated contract feed.
* **Glowing Perspective Quad Overlay**: Edge detection polygon with 4 vertex handles and animated scanning glow.
* **HUD Telemetry**: Gyroscope hold-flat leveling angle indicator (e.g. `0.4°`), Secure Enclave OCR badge, and confidence tracker (`98.4%`).
* **Capture Modes**: Auto-capture with edge-lock vs. Manual shutter button with haptic flash feedback.
* **Image Filters**: Color, B&W Clear, Grayscale, and Unwarp presets.

### 3. ✂️ Document Crop & OCR Review (`DocumentCropReviewScreen`)
* **Interactive Perspective Quadrilateral**: Draggable corner pins and rule-of-thirds grid.
* **Magnifier Loupe**: Precision 1x / 2x zoom loupe tracking active corner pins.
* **Toolbar Adjustments**: Rotate 90°, Planar Deskew compensation, Format preset picker (A4, Letter, Legal, ID Card), and Reset Pins.
* **Enhancement Profiles**: Clean B&W (high-contrast binarization), True Color, and Grayscale Pro.
* **Live OCR Text Tab**: 342 extracted words with 99.2% confidence scoring, in-place text editing, and clipboard copy.

### 4. 🔍 Media Inspector & Sharing (`MediaInspectorScreen`)
* **Interactive Document & Media Viewers**: Dispatches to specialized file readers based on MIME/extension.
* **Watermark & Integrity Stamp**: Forensic dynamic watermarking and AES-256-GCM status chip.
* **Segmented Tabs**:
  * **Metadata & Integrity**: SHA-256 checksums, Initialization Nonce, Key Derivation (Argon2id + PBKDF2), and Hardware Enclave Signer ID.
  * **Share Permissions**: Public Share Link toggle, QR code generator, Access Privilege Levels (*View Only* vs *Allow Download*), and Zero Leak Shield password protection.

### 5. 🛡️ Security & Storage Analytics (`SecurityAnalyticsScreen`)
* **Top Trust Hero Card**: Active Protection HSM Enclave telemetry, Grade A+ rating, and live cryptographic audit re-scan trigger.
* **Storage Allocation Breakdown**: Multi-segmented progress bar (Images 42%, Documents 28%, Videos 18%, Archives 12%) with file counts.
* **Vault Pruning Engine**: One-click cleanup simulation that reclaims 1.8 GB of duplicate & temp chunks.
* **Cryptographic Envelope**: Master Key `#V-8942` stored in hardware enclave.

### 6. ⚡ Uploads & Transfer Queue (`UploadsTransferScreen`)
* **Queue Velocity**: Real-time throughput tracker (`8.4 MB/s • TLS 1.3 Secure Pipe • P2P Stream`).
* **Active Queue Controls**: Pause All / Cancel All and aggregate progress bar.
* **Real File Ingestion Dropzone**: Drag-and-drop or device file browsing with real-time SHA-256 hashing.
* **Ingest Preferences**: Auto-compress images and SHA-256 bit-rot verification toggles.

---

## 📦 Packages for File Reading & Processing

| Package / Module | Purpose |
| :--- | :--- |
| **`papaparse`** | In-memory CSV/TSV parser for tabular financial forecasts and audit datasets with live cell searching, column sorting, and pagination. |
| **`PdfReader`** | Interactive PDF document viewer with sheet navigation, 50%–250% zoom levels, and extracted text layer inspection. |
| **`ImageReader`** | High-resolution image inspection with real-time canvas filters (Clean B&W, Grayscale Pro, Vibrant, Invert) and EXIF telemetry. |
| **`TextCodeReader`** | Monospace text viewer with line numbers, byte length calculation, and clipboard copy for Markdown, JSON, and PEM keys. |
| **`AudioVideoPlayer`** | Video player with time scrubber, mute toggle, and ProRes 422 4K UHD telemetry. |
| **`cryptoEngine.js`** | Genuine browser Web Crypto API (`crypto.subtle.digest('SHA-256')`) for computing bit-rot check hashes on uploaded files. |
| **`ocrEngine.js`** | Text extraction and contract parsing engine with confidence scoring and legibility metrics. |

---

## 🤖 React Native for Android Architecture (`src/native/`)

The repository includes a dedicated React Native Android implementation in `src/native/`:

```
src/native/
├── README.md                          # Android build & setup instructions
├── AndroidManifest.xml                # Permissions (Camera, SAF Storage, Biometrics, Network)
├── App.native.tsx                     # React Native navigation root with BottomTabs
├── screens/
│   ├── CloudVaultScreen.native.tsx     # Files list, storage quota, categories, FAB
│   ├── DocumentScannerScreen.native.tsx# Camera HUD, SVG quad overlay, shutter trigger
│   ├── DocumentCropReviewScreen.native.tsx # Interactive polygon crop, OCR stream
│   ├── MediaInspectorScreen.native.tsx # Previewer, SHA-256 hashes, sharing guardrails
│   ├── SecurityAnalyticsScreen.native.tsx # Enclave status, storage chart, pruning
│   └── UploadsTransferScreen.native.tsx# Transfer queue, speed pipe, dropzone
└── services/
    └── NativeFileSystem.ts            # Android SAF & hardware enclave bridge
```

---

## 🚀 Getting Started

### Run the Web & Android Simulator Application:
```bash
npm run dev
```
Open your browser at `http://localhost:3000`. Use the top toolbar toggle to switch between **Android Native Mobile View** (Pixel 8 frame with status bar and gesture navigation) and **Desktop View**!

### Build for Production:
```bash
npm run build
```
Verify the production build output in `dist/`.

