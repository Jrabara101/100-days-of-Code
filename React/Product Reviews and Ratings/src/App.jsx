import React, { useState, useMemo } from 'react';
import { useTrustStore } from './context/TrustStoreContext';
import { Navbar } from './components/common/Navbar';
import { ProductStrip } from './components/storefront/ProductStrip';
import { ScorecardBento } from './components/storefront/ScorecardBento';
import { SentimentPillBar } from './components/storefront/SentimentPillBar';
import { PeopleLikeMeFilter } from './components/storefront/PeopleLikeMeFilter';
import { MediaUnboxingGallery } from './components/storefront/MediaUnboxingGallery';
import { ReviewFeed } from './components/storefront/ReviewFeed';
import { CustomerMediaLightbox } from './components/storefront/CustomerMediaLightbox';
import { ReviewSubmissionModal } from './components/storefront/ReviewSubmissionModal';
import { OwnershipUpdateModal } from './components/storefront/OwnershipUpdateModal';

import { TelemetryBar } from './components/admin/TelemetryBar';
import { ModerationSidebar } from './components/admin/ModerationSidebar';
import { TriageQueueList } from './components/admin/TriageQueueList';
import { ReviewInspectionStage } from './components/admin/ReviewInspectionStage';
import { PhotoPrivacyBlurModal } from './components/admin/PhotoPrivacyBlurModal';
import { BrandResponseStation } from './components/admin/BrandResponseStation';
import { BrigadeProtectionConsole } from './components/admin/BrigadeProtectionConsole';
import { RejectReasonModal } from './components/admin/RejectReasonModal';
import { DefectRadarModal } from './components/admin/DefectRadarModal';

import { useModerationHotkeys } from './hooks/useModerationHotkeys';

export function App() {
  const {
    viewMode,
    reviews,
    selectedReviewId,
    setSelectedReviewId,
    selectedReview,
    activeQueueTab,
    approveReview,
    redactAndApproveReview
  } = useTrustStore();

  // Storefront Filter States
  const [activeRatingFilter, setActiveRatingFilter] = useState(null);
  const [activeTopicFilter, setActiveTopicFilter] = useState(null);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [withMediaOnly, setWithMediaOnly] = useState(false);
  const [personaFilters, setPersonaFilters] = useState({});
  const [sortBy, setSortBy] = useState('most_helpful');
  const [isPeopleLikeMeOpen, setIsPeopleLikeMeOpen] = useState(false);

  // Storefront Modals
  const [isWriteReviewOpen, setIsWriteReviewOpen] = useState(false);
  const [activeLightboxData, setActiveLightboxData] = useState(null); // { mediaItem, review }
  const [activeOwnershipUpdateReview, setActiveOwnershipUpdateReview] = useState(null);

  // Admin Modals
  const [blurModalReview, setBlurModalReview] = useState(null);
  const [brandReplyReview, setBrandReplyReview] = useState(null);
  const [rejectModalReview, setRejectModalReview] = useState(null);
  const [isDefectRadarOpen, setIsDefectRadarOpen] = useState(false);

  // Active queue list for J/K navigation
  const currentQueueList = useMemo(() => {
    return reviews.filter(r => {
      if (activeQueueTab === 'triage-inbox') return r.moderationStatus === 'pending';
      if (activeQueueTab === 'needs-redaction') return r.priorityQueue === 'needs-redaction' && r.moderationStatus === 'pending';
      if (activeQueueTab === 'media-blur') return r.priorityQueue === 'media-blur' && r.moderationStatus === 'pending';
      if (activeQueueTab === 'low-star-escalations') return r.priorityQueue === 'low-star-escalations' && r.moderationStatus === 'pending';
      if (activeQueueTab === 'fraud-hold') return r.priorityQueue === 'fraud-hold' || r.moderationStatus === 'rejected';
      if (activeQueueTab === 'published') return r.moderationStatus === 'approved';
      return true;
    });
  }, [reviews, activeQueueTab]);

  // J/K Navigation Handlers
  const handleNavNext = () => {
    if (currentQueueList.length === 0) return;
    const currentIndex = currentQueueList.findIndex(r => r.id === selectedReviewId);
    const nextIndex = (currentIndex + 1) % currentQueueList.length;
    setSelectedReviewId(currentQueueList[nextIndex].id);
  };

  const handleNavPrev = () => {
    if (currentQueueList.length === 0) return;
    const currentIndex = currentQueueList.findIndex(r => r.id === selectedReviewId);
    const prevIndex = currentIndex <= 0 ? currentQueueList.length - 1 : currentIndex - 1;
    setSelectedReviewId(currentQueueList[prevIndex].id);
  };

  const handleHotKeyApprove = () => {
    if (selectedReview && selectedReview.moderationStatus === 'pending') {
      approveReview(selectedReview.id);
    }
  };

  const handleHotKeyRedactAndApprove = () => {
    if (selectedReview && selectedReview.moderationStatus === 'pending') {
      redactAndApproveReview(selectedReview.id);
    }
  };

  const handleHotKeyToggleBlur = () => {
    if (selectedReview && selectedReview.media?.length > 0) {
      setBlurModalReview(selectedReview);
    }
  };

  const handleHotKeyReply = () => {
    if (selectedReview) {
      setBrandReplyReview(selectedReview);
    }
  };

  const handleHotKeyReject = () => {
    if (selectedReview) {
      setRejectModalReview(selectedReview);
    }
  };

  // Enable hotkeys only in admin mode and when no modal is blocking
  const isAnyModalOpen =
    isWriteReviewOpen ||
    !!activeLightboxData ||
    !!activeOwnershipUpdateReview ||
    !!blurModalReview ||
    !!brandReplyReview ||
    !!rejectModalReview ||
    isDefectRadarOpen;

  const { activeHotkey } = useModerationHotkeys({
    onNext: handleNavNext,
    onPrev: handleNavPrev,
    onApprove: handleHotKeyApprove,
    onReject: handleHotKeyReject,
    onRedactAndApprove: handleHotKeyRedactAndApprove,
    onToggleBlur: handleHotKeyToggleBlur,
    onReply: handleHotKeyReply,
    isEnabled: viewMode === 'admin' && !isAnyModalOpen
  });

  return (
    <div className="min-h-screen bg-surface flex flex-col antialiased">
      {/* Top Fixed Global Header */}
      <Navbar />

      {/* Main View Container (Padded top 14 / 56px) */}
      <div className="pt-14 flex-1 flex flex-col">
        {viewMode === 'storefront' ? (
          /* ======================================================== */
          /* STOREFRONT CUSTOMER EXPERIENCE                           */
          /* ======================================================== */
          <main className="w-full flex flex-col">
            {/* Sub-header Breadcrumb & Product Strip */}
            <ProductStrip onOpenWriteReview={() => setIsWriteReviewOpen(true)} />

            {/* Storefront Content Grid */}
            <div className="w-full max-w-7xl mx-auto px-6 lg:px-12 py-8 flex flex-col gap-8">
              {/* Scorecard Bento Box */}
              <ScorecardBento
                onOpenWriteReview={() => setIsWriteReviewOpen(true)}
                activeRatingFilter={activeRatingFilter}
                setActiveRatingFilter={setActiveRatingFilter}
              />

              {/* Sentiment Highlight Filter Bar & Tools */}
              <SentimentPillBar
                activeTopicFilter={activeTopicFilter}
                setActiveTopicFilter={setActiveTopicFilter}
                sortBy={sortBy}
                setSortBy={setSortBy}
                verifiedOnly={verifiedOnly}
                setVerifiedOnly={setVerifiedOnly}
                withMediaOnly={withMediaOnly}
                setWithMediaOnly={setWithMediaOnly}
                onTogglePeopleLikeMe={() => setIsPeopleLikeMeOpen(!isPeopleLikeMeOpen)}
                activePersonaFiltersCount={Object.keys(personaFilters).length}
              />

              {/* People Like Me Persona Context Drawer */}
              <PeopleLikeMeFilter
                isOpen={isPeopleLikeMeOpen}
                onClose={() => setIsPeopleLikeMeOpen(false)}
                personaFilters={personaFilters}
                setPersonaFilters={setPersonaFilters}
                onClearFilters={() => setPersonaFilters({})}
              />

              {/* Customer Unboxing Gallery (Variant Tagged) */}
              <MediaUnboxingGallery
                onSelectMedia={(mediaItem, review) =>
                  setActiveLightboxData({ mediaItem, review })
                }
                onQuickViewVariant={(variantTitle) => {
                  setPersonaFilters({ variant: variantTitle });
                  setIsPeopleLikeMeOpen(true);
                }}
              />

              {/* Review Feed */}
              <ReviewFeed
                activeRatingFilter={activeRatingFilter}
                setActiveRatingFilter={setActiveRatingFilter}
                activeTopicFilter={activeTopicFilter}
                setActiveTopicFilter={setActiveTopicFilter}
                verifiedOnly={verifiedOnly}
                setVerifiedOnly={setVerifiedOnly}
                withMediaOnly={withMediaOnly}
                setWithMediaOnly={setWithMediaOnly}
                personaFilters={personaFilters}
                setPersonaFilters={setPersonaFilters}
                sortBy={sortBy}
                onOpenMediaLightbox={(mediaItem, review) =>
                  setActiveLightboxData({ mediaItem, review })
                }
                onOpenOwnershipUpdate={(review) => setActiveOwnershipUpdateReview(review)}
              />
            </div>

            {/* Storefront Footer */}
            <footer className="w-full bg-surface-container-low py-12 border-t border-outline-variant/30 mt-12">
              <div className="max-w-7xl mx-auto px-6 lg:px-12 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex flex-col gap-1">
                  <span className="font-headline-sm text-headline-sm text-primary font-bold">
                    Hollis Trust Consumer Storefront
                  </span>
                  <span className="font-body-sm text-on-surface-variant">
                    Every review verified by cryptographic proof of purchase &amp; privacy-first moderation.
                  </span>
                </div>
                <div className="font-mono text-label-code-sm text-outline">
                  © 2026 Hollis Trust Technologies Inc. All verified reviews protected.
                </div>
              </div>
            </footer>
          </main>
        ) : (
          /* ======================================================== */
          /* ADMIN MODERATION & TRUST GOVERNANCE PORTAL                */
          /* ======================================================== */
          <div className="flex-1 flex flex-col">
            {/* Pinned Telemetry & Hotkey Bar */}
            <TelemetryBar activeHotkey={activeHotkey} />

            {/* Admin Workspace Layout (Sidebar + Queue List + Stage) */}
            <div className="flex-1 flex">
              {/* Left Queues Taxonomy Rail (240px) */}
              <ModerationSidebar
                onOpenDefectRadar={() => setIsDefectRadarOpen(true)}
              />

              {activeQueueTab === 'brigade-protection' ? (
                /* Brigade Protection View */
                <BrigadeProtectionConsole />
              ) : (
                /* Standard Split Triage & Stage */
                <div className="flex-1 flex">
                  {/* Triage Queue List (420px) */}
                  <TriageQueueList />

                  {/* Workspace Inspection Stage */}
                  <ReviewInspectionStage
                    onOpenBlurTool={(review, media) => setBlurModalReview(review)}
                    onOpenBrandReply={(review) => setBrandReplyReview(review)}
                    onOpenRejectModal={(review) => setRejectModalReview(review)}
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* GLOBAL MODALS & DRAWERS                                  */}
      {/* ======================================================== */}

      {/* 1. Review Submission Modal */}
      <ReviewSubmissionModal
        isOpen={isWriteReviewOpen}
        onClose={() => setIsWriteReviewOpen(false)}
      />

      {/* 2. Customer Media Lightbox */}
      {activeLightboxData && (
        <CustomerMediaLightbox
          mediaItem={activeLightboxData.mediaItem}
          review={activeLightboxData.review}
          onClose={() => setActiveLightboxData(null)}
          onQuickViewVariant={(variantTitle) => {
            setActiveLightboxData(null);
            setPersonaFilters({ variant: variantTitle });
            setIsPeopleLikeMeOpen(true);
          }}
        />
      )}

      {/* 3. Longitudinal 6-Month Ownership Update Modal */}
      {activeOwnershipUpdateReview && (
        <OwnershipUpdateModal
          isOpen={!!activeOwnershipUpdateReview}
          onClose={() => setActiveOwnershipUpdateReview(null)}
          review={activeOwnershipUpdateReview}
        />
      )}

      {/* 4. Admin Photo Privacy Blur Modal */}
      {blurModalReview && (
        <PhotoPrivacyBlurModal
          isOpen={!!blurModalReview}
          onClose={() => setBlurModalReview(null)}
          review={blurModalReview}
        />
      )}

      {/* 5. Brand Response & Make-Good Station Modal */}
      {brandReplyReview && (
        <BrandResponseStation
          isOpen={!!brandReplyReview}
          onClose={() => setBrandReplyReview(null)}
          review={brandReplyReview}
        />
      )}

      {/* 6. Admin Reject Reason Modal */}
      {rejectModalReview && (
        <RejectReasonModal
          isOpen={!!rejectModalReview}
          onClose={() => setRejectModalReview(null)}
          review={rejectModalReview}
        />
      )}

      {/* 7. SKU Defect Early-Warning Radar Modal */}
      <DefectRadarModal
        isOpen={isDefectRadarOpen}
        onClose={() => setIsDefectRadarOpen(false)}
      />
    </div>
  );
}

