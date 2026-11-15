/**
 * Sample Initial Data for Vault & Stream
 * Grounded in the provided UI screenshots & design specs
 */

export const INITIAL_FILES = [
  {
    id: 'f-1',
    name: 'Architecture_Blueprint_Rev4.pdf',
    type: 'pdf',
    typeName: 'PDF Document',
    size: 24.6 * 1024 * 1024,
    sizeDisplay: '24.6 MB',
    modified: 'Today, 11:20 AM',
    modifiedRaw: new Date(Date.now() - 3600000 * 2).toISOString(),
    category: 'Documents',
    securityStatus: 'Sealed & Signed',
    cipher: 'AES-256-GCM',
    sha256: '9f83cf21e3f8902d3854162633a523a129d3b2830a9845d4522909e61fe0098a',
    nonce: '4A:8C:F9:01:22:EE:99:31:00:DF:14:B2',
    signer: 'Hardware Enclave Key #V-8942',
    pages: 18,
    activeSheet: 'Sheet 04 / 18 · Section A-A',
    previewUrl: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1200&q=80',
    pinned: false,
    publicShare: false,
    shareUrl: 'https://vault.stream/s/e89f2-blueprint-a4',
    accessPrivilege: 'view_only', // view_only | allow_download
    passwordProtected: true,
    zeroLeakShield: true,
    exifScrubbed: true,
    content: `SPECIFICATION DOCUMENT - ARCHITECTURAL BLUEPRINT REV 4
Project: TrustMedia Secure Data Center Facility
Location: Sector 7 Enclave, High-Security Zone
Status: Sealed & Cryptographically Signed

1. STRUCTURAL OVERVIEW
The primary enclosure is constructed with 450mm reinforced concrete with integrated Faraday shielding.
All server bays feature dual-redundant CRAC units with N+2 power distribution architecture.

2. ENCLAVE SECURITY PERIMETER
- Biometric access portals with multi-factor iris scanning
- Hardware Security Module (HSM) chambers isolated from external vibration
- Cryptographic key vault with physical air-gapping

3. AIRFLOW & POWER LOAD
- Target PUE: 1.12
- Nominal IT Load: 4.8 MW
- Battery Backup: Flywheel UPS with 15-minute bridging to diesel turbines.`
  },
  {
    id: 'f-2',
    name: 'Cinematic_Trailer_Edit.mov',
    type: 'video',
    typeName: 'ProRes 422',
    size: 340.5 * 1024 * 1024,
    sizeDisplay: '340.5 MB',
    modified: '25m ago',
    modifiedRaw: new Date(Date.now() - 1500000).toISOString(),
    category: 'Videos',
    securityStatus: 'Synced',
    cipher: 'Hardware Enclave',
    sha256: 'a12b48cd90e1f34a56b78c90de12fa34bc56de78fa90bc12de34fa56bc78de90',
    nonce: '1B:3E:99:4C:AA:02:11:78:90:33:45:67',
    signer: 'Key #V-8942',
    previewUrl: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&w=800&q=80',
    pinned: true,
    publicShare: true,
    shareUrl: 'https://vault.stream/s/m8291-cinematic-trailer',
    accessPrivilege: 'view_only',
    passwordProtected: false,
    zeroLeakShield: true,
    duration: '02:45',
    resolution: '3840x2160 (4K UHD)'
  },
  {
    id: 'f-3',
    name: 'Client_Access_Key.pem',
    type: 'key',
    typeName: 'Cryptographic Key',
    size: 14 * 1024,
    sizeDisplay: '14 KB',
    modified: '1h ago',
    modifiedRaw: new Date(Date.now() - 3600000).toISOString(),
    category: 'Encrypted Vault',
    securityStatus: 'Hardware Enclave Armed',
    cipher: 'Ed25519-AES-256',
    sha256: 'f87a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b7c6d5e4f3a2b1c0d9e8f7a',
    nonce: 'FF:AA:BB:CC:DD:EE:00:11:22:33:44:55',
    signer: 'Secure Enclave Root CA',
    pinned: true,
    publicShare: false,
    content: `-----BEGIN ENCRYPTED PRIVATE KEY-----
MIIFHDBOBgkqhkiG9w0BBQ0wQTApBgkqhkiG9w0BBQwwHAQIf09s3A0PZ0kCAggA
MAwGCCqGSIb3DQIJBQAwFAYIKoZIhvcNAwcECN+89gVvXzYqBIIEyO7f+zE1qN9j
G0qI+1Z7Yq1k/v0r0x9sZlQk0j3y/2ZlQk0j3y/2ZlQk0j3y/2ZlQk0j3y/2ZlQk
kX98qZlQk0j3y/2ZlQk0j3y/2ZlQk0j3y/2ZlQk0j3y/2ZlQk0j3y/2ZlQk0j3y/
-----END ENCRYPTED PRIVATE KEY-----`
  },
  {
    id: 'f-4',
    name: 'Brand_Guidelines_v2.4.pdf',
    type: 'pdf',
    typeName: 'PDF Document',
    size: 18.4 * 1024 * 1024,
    sizeDisplay: '18.4 MB',
    modified: '2h ago',
    modifiedRaw: new Date(Date.now() - 7200000).toISOString(),
    category: 'Documents',
    securityStatus: 'SHA-256 Verified',
    cipher: 'AES-256-GCM',
    sha256: 'c3ab8ff13720e8ad9047dd39466b3c8974e592c2fa383d4a3960714caef0c4f2',
    nonce: '88:77:66:55:44:33:22:11:00:FF:EE:DD',
    signer: 'Brand Identity Vault #8801',
    pages: 42,
    activeSheet: 'Section 01 · Visual Sovereignty',
    previewUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
    pinned: false,
    content: `# VAULT & STREAM - BRAND IDENTITY GUIDELINES
Version: 2.4 | Status: Approved

1. BRAND ETHOS
Vault & Stream represents uncompromising security, institutional permanence, and effortless clarity.
The design language pairs deep naval anchors with serene atmospheric surfaces.

2. COLOR PALETTE
- Primary: #0B2545 (Deep Navy)
- Secondary: #134074 (Structural Navy)
- Tertiary: #059669 (Security Emerald)
- Base Canvas: #F7F9FF (Atmospheric White/Blue)

3. TYPOGRAPHY
- Display & Headlines: Plus Jakarta Sans
- Body & Numerical Metadata: Inter (Tabular figures enabled)`
  },
  {
    id: 'f-5',
    name: 'Q3_Financial_Forecast.xlsx',
    type: 'csv',
    typeName: 'Financial Ledger',
    size: 4.2 * 1024 * 1024,
    sizeDisplay: '4.2 MB',
    modified: 'Yesterday',
    modifiedRaw: new Date(Date.now() - 86400000).toISOString(),
    category: 'Documents',
    securityStatus: 'Passcode Protected',
    cipher: 'AES-256-CBC',
    sha256: '7b2a9e4f1c8d5b3a6e0f9c2d4b7a1e8f3c5d6e9a0b1c2d3e4f5a6b7c8d9e0f1a',
    nonce: '99:AA:88:BB:77:CC:66:DD:55:EE:44:FF',
    signer: 'CFO Office Enclave Token',
    pinned: false,
    content: `Quarter,Department,Budget_Allocated,Actual_Spend,Variance_USD,Variance_Pct,Audit_Status
Q3-2026,Cloud Infrastructure,1250000,1184500,-65500,-5.24%,VERIFIED
Q3-2026,Cryptography & HSM,820000,795000,-25000,-3.05%,VERIFIED
Q3-2026,Mobile Engineering,940000,962000,+22000,+2.34%,FLAGGED_REVIEW
Q3-2026,Security Operations,670000,642000,-28000,-4.18%,VERIFIED
Q3-2026,Compliance & Legal,430000,410000,-20000,-4.65%,VERIFIED
Q3-2026,Edge CDN & Storage,510000,535000,+25000,+4.90%,APPROVED_OVERRUN`
  },
  {
    id: 'f-6',
    name: 'Product_Hero_4K_Shot.raw',
    type: 'image',
    typeName: 'RAW Photo',
    size: 84.1 * 1024 * 1024,
    sizeDisplay: '84.1 MB',
    modified: '3 days ago',
    modifiedRaw: new Date(Date.now() - 86400000 * 3).toISOString(),
    category: 'Images',
    securityStatus: 'RAW Sensor Master',
    cipher: 'AES-256-GCM',
    sha256: '3d5e7f9a1b2c4e6a8d0b2c4e6a8d0b2c4e6a8d0b2c4e6a8d0b2c4e6a8d0b2c4e',
    nonce: '33:44:55:66:77:88:99:AA:BB:CC:DD:EE',
    signer: 'Hardware Enclave Camera Module',
    previewUrl: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=1200&q=80',
    pinned: false,
    resolution: '8192x5464 (44.8 MP)',
    camera: 'Sony Alpha 1 • FE 50mm F1.2 GM'
  },
  {
    id: 'f-7',
    name: 'Security_Protocol_2026.docx',
    type: 'text',
    typeName: 'Encrypted Spec',
    size: 1.1 * 1024 * 1024,
    sizeDisplay: '1.1 MB',
    modified: 'May 12',
    modifiedRaw: '2026-05-12T09:15:00Z',
    category: 'Documents',
    securityStatus: 'AES-GCM Armed',
    cipher: 'AES-256-GCM',
    sha256: '44a8c9b2f3d1e0a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1f0a9b8c7d6e5f4a3',
    nonce: '22:33:44:55:66:77:88:99:AA:BB:CC:DD',
    signer: 'CISO Cryptographic Signer',
    pinned: false,
    content: `TRUSTMEDIA SECURITY & RETENTION PROTOCOL - 2026

1. DATA AT REST
All objects ingested into Vault & Stream are fragmented into 4MB encrypted chunks prior to cloud persistence.
Keys are generated inside FIPS 140-3 Level 4 Hardware Security Modules.

2. ZERO-LEAK ACCESS CONTROL
- Public links require symmetric ephemeral secret exchange.
- Download access can be dynamically revoked at any second.
- Forensic dynamic watermarking encodes the viewer IP and timestamp into all viewed frames.

3. AUDIT TRAIL IMMUTABILITY
Every read, decrypt, or share action appends a signed block to the internal ledger.`
  }
];

export const INITIAL_TRANSFERS = [
  {
    id: 't-1',
    name: 'Keynote_Presentation_Q4_Final.mov',
    sizeDisplay: '210 MB',
    sizeBytes: 210 * 1024 * 1024,
    processedBytes: 142.8 * 1024 * 1024,
    progressPct: 68,
    speed: '4.8 MB/s',
    eta: '45s left',
    status: 'uploading', // uploading | paused | completed | hashing
    format: 'ProRes 422 QuickTime'
  },
  {
    id: 't-2',
    name: 'Client_Contract_Signed_Final.pdf',
    sizeDisplay: '8.4 MB',
    sizeBytes: 8.4 * 1024 * 1024,
    processedBytes: 7.7 * 1024 * 1024,
    progressPct: 92,
    speed: '2.1 MB/s',
    eta: 'Hashing & verifying integrity...',
    status: 'hashing',
    format: 'Cryptographic Envelope'
  },
  {
    id: 't-3',
    name: 'Research_Survey_Data_Raw.csv',
    sizeDisplay: '142.5 MB',
    sizeBytes: 142.5 * 1024 * 1024,
    processedBytes: 42.1 * 1024 * 1024,
    progressPct: 30,
    speed: '3.6 MB/s',
    eta: '1m 12s left',
    status: 'uploading',
    format: 'Tabular Dataset'
  }
];

