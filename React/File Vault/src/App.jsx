import React from 'react';
import { VaultProvider, useVault } from './context/VaultContext';
import AndroidDeviceFrame from './components/layout/AndroidDeviceFrame';
import Header from './components/layout/Header';
import BottomNav from './components/layout/BottomNav';
import UploadModalSheet from './components/modals/UploadModalSheet';
import CloudVaultScreen from './screens/CloudVaultScreen';
import UploadsTransferScreen from './screens/UploadsTransferScreen';
import MediaInspectorScreen from './screens/MediaInspectorScreen';
import SecurityAnalyticsScreen from './screens/SecurityAnalyticsScreen';
import DocumentScannerScreen from './screens/DocumentScannerScreen';
import DocumentCropReviewScreen from './screens/DocumentCropReviewScreen';
import { CheckCircle2, ShieldAlert, Info } from 'lucide-react';

function VaultAppContent() {
  const { currentScreen, toast } = useVault();

  const renderActiveScreen = () => {
    switch (currentScreen) {
      case 'files':
        return <CloudVaultScreen />;
      case 'uploads':
        return <UploadsTransferScreen />;
      case 'inspector':
        return <MediaInspectorScreen />;
      case 'security':
        return <SecurityAnalyticsScreen />;
      case 'scanner':
        return <DocumentScannerScreen />;
      case 'crop_review':
        return <DocumentCropReviewScreen />;
      default:
        return <CloudVaultScreen />;
    }
  };

  // Hide standard header in Document Scanner HUD for edge-to-edge camera experience
  const isScannerHud = currentScreen === 'scanner';
  // Hide standard bottom nav in scanner or crop review
  const showBottomNav = !['scanner', 'crop_review'].includes(currentScreen);

  return (
    <AndroidDeviceFrame>
      {/* Toast Notification Banner */}
      <div
        className={`fixed top-12 left-1/2 -translate-x-1/2 z-50 pointer-events-none transition-all duration-300 max-w-[90%] ${
          toast.visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-3'
        }`}
      >
        <div className="bg-primary-container text-white px-4 py-2 rounded-full shadow-2xl flex items-center gap-2 text-xs font-mono border border-secondary/40 backdrop-blur-md">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span className="truncate">{toast.message}</span>
        </div>
      </div>

      {/* Header */}
      {!isScannerHud && <Header />}

      {/* Active Screen View */}
      <div className="flex-1 w-full flex flex-col relative overflow-y-auto no-scrollbar">
        {renderActiveScreen()}
      </div>

      {/* Global FAB Upload Sheet Modal */}
      <UploadModalSheet />

      {/* Bottom Navigation */}
      {showBottomNav && <BottomNav />}
    </AndroidDeviceFrame>
  );
}

export default function App() {
  return (
    <VaultProvider>
      <VaultAppContent />
    </VaultProvider>
  );
}

