import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { 
  Sparkles, 
  Heart, 
  Send, 
  Check, 
  UserPlus, 
  Calendar, 
  Music, 
  MessageSquare, 
  AlertCircle,
  Utensils
} from 'lucide-react';
import { ConfirmedDigitalPass } from './ConfirmedDigitalPass';
import { saveGuestRsvp } from '../services/inviteTokenService';

export function RsvpComposer({
  event,
  currentGuest,
  onRsvpSubmitted,
  onSongAdded
}) {
  const [isFlipped, setIsFlipped] = useState(currentGuest.status === 'confirmed');
  const [attendance, setAttendance] = useState(currentGuest.status === 'declined' ? 'declined' : 'attending');
  const [hasPlusOne, setHasPlusOne] = useState(
    currentGuest.hasPlusOneAllowed && (currentGuest.confirmedGuests > 1 || !!currentGuest.plusOneDefaultName)
  );
  const [plusOneName, setPlusOneName] = useState(currentGuest.plusOneDefaultName || '');
  const [selectedSubEvents, setSelectedSubEvents] = useState(
    currentGuest.subEventsConfirmed || ['main']
  );
  const [selectedDietary, setSelectedDietary] = useState(
    currentGuest.dietary || ['No Restrictions']
  );
  const [customDietaryNotes, setCustomDietaryNotes] = useState('');
  const [danceSong, setDanceSong] = useState(currentGuest.favoriteSong || '');
  const [toastNote, setToastNote] = useState(currentGuest.toastNote || '');
  const [submittedRecord, setSubmittedRecord] = useState(currentGuest);

  // Sync state if guest changes from dropdown
  useEffect(() => {
    setIsFlipped(currentGuest.status === 'confirmed');
    setAttendance(currentGuest.status === 'declined' ? 'declined' : 'attending');
    setHasPlusOne(currentGuest.hasPlusOneAllowed && currentGuest.confirmedGuests > 1);
    setPlusOneName(currentGuest.plusOneDefaultName || '');
    setSelectedSubEvents(currentGuest.subEventsConfirmed || ['main']);
    setSelectedDietary(currentGuest.dietary || ['No Restrictions']);
    setDanceSong(currentGuest.favoriteSong || '');
    setToastNote(currentGuest.toastNote || '');
    setSubmittedRecord(currentGuest);
  }, [currentGuest]);

  const dietaryOptions = [
    { id: 'No Restrictions', label: 'No Restrictions', icon: '✨' },
    { id: 'Plant-Based', label: '🌱 Plant-Based', icon: '🌱' },
    { id: 'Gluten-Free', label: '🌾 Gluten-Free', icon: '🌾' },
    { id: 'Nut Allergy', label: '🥜 Nut Allergy', icon: '🥜' },
    { id: 'Zero-Proof', label: '🥂 Zero-Proof Lover', icon: '🥂' }
  ];

  const toggleSubEvent = (subId) => {
    if (selectedSubEvents.includes(subId)) {
      setSelectedSubEvents(selectedSubEvents.filter(id => id !== subId));
    } else {
      setSelectedSubEvents([...selectedSubEvents, subId]);
    }
  };

  const toggleDietary = (dietId) => {
    if (dietId === 'No Restrictions') {
      setSelectedDietary(['No Restrictions']);
      return;
    }
    let updated = selectedDietary.filter(d => d !== 'No Restrictions');
    if (updated.includes(dietId)) {
      updated = updated.filter(d => d !== dietId);
      if (updated.length === 0) updated = ['No Restrictions'];
    } else {
      updated.push(dietId);
    }
    setSelectedDietary(updated);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const record = {
      ...currentGuest,
      status: attendance,
      confirmedGuests: attendance === 'attending' ? (hasPlusOne ? 2 : 1) : 0,
      plusOneName: hasPlusOne ? plusOneName : '',
      subEventsConfirmed: selectedSubEvents,
      dietary: selectedDietary,
      customDietaryNotes,
      favoriteSong: danceSong,
      toastNote
    };

    setSubmittedRecord(record);
    saveGuestRsvp(currentGuest.token, record);

    if (onRsvpSubmitted) {
      onRsvpSubmitted(record);
    }

    if (danceSong && onSongAdded) {
      onSongAdded({
        title: danceSong.split('—')[0]?.trim() || danceSong,
        artist: danceSong.split('—')[1]?.trim() || currentGuest.primaryName,
        submittedBy: currentGuest.primaryName,
        category: 'Peak Dancefloor'
      });
    }

    // Confetti celebration
    try {
      confetti({
        particleCount: 75,
        spread: 70,
        origin: { y: 0.55 },
        colors: [event.goldColor || '#C5A059', event.accentColor || '#2E5A44', '#161E19']
      });
    } catch (err) {}

    // 3D Flip into Confirmed Digital Pass
    setIsFlipped(true);
  };

  // Filter sub-events based on privacy permission
  const visibleSubEvents = event.subEvents.filter(sub => {
    if (!sub.private) return true;
    return currentGuest.invitedToPrivate;
  });

  return (
    <div id="rsvp-section" className="w-full perspective-1200">
      
      {/* 3D Rotating Container */}
      <div 
        className={`w-full transition-transform duration-700 transform-style-3d ${
          isFlipped ? 'rotate-y-180' : ''
        }`}
      >
        
        {/* FRONT: The Tactile RSVP Composer */}
        <div className={`w-full rounded-3xl p-6 sm:p-8 bg-theme-card border border-theme-foil/70 shadow-paper-deep transition-opacity duration-300 ${
          isFlipped ? 'opacity-0 pointer-events-none absolute inset-0' : 'opacity-100'
        }`}>
          
          {/* Header */}
          <div className="flex items-start justify-between gap-4 pb-5 border-b border-theme-border">
            <div>
              <div className="text-[10px] font-mono tracking-widest uppercase text-theme-gold font-semibold mb-1">
                Formal Response Card
              </div>
              <h3 className="text-xl sm:text-2xl font-serif text-theme-primary font-normal">
                Responding for {currentGuest.partyName || currentGuest.primaryName}
              </h3>
            </div>
            
            <div className="text-right">
              <span className="text-[10px] font-mono px-2 py-1 rounded bg-theme-inset text-theme-muted border border-theme-border">
                {event.hero.rsvpDeadline}
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-6">
            
            {/* 1. Tactile Oversized Attendance Toggles */}
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-theme-muted mb-2">
                Will you be joining us?
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setAttendance('attending')}
                  className={`p-4 rounded-2xl border text-left transition-all duration-200 flex items-center justify-between ${
                    attendance === 'attending'
                      ? 'border-theme-accent bg-theme-accent/10 ring-1 ring-theme-accent'
                      : 'border-theme-border bg-theme-card hover:bg-theme-inset'
                  }`}
                >
                  <div>
                    <div className="font-serif font-semibold text-theme-primary text-base flex items-center gap-1.5">
                      <span>✨ Joyfully Attending</span>
                    </div>
                    <div className="text-[11px] text-theme-muted">
                      Ready to celebrate in person
                    </div>
                  </div>
                  {attendance === 'attending' && (
                    <div className="w-5 h-5 rounded-full bg-theme-accent text-white flex items-center justify-center">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setAttendance('declined')}
                  className={`p-4 rounded-2xl border text-left transition-all duration-200 flex items-center justify-between ${
                    attendance === 'declined'
                      ? 'border-theme-toast bg-theme-toast/10 ring-1 ring-theme-toast'
                      : 'border-theme-border bg-theme-card hover:bg-theme-inset'
                  }`}
                >
                  <div>
                    <div className="font-serif font-semibold text-theme-primary text-base">
                      🥂 Warm Wishes from Afar
                    </div>
                    <div className="text-[11px] text-theme-muted">
                      Unable to attend in person
                    </div>
                  </div>
                  {attendance === 'declined' && (
                    <div className="w-5 h-5 rounded-full bg-theme-toast text-white flex items-center justify-center">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                  )}
                </button>
              </div>
            </div>

            {/* IF ATTENDING: Household & Sub-Events & Preferences */}
            {attendance === 'attending' ? (
              <>
                {/* Plus-One Allocation (Respects Host Token Allowance) */}
                {currentGuest.hasPlusOneAllowed ? (
                  <div className="p-4 rounded-2xl bg-theme-inset/70 border border-theme-border space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <UserPlus className="w-4 h-4 text-theme-accent" />
                        <span className="text-xs font-semibold text-theme-primary">
                          Plus-One Guest Allowance (1 Permitted)
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setHasPlusOne(!hasPlusOne)}
                        className={`text-xs font-medium px-3 py-1 rounded-full border transition ${
                          hasPlusOne 
                            ? 'bg-theme-accent text-white border-theme-accent' 
                            : 'bg-theme-card text-theme-muted border-theme-border'
                        }`}
                      >
                        {hasPlusOne ? 'Attending with +1' : 'Attending Solo'}
                      </button>
                    </div>

                    {hasPlusOne && (
                      <div className="animate-fadeIn">
                        <label className="block text-[11px] font-mono text-theme-muted mb-1">
                          Full Name of Your Plus-One Guest:
                        </label>
                        <input
                          type="text"
                          required={hasPlusOne}
                          placeholder="e.g., Alex Rivera"
                          value={plusOneName}
                          onChange={(e) => setPlusOneName(e.target.value)}
                          className="w-full px-3.5 py-2 rounded-xl border border-theme-border bg-theme-card text-theme-primary text-xs focus:outline-none focus:ring-1 focus:ring-theme-foil"
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-[11px] font-mono text-theme-muted p-2.5 rounded-xl bg-theme-inset/50 border border-theme-border flex items-center gap-2">
                    <AlertCircle className="w-3.5 h-3.5 text-theme-accent" />
                    <span>Single guest invitation registered to: {currentGuest.primaryName}</span>
                  </div>
                )}

                {/* Sub-Events RSVP Checkboxes */}
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-theme-muted mb-2">
                    Select Which Celebrations You Will Attend:
                  </label>
                  <div className="space-y-2">
                    {visibleSubEvents.map((sub) => {
                      const isChecked = selectedSubEvents.includes(sub.id);
                      return (
                        <div
                          key={sub.id}
                          onClick={() => toggleSubEvent(sub.id)}
                          className={`cursor-pointer p-3 rounded-xl border transition-all flex items-center justify-between text-xs ${
                            isChecked
                              ? 'border-theme-accent bg-theme-accent/5'
                              : 'border-theme-border bg-theme-card hover:bg-theme-inset/60'
                          }`}
                        >
                          <div>
                            <div className="font-semibold text-theme-primary flex items-center gap-1.5">
                              <span>{sub.title}</span>
                              {sub.private && (
                                <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-700 dark:text-amber-300 font-mono">
                                  VIP Circle
                                </span>
                              )}
                            </div>
                            <div className="text-theme-muted text-[11px] mt-0.5">
                              {sub.time} • {sub.desc}
                            </div>
                          </div>

                          <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                            isChecked ? 'bg-theme-accent border-theme-accent text-white' : 'border-theme-muted'
                          }`}>
                            {isChecked && <Check className="w-3 h-3" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Dietary & Drink Restrictions */}
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-theme-muted mb-2 flex items-center gap-1.5">
                    <Utensils className="w-3.5 h-3.5 text-theme-accent" />
                    <span>Dietary & Toast Preferences (1-Tap Selection):</span>
                  </label>

                  <div className="flex flex-wrap gap-2 mb-2">
                    {dietaryOptions.map((opt) => {
                      const active = selectedDietary.includes(opt.id);
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => toggleDietary(opt.id)}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                            active
                              ? 'bg-theme-accent text-white border-theme-accent shadow-sm'
                              : 'bg-theme-inset text-theme-primary border-theme-border hover:bg-theme-card'
                          }`}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>

                  <input
                    type="text"
                    placeholder="Severe allergies or specific details for the culinary team..."
                    value={customDietaryNotes}
                    onChange={(e) => setCustomDietaryNotes(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-theme-border bg-theme-card text-theme-primary text-xs focus:outline-none focus:ring-1 focus:ring-theme-foil"
                  />
                </div>

                {/* Micro-Prompt: Dancefloor Song Contribution */}
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-theme-muted mb-1 flex items-center gap-1.5">
                    <Music className="w-3.5 h-3.5 text-theme-accent" />
                    <span>{event.microPrompt.label}</span>
                  </label>
                  <input
                    type="text"
                    placeholder={event.microPrompt.placeholder}
                    value={danceSong}
                    onChange={(e) => setDanceSong(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-theme-border bg-theme-card text-theme-primary text-xs focus:outline-none focus:ring-1 focus:ring-theme-foil font-medium"
                  />
                  <div className="text-[10px] text-theme-muted mt-1">
                    Adds directly to our live rotating vinyl shelf below!
                  </div>
                </div>
              </>
            ) : null}

            {/* Toast / Memory Note for Hosts */}
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-theme-muted mb-1 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-theme-accent" />
                <span>{event.microPrompt.toastLabel}</span>
              </label>
              <textarea
                rows={2}
                placeholder={event.microPrompt.toastPlaceholder}
                value={toastNote}
                onChange={(e) => setToastNote(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-theme-border bg-theme-card text-theme-primary text-xs focus:outline-none focus:ring-1 focus:ring-theme-foil"
              ></textarea>
            </div>

            {/* Perforated Submit Stub Footer */}
            <div className="pt-4 border-t-2 border-dashed border-theme-border flex flex-col gap-2">
              <button
                type="submit"
                className="w-full py-3.5 px-6 rounded-2xl bg-theme-accent text-white font-serif font-semibold text-sm sm:text-base hover:brightness-110 active:scale-[0.99] transition shadow-md flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-amber-200" />
                <span>Seal & Confirm RSVP →</span>
              </button>

              <div className="text-center text-[10px] font-mono text-theme-muted">
                Generates instant verified 3D digital pass & calendar sync
              </div>
            </div>

          </form>

        </div>

        {/* BACK: Confirmed 3D VIP Digital Pass */}
        <div className={`w-full rotate-y-180 transition-opacity duration-300 ${
          isFlipped ? 'opacity-100' : 'opacity-0 pointer-events-none absolute inset-0'
        }`}>
          <ConfirmedDigitalPass
            event={event}
            currentGuest={currentGuest}
            rsvpRecord={submittedRecord}
            onEditRsvp={() => setIsFlipped(false)}
          />
        </div>

      </div>

    </div>
  );
}

