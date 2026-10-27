import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  GameTitle,
  PlayerReview,
  ReviewsResponse,
  DiscoveryResponse,
  DiscoveryQueryParams,
  HardwareProfile,
  SquadRoom,
} from '../types/game';

const API_BASE = '/api';

/**
 * Fetch catalog games with faceted search and vector cosine similarity
 */
export async function fetchDiscoverGames(params: DiscoveryQueryParams): Promise<DiscoveryResponse> {
  const query = new URLSearchParams();
  if (params.search) query.set('q', params.search);
  if (params.alchemyTags && params.alchemyTags.length > 0) {
    query.set('alchemyTags', JSON.stringify(params.alchemyTags));
  }
  if (params.excludeTags && params.excludeTags.length > 0) {
    query.set('excludeTags', JSON.stringify(params.excludeTags));
  }
  if (params.maxPriceCents !== undefined && params.maxPriceCents !== null) {
    query.set('maxPriceCents', String(params.maxPriceCents));
  }
  if (params.deckVerifiedOnly) query.set('deckVerifiedOnly', 'true');
  if (params.minScore) query.set('minScore', String(params.minScore));
  if (params.sortBy) query.set('sortBy', params.sortBy);
  if (params.limit) query.set('limit', String(params.limit));
  if (params.offset) query.set('offset', String(params.offset));

  const res = await fetch(`${API_BASE}/games/discover?${query.toString()}`);
  if (!res.ok) throw new Error('Failed to discover games');
  return res.json();
}

/**
 * Fetch hardware profiles
 */
export async function fetchHardwareProfiles(): Promise<HardwareProfile[]> {
  const res = await fetch(`${API_BASE}/hardware-profiles`);
  if (!res.ok) throw new Error('Failed to fetch hardware profiles');
  return res.json();
}

/**
 * Fetch single game details
 */
export async function fetchGameDetails(id: string): Promise<GameTitle> {
  const res = await fetch(`${API_BASE}/games/${id}`);
  if (!res.ok) throw new Error('Failed to fetch game details');
  return res.json();
}

/**
 * Fetch reviews for a game
 */
export async function fetchGameReviews(
  id: string,
  filters: { playtimeBracket?: string; patch?: string; sentiment?: string } = {}
): Promise<ReviewsResponse> {
  const query = new URLSearchParams();
  if (filters.playtimeBracket) query.set('playtimeBracket', filters.playtimeBracket);
  if (filters.patch) query.set('patch', filters.patch);
  if (filters.sentiment) query.set('sentiment', filters.sentiment);

  const res = await fetch(`${API_BASE}/games/${id}/reviews?${query.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch reviews');
  return res.json();
}

/**
 * Submit verified review
 */
export async function submitReview(
  gameId: string,
  data: {
    username: string;
    recommended: boolean;
    content: string;
    playtimeHours: number;
    receivedForFree?: boolean;
  }
): Promise<PlayerReview> {
  const res = await fetch(`${API_BASE}/games/${gameId}/reviews`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed to submit review' }));
    throw new Error(err.error || 'Failed to submit review');
  }
  return res.json();
}

/**
 * Vote on a review
 */
export async function voteReview(
  gameId: string,
  reviewId: string,
  type: 'helpful' | 'funny'
): Promise<{ success: boolean; helpfulCount: number; funnyCount: number }> {
  const res = await fetch(`${API_BASE}/games/${gameId}/reviews/${reviewId}/vote`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type }),
  });
  if (!res.ok) throw new Error('Failed to vote');
  return res.json();
}

/**
 * Fetch Discovery Queue items
 */
export async function fetchDiscoveryQueue(): Promise<GameTitle[]> {
  const res = await fetch(`${API_BASE}/games/discovery-queue`);
  if (!res.ok) throw new Error('Failed to fetch discovery queue');
  return res.json();
}

/**
 * Squad cart queries & mutations
 */
export async function createSquadRoom(username: string): Promise<SquadRoom> {
  const res = await fetch(`${API_BASE}/squad/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username }),
  });
  if (!res.ok) throw new Error('Failed to create squad room');
  return res.json();
}

export async function joinSquadRoom(code: string, username: string): Promise<SquadRoom> {
  const res = await fetch(`${API_BASE}/squad/join`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, username }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed to join squad room' }));
    throw new Error(err.error || 'Failed to join squad room');
  }
  return res.json();
}

export async function voteSquadGame(
  code: string,
  username: string,
  gameId: string,
  vote: 'yes' | 'no'
): Promise<SquadRoom> {
  const res = await fetch(`${API_BASE}/squad/vote`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, username, gameId, vote }),
  });
  if (!res.ok) throw new Error('Failed to vote in squad');
  return res.json();
}

export async function fetchSquadRoom(code: string): Promise<SquadRoom> {
  const res = await fetch(`${API_BASE}/squad/${code}`);
  if (!res.ok) throw new Error('Squad room not found');
  return res.json();
}
