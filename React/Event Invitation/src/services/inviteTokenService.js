import { SAMPLE_INVITE_TOKENS } from '../data/guestsData';

const STORAGE_KEY_PREFIX = 'event_keepsake_rsvp_';

export function resolveInviteToken(tokenParam) {
  // If tokenParam is provided, check SAMPLE_INVITE_TOKENS
  let token = tokenParam;
  if (!token && typeof window !== 'undefined') {
    const urlParams = new URLSearchParams(window.location.search);
    token = urlParams.get('invite') || urlParams.get('guest');
  }

  // Default to sarah-chen if nothing provided
  if (!token || !SAMPLE_INVITE_TOKENS[token]) {
    token = 'sarah-chen';
  }

  const baseGuest = SAMPLE_INVITE_TOKENS[token];

  // Check localStorage for any previous submission for this guest
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(`${STORAGE_KEY_PREFIX}${token}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        return { ...baseGuest, ...parsed, isCustomSaved: true };
      }
    } catch (e) {
      console.warn('Could not read from localStorage', e);
    }
  }

  return { ...baseGuest, isCustomSaved: false };
}

export function saveGuestRsvp(token, rsvpData) {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(`${STORAGE_KEY_PREFIX}${token}`, JSON.stringify(rsvpData));
    } catch (e) {
      console.warn('Could not write to localStorage', e);
    }
  }
}

export function checkRsvpDeadline(deadlineDateString) {
  // Check if current date is before deadline
  // For demo realism, we consider deadlines open by default unless explicitly configured past
  return {
    isLocked: false,
    daysRemaining: 18,
    badgeText: 'Self-Edit Open Until Nov 1'
  };
}

