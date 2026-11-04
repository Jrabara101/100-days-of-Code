import React, { useState } from 'react';
import { 
  MessageSquare, 
  Gavel, 
  ShieldCheck, 
  Pin, 
  ThumbsUp, 
  Send, 
  CheckCircle2, 
  Sparkles, 
  Bot, 
  Clock, 
  Flame, 
  Filter 
} from 'lucide-react';
import { TimelineEntry, BidRecord, AuthorRole } from '../types/auction';
import { formatCents, formatRelativeTime } from '../utils/formatters';
import { useAuction } from '../context/AuctionContext';

interface InterleavedTimelineProps {
  lotId: string;
  bids: BidRecord[];
  timelineEntries: TimelineEntry[];
  sellerName: string;
}

export const InterleavedTimeline: React.FC<InterleavedTimelineProps> = ({
  lotId,
  bids,
  timelineEntries,
  sellerName,
}) => {
  const { postQuestion, answerQuestion, upvoteTimelineEntry, currentUser } = useAuction();
  
  const [filterTab, setFilterTab] = useState<'all' | 'bids' | 'qa' | 'pinned'>('all');
  const [newQuestionText, setNewQuestionText] = useState('');
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [pinReplyToSpecs, setPinReplyToSpecs] = useState(true);

  // Merge bids and timeline entries chronologically
  type MergedItem = 
    | { type: 'bid'; data: BidRecord; timestamp: number }
    | { type: 'timeline'; data: TimelineEntry; timestamp: number };

  const mergedItems: MergedItem[] = [
    ...bids.map(b => ({
      type: 'bid' as const,
      data: b,
      timestamp: new Date(b.createdAt).getTime(),
    })),
    ...timelineEntries.map(t => ({
      type: 'timeline' as const,
      data: t,
      timestamp: new Date(t.createdAt).getTime(),
    })),
  ].sort((a, b) => b.timestamp - a.timestamp);

  // Apply filters
  const filteredItems = mergedItems.filter(item => {
    if (filterTab === 'all') return true;
    if (filterTab === 'bids') return item.type === 'bid';
    if (filterTab === 'qa') {
      return (
        item.type === 'timeline' &&
        (item.data.entryType === 'comment' || item.data.entryType === 'seller_answer')
      );
    }
    if (filterTab === 'pinned') {
      return item.type === 'timeline' && item.data.isPinned;
    }
    return true;
  });

  const handlePostQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestionText.trim()) return;
    postQuestion(lotId, newQuestionText.trim());
    setNewQuestionText('');
  };

  const handleSendReply = (parentId: string) => {
    if (!replyText.trim()) return;
    answerQuestion(lotId, parentId, replyText.trim(), pinReplyToSpecs);
    setReplyText('');
    setReplyingToId(null);
  };

  return (
    <div className="space-y-4">
      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E5E3DC] dark:border-[#252934] pb-3">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setFilterTab('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              filterTab === 'all'
                ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-semibold shadow-sm'
                : 'text-[#646870] dark:text-[#8E96A8] hover:bg-neutral-100 dark:hover:bg-neutral-800'
            }`}
          >
            All Activity ({mergedItems.length})
          </button>
          <button
            onClick={() => setFilterTab('bids')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1 ${
              filterTab === 'bids'
                ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-semibold shadow-sm'
                : 'text-[#646870] dark:text-[#8E96A8] hover:bg-neutral-100 dark:hover:bg-neutral-800'
            }`}
          >
            <Gavel className="w-3.5 h-3.5 text-emerald-500" />
            Bids Only ({bids.length})
          </button>
          <button
            onClick={() => setFilterTab('qa')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1 ${
              filterTab === 'qa'
                ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-semibold shadow-sm'
                : 'text-[#646870] dark:text-[#8E96A8] hover:bg-neutral-100 dark:hover:bg-neutral-800'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5 text-blue-500" />
            Seller Q&A ({timelineEntries.filter(e => e.entryType === 'comment' || e.entryType === 'seller_answer').length})
          </button>
          <button
            onClick={() => setFilterTab('pinned')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1 ${
              filterTab === 'pinned'
                ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-semibold shadow-sm'
                : 'text-[#646870] dark:text-[#8E96A8] hover:bg-neutral-100 dark:hover:bg-neutral-800'
            }`}
          >
            <Pin className="w-3.5 h-3.5 text-amber-500" />
            Pinned Disclosures ({timelineEntries.filter(e => e.isPinned).length})
          </button>
        </div>

        <span className="text-[11px] font-mono text-[#646870] dark:text-[#8E96A8]">
          ⚡ Real-time stream
        </span>
      </div>

      {/* Ask Question Box */}
      <form onSubmit={handlePostQuestion} className="p-3.5 rounded-xl bg-[#F3F2EE] dark:bg-[#12141A] border border-[#E5E3DC] dark:border-[#252934] space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-[#111315] dark:text-[#F8FAFC] flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5 text-emerald-500" />
            Ask the Consignor or Inspection Specialist
          </span>
          <span className="font-mono text-[10px] text-[#646870] dark:text-[#8E96A8]">
            Posting as {currentUser.paddle.paddleNumber}
          </span>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={newQuestionText}
            onChange={e => setNewQuestionText(e.target.value)}
            placeholder="Ask about service records, mechanical tolerances, paperwork authenticity..."
            className="flex-1 px-3 py-2 text-xs rounded-lg bg-[#FFFFFF] dark:bg-[#181B23] border border-[#E5E3DC] dark:border-[#252934] text-[#111315] dark:text-[#F8FAFC] focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
          <button
            type="submit"
            disabled={!newQuestionText.trim()}
            className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-500 disabled:opacity-50 transition-colors flex items-center gap-1 cursor-pointer"
          >
            <Send className="w-3 h-3" />
            <span>Post</span>
          </button>
        </div>
      </form>

      {/* Unified Timeline Stream */}
      <div className="space-y-3 max-h-[560px] overflow-y-auto pr-1">
        {filteredItems.map(item => {
          if (item.type === 'bid') {
            const b = item.data;
            const isUser = b.bidderId === currentUser.id;

            return (
              <div
                key={b.id}
                className={`p-3 rounded-xl border flex items-center justify-between transition-colors font-mono text-xs ${
                  isUser
                    ? 'bg-emerald-500/10 border-emerald-500/40 text-[#111315] dark:text-[#F8FAFC]'
                    : b.isProxyAutoBid
                    ? 'bg-indigo-500/5 border-indigo-500/20 text-[#111315] dark:text-[#F8FAFC]'
                    : 'bg-[#FFFFFF] dark:bg-[#181B23] border-[#E5E3DC] dark:border-[#252934] text-[#111315] dark:text-[#F8FAFC]'
                }`}
              >
                {/* Left: Bid amount & Paddle badge */}
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold shrink-0">
                    <Gavel className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-emerald-600 dark:text-emerald-400">
                        {formatCents(b.amountCents)}
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-neutral-200 dark:bg-neutral-800 text-[11px] font-bold">
                        {b.paddleNumber}
                      </span>
                      {isUser && (
                        <span className="px-1.5 py-0.2 rounded bg-emerald-500 text-black text-[9px] font-bold">
                          YOU
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-[#646870] dark:text-[#8E96A8]">
                      {b.bidderTitle || 'Verified Bidder'}
                    </span>
                  </div>
                </div>

                {/* Right: Soft close badge & relative time */}
                <div className="flex flex-col items-end gap-1">
                  <div className="flex items-center gap-1.5">
                    {b.isProxyAutoBid && (
                      <span className="px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 text-[10px] font-bold flex items-center gap-0.5">
                        <Bot className="w-3 h-3" />
                        Auto-Proxy
                      </span>
                    )}
                    {b.triggeredSoftCloseExtension && (
                      <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-500 text-[10px] font-bold flex items-center gap-0.5 animate-pulse">
                        <Flame className="w-3 h-3" />
                        +02:00 Soft-Close
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-[#646870] dark:text-[#8E96A8]">
                    {formatRelativeTime(b.createdAt)}
                  </span>
                </div>
              </div>
            );
          }

          // Timeline Entry (Q&A, Specialist Note, Milestone)
          const entry = item.data;
          const isSeller = entry.authorRole === 'seller';
          const isSpecialist = entry.authorRole === 'specialist';
          const isSystem = entry.authorRole === 'system';

          return (
            <div
              key={entry.id}
              className={`p-3.5 rounded-xl border text-xs space-y-2 transition-all ${
                entry.isPinned
                  ? 'bg-amber-500/5 border-amber-500/30'
                  : isSeller
                  ? 'bg-emerald-500/5 border-emerald-500/30 ml-4'
                  : isSpecialist
                  ? 'bg-purple-500/5 border-purple-500/30'
                  : 'bg-[#FFFFFF] dark:bg-[#181B23] border-[#E5E3DC] dark:border-[#252934]'
              }`}
            >
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-[#111315] dark:text-[#F8FAFC]">
                    {entry.authorName}
                  </span>

                  {entry.authorPaddleNumber && (
                    <span className="px-1.5 py-0.5 rounded bg-neutral-200 dark:bg-neutral-800 text-[10px] font-mono">
                      {entry.authorPaddleNumber}
                    </span>
                  )}

                  {isSeller && (
                    <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold flex items-center gap-0.5">
                      <CheckCircle2 className="w-3 h-3" />
                      Verified Consignor
                    </span>
                  )}

                  {isSpecialist && (
                    <span className="px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-600 dark:text-purple-400 text-[10px] font-bold flex items-center gap-0.5">
                      <ShieldCheck className="w-3 h-3" />
                      Inspection Specialist
                    </span>
                  )}

                  {entry.isPinned && (
                    <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-600 dark:text-amber-400 text-[10px] font-bold flex items-center gap-0.5">
                      <Pin className="w-3 h-3" />
                      Pinned to Lot Specs
                    </span>
                  )}
                </div>

                <span className="font-mono text-[10px] text-[#646870] dark:text-[#8E96A8]">
                  {formatRelativeTime(entry.createdAt)}
                </span>
              </div>

              {/* Body */}
              <p className="text-[#111315] dark:text-[#F8FAFC] leading-relaxed">
                {entry.body}
              </p>

              {/* Footer actions: Upvote & Seller Reply Trigger */}
              <div className="flex items-center justify-between pt-1 border-t border-neutral-100 dark:border-neutral-800 text-[11px]">
                <button
                  onClick={() => upvoteTimelineEntry(lotId, entry.id)}
                  className="flex items-center gap-1.5 text-[#646870] dark:text-[#8E96A8] hover:text-emerald-500 transition-colors cursor-pointer"
                >
                  <ThumbsUp className="w-3 h-3" />
                  <span>{entry.upvotesCount} Helpful</span>
                </button>

                {/* Reply button for simulation demo */}
                {entry.entryType === 'comment' && (
                  <button
                    onClick={() => setReplyingToId(replyingToId === entry.id ? null : entry.id)}
                    className="text-emerald-600 dark:text-emerald-400 font-medium hover:underline cursor-pointer"
                  >
                    {replyingToId === entry.id ? 'Cancel Reply' : 'Answer as Consignor'}
                  </button>
                )}
              </div>

              {/* Inline Seller Reply Box */}
              {replyingToId === entry.id && (
                <div className="pt-2 pl-3 border-l-2 border-emerald-500 space-y-2 mt-2">
                  <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                    Official Consignor Response:
                  </span>
                  <textarea
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    rows={2}
                    placeholder={`Answer this buyer query and disclose official records...`}
                    className="w-full p-2 text-xs rounded-lg bg-[#FAF9F5] dark:bg-[#12141A] border border-[#E5E3DC] dark:border-[#252934] text-[#111315] dark:text-[#F8FAFC] focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-1.5 text-[11px] text-[#646870] dark:text-[#8E96A8] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={pinReplyToSpecs}
                        onChange={e => setPinReplyToSpecs(e.target.checked)}
                        className="rounded border-neutral-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span>Pin this answer to official lot specification sheet</span>
                    </label>
                    <button
                      onClick={() => handleSendReply(entry.id)}
                      disabled={!replyText.trim()}
                      className="px-3 py-1 bg-emerald-600 text-white font-semibold rounded text-xs hover:bg-emerald-500 disabled:opacity-50 cursor-pointer"
                    >
                      Publish Verified Answer
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

