import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ThumbsUp,
  ThumbsDown,
  Clock,
  Sparkles,
  Filter,
  CheckCircle,
  Helpful,
  Smile,
  ShieldCheck,
  PlusCircle,
  AlertCircle,
} from 'lucide-react';
import { PlayerReview, ReviewsResponse } from '../types/game';
import { fetchGameReviews, submitReview, voteReview } from '../lib/api';
import { Dialog } from './ui/Dialog';
import { cn } from '../lib/utils';

export interface ReviewFeedProps {
  gameId: string;
  patchNotesVersions?: string[];
  initialPatchFilter?: string;
}

export function ReviewFeed({
  gameId,
  patchNotesVersions = [],
  initialPatchFilter = 'all',
}: ReviewFeedProps) {
  const queryClient = useQueryClient();

  const [playtimeBracket, setPlaytimeBracket] = useState<string>('all');
  const [selectedPatch, setSelectedPatch] = useState<string>(initialPatchFilter);
  const [sentiment, setSentiment] = useState<string>('all');
  const [isWriteModalOpen, setIsWriteModalOpen] = useState(false);

  // Review Form State
  const [reviewRecommended, setReviewRecommended] = useState(true);
  const [reviewHours, setReviewHours] = useState('14.5');
  const [reviewContent, setReviewContent] = useState('');
  const [reviewUsername, setReviewUsername] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Query reviews
  const { data, isLoading } = useQuery<ReviewsResponse>({
    queryKey: ['reviews', gameId, playtimeBracket, selectedPatch, sentiment],
    queryFn: () =>
      fetchGameReviews(gameId, {
        playtimeBracket,
        patch: selectedPatch,
        sentiment,
      }),
  });

  // Mutation for submitting verified review
  const submitMutation = useMutation({
    mutationFn: (formData: any) => submitReview(gameId, formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews', gameId] });
      queryClient.invalidateQueries({ queryKey: ['game', gameId] });
      setIsWriteModalOpen(false);
      setReviewContent('');
      setFormError(null);
    },
    onError: (err: any) => {
      setFormError(err.message || 'Verification failed');
    },
  });

  // Mutation for voting
  const voteMutation = useMutation({
    mutationFn: ({ reviewId, type }: { reviewId: string; type: 'helpful' | 'funny' }) =>
      voteReview(gameId, reviewId, type),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews', gameId] });
    },
  });

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const hours = parseFloat(reviewHours);
    if (isNaN(hours) || hours < 0.2) {
      setFormError('Playtime Verification Failed: Minimum 0.2 hours (12 mins) of verified telemetry required.');
      return;
    }
    if (reviewContent.trim().length < 10) {
      setFormError('Review must contain at least 10 characters of detailed gameplay feedback.');
      return;
    }

    submitMutation.mutate({
      username: reviewUsername.trim() || 'VerifiedCommander',
      recommended: reviewRecommended,
      content: reviewContent,
      playtimeHours: hours,
    });
  };

  const reviews = data?.reviews || [];

  return (
    <div className="w-full bg-[#101622] rounded-2xl border border-white/10 p-6 space-y-6">
      {/* Feed Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold font-display text-white tracking-wide">
              PLAYTIME-VERIFIED PLAYER REVIEWS
            </h3>
            <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              Anti-Brigading Verified
            </span>
          </div>
          <p className="text-xs text-[#94A3B8] mt-1">
            Every review includes hardware telemetry and verified playtime at timestamp vs. current total on record.
          </p>
        </div>

        {/* Write Verified Review Button */}
        <button
          onClick={() => setIsWriteModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#192234] hover:bg-[#1E293B] text-white border border-white/10 text-xs font-mono font-bold transition-all shadow-md"
        >
          <PlusCircle className="w-4 h-4 text-[#06B6D4]" />
          <span>Write Verified Review</span>
        </button>
      </div>

      {/* Filter Controls Bar */}
      <div className="flex flex-wrap items-center gap-3 p-3 rounded-xl bg-[#080B11] border border-white/5">
        <span className="text-xs font-mono text-[#94A3B8] font-bold flex items-center gap-1.5 mr-1">
          <Filter className="w-3.5 h-3.5 text-[#06B6D4]" />
          PLAYTIME BRACKET:
        </span>

        {/* Playtime Brackets */}
        {[
          { id: 'all', label: 'All Playtimes' },
          { id: 'gt10', label: '> 10 Hours' },
          { id: 'gt50', label: '> 50 Hours' },
          { id: 'gt100', label: '> 100 Hours' },
        ].map((bracket) => (
          <button
            key={bracket.id}
            onClick={() => setPlaytimeBracket(bracket.id)}
            className={cn(
              'px-3 py-1 rounded-lg text-xs font-mono transition-all',
              playtimeBracket === bracket.id
                ? 'bg-[#06B6D4] text-black font-extrabold shadow-sm'
                : 'bg-[#192234] text-[#94A3B8] hover:text-white'
            )}
          >
            {bracket.label}
          </button>
        ))}

        {/* Sentiment Filter */}
        <div className="flex items-center gap-1.5 ml-auto">
          <button
            onClick={() => setSentiment('all')}
            className={cn(
              'px-2.5 py-1 rounded-lg text-xs font-mono transition-all',
              sentiment === 'all'
                ? 'bg-white/20 text-white font-bold'
                : 'text-[#94A3B8] hover:text-white'
            )}
          >
            All Sentiments
          </button>
          <button
            onClick={() => setSentiment('positive')}
            className={cn(
              'flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono transition-all',
              sentiment === 'positive'
                ? 'bg-[#38BDF8]/20 text-[#38BDF8] border border-[#38BDF8]/40 font-bold'
                : 'text-[#94A3B8] hover:text-[#38BDF8]'
            )}
          >
            <ThumbsUp className="w-3 h-3" />
            <span>Positive Only</span>
          </button>
          <button
            onClick={() => setSentiment('negative')}
            className={cn(
              'flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono transition-all',
              sentiment === 'negative'
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 font-bold'
                : 'text-[#94A3B8] hover:text-rose-400'
            )}
          >
            <ThumbsDown className="w-3 h-3" />
            <span>Negative Only</span>
          </button>
        </div>
      </div>

      {/* Review Feed List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-28 rounded-xl bg-[#192234] animate-pulse" />
            ))}
          </div>
        ) : reviews.length === 0 ? (
          <div className="p-12 text-center text-[#94A3B8] font-mono space-y-2">
            <p className="text-white font-display text-sm">No reviews matching the current filters.</p>
            <p className="text-xs">Try selecting a broader playtime bracket or resetting the patch filter.</p>
          </div>
        ) : (
          reviews.map((review) => {
            const hasKeptPlaying = review.playtimeTotalHours > review.playtimeAtReviewHours + 5;

            return (
              <div
                key={review.id}
                className="p-5 rounded-xl bg-[#192234]/70 border border-white/5 space-y-3 hover:border-white/15 transition-all"
              >
                {/* Review Header: User & Sentiment Badge */}
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={review.author.avatarUrl}
                      alt={review.author.username}
                      className="w-10 h-10 rounded-full border border-white/10 object-cover"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-display font-bold text-sm text-white">
                          {review.author.username}
                        </span>
                        <span className="text-[10px] font-mono text-[#94A3B8]">
                          ({review.author.gamesOwned} games in vault)
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span
                          className={cn(
                            'flex items-center gap-1 text-xs font-mono font-bold px-2 py-0.5 rounded',
                            review.recommended
                              ? 'bg-[#38BDF8]/15 text-[#38BDF8] border border-[#38BDF8]/30'
                              : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                          )}
                        >
                          {review.recommended ? (
                            <>
                              <ThumbsUp className="w-3 h-3" /> RECOMMENDED
                            </>
                          ) : (
                            <>
                              <ThumbsDown className="w-3 h-3" /> NOT RECOMMENDED
                            </>
                          )}
                        </span>
                        <span className="text-[11px] font-mono text-amber-400 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-500/20">
                          Patch {review.writtenDuringPatch}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Date */}
                  <span className="text-[11px] font-mono text-[#94A3B8]">
                    {new Date(review.createdAt).toLocaleDateString()}
                  </span>
                </div>

                {/* Authoritative Playtime Telemetry Stamp */}
                <div className="flex flex-wrap items-center gap-2 text-xs font-mono p-2.5 rounded-lg bg-[#101622] border border-white/5">
                  <Clock className="w-3.5 h-3.5 text-[#06B6D4]" />
                  <span className="text-[#94A3B8]">
                    Reviewed at{' '}
                    <strong className="text-white">{review.playtimeAtReviewHours.toFixed(1)} hrs</strong>
                  </span>
                  <span className="text-[#94A3B8]">//</span>
                  <span className="text-[#94A3B8]">
                    Currently{' '}
                    <strong className="text-[#38BDF8]">{review.playtimeTotalHours.toFixed(1)} hrs</strong> on record
                  </span>

                  {/* Did they keep playing? */}
                  {hasKeptPlaying && (
                    <span className="ml-auto text-[10px] font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                      ✓ Critic kept playing (+{(review.playtimeTotalHours - review.playtimeAtReviewHours).toFixed(1)}h logged)
                    </span>
                  )}
                </div>

                {/* Review Body */}
                <p className="text-sm text-slate-200 leading-relaxed font-sans">{review.content}</p>

                {/* Helpful / Funny Upvotes */}
                <div className="flex items-center gap-3 pt-2 text-xs font-mono text-[#94A3B8]">
                  <span>Was this review helpful?</span>
                  <button
                    onClick={() => voteMutation.mutate({ reviewId: review.id, type: 'helpful' })}
                    className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#101622] hover:bg-[#192234] text-white border border-white/5 transition-colors"
                  >
                    <ThumbsUp className="w-3 h-3 text-[#38BDF8]" />
                    <span>Yes ({review.helpfulCount})</span>
                  </button>

                  <button
                    onClick={() => voteMutation.mutate({ reviewId: review.id, type: 'funny' })}
                    className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#101622] hover:bg-[#192234] text-white border border-white/5 transition-colors"
                  >
                    <Smile className="w-3 h-3 text-amber-400" />
                    <span>Funny ({review.funnyCount})</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Write Verified Review Modal */}
      <Dialog
        isOpen={isWriteModalOpen}
        onClose={() => setIsWriteModalOpen(false)}
        title="SUBMIT PLAYTIME-VERIFIED REVIEW"
        description="To prevent review bombing, our anti-brigading telemetry validates user gameplay session hours."
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-500/50 text-rose-200 text-xs font-mono flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* Username */}
          <div>
            <label className="text-xs font-mono text-[#94A3B8] block mb-1">Commander Alias</label>
            <input
              type="text"
              value={reviewUsername}
              onChange={(e) => setReviewUsername(e.target.value)}
              placeholder="e.g. DeckCaptain_2099"
              className="w-full bg-[#101622] border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white font-mono focus:outline-none focus:border-[#06B6D4]"
            />
          </div>

          {/* Recommendation */}
          <div>
            <label className="text-xs font-mono text-[#94A3B8] block mb-1.5">Verdict</label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setReviewRecommended(true)}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-mono font-bold border transition-all',
                  reviewRecommended
                    ? 'bg-[#38BDF8]/20 text-[#38BDF8] border-[#38BDF8]/50 shadow-md'
                    : 'bg-[#101622] text-[#94A3B8] border-white/5'
                )}
              >
                <ThumbsUp className="w-4 h-4" />
                <span>Yes, Recommend</span>
              </button>

              <button
                type="button"
                onClick={() => setReviewRecommended(false)}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-mono font-bold border transition-all',
                  !reviewRecommended
                    ? 'bg-rose-500/20 text-rose-400 border-rose-500/50 shadow-md'
                    : 'bg-[#101622] text-[#94A3B8] border-white/5'
                )}
              >
                <ThumbsDown className="w-4 h-4" />
                <span>No, Do Not Recommend</span>
              </button>
            </div>
          </div>

          {/* Verified Session Playtime Input */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-mono text-[#94A3B8]">
                Verified Session Telemetry Hours
              </label>
              <span className="text-[10px] font-mono text-emerald-400">
                Minimum 0.2h (12 mins) required
              </span>
            </div>
            <input
              type="number"
              step="0.1"
              min="0.2"
              value={reviewHours}
              onChange={(e) => setReviewHours(e.target.value)}
              className="w-full bg-[#101622] border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white font-mono focus:outline-none focus:border-[#06B6D4]"
            />
          </div>

          {/* Content */}
          <div>
            <label className="text-xs font-mono text-[#94A3B8] block mb-1">Review Feedback</label>
            <textarea
              rows={4}
              value={reviewContent}
              onChange={(e) => setReviewContent(e.target.value)}
              placeholder="Describe combat loop, frame pacing, balance, or hardware performance..."
              className="w-full bg-[#101622] border border-white/10 rounded-xl p-3 text-sm text-white font-sans focus:outline-none focus:border-[#06B6D4]"
            />
          </div>

          {/* Submit Action */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsWriteModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-[#101622] text-[#94A3B8] hover:text-white text-xs font-mono"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitMutation.isPending}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#06B6D4] to-[#3B82F6] text-white text-xs font-mono font-bold shadow-lg shadow-cyan-500/20"
            >
              {submitMutation.isPending ? 'Verifying Telemetry...' : 'Submit Verified Review'}
            </button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
