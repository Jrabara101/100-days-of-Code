import React, { useState } from 'react';
import { 
  X, 
  Globe, 
  Calendar, 
  Link2, 
  Sparkles, 
  Eye, 
  Trash2, 
  Check, 
  Share2 
} from 'lucide-react';
import { generateAutoExcerpt } from '../../services/storageService';

export const PublishSettingsModal = ({ 
  isOpen, 
  onClose, 
  formData, 
  setFormData, 
  onDelete 
}) => {
  if (!isOpen) return null;

  const handleSlugChange = (val) => {
    const sanitized = val.toLowerCase().replace(/[^a-z0-9\-]+/g, '-').replace(/(^-|-$)+/g, '');
    setFormData(prev => ({ ...prev, slug: sanitized }));
  };

  const handleAutoExcerpt = () => {
    const auto = generateAutoExcerpt(formData.content);
    setFormData(prev => ({ ...prev, excerpt: auto }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="w-full max-w-2xl bg-white dark:bg-[#1B1C21] rounded-3xl shadow-2xl border border-[#E5E5DF] dark:border-[#26272C] overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-[#E5E5DF] dark:border-[#26272C] flex items-center justify-between">
          <div>
            <h3 className="font-serif font-bold text-lg text-[#18181B] dark:text-[#F4F4F6]">
              Publishing Controls &amp; Metadata
            </h3>
            <p className="text-xs text-[#71717A] dark:text-[#9496A1]">
              Configure taxonomy slugs, publication lifecycle, and social OpenGraph tags.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#71717A] hover:text-[#18181B] dark:hover:text-[#F4F4F6] rounded-md cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Lifecycle Status & Scheduling */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold font-mono uppercase tracking-wider text-[#18181B] dark:text-[#F4F4F6] mb-1.5">
                Publication Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                className="w-full p-2.5 rounded-xl border border-[#E5E5DF] dark:border-[#26272C] bg-[#FAFAF8] dark:bg-[#141518] text-xs font-mono text-[#18181B] dark:text-[#F4F4F6] outline-hidden focus:ring-1 focus:ring-[#18181B]"
              >
                <option value="published">Published (Public Stream)</option>
                <option value="draft">Draft (Private Canvas)</option>
                <option value="scheduled">Scheduled (Timed Release)</option>
                <option value="unlisted">Unlisted (Direct Link Only)</option>
                <option value="archived">Archived (Read-Only)</option>
              </select>
            </div>

            {formData.status === 'scheduled' && (
              <div>
                <label className="block text-xs font-semibold font-mono uppercase tracking-wider text-[#18181B] dark:text-[#F4F4F6] mb-1.5">
                  Scheduled Release Date
                </label>
                <input
                  type="datetime-local"
                  value={formData.publishedAt ? new Date(formData.publishedAt).toISOString().slice(0, 16) : ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, publishedAt: new Date(e.target.value).toISOString() }))}
                  className="w-full p-2.5 rounded-xl border border-[#E5E5DF] dark:border-[#26272C] bg-[#FAFAF8] dark:bg-[#141518] text-xs font-mono text-[#18181B] dark:text-[#F4F4F6] outline-hidden"
                />
              </div>
            )}
          </div>

          {/* URL Slug */}
          <div>
            <label className="block text-xs font-semibold font-mono uppercase tracking-wider text-[#18181B] dark:text-[#F4F4F6] mb-1.5">
              Custom Story Slug
            </label>
            <div className="flex items-center rounded-xl border border-[#E5E5DF] dark:border-[#26272C] bg-[#FAFAF8] dark:bg-[#141518] px-3">
              <span className="text-xs font-mono text-[#71717A] dark:text-[#9496A1]">/story/</span>
              <input
                type="text"
                value={formData.slug}
                onChange={(e) => handleSlugChange(e.target.value)}
                placeholder="the-typographic-sanctuary"
                className="w-full py-2.5 px-1 bg-transparent text-xs font-mono text-[#18181B] dark:text-[#F4F4F6] outline-hidden"
              />
            </div>
          </div>

          {/* Canonical URL Attribution */}
          <div>
            <label className="block text-xs font-semibold font-mono uppercase tracking-wider text-[#18181B] dark:text-[#F4F4F6] mb-1.5">
              Canonical URL (Cross-Posting Attribution)
            </label>
            <div className="flex items-center rounded-xl border border-[#E5E5DF] dark:border-[#26272C] bg-[#FAFAF8] dark:bg-[#141518] px-3">
              <Link2 className="w-4 h-4 text-[#71717A] mr-2 shrink-0" />
              <input
                type="url"
                value={formData.canonicalUrl}
                onChange={(e) => setFormData(prev => ({ ...prev, canonicalUrl: e.target.value }))}
                placeholder="https://original-publication.org/article-permalink"
                className="w-full py-2.5 bg-transparent text-xs font-mono text-[#18181B] dark:text-[#F4F4F6] outline-hidden"
              />
            </div>
            <p className="mt-1 text-[11px] text-[#71717A] dark:text-[#9496A1]">
              Protects SEO ranking when syndicating content previously published on Substack, Medium, or your personal domain.
            </p>
          </div>

          {/* Excerpt Optimization */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold font-mono uppercase tracking-wider text-[#18181B] dark:text-[#F4F4F6]">
                Excerpt &amp; Meta Description
              </label>
              <button
                type="button"
                onClick={handleAutoExcerpt}
                className="text-xs font-mono text-[#4F46E5] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Sparkles className="w-3 h-3" />
                <span>Auto-generate from text</span>
              </button>
            </div>
            <textarea
              rows={3}
              value={formData.excerpt}
              onChange={(e) => setFormData(prev => ({ ...prev, excerpt: e.target.value }))}
              placeholder="A concise synopsis of the essay for discovery cards and search snippets..."
              className="w-full p-3 rounded-xl border border-[#E5E5DF] dark:border-[#26272C] bg-[#FAFAF8] dark:bg-[#141518] text-xs text-[#18181B] dark:text-[#F4F4F6] outline-hidden focus:ring-1 focus:ring-[#18181B]"
            />
          </div>

          {/* Previews: SERP & OpenGraph */}
          <div className="pt-2 border-t border-[#E5E5DF]/70 dark:border-[#26272C]/70">
            <h5 className="font-mono uppercase tracking-wider text-[11px] text-[#18181B] dark:text-[#F4F4F6] font-semibold mb-3">
              Search &amp; Social Card Previews
            </h5>

            {/* Google SERP Snippet Preview */}
            <div className="p-4 rounded-xl border border-[#E5E5DF] dark:border-[#26272C] bg-[#FAFAF8] dark:bg-[#141518] mb-3">
              <div className="text-[11px] text-[#202124] dark:text-[#BDC1C6] font-sans flex items-center gap-1 mb-0.5">
                <span>chronicle-codex.org</span>
                <span>› story ›</span>
                <span>{formData.slug || 'untitled'}</span>
              </div>
              <h6 className="text-sm font-medium text-[#1A0DAB] dark:text-[#8AB4F8] hover:underline truncate">
                {formData.title || 'Untitled Story'} — Chronicle &amp; Codex
              </h6>
              <p className="text-xs text-[#4D5156] dark:text-[#9AA0A6] line-clamp-2 mt-0.5 leading-relaxed">
                {formData.excerpt || 'Read the full essay on Chronicle & Codex publishing platform.'}
              </p>
            </div>

            {/* OpenGraph Card Preview */}
            <div className="p-4 rounded-xl border border-[#E5E5DF] dark:border-[#26272C] bg-white dark:bg-[#0C0D0E]">
              {formData.coverImage && (
                <div className="w-full h-32 rounded-lg overflow-hidden mb-2.5 bg-[#F3F3EE]">
                  <img
                    src={formData.coverImage}
                    alt={formData.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <span className="text-[10px] font-mono uppercase text-[#71717A] dark:text-[#9496A1]">
                CHRONICLE-CODEX.ORG
              </span>
              <h6 className="font-serif font-bold text-sm text-[#18181B] dark:text-[#F4F4F6] truncate">
                {formData.title || 'Untitled Story'}
              </h6>
              <p className="text-xs text-[#71717A] dark:text-[#9496A1] line-clamp-2 mt-1">
                {formData.excerpt || 'An intentional editorial publishing hub.'}
              </p>
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-[#E5E5DF] dark:border-[#26272C] flex items-center justify-between bg-white dark:bg-[#1B1C21]">
          {formData.id && onDelete ? (
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Are you sure you want to delete this story? This cannot be undone.')) {
                  onDelete(formData.id);
                  onClose();
                }
              }}
              className="inline-flex items-center gap-1.5 text-xs text-[#E11D48] hover:text-red-700 cursor-pointer font-medium"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Story</span>
            </button>
          ) : <div />}

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-medium bg-[#18181B] text-white dark:bg-[#F4F4F6] dark:text-[#18181B] hover:opacity-90 cursor-pointer"
          >
            Apply &amp; Return to Studio
          </button>
        </div>
      </div>
    </div>
  );
};
