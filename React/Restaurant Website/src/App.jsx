import React from 'react';
import { RestaurantProvider, useRestaurant } from './services/restaurantStore';
import Navbar from './components/Navbar';
import AtmosphericHeroStage from './components/AtmosphericHeroStage';
import LivingMenuExplorer from './components/LivingMenuExplorer';
import SpatialReservationConcierge from './components/SpatialReservationConcierge';
import RelationalGalleryGrid from './components/RelationalGalleryGrid';
import VerifiedReviewShowcase from './components/VerifiedReviewShowcase';
import Footer from './components/Footer';
import DishDetailModal from './components/DishDetailModal';
import StandbyWaitlistModal from './components/StandbyWaitlistModal';
import ReviewSubmissionModal from './components/ReviewSubmissionModal';
import HostStandLiveCockpit from './components/HostStandLiveCockpit';
import DatabaseSchemaModal from './components/DatabaseSchemaModal';
import { X, Sparkles, Bell } from 'lucide-react';

function RestaurantApp() {
  const {
    reservationModalOpen,
    setReservationModalOpen,
    toastMessage
  } = useRestaurant();

  return (
    <div className="min-h-screen bg-[var(--bg-canvas)] text-[var(--text-primary)] transition-colors duration-500 font-body selection:bg-[var(--brand-primary)]/20 selection:text-[var(--brand-primary)]">
      
      {/* Navigation Header */}
      <Navbar />

      {/* Hero Stage & Instant Availability Quick-Bar */}
      <AtmosphericHeroStage />

      {/* Living Culinary Menu & Dietary Intelligence Engine */}
      <LivingMenuExplorer />

      {/* Spatial Table Reservations & Architectural Floorplan Concierge */}
      <SpatialReservationConcierge />

      {/* Relational Visual Gallery & Atmospheric Storytelling */}
      <RelationalGalleryGrid />

      {/* Verified Diner Reviews & Dimensional Sentiment Matrix */}
      <VerifiedReviewShowcase />

      {/* Culinary Footer */}
      <Footer />

      {/* Modals & Portals */}
      <DishDetailModal />
      <StandbyWaitlistModal />
      <ReviewSubmissionModal />
      <HostStandLiveCockpit />
      <DatabaseSchemaModal />

      {/* Focused Modal for "Reserve a Table" CTA */}
      {reservationModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-fadeIn overflow-y-auto">
          <div className="relative w-full max-w-6xl my-auto bg-[var(--bg-elevated)] border border-[var(--border-hairline)] rounded-3xl shadow-2xl overflow-hidden p-4 sm:p-8">
            <button
              onClick={() => setReservationModalOpen(false)}
              className="absolute top-4 right-4 z-30 p-2 rounded-full bg-[var(--bg-surface)] hover:bg-[var(--bg-canvas)] text-[var(--text-muted)] hover:text-[var(--text-primary)] border border-[var(--border-hairline)] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <SpatialReservationConcierge isModal={true} onClose={() => setReservationModalOpen(false)} />
          </div>
        </div>
      )}

      {/* Real-Time Toast Notification Pill */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce">
          <div className="px-4 py-3 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--accent-gold)] shadow-2xl flex items-center gap-2.5 text-xs font-mono-numbers text-[var(--text-primary)]">
            <Sparkles className="w-4 h-4 text-[var(--brand-primary)] shrink-0" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

    </div>
  );
}

export default function App() {
  return (
    <RestaurantProvider>
      <RestaurantApp />
    </RestaurantProvider>
  );
}
