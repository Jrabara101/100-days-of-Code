import React, { useState } from 'react';
import { AuctionProvider, useAuction } from './context/AuctionContext';
import { Header } from './components/Header';
import { EndingSoonTicker } from './components/EndingSoonTicker';
import { AuctionPortalLobby } from './components/AuctionPortalLobby';
import { LiveLotBiddingStage } from './components/LiveLotBiddingStage';
import { MultiLotWatchlistTerminal } from './components/MultiLotWatchlistTerminal';
import { ConsignorCockpit } from './components/ConsignorCockpit';
import { EscrowSettlementPortal } from './components/EscrowSettlementPortal';
import { BidderPaddleVerificationModal } from './components/BidderPaddleVerificationModal';
import { ArchitectureModal } from './components/ArchitectureModal';

const MainContent: React.FC = () => {
  const { activeView, setActiveView, selectedLotId, setSelectedLotId, selectedLot } = useAuction();
  const [isInStageView, setIsInStageView] = useState(true); // Default to stage view for Lot #041 to showcase live features directly

  const handleSelectLotFromLobby = (lotId: string) => {
    setSelectedLotId(lotId);
    setIsInStageView(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToLobby = () => {
    setIsInStageView(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F5] dark:bg-[#0A0B0E] text-[#111315] dark:text-[#F8FAFC] transition-colors">
      <Header />
      <EndingSoonTicker />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {activeView === 'portal' && (
          <>
            {isInStageView && selectedLot ? (
              <LiveLotBiddingStage
                lot={selectedLot}
                onBack={handleBackToLobby}
              />
            ) : (
              <AuctionPortalLobby onSelectLot={handleSelectLotFromLobby} />
            )}
          </>
        )}

        {activeView === 'terminal' && (
          <MultiLotWatchlistTerminal
            onOpenStage={(lotId) => {
              setSelectedLotId(lotId);
              setActiveView('portal');
              setIsInStageView(true);
            }}
          />
        )}

        {activeView === 'studio' && <ConsignorCockpit />}

        {activeView === 'settlement' && <EscrowSettlementPortal />}
      </main>

      {/* Global Modals */}
      <BidderPaddleVerificationModal />
      <ArchitectureModal />

      {/* Institutional Footer */}
      <footer className="border-t border-[#E5E3DC] dark:border-[#252934] bg-[#F3F2EE] dark:bg-[#12141A] py-8 text-xs font-mono transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[#646870] dark:text-[#8E96A8]">
          <div className="flex items-center gap-2">
            <span className="font-serif font-bold text-sm text-[#111315] dark:text-[#F8FAFC]">
              AUCTIO VAULT
            </span>
            <span>•</span>
            <span>Server-Authoritative Anti-Sniping & Escrow Platform</span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <span>Popcorn Soft-Close: 120s</span>
            <span>•</span>
            <span>Stripe Pre-Auth Manual Capture</span>
            <span>•</span>
            <span>PostgreSQL Atomic Row Locks</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <AuctionProvider>
      <MainContent />
    </AuctionProvider>
  );
}
