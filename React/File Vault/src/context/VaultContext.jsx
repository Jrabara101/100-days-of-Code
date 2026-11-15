import React, { createContext, useContext, useState, useEffect } from 'react';
import { INITIAL_FILES, INITIAL_TRANSFERS } from '../utils/sampleData';
import { computeSHA256, formatBytes, generateNonce } from '../utils/cryptoEngine';
import confetti from 'canvas-confetti';

const VaultContext = createContext(null);

export function VaultProvider({ children }) {
  const [currentScreen, setCurrentScreen] = useState('files'); // files | uploads | inspector | security | scanner | crop_review
  const [activeInspectFile, setActiveInspectFile] = useState(INITIAL_FILES[0]);
  const [files, setFiles] = useState(INITIAL_FILES);
  const [transfers, setTransfers] = useState(INITIAL_TRANSFERS);
  const [filterCategory, setFilterCategory] = useState('All Files');
  const [searchQuery, setSearchQuery] = useState('');
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [isAndroidFrameMode, setIsAndroidFrameMode] = useState(true);
  const [securityScanRunning, setSecurityScanRunning] = useState(false);
  const [cleanVaultRunning, setCleanVaultRunning] = useState(false);

  // Storage metrics (starts at 34.8 GB of 100 GB)
  const [storageUsedGB, setStorageUsedGB] = useState(34.8);
  const totalStorageGB = 100;

  // Notification Toast
  const [toast, setToast] = useState({ visible: false, message: '', icon: 'verified' });

  // Document scanning & crop workflow state
  const [scannedDocument, setScannedDocument] = useState({
    title: 'Contract_Scan_01.pdf',
    pageIndex: 1,
    totalPages: 1,
    imageSrc: 'https://images.unsplash.com/photo-1568667256549-094345857637?auto=format&fit=crop&w=1000&q=80',
    corners: [
      { x: 12, y: 15 }, // Top-Left
      { x: 88, y: 12 }, // Top-Right
      { x: 92, y: 88 }, // Bottom-Right
      { x: 8, y: 85 }   // Bottom-Left
    ],
    rotation: 0,
    deskew: true,
    filterProfile: 'bw', // bw | color | grayscale
    format: 'A4',
    ocrConfidence: 99.2,
    ocrText: `SERVICE AGREEMENT & TECHNICAL SPECIFICATIONS\nDocument Reference: TS-2026-ENCLAVE-04\nClassification: CONFIDENTIAL // STRICT PRIVILEGE\nPage: 1 of 3\nLegibility: 99.2% • Ready for OCR\n\n1. PARTIES & RECITALS\nThis Mutual Master Services Agreement ("Agreement") is executed between TrustMedia Enterprise Systems Inc. ("Provider") and the Designated Client Organization ("Recipient"). Both parties covenant to uphold zero-knowledge cryptographic safeguards regarding all persisted data streams, storage vaults, and telemetry keys.\n\n2. CRYPTOGRAPHIC DATA INTEGRITY\nProvider warrants that all digital artifacts deposited into the Enclave File Vault shall undergo automatic 256-bit AES-GCM symmetric ciphering utilizing hardware-bound root keys. Real-time SHA-256 bit-rot audits execute periodically across all distributed parity blocks.\n\n3. PERSPECTIVE DESKEW & OPTICAL RECOGNITION\nUnder Section 4.8, scanned physical contracts processed via the Mobile Viewfinder undergo perspective planar normalization, 300 DPI edge contrast enhancement, and automated textual transcription.`
  });

  const showToast = (message, icon = 'verified') => {
    setToast({ visible: true, message, icon });
    setTimeout(() => {
      setToast(prev => ({ ...prev, visible: false }));
    }, 2800);
  };

  // Switch to inspector for specific file
  const inspectFile = (file) => {
    setActiveInspectFile(file);
    setCurrentScreen('inspector');
    showToast(`Inspecting ${file.name}`, 'visibility');
  };

  // Add real or mock upload
  const handleUploadFile = async (realFile) => {
    const fileId = 't-' + Date.now();
    const fileName = realFile.name;
    const fileSize = realFile.size;
    const sizeDisplay = formatBytes(fileSize);

    // Initial item in queue
    const newTransfer = {
      id: fileId,
      name: fileName,
      sizeDisplay,
      sizeBytes: fileSize,
      processedBytes: 0,
      progressPct: 5,
      speed: '8.4 MB/s',
      eta: 'Calculating SHA-256...',
      status: 'uploading',
      format: realFile.type || 'Binary Stream',
      rawFile: realFile
    };

    setTransfers(prev => [newTransfer, ...prev]);
    setCurrentScreen('uploads');
    showToast(`Added ${fileName} to encrypted transfer queue`, 'cloud_upload');

    // Calculate real SHA-256 checksum
    const sha256 = await computeSHA256(realFile);

    // Simulate transfer chunking & completion
    let progress = 10;
    const interval = setInterval(() => {
      progress += Math.floor(Math.random() * 25) + 15;
      if (progress >= 100) {
        clearInterval(interval);
        setTransfers(prev => prev.filter(t => t.id !== fileId));

        // Read preview content if readable
        let reader = new FileReader();
        let fileType = 'document';
        if (realFile.type.startsWith('image/')) fileType = 'image';
        else if (realFile.type.startsWith('video/')) fileType = 'video';
        else if (realFile.type.includes('pdf')) fileType = 'pdf';
        else if (realFile.name.endsWith('.csv') || realFile.name.endsWith('.tsv')) fileType = 'csv';
        else if (realFile.type.startsWith('text/') || realFile.name.endsWith('.json') || realFile.name.endsWith('.md')) fileType = 'text';

        const finalizeAddition = (previewUrl = null, textContent = '') => {
          const newVaultFile = {
            id: 'f-' + Date.now(),
            name: fileName,
            type: fileType,
            typeName: realFile.type || 'Cryptographic File',
            size: fileSize,
            sizeDisplay,
            modified: 'Just now',
            modifiedRaw: new Date().toISOString(),
            category: fileType === 'image' ? 'Images' : (fileType === 'video' ? 'Videos' : 'Documents'),
            securityStatus: 'Sealed & Signed',
            cipher: 'AES-256-GCM',
            sha256,
            nonce: generateNonce(),
            signer: 'Hardware Enclave Key #V-8942',
            pages: 1,
            previewUrl: previewUrl || (fileType === 'image' ? 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80' : null),
            pinned: false,
            content: textContent || `Encrypted content of ${fileName} verified with SHA-256: ${sha256}`
          };

          setFiles(prev => [newVaultFile, ...prev]);
          setStorageUsedGB(prev => +(prev + (fileSize / (1024 * 1024 * 1024))).toFixed(2));
          showToast(`Ingested & Encrypted: ${fileName}`, 'verified');
          confetti({ particleCount: 30, spread: 60, origin: { y: 0.8 } });
        };

        if (fileType === 'image') {
          reader.onload = (e) => finalizeAddition(e.target.result);
          reader.readAsDataURL(realFile);
        } else if (fileType === 'text' || fileType === 'csv') {
          reader.onload = (e) => finalizeAddition(null, e.target.result);
          reader.readAsText(realFile);
        } else {
          finalizeAddition();
        }
      } else {
        setTransfers(prev => prev.map(t => {
          if (t.id === fileId) {
            return {
              ...t,
              progressPct: progress,
              processedBytes: Math.floor(fileSize * (progress / 100)),
              eta: `${Math.max(1, Math.round((100 - progress) / 15))}s left`
            };
          }
          return t;
        }));
      }
    }, 400);
  };

  // Toggle pause on transfer
  const toggleTransferPause = (id) => {
    setTransfers(prev => prev.map(t => {
      if (t.id === id) {
        const nextStatus = t.status === 'paused' ? 'uploading' : 'paused';
        showToast(nextStatus === 'paused' ? `Paused ${t.name}` : `Resumed ${t.name}`, 'pause');
        return { ...t, status: nextStatus };
      }
      return t;
    }));
  };

  // Cancel transfer
  const cancelTransfer = (id) => {
    setTransfers(prev => prev.filter(t => t.id !== id));
    showToast('Transfer canceled', 'close');
  };

  // Security scan simulation
  const runSecurityScan = () => {
    setSecurityScanRunning(true);
    showToast('Running Hardware Enclave Cryptographic Audit...', 'sync');
    setTimeout(() => {
      setSecurityScanRunning(false);
      showToast('All 14 cryptographic parity chains verified: Grade A+', 'verified_user');
      confetti({ particleCount: 40, spread: 50, origin: { y: 0.5 } });
    }, 2000);
  };

  // Vault pruning / deduplication
  const runVaultPruning = () => {
    setCleanVaultRunning(true);
    showToast('Pruning 1.8 GB temporary hash chunks & orphaned mirrors...', 'delete_sweep');
    setTimeout(() => {
      setCleanVaultRunning(false);
      setStorageUsedGB(prev => Math.max(10, +(prev - 1.8).toFixed(1)));
      showToast('Vault pruned! Reclaimed 1.8 GB allocation.', 'task_alt');
      confetti({ particleCount: 50, spread: 70, origin: { y: 0.6 } });
    }, 2200);
  };

  // Commit scanned & cropped document into Vault
  const saveScannedDocumentToVault = (docData) => {
    const docFile = {
      id: 'f-' + Date.now(),
      name: docData.title || 'Contract_Scan_01.pdf',
      type: 'pdf',
      typeName: 'Scanned A4 Contract',
      size: 4.8 * 1024 * 1024,
      sizeDisplay: '4.8 MB',
      modified: 'Just now',
      modifiedRaw: new Date().toISOString(),
      category: 'Documents',
      securityStatus: 'Sealed & Signed',
      cipher: 'AES-256-GCM',
      sha256: '7c89f21e3d09a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6',
      nonce: generateNonce(),
      signer: 'Enclave Scanner Module #S-109',
      pages: 1,
      previewUrl: docData.imageSrc,
      pinned: false,
      publicShare: false,
      shareUrl: 'https://vault.stream/s/scanned-contract-doc',
      accessPrivilege: 'view_only',
      content: docData.ocrText
    };

    setFiles(prev => [docFile, ...prev]);
    setActiveInspectFile(docFile);
    setCurrentScreen('inspector');
    showToast(`Saved ${docFile.name} to Vault`, 'check_circle');
    confetti({ particleCount: 60, spread: 80, origin: { y: 0.7 } });
  };

  return (
    <VaultContext.Provider
      value={{
        currentScreen,
        setCurrentScreen,
        activeInspectFile,
        setActiveInspectFile,
        files,
        setFiles,
        transfers,
        setTransfers,
        filterCategory,
        setFilterCategory,
        searchQuery,
        setSearchQuery,
        uploadModalOpen,
        setUploadModalOpen,
        isAndroidFrameMode,
        setIsAndroidFrameMode,
        storageUsedGB,
        totalStorageGB,
        toast,
        showToast,
        inspectFile,
        handleUploadFile,
        toggleTransferPause,
        cancelTransfer,
        securityScanRunning,
        runSecurityScan,
        cleanVaultRunning,
        runVaultPruning,
        scannedDocument,
        setScannedDocument,
        saveScannedDocumentToVault
      }}
    >
      {children}
    </VaultContext.Provider>
  );
}

export function useVault() {
  const context = useContext(VaultContext);
  if (!context) {
    throw new Error('useVault must be used within a VaultProvider');
  }
  return context;
}

