import React, { useState } from 'react';
import { OrderProvider, useOrders } from './context/OrderContext';
import { Sidebar } from './components/layout/Sidebar';
import { TopHeader } from './components/layout/TopHeader';
import { SlaHorizonRibbon } from './components/horizon/SlaHorizonRibbon';
import { OrderTable } from './components/orders/OrderTable';
import { BatchActionBar } from './components/orders/BatchActionBar';
import { Order360Drawer } from './components/inspector/Order360Drawer';
import { SplitFulfillmentModal } from './components/modals/SplitFulfillmentModal';
import { ScanToPackStation } from './components/fulfillment/ScanToPackStation';
import { RmaDesk } from './components/returns/RmaDesk';
import { InventorySafetyStockView } from './components/inventory/InventorySafetyStockView';
import { CommandPalette } from './components/layout/CommandPalette';
import { KeyboardShortcutsModal } from './components/modals/KeyboardShortcutsModal';
import { ThermalLabelModal } from './components/modals/ThermalLabelModal';
import { WavePickModal } from './components/modals/WavePickModal';

const MainLayout: React.FC = () => {
  const [currentView, setCurrentView] = useState<'ledger' | 'pack' | 'returns' | 'inventory'>('ledger');
  const { isPackStationOpen } = useOrders();

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-canvas-light dark:bg-canvas-dark text-slate-900 dark:text-slate-100 font-sans transition-colors duration-200">
      {/* 240px Navigation Rail */}
      <Sidebar currentView={currentView} setCurrentView={setCurrentView} />

      {/* Main Content Workspace */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Top Operational Header */}
        <TopHeader />

        {/* View Switching */}
        {currentView === 'ledger' && (
          <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
            {/* 4-Card SLA Horizon Ribbon */}
            <SlaHorizonRibbon />

            {/* High-Density Order Ledger Table */}
            <OrderTable />

            {/* Floating Glassmorphic Batch Action Dock */}
            <BatchActionBar />
          </main>
        )}

        {currentView === 'pack' && (
          <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
            <ScanToPackStation />
          </main>
        )}

        {currentView === 'returns' && (
          <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
            <RmaDesk />
          </main>
        )}

        {currentView === 'inventory' && (
          <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
            <InventorySafetyStockView />
          </main>
        )}
      </div>

      {/* Full-screen Scan to Pack Station Modal (when opened from ledger via 'P' or button) */}
      {isPackStationOpen && currentView !== 'pack' && <ScanToPackStation />}

      {/* Slide-over Order 360° Inspector */}
      <Order360Drawer />

      {/* Interactive Modals */}
      <SplitFulfillmentModal />
      <WavePickModal />
      <ThermalLabelModal />
      <CommandPalette setCurrentView={setCurrentView} />
      <KeyboardShortcutsModal />
    </div>
  );
};

export default function App() {
  return (
    <OrderProvider>
      <MainLayout />
    </OrderProvider>
  );
}

