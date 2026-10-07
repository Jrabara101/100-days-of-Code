import React, { useRef, useState } from 'react';
import { useBlog } from '../../context/BlogContext';
import { TagBadge } from '../common/TagBadge';
import { TableOfContents } from './TableOfContents';
import { TextSelectionQuoteTooltip } from './TextSelectionQuoteTooltip';
import { FloatingReactionDock } from './FloatingReactionDock';
import { CommentSection } from '../comments/CommentSection';
import { useToast } from '../../context/ToastContext';
import { 
  Clock, 
  Eye, 
  Calendar, 
  Copy, 
  Check, 
  ArrowLeft, 
  Share2, 
  Bookmark, 
  Flame,
  ExternalLink
} from 'lucide-react';
import * as storage from '../../services/storageService';

export const ArticleView = ({ slug }) => {
  const { posts, tags, navigateToFeed, navigateToTagHub } = useBlog();
  const { showToast } = useToast();
  const contentContainerRef = useRef(null);
  const [copiedCodeIdx, setCopiedCodeIdx] = useState(null);

  const post = posts.find(p => p.slug === slug);

  if (!post) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-20 text-center">
        <h2 className="font-serif text-3xl font-bold text-[#18181B] dark:text-[#F4F4F6] mb-3">
          Story Not Found
        </h2>
        <p className="text-sm text-[#71717A] dark:text-[#9496A1] mb-6">
          The requested essay could not be located in our publication archives.
        </p>
        <button
          onClick={() => navigateToFeed()}
          className="px-4 py-2 rounded-xl text-xs font-medium bg-[#18181B] text-white dark:bg-[#F4F4F6] dark:text-[#18181B] cursor-pointer"
        >
          Return to Feed
        </button>
      </div>
    );
  }

  const postTags = tags.filter(t => (post.tagIds || []).includes(t.id));
  const postComments = storage.getComments(post.id);

  const formattedDate = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      })
    : 'Draft';

  const handleCopyCode = (code, idx) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeIdx(idx);
    showToast('Code snippet copied to clipboard', 'info');
    setTimeout(() => setCopiedCodeIdx(null), 2000);
  };

  // Render markdown content with typographic polish
  const renderMarkdown = (rawContent) => {
    const blocks = rawContent.split(/\n\n+/);
    let codeBlockCounter = 0;

    return blocks.map((block, idx) => {
      const trimmed = block.trim();

      // Heading 2
      if (trimmed.startsWith('## ')) {
        const title = trimmed.replace(/^##\s+/, '');
        const id = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
        return (
          <h2
            key={idx}
            id={id}
            className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-[#18181B] dark:text-[#F4F4F6] mt-10 mb-4 pt-4 border-t border-[#E5E5DF]/50 dark:border-[#26272C]/50 scroll-mt-24"
          >
            {title}
          </h2>
        );
      }

      // Heading 3
      if (trimmed.startsWith('### ')) {
        const title = trimmed.replace(/^###\s+/, '');
        const id = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
        return (
          <h3
            key={idx}
            id={id}
            className="font-serif text-xl sm:text-2xl font-bold text-[#18181B] dark:text-[#F4F4F6] mt-8 mb-3 scroll-mt-24"
          >
            {title}
          </h3>
        );
      }

      // Blockquote
      if (trimmed.startsWith('>')) {
        const quoteText = trimmed.split('\n').map(l => l.replace(/^>\s*/, '')).join('\n');
        return (
          <blockquote
            key={idx}
            className="my-6 pl-5 py-1.5 border-l-3 border-[#E11D48] italic font-serif text-lg sm:text-xl text-[#18181B] dark:text-[#F4F4F6] leading-relaxed bg-[#F3F3EE]/30 dark:bg-[#141518]/30 rounded-r-xl"
          >
            "{quoteText}"
          </blockquote>
        );
      }

      // Code Fence (```lang ... ```)
      if (trimmed.startsWith('```')) {
        const lines = trimmed.split('\n');
        const lang = lines[0].replace(/^```/, '').trim() || 'code';
        const code = lines.slice(1, -1).join('\n');
        const currentIdx = codeBlockCounter++;

        return (
          <div key={idx} className="my-6 rounded-xl overflow-hidden border border-[#E5E5DF] dark:border-[#26272C] bg-[#141518] text-[#F4F4F6] shadow-sm">
            <div className="flex items-center justify-between px-4 py-2 bg-[#0C0D0E] border-b border-[#26272C] text-[11px] font-mono text-[#9496A1]">
              <span className="uppercase tracking-wider">{lang}</span>
              <button
                onClick={() => handleCopyCode(code, currentIdx)}
                className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer"
              >
                {copiedCodeIdx === currentIdx ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-green-400" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
            <pre className="p-4 font-mono text-xs sm:text-sm overflow-x-auto leading-relaxed text-[#F4F4F6]">
              <code>{code}</code>
            </pre>
          </div>
        );
      }

      // Horizontal Divider
      if (trimmed === '---') {
        return (
          <hr
            key={idx}
            className="my-10 border-t border-[#E5E5DF] dark:border-[#26272C]"
          />
        );
      }

      // Unordered List
      if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
        const items = trimmed.split('\n').filter(Boolean);
        return (
          <ul key={idx} className="my-4 space-y-2 list-disc list-inside text-sm sm:text-base leading-relaxed text-[#18181B] dark:text-[#F4F4F6]">
            {items.map((item, i) => (
              <li key={i} className="pl-1">
                {item.replace(/^[\*\-]\s+/, '')}
              </li>
            ))}
          </ul>
        );
      }

      // Standard Paragraph
      return (
        <p
          key={idx}
          className="font-serif text-base sm:text-[19px] leading-[1.8] text-[#18181B] dark:text-[#F4F4F6] mb-5 tracking-[-0.01em]"
        >
          {trimmed}
        </p>
      );
    });
  };

  return (
    <article className="min-h-screen py-10 relative">
      
      {/* Article Stage */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        
        {/* Navigation Breadcrumb */}
        <button
          onClick={() => navigateToFeed()}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[#71717A] dark:text-[#9496A1] hover:text-[#18181B] dark:hover:text-[#F4F4F6] mb-6 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Stories</span>
        </button>

        {/* Tag Row */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          {postTags.map(tag => (
            <TagBadge key={tag.id} tag={tag} size="sm" />
          ))}
        </div>

        {/* Main Headline */}
        <h1 className="font-serif text-3xl sm:text-5xl font-bold tracking-tight text-[#18181B] dark:text-[#F4F4F6] leading-[1.18] mb-6">
          {post.title}
        </h1>

        {/* Subtitle / Excerpt */}
        {post.excerpt && (
          <p className="font-serif text-lg sm:text-xl text-[#71717A] dark:text-[#9496A1] leading-relaxed mb-8 italic">
            {post.excerpt}
          </p>
        )}

        {/* Author & Publication Meta Card */}
        <div className="flex items-center justify-between py-4 border-y border-[#E5E5DF] dark:border-[#26272C] mb-8">
          <div className="flex items-center gap-3">
            <img
              src={post.author?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=128&q=80'}
              alt={post.author?.name}
              className="w-10 h-10 rounded-full object-cover border border-[#E5E5DF] dark:border-[#26272C]"
            />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-sans font-semibold text-sm text-[#18181B] dark:text-[#F4F4F6]">
                  {post.author?.name}
                </span>
                <span className="text-[10px] font-mono font-medium px-1.5 py-0.2 bg-[#F3F3EE] dark:bg-[#1B1C21] rounded text-[#71717A] dark:text-[#9496A1]">
                  Author
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-[#71717A] dark:text-[#9496A1] font-mono">
                <time dateTime={post.publishedAt}>{formattedDate}</time>
                <span>·</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {post.readingTime} min read
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono text-[#71717A] dark:text-[#9496A1]">
            <span className="flex items-center gap-1" title="Views">
              <Eye className="w-3.5 h-3.5" />
              {post.viewsCount || 0}
            </span>
          </div>
        </div>

        {/* Hero Cover Image (if present) */}
        {post.coverImage && (
          <div className="w-full h-72 sm:h-96 rounded-2xl overflow-hidden mb-10 bg-[#F3F3EE] dark:bg-[#141518] shadow-xs">
            <img
              src={post.coverImage}
              alt={post.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Interactive Dynamic Table of Contents */}
        <TableOfContents content={post.content} />

        {/* Body Content with Text Selection Quote Tooltip */}
        <div 
          ref={contentContainerRef}
          className="editorial-prose relative select-text"
        >
          {renderMarkdown(post.content)}
        </div>

        {/* Floating Contextual Quote Tooltip */}
        <TextSelectionQuoteTooltip 
          containerRef={contentContainerRef} 
          articleTitle={post.title}
          authorName={post.author?.name || 'Author'}
        />

        {/* Canonical attribution tag if configured */}
        {post.canonicalUrl && (
          <div className="mt-8 p-3 rounded-xl bg-[#F3F3EE]/50 dark:bg-[#141518]/50 border border-[#E5E5DF] dark:border-[#26272C] text-xs font-mono text-[#71717A] dark:text-[#9496A1] flex items-center justify-between">
            <span>Canonical Attribution:</span>
            <a 
              href={post.canonicalUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-[#4F46E5] hover:underline flex items-center gap-1"
            >
              {post.canonicalUrl} <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}

        {/* Floating Reaction Dock */}
        <FloatingReactionDock post={post} commentCount={postComments.length} />

        {/* Threaded Discussion Section */}
        <CommentSection postId={post.id} postAuthorId={post.authorId} />

      </div>
    </article>
  );
};
