import React, { useState, useEffect } from 'react';
import { EVENT_PRESETS } from './data/eventPresets';
import { SAMPLE_INVITE_TOKENS, INITIAL_GUEST_COMMUNITY } from './data/guestsData';
import { INITIAL_TRACKS } from './data/soundtrackData';
import { INITIAL_POLAROIDS, INITIAL_TOASTS } from './data/photoGalleryData';
import { resolveInviteToken, saveGuestRsvp } from './services/inviteTokenService';
import { aggregateCateringMatrix } from './services/cateringMatrixService';

import { TopDemoBar } from './components/TopDemoBar';
import { HeroKeepsakeStage } from './components/HeroKeepsakeStage';
import { RunOfShowTimeline } from './components/RunOfShowTimeline';
import { DressCodeMoodboard } from './components/DressCodeMoodboard';
import { ArrivalConcierge } from './components/ArrivalConcierge';
import { RsvpComposer } from './components/RsvpComposer';
import { MutualsGuestbook } from './components/MutualsGuestbook';
import { VinylShelfPlayer } from './components/VinylShelfPlayer';
import { RideshareBoard } from './components/RideshareBoard';
import { PolaroidToastWall } from './components/PolaroidToastWall';
import { DayOfCompanionMode } from './components/DayOfCompanionMode';
import { HostInsightsModal } from './components/HostInsightsModal';

import { Sparkles, ArrowUp, ChevronUp } from 'lucide-react';

export default function App() {
  const [archetypeId, setArchetypeId] = useState('wedding');
  const [guestToken, setGuestToken] = useState('sarah-chen');
  const [currentGuest, setCurrentGuest] = useState(() => resolveInviteToken('sarah-chen'));
  const [eventMode, setEventMode] = useState('pre-event'); // 'pre-event' | 'day-of' | 'post-event'
  const [isHostInsightsOpen, setIsHostInsightsOpen] = useState(false);

  // Community state
  const [guests, setGuests] = useState(INITIAL_GUEST_COMMUNITY);
  const [tracks, setTracks] = useState(INITIAL_TRACKS);
  const [polaroids, setPolaroids] = useState(INITIAL_POLAROIDS);
  const [toasts, setToasts] = useState(INITIAL_TOASTS);

  const currentArchetype = EVENT_PRESETS[archetypeId] || EVENT_PRESETS.wedding;

  // Sync guest when token changes
  useEffect(() => {
    const resolved = resolveInviteToken(guestToken);
    setCurrentGuest(resolved);
  }, [guestToken]);

  // Handle archetype change
  const handleSelectArchetype = (id) => {
    setArchetypeId(id);
    // Align default guest to archetype target if appropriate
    if (id === 'birthday') {
      setGuestToken('chloe-dupuis');
    } else if (id === 'conference') {
      setGuestToken('elena-rostova');
    } else {
      setGuestToken('sarah-chen');
    }
  };

  const handleSelectGuest = (token) => {
    setGuestToken(token);
    const guest = SAMPLE_INVITE_TOKENS[token];
    if (guest && guest.archetypeTarget) {
      setArchetypeId(guest.archetypeTarget);
    }
  };

  const handleRsvpSubmitted = (updatedRecord) => {
    setCurrentGuest(updatedRecord);
    // Update in guest community
    setGuests(prev => {
      const idx = prev.findIndex(g => g.name === updatedRecord.primaryName);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = {
          ...copy[idx],
          dietary: updatedRecord.dietary?.join(', ') || 'None',
          danceSong: updatedRecord.favoriteSong || copy[idx].danceSong
        };
        return copy;
      } else {
        return [
          {
            id: `g-${Date.now()}`,
            name: updatedRecord.primaryName,
            archetype: archetypeId,
            roleTag: 'Guest of Honor Circle',
            tableId: updatedRecord.assignedTableId || 'T04',
            tableName: updatedRecord.assignedTableName || 'Table 04',
            city: updatedRecord.hometown || 'Guest City',
            icebreaker: updatedRecord.toastNote || 'Excited to celebrate!',
            danceSong: updatedRecord.favoriteSong || '',
            dietary: updatedRecord.dietary?.join(', ') || 'None',
            outOfTown: true,
            avatar: updatedRecord.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
            rideshare: { needed: false }
          },
          ...prev
        ];
      }
    });
  };

  const handleSongAdded = (newTrack) => {
    setTracks(prev => [
      {
        id: `tr-${Date.now()}`,
        archetype: archetypeId,
        title: newTrack.title,
        artist: newTrack.artist,
        category: newTrack.category || 'Peak Dancefloor',
        submittedBy: newTrack.submittedBy || 'You',
        upvotes: 1,
        tempo: '124 BPM',
        duration: '3:30',
        color: currentArchetype.goldColor || '#C5A059'
      },
      ...prev
    ]);
  };

  const handleUpvoteTrack = (trackIdOrTitle) => {
    setTracks(prev => prev.map(t => {
      if (t.id === trackIdOrTitle || t.title === trackIdOrTitle) {
        return { ...t, upvotes: (t.upvotes || 0) + 1 };
      }
      return t;
    }));
  };

  const handleAddPolaroid = (newPol) => {
    setPolaroids(prev => [
      {
        id: `pol-${Date.now()}`,
        archetype: archetypeId,
        ...newPol
      },
      ...prev
    ]);
  };

  const handleAddToast = (newToast) => {
    setToasts(prev => [
      {
        id: `tst-${Date.now()}`,
        archetype: archetypeId,
        ...newToast
      },
      ...prev
    ]);
  };

  const handleCheersToast = (toastId) => {
    setToasts(prev => prev.map(t => {
      if (t.id === toastId) {
        return { ...t, cheers: (t.cheers || 1) + 1 };
      }
      return t;
    }));
  };

  const scrollToRsvp = () => {
    const el = document.getElementById('rsvp-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  // Compute live catering summary for host intelligence
  const cateringSummary = aggregateCateringMatrix(guests, currentArchetype.subEvents, currentGuest);

  return (
    <div className={`min-h-screen transition-colors duration-500 ${currentArchetype.themeClass}`}>
      
      {/* 1. TOP FLOATING DEMO & ARCHETYPE SWITCHER BAR */}
      <TopDemoBar
        currentArchetype={currentArchetype}
        onSelectArchetype={handleSelectArchetype}
        currentGuest={currentGuest}
        onSelectGuest={handleSelectGuest}
        eventMode={eventMode}
        onChangeEventMode={setEventMode}
        onOpenHostInsights={() => setIsHostInsightsOpen(true)}
        onScrollToRsvp={scrollToRsvp}
      />

      <main className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        
        {/* 2. TACTILE "UNSEAL & REVEAL" HERO STAGE */}
        <HeroKeepsakeStage
          event={currentArchetype}
          currentGuest={currentGuest}
          onScrollToRsvp={scrollToRsvp}
        />

        {/* 3. DAY-OF COMPANION MODE (If mode selected or user is in day-of) */}
        {eventMode === 'day-of' && (
          <DayOfCompanionMode
            event={currentArchetype}
            currentGuest={currentGuest}
            onDeactivate={() => setEventMode('pre-event')}
          />
        )}

        {/* 4. ASYMMETRIC EVENT SUITE SPLIT (Cols 1-7 Left | Cols 8-12 Right Sticky) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mt-6">
          
          {/* Left Column (7 Cols): Schedule, Lookbook & Travel Logistics */}
          <div className="lg:col-span-7 space-y-12">
            
            {/* Run of Show Timeline */}
            <RunOfShowTimeline event={currentArchetype} />

            {/* Dress-Code Moodboard & Terrain Swatch Drawer */}
            <DressCodeMoodboard event={currentArchetype} />

            {/* Arrival & Travel Concierge Cards */}
            <ArrivalConcierge event={currentArchetype} />

          </div>

          {/* Right Column (5 Cols): Sticky Tactile RSVP Composer & 3D Flip Pass */}
          <div className="lg:col-span-5 lg:sticky lg:top-20 z-20">
            <RsvpComposer
              event={currentArchetype}
              currentGuest={currentGuest}
              onRsvpSubmitted={handleRsvpSubmitted}
              onSongAdded={handleSongAdded}
            />
          </div>

        </div>

        {/* 5. FULL-WIDTH SOCIAL LOUNGE & VALUE-ADDS */}
        <div className="space-y-14 mt-16">
          
          {/* "Who's Coming" Icebreaker Wall */}
          <MutualsGuestbook
            event={currentArchetype}
            guests={guests}
          />

          {/* Crowd-Curated Soundtrack Vinyl Shelf */}
          <VinylShelfPlayer
            event={currentArchetype}
            tracks={tracks}
            onUpvoteTrack={handleUpvoteTrack}
            onAddNewTrack={handleSongAdded}
          />

          {/* Guest Ride-Share & Arrival Coordinator */}
          <RideshareBoard
            event={currentArchetype}
            currentGuest={currentGuest}
          />

          {/* Digital Disposable Camera & Toast Wall */}
          <PolaroidToastWall
            event={currentArchetype}
            currentGuest={currentGuest}
            polaroids={polaroids}
            toasts={toasts}
            onAddPolaroid={handleAddPolaroid}
            onAddToast={handleAddToast}
            onCheersToast={handleCheersToast}
          />

        </div>

      </main>

      {/* 6. STICKY MOBILE RSVP BAR */}
      <div className="lg:hidden fixed bottom-4 left-4 right-4 z-40">
        <div className="p-3 rounded-2xl backdrop-blur-xl bg-theme-card/95 border border-theme-foil shadow-2xl flex items-center justify-between gap-3">
          <div>
            <div className="text-[10px] font-mono text-theme-muted uppercase">
              {currentGuest.partyName || currentGuest.primaryName}
            </div>
            <div className="font-serif font-semibold text-theme-primary text-xs sm:text-sm">
              {currentGuest.status === 'confirmed' ? '✓ Pass Confirmed' : 'Awaiting Your Reply'}
            </div>
          </div>

          <button
            onClick={scrollToRsvp}
            className="px-4 py-2 rounded-xl bg-theme-accent text-white font-medium text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{currentGuest.status === 'confirmed' ? 'View Pass' : 'RSVP Now'}</span>
          </button>
        </div>
      </div>

      {/* 7. HOST INSIGHTS & CATERING MATRIX MODAL */}
      <HostInsightsModal
        isOpen={isHostInsightsOpen}
        onClose={() => setIsHostInsightsOpen(false)}
        cateringSummary={cateringSummary}
        guestsList={guests}
        event={currentArchetype}
      />

    </div>
  );
}

