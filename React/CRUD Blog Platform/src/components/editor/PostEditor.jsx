import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useBlog } from '../../context/BlogContext';
import { TagSelector } from './TagSelector';
import { SlashMenu } from './SlashMenu';
import { RevisionHistoryModal } from './RevisionHistoryModal';
import { PublishSettingsModal } from './PublishSettingsModal';
import { calculateReadingTime, generateAutoExcerpt } from '../../services/storageService';
import { 
  History, 
  Settings, 
  Eye, 
  Columns, 
  PenTool, 
  Image, 
  Check, 
  Cloud, 
  CloudUpload, 
  ArrowLeft, 
  Sparkles,
  Link,
  HelpCircle
} from 'lucide-react';

const PRESET_COVERS = [
  'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&w=1600&q=80',
  'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1600&q=80',
  'https://images.unsplash.com/photo-1516259762381-22954d7d3ad2?auto=format&fit=crop&w=1600&q=80',
  'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=1600&q=80',
  'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=1600&q=80'
];

export const PostEditor = ({ postId = null }) => {
  const { 
    posts, 
    savePost, 
    deletePost, 
    navigateToArticle, 
    navigateToFeed, 
    restoreRevision 
  } = useBlog();

  // Load existing post if editing, else initial draft
  const existingPost = postId ? posts.find(p => p.id === postId) : null;

  const [formData, setFormData] = useState(() => {
    if (existingPost) {
      return {
        id: existingPost.id,
        title: existingPost.title,
        slug: existingPost.slug,
        excerpt: existingPost.excerpt,
        content: existingPost.content,
        coverImage: existingPost.coverImage || '',
        status: existingPost.status || 'draft',
        tagIds: existingPost.tagIds || [],
        canonicalUrl: existingPost.canonicalUrl || '',
        publishedAt: existingPost.publishedAt || null,
        revisions: existingPost.revisions || []
      };
    }
    return {
      id: null,
      title: '',
      slug: '',
      excerpt: '',
      content: '',
      coverImage: '',
      status: 'draft',
      tagIds: ['tag-react'],
      canonicalUrl: '',
      publishedAt: null,
      revisions: []
    };
  });

  // Editor View Modes: 'write' | 'split' | 'read'
  const [editorMode, setEditorMode] = useState('write');

  // Autosave Heartbeat Status: 'saved' | 'saving' | 'idle'
  const [autosaveStatus, setAutosaveStatus] = useState('saved');
  const [lastSavedTime, setLastSavedTime] = useState('Just now');
  const autosaveTimeoutRef = useRef(null);

  // Slash Menu Popover State
  const [slashMenuOpen, setSlashMenuOpen] = useState(false);
  const [slashFilter, setSlashFilter] = useState('');
  const [slashPosition, setSlashPosition] = useState({ top: 0, left: 0 });

  // Modals
  const [isRevisionModalOpen, setIsRevisionModalOpen] = useState(false);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [showCoverPicker, setShowCoverPicker] = useState(false);

  const textareaRef = useRef(null);
  const titleTextareaRef = useRef(null);

  // Metrics
  const wordCount = formData.content.trim().split(/\s+/).filter(Boolean).length;
  const charCount = formData.content.length;
  const estimatedReadTime = calculateReadingTime(formData.content);

  // Debounced Autosave Heartbeat (600ms)
  useEffect(() => {
    if (!formData.title && !formData.content) return;

    setAutosaveStatus('saving');
    clearTimeout(autosaveTimeoutRef.current);

    autosaveTimeoutRef.current = setTimeout(() => {
      // Perform local snapshot save
      try {
        localStorage.setItem('cc_editorial_editor_draft_v1', JSON.stringify(formData));
        setAutosaveStatus('saved');
        setLastSavedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      } catch (e) {
        console.error('Autosave error:', e);
      }
    }, 600);

    return () => clearTimeout(autosaveTimeoutRef.current);
  }, [formData]);

  // Handle Slash Command Detection in Content Textarea
  const handleContentChange = (e) => {
    const val = e.target.value;
    const cursorPos = e.target.selectionStart;
    setFormData(prev => ({ ...prev, content: val }));

    // Check if the character before cursor is '/'
    const textBeforeCursor = val.slice(0, cursorPos);
    const lastSlashIndex = textBeforeCursor.lastIndexOf('/');

    if (lastSlashIndex !== -1 && (lastSlashIndex === 0 || textBeforeCursor[lastSlashIndex - 1] === '\n' || textBeforeCursor[lastSlashIndex - 1] === ' ')) {
      const query = textBeforeCursor.slice(lastSlashIndex + 1);
      if (!query.includes(' ') && !query.includes('\n')) {
        setSlashFilter(query);
        setSlashMenuOpen(true);
        return;
      }
    }
    setSlashMenuOpen(false);
  };

  const handleInsertSlashSnippet = (snippet) => {
    const el = textareaRef.current;
    if (!el) return;

    const cursorPos = el.selectionStart;
    const val = formData.content;
    const textBeforeCursor = val.slice(0, cursorPos);
    const lastSlashIndex = textBeforeCursor.lastIndexOf('/');

    const before = val.slice(0, lastSlashIndex);
    const after = val.slice(cursorPos);
    const newContent = `${before}${snippet}${after}`;

    setFormData(prev => ({ ...prev, content: newContent }));
    setSlashMenuOpen(false);

    setTimeout(() => {
      el.focus();
      const newPos = before.length + snippet.length;
      el.setSelectionRange(newPos, newPos);
    }, 0);
  };

  const handlePublishOrUpdate = (overrideStatus = null) => {
    if (!formData.title.trim()) {
      alert('Please provide a story title before publishing.');
      titleTextareaRef.current?.focus();
      return;
    }

    const statusToSave = overrideStatus || (formData.status === 'draft' ? 'published' : formData.status);
    const saved = savePost({
      ...formData,
      status: statusToSave,
      publishedAt: statusToSave === 'published' && !formData.publishedAt ? new Date().toISOString() : formData.publishedAt
    });

    if (statusToSave === 'published') {
      navigateToArticle(saved.slug);
    } else {
      setFormData(prev => ({ ...prev, id: saved.id, status: statusToSave }));
    }
  };

  const handleRestoreSnapshot = (snapshot) => {
    setFormData(prev => ({
      ...prev,
      title: snapshot.title,
      excerpt: snapshot.excerpt,
      content: snapshot.content
    }));
  };

  return (
    <div className="min-h-screen bg-[#FAFAF8] dark:bg-[#0C0D0E] text-[#18181B] dark:text-[#F4F4F6] pb-24 transition-colors">
      
      {/* Studio Header Bar */}
      <header className="sticky top-0 z-40 bg-[#FAFAF8]/95 dark:bg-[#0C0D0E]/95 backdrop-blur-md border-b border-[#E5E5DF] dark:border-[#26272C] px-4 sm:px-8 h-16 flex items-center justify-between gap-4">
        
        {/* Left: Back & Cloud Heartbeat */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigateToFeed()}
            className="p-1.5 rounded-lg text-[#71717A] hover:text-[#18181B] dark:hover:text-[#F4F4F6] hover:bg-[#F3F3EE] dark:hover:bg-[#141518] cursor-pointer"
            title="Exit Studio"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          {/* Cloud Heartbeat Pill */}
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#F3F3EE] dark:bg-[#141518] border border-[#E5E5DF] dark:border-[#26272C] text-[11px] font-mono text-[#71717A] dark:text-[#9496A1]">
            <span
              className={`w-2 h-2 rounded-full transition-all ${
                autosaveStatus === 'saving'
                  ? 'bg-amber-500 animate-pulse'
                  : 'bg-[#0D9488] shadow-xs'
              }`}
            />
            <span className="hidden sm:inline">
              {autosaveStatus === 'saving' ? 'Syncing...' : `Saved to cloud (${lastSavedTime})`}
            </span>
          </div>
        </div>

        {/* Center: Mode Switch Pills */}
        <div className="flex items-center p-1 rounded-xl bg-[#F3F3EE] dark:bg-[#141518] border border-[#E5E5DF] dark:border-[#26272C] text-xs font-medium">
          <button
            onClick={() => setEditorMode('write')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-colors cursor-pointer ${
              editorMode === 'write'
                ? 'bg-white dark:bg-[#1B1C21] text-[#18181B] dark:text-[#F4F4F6] shadow-xs font-semibold'
                : 'text-[#71717A] dark:text-[#9496A1] hover:text-[#18181B] dark:hover:text-[#F4F4F6]'
            }`}
          >
            <PenTool className="w-3.5 h-3.5" />
            <span>Write</span>
          </button>
          <button
            onClick={() => setEditorMode('split')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-colors cursor-pointer ${
              editorMode === 'split'
                ? 'bg-white dark:bg-[#1B1C21] text-[#18181B] dark:text-[#F4F4F6] shadow-xs font-semibold'
                : 'text-[#71717A] dark:text-[#9496A1] hover:text-[#18181B] dark:hover:text-[#F4F4F6]'
            }`}
          >
            <Columns className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Split Preview</span>
          </button>
          <button
            onClick={() => setEditorMode('read')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-colors cursor-pointer ${
              editorMode === 'read'
                ? 'bg-white dark:bg-[#1B1C21] text-[#18181B] dark:text-[#F4F4F6] shadow-xs font-semibold'
                : 'text-[#71717A] dark:text-[#9496A1] hover:text-[#18181B] dark:hover:text-[#F4F4F6]'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Read Mode</span>
          </button>
        </div>

        {/* Right: Snapshots, Settings & Publish CTA */}
        <div className="flex items-center gap-2">
          {/* Revisions Button */}
          <button
            onClick={() => setIsRevisionModalOpen(true)}
            className="p-2 rounded-xl text-[#71717A] hover:text-[#18181B] dark:hover:text-[#F4F4F6] hover:bg-[#F3F3EE] dark:hover:bg-[#141518] transition-colors cursor-pointer"
            title="Snapshots & Revision History"
          >
            <History className="w-4 h-4" />
          </button>

          {/* Settings Button */}
          <button
            onClick={() => setIsPublishModalOpen(true)}
            className="p-2 rounded-xl text-[#71717A] hover:text-[#18181B] dark:hover:text-[#F4F4F6] hover:bg-[#F3F3EE] dark:hover:bg-[#141518] transition-colors cursor-pointer"
            title="Publishing Settings & Metadata"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* Save Draft / Publish Button */}
          <button
            onClick={() => handlePublishOrUpdate()}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium bg-[#18181B] text-white dark:bg-[#F4F4F6] dark:text-[#18181B] hover:opacity-90 active:scale-95 transition-all shadow-xs cursor-pointer font-sans"
          >
            <Check className="w-3.5 h-3.5" />
            <span>{formData.status === 'published' ? 'Update Story' : 'Publish Story'}</span>
          </button>
        </div>

      </header>

      {/* Main Editorial Canvas */}
      <div className={`mx-auto px-4 sm:px-8 py-10 ${editorMode === 'split' ? 'max-w-6xl' : 'max-w-3xl'}`}>
        
        {/* Cover Image Selector */}
        <div className="mb-8">
          {formData.coverImage ? (
            <div className="relative group rounded-2xl overflow-hidden h-64 sm:h-80 bg-[#F3F3EE] dark:bg-[#141518] border border-[#E5E5DF] dark:border-[#26272C]">
              <img
                src={formData.coverImage}
                alt="Story cover"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowCoverPicker(true)}
                  className="px-3 py-1.5 rounded-lg bg-white/90 text-[#18181B] text-xs font-medium hover:bg-white cursor-pointer"
                >
                  Change Cover
                </button>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, coverImage: '' }))}
                  className="px-3 py-1.5 rounded-lg bg-red-600/90 text-white text-xs font-medium hover:bg-red-600 cursor-pointer"
                >
                  Remove Cover
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowCoverPicker(!showCoverPicker)}
              className="w-full py-4 px-6 rounded-2xl border border-dashed border-[#E5E5DF] dark:border-[#26272C] hover:border-[#71717A] text-[#71717A] dark:text-[#9496A1] hover:text-[#18181B] dark:hover:text-[#F4F4F6] text-xs font-mono flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Image className="w-4 h-4" />
              <span>+ Add Editorial Cover Photography</span>
            </button>
          )}

          {/* Cover Preset Picker Drawer */}
          {showCoverPicker && (
            <div className="mt-3 p-4 rounded-2xl border border-[#E5E5DF] dark:border-[#26272C] bg-white dark:bg-[#141518] animate-in fade-in duration-150">
              <div className="flex items-center justify-between mb-3 text-xs font-mono text-[#71717A]">
                <span>Select Curated Photography or Enter Custom URL:</span>
                <button onClick={() => setShowCoverPicker(false)} className="hover:text-black dark:hover:text-white">✕</button>
              </div>
              <div className="grid grid-cols-5 gap-2 mb-3">
                {PRESET_COVERS.map((url, i) => (
                  <div
                    key={i}
                    onClick={() => {
                      setFormData(prev => ({ ...prev, coverImage: url }));
                      setShowCoverPicker(false);
                    }}
                    className="h-16 rounded-lg overflow-hidden border border-[#E5E5DF] dark:border-[#26272C] hover:scale-105 transition-transform cursor-pointer"
                  >
                    <img src={url} alt={`Preset ${i}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
              <input
                type="url"
                placeholder="Or paste an image URL (Unsplash, Cloudinary)..."
                value={formData.coverImage}
                onChange={(e) => setFormData(prev => ({ ...prev, coverImage: e.target.value }))}
                className="w-full p-2.5 rounded-lg border border-[#E5E5DF] dark:border-[#26272C] bg-[#FAFAF8] dark:bg-[#0C0D0E] text-xs font-mono text-[#18181B] dark:text-[#F4F4F6] outline-hidden"
              />
            </div>
          )}
        </div>

        {/* Title Input */}
        <div className="mb-4">
          <textarea
            ref={titleTextareaRef}
            rows={2}
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            placeholder="Title of your essay..."
            className="w-full bg-transparent border-none outline-hidden font-serif text-3xl sm:text-5xl font-bold tracking-tight text-[#18181B] dark:text-[#F4F4F6] placeholder:text-[#71717A]/30 resize-none leading-[1.15]"
          />
        </div>

        {/* Multi-Tag Selector */}
        <div className="mb-6">
          <TagSelector
            selectedTagIds={formData.tagIds}
            onChange={(newIds) => setFormData(prev => ({ ...prev, tagIds: newIds }))}
          />
        </div>

        {/* Editor Writing Space (Split / Single Canvas) */}
        {editorMode === 'split' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            {/* Left: Raw Markdown Editor */}
            <div className="relative">
              <div className="text-[11px] font-mono uppercase text-[#71717A] mb-2 font-semibold flex items-center justify-between">
                <span>Markdown Editor</span>
                <span>Type '/' for blocks</span>
              </div>
              <textarea
                ref={textareaRef}
                rows={24}
                value={formData.content}
                onChange={handleContentChange}
                placeholder="Begin crafting your narrative... Type '/' on a new line to insert headings, code fences, blockquotes, or lists."
                className="w-full p-4 rounded-2xl border border-[#E5E5DF] dark:border-[#26272C] bg-white dark:bg-[#141518] font-mono text-xs sm:text-sm text-[#18181B] dark:text-[#F4F4F6] outline-hidden focus:ring-1 focus:ring-[#18181B] dark:focus:ring-white leading-relaxed resize-y"
              />
              {slashMenuOpen && (
                <SlashMenu
                  filter={slashFilter}
                  onSelect={handleInsertSlashSnippet}
                  onClose={() => setSlashMenuOpen(false)}
                />
              )}
            </div>

            {/* Right: Live Editorial Preview */}
            <div className="p-6 rounded-2xl border border-[#E5E5DF] dark:border-[#26272C] bg-white dark:bg-[#141518] min-h-[500px]">
              <div className="text-[11px] font-mono uppercase text-[#71717A] mb-4 pb-2 border-b border-[#E5E5DF] dark:border-[#26272C] font-semibold">
                Live Editorial Rendering
              </div>
              <div className="editorial-prose font-serif text-base sm:text-lg leading-relaxed text-[#18181B] dark:text-[#F4F4F6] whitespace-pre-wrap">
                {formData.content || <span className="text-[#71717A] italic">Preview will appear here as you type...</span>}
              </div>
            </div>
          </div>
        ) : editorMode === 'read' ? (
          /* Pure Read Mode View */
          <div className="p-8 sm:p-12 rounded-3xl border border-[#E5E5DF] dark:border-[#26272C] bg-white dark:bg-[#141518] shadow-sm">
            <h1 className="font-serif text-3xl sm:text-5xl font-bold tracking-tight text-[#18181B] dark:text-[#F4F4F6] mb-8 leading-snug">
              {formData.title || 'Untitled Essay'}
            </h1>
            <div className="editorial-prose font-serif text-lg leading-relaxed text-[#18181B] dark:text-[#F4F4F6] whitespace-pre-wrap">
              {formData.content || <span className="text-[#71717A] italic">Draft canvas is currently empty.</span>}
            </div>
          </div>
        ) : (
          /* Distraction-Free Write Canvas */
          <div className="relative">
            <textarea
              ref={textareaRef}
              rows={22}
              value={formData.content}
              onChange={handleContentChange}
              placeholder="Begin crafting your narrative... Type '/' on a new line to summon the formatting palette."
              className="w-full bg-transparent border-none outline-hidden font-serif text-lg sm:text-xl text-[#18181B] dark:text-[#F4F4F6] placeholder:text-[#71717A]/30 resize-none leading-[1.8] tracking-[-0.01em]"
            />
            {slashMenuOpen && (
              <SlashMenu
                filter={slashFilter}
                onSelect={handleInsertSlashSnippet}
                onClose={() => setSlashMenuOpen(false)}
              />
            )}
          </div>
        )}

      </div>

      {/* Floating Bottom Metrics Toolbar */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-4 px-4 py-2 rounded-full bg-white/90 dark:bg-[#1B1C21]/90 backdrop-blur-md border border-[#E5E5DF] dark:border-[#26272C] shadow-lg text-xs font-mono text-[#71717A] dark:text-[#9496A1]">
        <span>{wordCount} words</span>
        <span>·</span>
        <span>{charCount} chars</span>
        <span>·</span>
        <span className="text-[#E11D48] font-medium">{estimatedReadTime} min read</span>
        <div className="w-[1px] h-3.5 bg-[#E5E5DF] dark:border-[#26272C]" />
        <button
          onClick={() => setIsRevisionModalOpen(true)}
          className="hover:text-[#18181B] dark:hover:text-[#F4F4F6] flex items-center gap-1 cursor-pointer"
        >
          <History className="w-3.5 h-3.5" />
          <span>Snapshots</span>
        </button>
      </div>

      {/* Modals */}
      <RevisionHistoryModal
        isOpen={isRevisionModalOpen}
        onClose={() => setIsRevisionModalOpen(false)}
        revisions={formData.revisions || []}
        onRestore={handleRestoreSnapshot}
      />

      <PublishSettingsModal
        isOpen={isPublishModalOpen}
        onClose={() => setIsPublishModalOpen(false)}
        formData={formData}
        setFormData={setFormData}
        onDelete={deletePost}
      />

    </div>
  );
};
