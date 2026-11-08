import React, { useState } from 'react';
import { useDiscussion } from '../../context/DiscussionContext';
import { X, CornerUpLeft, MessageSquare, Maximize2, ShieldCheck } from 'lucide-react';
import NuanceReactions from './NuanceReactions';
import { stanceDefinitions } from '../../data/initialComments';

export default function FocusThreadDrawer() {
  const { 
    focusThreadId, 
    setFocusThreadId, 
    commentIndex, 
    addComment,
    jumpToParagraph
  } = useDiscussion();

  const [drawerDraft, setDrawerDraft] = useState('');
  const [showFullBreadcrumbs, setShowFullBreadcrumbs] = useState(false);

  if (!focusThreadId || !commentIndex[focusThreadId]) {
    return null;
  }

  const focusComment = commentIndex[focusThreadId];

  // Build breadcrumb ancestral path
  const breadcrumbs = [];
  let curr = focusComment.parentId ? commentIndex[focusComment.parentId] : null;
  while (curr) {
    breadcrumbs.unshift(curr);
    curr = curr.parentId ? commentIndex[curr.parentId] : null;
  }

  const handlePostReply = (e) => {
    e.preventDefault();
    if (!drawerDraft.trim()) return;

    addComment({
      parentId: focusComment.id,
      paragraphId: focusComment.paragraphId,
      body: drawerDraft.trim(),
      stance: 'building'
    });

    setDrawerDraft('');
  };

  const stanceInfo = focusComment.stance ? stanceDefinitions[focusComment.stance] : null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end animate-fade-in">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={() => setFocusThreadId(null)}
      />

      {/* Slide-over panel maintaining golden 55ch reading width */}
      <div className="relative w-full max-w-2xl bg-salon-card h-full shadow-2xl flex flex-col border-l border-salon-border z-10 animate-slide-up">
        {/* Drawer Header */}
        <div className="px-6 py-4 border-b border-salon-border flex items-center justify-between bg-salon-nested/40">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <Maximize2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-salon-ink-primary">
                Focus Thread Branch
              </h3>
              <p className="text-xs text-salon-ink-secondary">
                Reading depth {focusComment.depth} with zero column squeeze (min 55ch width)
              </p>
            </div>
          </div>

          <button
            onClick={() => setFocusThreadId(null)}
            className="p-2 rounded-lg text-salon-ink-muted hover:text-salon-ink-primary hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Thread Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {/* Ancestral Breadcrumbs */}
          {breadcrumbs.length > 0 && (
            <div className="p-3.5 rounded-xl bg-salon-nested border border-salon-border text-xs">
              <div className="flex items-center justify-between text-salon-ink-muted mb-2 font-medium">
                <span className="flex items-center gap-1.5">
                  <CornerUpLeft className="w-3.5 h-3.5" />
                  <span>Branch Origin ({breadcrumbs.length} parent nodes)</span>
                </span>
                <button
                  onClick={() => setShowFullBreadcrumbs(!showFullBreadcrumbs)}
                  className="text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  {showFullBreadcrumbs ? 'Collapse History' : 'View Full Ancestry'}
                </button>
              </div>

              {/* Immediate Parent Teaser */}
              {!showFullBreadcrumbs ? (
                <div className="line-clamp-2 italic text-salon-ink-secondary">
                  "{breadcrumbs[breadcrumbs.length - 1].body}"
                  <span className="font-semibold text-salon-ink-primary ml-1.5 not-italic">
                    — {breadcrumbs[breadcrumbs.length - 1].author.name}
                  </span>
                </div>
              ) : (
                <div className="space-y-2.5 pt-1">
                  {breadcrumbs.map((bNode, idx) => (
                    <div key={bNode.id} className="pl-2 border-l-2 border-indigo-400/60 text-xs">
                      <span className="font-semibold text-salon-ink-primary">
                        {bNode.author.name}:
                      </span>
                      <p className="text-salon-ink-secondary line-clamp-2 mt-0.5">
                        {bNode.body}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Root Focus Comment */}
          <div className="p-5 rounded-2xl bg-salon-card border-2 border-indigo-500/20 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={focusComment.author.avatar}
                  alt={focusComment.author.name}
                  className="w-10 h-10 rounded-full object-cover ring-2 ring-indigo-500/30"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-salon-ink-primary">
                      {focusComment.author.name}
                    </span>
                    {focusComment.author.isAuthor && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded font-bold uppercase tracking-wider bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300">
                        Author
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-salon-ink-muted">
                    {focusComment.author.role}
                  </span>
                </div>
              </div>

              {stanceInfo && (
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium border ${stanceInfo.badgeClass}`}>
                  {stanceInfo.icon} {stanceInfo.label}
                </span>
              )}
            </div>

            {/* Anchored Quote if present */}
            {focusComment.quotedText && (
              <div 
                onClick={() => focusComment.paragraphId && jumpToParagraph(focusComment.paragraphId)}
                className="p-3 rounded-xl bg-salon-nested border-l-4 border-amber-500 text-xs font-serif italic text-salon-ink-secondary cursor-pointer hover:bg-amber-500/[0.04] transition-colors"
              >
                "{focusComment.quotedText}"
              </div>
            )}

            {/* Comment Body */}
            <div className="text-sm leading-relaxed text-salon-ink-primary whitespace-pre-wrap">
              {focusComment.body}
            </div>

            {/* Reactions */}
            <NuanceReactions comment={focusComment} />
          </div>

          {/* Sub-replies inside this focus branch */}
          <div className="space-y-4 pl-4 border-l-2 border-salon-border">
            <h4 className="text-xs font-bold uppercase tracking-wider text-salon-ink-muted">
              Thread Replies ({focusComment.children?.length || 0})
            </h4>

            {(!focusComment.children || focusComment.children.length === 0) ? (
              <p className="text-xs text-salon-ink-muted italic py-2">
                No replies in this deep branch yet. Be the first to continue the line of thought below.
              </p>
            ) : (
              focusComment.children.map(child => (
                <div key={child.id} className="p-4 rounded-xl bg-salon-nested/60 border border-salon-border space-y-2">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={child.author.avatar}
                      alt={child.author.name}
                      className="w-7 h-7 rounded-full object-cover"
                    />
                    <div>
                      <span className="text-xs font-semibold text-salon-ink-primary block">
                        {child.author.name}
                      </span>
                      <span className="text-[11px] text-salon-ink-muted">
                        {child.author.role}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs leading-relaxed text-salon-ink-primary pl-9">
                    {child.body}
                  </p>
                  <div className="pl-9">
                    <NuanceReactions comment={child} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Drawer Footer Reply Composer */}
        <form onSubmit={handlePostReply} className="p-4 border-t border-salon-border bg-salon-nested/40">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder={`Reply directly to ${focusComment.author.name}...`}
              value={drawerDraft}
              onChange={(e) => setDrawerDraft(e.target.value)}
              className="flex-1 text-xs px-3.5 py-2.5 rounded-xl border border-salon-border bg-salon-card text-salon-ink-primary focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="submit"
              disabled={!drawerDraft.trim()}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-semibold text-xs transition-all shadow-sm"
            >
              Post
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

