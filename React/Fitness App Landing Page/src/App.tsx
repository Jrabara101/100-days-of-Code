import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { KineticHeroStage } from './components/KineticHeroStage';
import { InteractiveWorkoutExplorer } from './components/InteractiveWorkoutExplorer';
import { CoachAuditionDeck } from './components/CoachAuditionDeck';
import { FourWeekPlanConfigurator } from './components/FourWeekPlanConfigurator';
import { WearableTelemetryStage } from './components/WearableTelemetryStage';
import { MembershipPricingMatrix } from './components/MembershipPricingMatrix';
import { SocialProofReviews } from './components/SocialProofReviews';
import { FAQSection } from './components/FAQSection';
import { StickyMobileDownloadDock } from './components/StickyMobileDownloadDock';
import { DeepLinkModal } from './components/DeepLinkModal';
import { HsaFsaModal } from './components/HsaFsaModal';
import { Footer } from './components/Footer';
import { useBlueprintArchitect } from './hooks/useBlueprintArchitect';

export const App: React.FC = () => {
  const [isQRModalOpen, setIsQRModalOpen] = useState<boolean>(false);
  const [isHsaModalOpen, setIsHsaModalOpen] = useState<boolean>(false);
  const { token, goalTitle } = useBlueprintArchitect();

  return (
    <div className="min-h-screen bg-[#08090C] text-[#F8FAFC] flex flex-col font-sans selection:bg-[#D4FF00] selection:text-[#08090C]">
      {/* Sticky Acquisition Navbar */}
      <Navbar
        onOpenQRModal={() => setIsQRModalOpen(true)}
        onOpenHsaModal={() => setIsHsaModalOpen(true)}
      />

      <main className="flex-1">
        {/* Kinetic Hero Stage with Live Telemetry */}
        <KineticHeroStage
          onOpenQRModal={() => setIsQRModalOpen(true)}
          onOpenHsaModal={() => setIsHsaModalOpen(true)}
        />

        {/* Interactive Workout & Muscle Explorer (Try Before You Download) */}
        <InteractiveWorkoutExplorer
          onOpenQR={() => setIsQRModalOpen(true)}
        />

        {/* Coach Archetype & Vibe Audition Deck */}
        <CoachAuditionDeck />

        {/* Interactive 4-Week Blueprint Builder & State Handoff */}
        <FourWeekPlanConfigurator
          onOpenQRModal={() => setIsQRModalOpen(true)}
        />

        {/* Universal Wearable Telemetry Stage */}
        <WearableTelemetryStage />

        {/* Transparent Membership Plans & Cost-Per-Sweat ROI */}
        <MembershipPricingMatrix
          onOpenQRModal={() => setIsQRModalOpen(true)}
          onOpenHsaModal={() => setIsHsaModalOpen(true)}
        />

        {/* Verified Social Proof & Review Aggregator */}
        <SocialProofReviews />

        {/* FAQ Section */}
        <FAQSection />
      </main>

      {/* Modern Platform Footer */}
      <Footer
        onOpenQR={() => setIsQRModalOpen(true)}
        onOpenHsa={() => setIsHsaModalOpen(true)}
      />

      {/* Floating Mobile Thumb-Zone Dock */}
      <StickyMobileDownloadDock
        onOpenQR={() => setIsQRModalOpen(true)}
      />

      {/* Context-Preserving Scan-to-Pocket Dynamic QR Modal */}
      <DeepLinkModal
        isOpen={isQRModalOpen}
        onClose={() => setIsQRModalOpen(false)}
        token={token}
        goalTitle={goalTitle}
      />

      {/* Instant HSA/FSA Eligibility Lookup Modal */}
      <HsaFsaModal
        isOpen={isHsaModalOpen}
        onClose={() => setIsHsaModalOpen(false)}
      />
    </div>
  );
};

export default App;
