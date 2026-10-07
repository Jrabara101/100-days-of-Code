import React, { useState, useEffect } from 'react';
import { 
  X, Lock, Unlock, Plus, Edit3, Trash2, Mail, CheckCircle, Archive, 
  ExternalLink, Database, FileText, Send, Eye, Shield, RefreshCw, Download, Upload 
} from 'lucide-react';
import { Post, Inquiry, PostStage, PostStatus, InquiryStatus } from '../types';
import { StorageEngine } from '../lib/storage';
import { isSupabaseConfigured } from '../lib/supabaseClient';
import { ArticleRenderer } from './ArticleRenderer';
import { StageBadge } from './StageBadge';

interface AdminDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  onDataChanged: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  isOpen,
  onClose,
  onDataChanged,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [pinInput, setPinInput] = useState<string>('');
  const [pinError, setPinError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'editor' | 'leads' | 'database'>('editor');
  
  // Posts state
  const [posts, setPosts] = useState<Post[]>([]);
  const [selectedPost, setSelectedPost] = useState<Partial<Post> | null>(null);
  const [editorTitle, setEditorTitle] = useState('');
  const [editorSlug, setEditorSlug] = useState('');
  const [editorExcerpt, setEditorExcerpt] = useState('');
  const [editorContent, setEditorContent] = useState('');
  const [editorStage, setEditorStage] = useState<PostStage>('seedling');
  const [editorStatus, setEditorStatus] = useState<PostStatus>('published');
  const [editorTags, setEditorTags] = useState('Architecture, Engineering');
  const [isSavingPost, setIsSavingPost] = useState(false);

  // Inquiries state
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [inquiryFilter, setInquiryFilter] = useState<string>('all');
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);

  // SQL Schema View state
  const [copiedSchema, setCopiedSchema] = useState(false);

  const defaultPin = import.meta.env.VITE_ADMIN_PIN || 'studio2026';

  const loadData = async () => {
    const allPosts = await StorageEngine.getPosts(true);
    setPosts(allPosts);
    const allInquiries = await StorageEngine.getInquiries();
    setInquiries(allInquiries);
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput.trim() === defaultPin) {
      setIsAuthenticated(true);
      setPinError(null);
    } else {
      setPinError('Invalid access PIN. Try "studio2026".');
    }
  };

  const handleNewPost = () => {
    setSelectedPost({});
    setEditorTitle('');
    setEditorSlug('');
    setEditorExcerpt('');
    setEditorContent('## Introduction\n\nWrite your thoughts here using Markdown...\n\n$$\\text{Complexity} = \\mathcal{O}(1)$$');
    setEditorStage('seedling');
    setEditorStatus('draft');
    setEditorTags('Engineering, Craft');
  };

  const handleSelectPostForEdit = (post: Post) => {
    setSelectedPost(post);
    setEditorTitle(post.title);
    setEditorSlug(post.slug);
    setEditorExcerpt(post.excerpt);
    setEditorContent(post.content);
    setEditorStage(post.stage);
    setEditorStatus(post.status);
    setEditorTags(post.tags.join(', '));
  };

  const handleSavePost = async () => {
    if (!editorTitle.trim() || !editorContent.trim()) {
      alert('Please fill in at least the Title and Content.');
      return;
    }

    setIsSavingPost(true);
    try {
      const tagsArray = editorTags.split(',').map(t => t.trim()).filter(Boolean);
      await StorageEngine.savePost({
        id: selectedPost?.id,
        title: editorTitle,
        slug: editorSlug,
        excerpt: editorExcerpt,
        content: editorContent,
        stage: editorStage,
        status: editorStatus,
        tags: tagsArray,
      });

      await loadData();
      onDataChanged();
      alert('Essay successfully saved to digital garden!');
    } catch (err) {
      alert('Failed to save essay.');
    } finally {
      setIsSavingPost(false);
    }
  };

  const handleDeletePost = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this essay? This action cannot be undone.')) {
      await StorageEngine.deletePost(id);
      await loadData();
      onDataChanged();
      if (selectedPost?.id === id) {
        setSelectedPost(null);
      }
    }
  };

  const handleUpdateInquiryStatus = async (id: string, status: InquiryStatus) => {
    await StorageEngine.updateInquiryStatus(id, status);
    await loadData();
    onDataChanged();
  };

  const handleOpenEmailReply = (inquiry: Inquiry) => {
    const subject = encodeURIComponent(`Re: Inquiry regarding ${inquiry.intent.replace('_', ' ')} — Julian Vance`);
    const body = encodeURIComponent(
      `Hi ${inquiry.sender_name},\n\nThank you for reaching out via my portfolio. I reviewed your dispatch regarding your project:\n\n> "${inquiry.message}"\n\nI would love to set up an introductory discovery call. Let me know what time works best for you this week.\n\nWarmly,\nJulian Vance`
    );
    window.location.href = `mailto:${inquiry.sender_email}?subject=${subject}&body=${body}`;
    handleUpdateInquiryStatus(inquiry.id, 'replied');
  };

  const handleExportData = () => {
    const data = StorageEngine.exportAllData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `atelier-portfolio-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopySchema = async () => {
    const schemaText = `-- Atelier Portfolio PostgreSQL Schema
-- Tables: posts, tags, post_tags, inquiries, newsletter_subscribers, claps_log
-- See /supabase/schema.sql in repository root for full definitions.`;
    await navigator.clipboard.writeText(schemaText);
    setCopiedSchema(true);
    setTimeout(() => setCopiedSchema(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm flex justify-end animate-fade-in">
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative w-full max-w-5xl h-full bg-surface-elevated-light dark:bg-surface-elevated-dark border-l border-border-subtle-light dark:border-border-subtle-dark shadow-2xl flex flex-col z-10 animate-slide-up">
        {/* Top Cockpit Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle-light dark:border-border-subtle-dark bg-surface-secondary-light/50 dark:bg-surface-secondary-dark/50">
          <div className="flex items-center space-x-3">
            <span className="p-2 rounded-lg bg-primary-light dark:bg-primary-dark text-white dark:text-zinc-900">
              {isAuthenticated ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
            </span>
            <div>
              <h2 className="text-base font-mono font-semibold text-primary-light dark:text-primary-dark">
                Atelier Studio & Lead Triage Cockpit
              </h2>
              <p className="text-xs text-muted-light dark:text-muted-dark font-mono">
                {isSupabaseConfigured ? '🟢 Live Supabase PostgreSQL Sync' : '⚡ Local-First Persistent Engine'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-surface-secondary-light dark:hover:bg-surface-secondary-dark text-muted-light dark:text-muted-dark hover:text-primary-light dark:hover:text-primary-dark transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* PIN Authentication Gate */}
        {!isAuthenticated ? (
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="max-w-sm w-full p-8 rounded-2xl border border-border-subtle-light dark:border-border-subtle-dark bg-surface-secondary-light/40 dark:bg-surface-secondary-dark/40 shadow-xl text-center space-y-5">
              <div className="w-12 h-12 rounded-full bg-accent-indigo/10 text-accent-indigo mx-auto flex items-center justify-center">
                <Shield className="w-6 h-6" />
              </div>

              <div>
                <h3 className="text-lg font-serif text-primary-light dark:text-primary-dark">
                  Back-Office Access
                </h3>
                <p className="text-xs text-muted-light dark:text-muted-dark font-sans mt-1">
                  Enter master PIN to manage essays and lead triage.
                </p>
              </div>

              <form onSubmit={handleUnlock} className="space-y-4">
                <input
                  type="password"
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  placeholder="PIN: studio2026"
                  autoFocus
                  className="w-full text-center px-4 py-2.5 rounded-xl border border-border-subtle-light dark:border-border-subtle-dark bg-surface-elevated-light dark:bg-surface-elevated-dark text-sm font-mono tracking-widest focus:outline-none focus:border-accent-indigo"
                />

                {pinError && (
                  <p className="text-xs font-mono text-red-500">{pinError}</p>
                )}

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-primary-light dark:bg-primary-dark text-white dark:text-zinc-900 text-xs font-mono font-semibold hover:opacity-90 transition-opacity"
                >
                  Unlock Studio Drawer
                </button>
              </form>

              <div className="pt-2 border-t border-border-subtle-light/60 dark:border-border-subtle-dark/60 text-[11px] font-mono text-muted-light dark:text-muted-dark">
                Demo Evaluation PIN: <span className="font-semibold text-accent-indigo">studio2026</span>
              </div>
            </div>
          </div>
        ) : (
          /* Authenticated Cockpit Body */
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Navigation Tabs */}
            <div className="flex items-center space-x-2 px-6 pt-3 border-b border-border-subtle-light dark:border-border-subtle-dark bg-surface-secondary-light/20 dark:bg-surface-secondary-dark/20 text-xs font-mono">
              <button
                onClick={() => setActiveTab('editor')}
                className={`flex items-center space-x-2 px-4 py-2.5 border-b-2 font-medium transition-colors ${
                  activeTab === 'editor'
                    ? 'border-accent-indigo text-accent-indigo'
                    : 'border-transparent text-muted-light dark:text-muted-dark hover:text-primary-light dark:hover:text-primary-dark'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Garden Essays ({posts.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('leads')}
                className={`flex items-center space-x-2 px-4 py-2.5 border-b-2 font-medium transition-colors ${
                  activeTab === 'leads'
                    ? 'border-accent-indigo text-accent-indigo'
                    : 'border-transparent text-muted-light dark:text-muted-dark hover:text-primary-light dark:hover:text-primary-dark'
                }`}
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Lead CRM ({inquiries.filter(i => i.status === 'new').length} New)</span>
              </button>

              <button
                onClick={() => setActiveTab('database')}
                className={`flex items-center space-x-2 px-4 py-2.5 border-b-2 font-medium transition-colors ${
                  activeTab === 'database'
                    ? 'border-accent-indigo text-accent-indigo'
                    : 'border-transparent text-muted-light dark:text-muted-dark hover:text-primary-light dark:hover:text-primary-dark'
                }`}
              >
                <Database className="w-3.5 h-3.5" />
                <span>Database & Sync</span>
              </button>
            </div>

            {/* TAB 1: ESSAY PUBLISHER & DUAL-PANE MARKDOWN STUDIO */}
            {activeTab === 'editor' && (
              <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                {/* Left: Posts List Sidebar */}
                <div className="w-full md:w-64 border-r border-border-subtle-light dark:border-border-subtle-dark flex flex-col bg-surface-secondary-light/30 dark:bg-surface-secondary-dark/30">
                  <div className="p-3 border-b border-border-subtle-light dark:border-border-subtle-dark">
                    <button
                      onClick={handleNewPost}
                      className="w-full flex items-center justify-center space-x-1.5 py-2 px-3 rounded-lg bg-accent-indigo text-white font-mono text-xs font-semibold hover:bg-indigo-600 transition-colors shadow-sm"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Draft New Essay</span>
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto divide-y divide-border-subtle-light/40 dark:divide-border-subtle-dark/40">
                    {posts.map((p) => (
                      <div
                        key={p.id}
                        onClick={() => handleSelectPostForEdit(p)}
                        className={`p-3 cursor-pointer text-left transition-colors ${
                          selectedPost?.id === p.id
                            ? 'bg-accent-indigo/10 border-l-2 border-accent-indigo'
                            : 'hover:bg-surface-secondary-light dark:hover:bg-surface-secondary-dark'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[10px] font-mono text-muted-light dark:text-muted-dark mb-1">
                          <StageBadge stage={p.stage} size="sm" showIcon={false} />
                          <span className={p.status === 'published' ? 'text-accent-emerald' : 'text-amber-500'}>
                            {p.status}
                          </span>
                        </div>
                        <h4 className="text-xs font-serif font-medium text-primary-light dark:text-primary-dark line-clamp-1">
                          {p.title}
                        </h4>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right: Dual-Pane Live Markdown Editor */}
                <div className="flex-1 flex flex-col overflow-hidden bg-surface-elevated-light dark:bg-surface-elevated-dark">
                  {/* Top Editor Control Bar */}
                  <div className="p-4 border-b border-border-subtle-light dark:border-border-subtle-dark grid grid-cols-1 sm:grid-cols-3 gap-3 bg-surface-secondary-light/10 dark:bg-surface-secondary-dark/10">
                    <div>
                      <label className="block text-[10px] uppercase font-mono text-muted-light dark:text-muted-dark mb-1">
                        Title
                      </label>
                      <input
                        type="text"
                        value={editorTitle}
                        onChange={(e) => setEditorTitle(e.target.value)}
                        placeholder="Essay Headline..."
                        className="w-full px-3 py-1.5 rounded-lg border border-border-subtle-light dark:border-border-subtle-dark bg-surface-elevated-light dark:bg-surface-elevated-dark text-xs font-mono"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] uppercase font-mono text-muted-light dark:text-muted-dark mb-1">
                          Stage
                        </label>
                        <select
                          value={editorStage}
                          onChange={(e) => setEditorStage(e.target.value as PostStage)}
                          className="w-full px-2 py-1.5 rounded-lg border border-border-subtle-light dark:border-border-subtle-dark bg-surface-elevated-light dark:bg-surface-elevated-dark text-xs font-mono"
                        >
                          <option value="seedling">🌱 Seedling</option>
                          <option value="budding">🌿 Budding</option>
                          <option value="evergreen">🌲 Evergreen</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] uppercase font-mono text-muted-light dark:text-muted-dark mb-1">
                          Status
                        </label>
                        <select
                          value={editorStatus}
                          onChange={(e) => setEditorStatus(e.target.value as PostStatus)}
                          className="w-full px-2 py-1.5 rounded-lg border border-border-subtle-light dark:border-border-subtle-dark bg-surface-elevated-light dark:bg-surface-elevated-dark text-xs font-mono"
                        >
                          <option value="draft">Draft</option>
                          <option value="published">Published</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex items-end space-x-2">
                      <button
                        onClick={handleSavePost}
                        disabled={isSavingPost}
                        className="flex-1 py-1.5 px-3 rounded-lg bg-accent-emerald text-white font-mono text-xs font-semibold hover:bg-emerald-600 transition-colors shadow-sm disabled:opacity-50"
                      >
                        {isSavingPost ? 'Saving...' : 'Save & Sync'}
                      </button>

                      {selectedPost?.id && (
                        <button
                          onClick={() => handleDeletePost(selectedPost.id!)}
                          className="p-2 rounded-lg border border-red-500/30 text-red-500 hover:bg-red-500/10 transition-colors"
                          title="Delete essay"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Dual Pane View (Editor Left, Live Render Right) */}
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border-subtle-light dark:divide-border-subtle-dark overflow-hidden">
                    {/* Left Pane: Raw Markdown Input */}
                    <div className="flex flex-col h-full overflow-hidden p-4">
                      <span className="text-[10px] uppercase font-mono text-muted-light dark:text-muted-dark mb-2 block font-semibold">
                        Raw Markdown Input
                      </span>
                      <textarea
                        value={editorContent}
                        onChange={(e) => setEditorContent(e.target.value)}
                        placeholder="Write in Markdown / KaTeX ($ math $)..."
                        className="flex-1 w-full p-3 rounded-xl border border-border-subtle-light dark:border-border-subtle-dark bg-surface-secondary-light/40 dark:bg-surface-secondary-dark/40 font-mono text-xs leading-relaxed resize-none focus:outline-none focus:border-accent-indigo"
                      />
                    </div>

                    {/* Right Pane: Live Formatted Preview */}
                    <div className="flex flex-col h-full overflow-y-auto p-6 bg-surface-secondary-light/10 dark:bg-surface-secondary-dark/10">
                      <span className="text-[10px] uppercase font-mono text-accent-indigo mb-2 block font-semibold flex items-center space-x-1">
                        <Eye className="w-3 h-3" />
                        <span>Formatted Live Preview</span>
                      </span>
                      <div className="border border-border-subtle-light/60 dark:border-border-subtle-dark/60 rounded-xl p-5 bg-surface-elevated-light dark:bg-surface-elevated-dark shadow-sm">
                        <h2 className="text-2xl font-serif font-normal text-primary-light dark:text-primary-dark mb-3">
                          {editorTitle || 'Untitled Essay'}
                        </h2>
                        <ArticleRenderer content={editorContent} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: LEAD CRM & INQUIRY TRIAGE */}
            {activeTab === 'leads' && (
              <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                {/* Leads List */}
                <div className="w-full md:w-80 border-r border-border-subtle-light dark:border-border-subtle-dark flex flex-col bg-surface-secondary-light/20 dark:bg-surface-secondary-dark/20">
                  <div className="p-3 border-b border-border-subtle-light dark:border-border-subtle-dark flex items-center justify-between">
                    <span className="text-xs font-mono font-semibold text-primary-light dark:text-primary-dark">
                      Incoming Dispatches
                    </span>
                    <select
                      value={inquiryFilter}
                      onChange={(e) => setInquiryFilter(e.target.value)}
                      className="px-2 py-1 rounded border border-border-subtle-light dark:border-border-subtle-dark bg-surface-elevated-light dark:bg-surface-elevated-dark text-[11px] font-mono"
                    >
                      <option value="all">All Status</option>
                      <option value="new">New</option>
                      <option value="reviewed">Reviewed</option>
                      <option value="replied">Replied</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>

                  <div className="flex-1 overflow-y-auto divide-y divide-border-subtle-light/40 dark:divide-border-subtle-dark/40">
                    {inquiries
                      .filter(i => inquiryFilter === 'all' || i.status === inquiryFilter)
                      .map((inq) => (
                        <div
                          key={inq.id}
                          onClick={() => setSelectedInquiry(inq)}
                          className={`p-3.5 cursor-pointer text-left transition-colors ${
                            selectedInquiry?.id === inq.id
                              ? 'bg-accent-indigo/10 border-l-2 border-accent-indigo'
                              : 'hover:bg-surface-secondary-light dark:hover:bg-surface-secondary-dark'
                          }`}
                        >
                          <div className="flex items-center justify-between text-[10px] font-mono text-muted-light dark:text-muted-dark mb-1">
                            <span className="font-semibold text-primary-light dark:text-primary-dark">
                              {inq.sender_name}
                            </span>
                            <span className={`px-1.5 py-0.5 rounded uppercase font-semibold ${
                              inq.status === 'new' ? 'bg-emerald-500/10 text-accent-emerald' :
                              inq.status === 'replied' ? 'bg-indigo-500/10 text-accent-indigo' :
                              'bg-zinc-500/10 text-zinc-400'
                            }`}>
                              {inq.status}
                            </span>
                          </div>

                          <p className="text-xs font-mono text-accent-indigo truncate">
                            {inq.intent.replace('_', ' ')}
                          </p>
                          <p className="text-xs text-muted-light dark:text-muted-dark line-clamp-1 mt-0.5 font-sans">
                            {inq.message}
                          </p>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Lead Detail View */}
                <div className="flex-1 p-6 overflow-y-auto">
                  {selectedInquiry ? (
                    <div className="max-w-2xl space-y-6">
                      <div className="flex items-start justify-between pb-4 border-b border-border-subtle-light dark:border-border-subtle-dark">
                        <div>
                          <span className="text-[10px] uppercase font-mono tracking-wider text-muted-light dark:text-muted-dark font-semibold">
                            Dispatch {selectedInquiry.id}
                          </span>
                          <h3 className="text-2xl font-serif text-primary-light dark:text-primary-dark">
                            {selectedInquiry.sender_name}
                          </h3>
                          <a
                            href={`mailto:${selectedInquiry.sender_email}`}
                            className="text-xs font-mono text-accent-indigo hover:underline flex items-center space-x-1 mt-0.5"
                          >
                            <Mail className="w-3 h-3" />
                            <span>{selectedInquiry.sender_email}</span>
                          </a>
                        </div>

                        {/* Status update buttons */}
                        <div className="flex items-center space-x-1.5 font-mono text-xs">
                          <button
                            onClick={() => handleUpdateInquiryStatus(selectedInquiry.id, 'reviewed')}
                            className="px-2.5 py-1 rounded border border-border-subtle-light dark:border-border-subtle-dark hover:bg-surface-secondary-light dark:hover:bg-surface-secondary-dark"
                          >
                            Mark Reviewed
                          </button>
                          <button
                            onClick={() => handleUpdateInquiryStatus(selectedInquiry.id, 'archived')}
                            className="px-2.5 py-1 rounded border border-border-subtle-light dark:border-border-subtle-dark hover:bg-surface-secondary-light dark:hover:bg-surface-secondary-dark"
                          >
                            Archive
                          </button>
                        </div>
                      </div>

                      {/* Metadata Grid */}
                      <div className="grid grid-cols-2 gap-4 p-4 rounded-xl border border-border-subtle-light dark:border-border-subtle-dark bg-surface-secondary-light/30 dark:bg-surface-secondary-dark/30 font-mono text-xs">
                        <div>
                          <span className="text-[10px] uppercase text-muted-light dark:text-muted-dark block">
                            Intent
                          </span>
                          <span className="font-semibold text-primary-light dark:text-primary-dark">
                            {selectedInquiry.intent}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase text-muted-light dark:text-muted-dark block">
                            Budget Tier
                          </span>
                          <span className="font-semibold text-accent-emerald">
                            {selectedInquiry.budget_tier ? selectedInquiry.budget_tier.replace('_', ' ') : 'N/A'}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase text-muted-light dark:text-muted-dark block">
                            Timeline
                          </span>
                          <span className="text-primary-light dark:text-primary-dark">
                            {selectedInquiry.timeline || 'Not specified'}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase text-muted-light dark:text-muted-dark block">
                            Received At
                          </span>
                          <span className="text-primary-light dark:text-primary-dark">
                            {new Date(selectedInquiry.created_at).toLocaleString()}
                          </span>
                        </div>
                      </div>

                      {/* Message Content */}
                      <div>
                        <h4 className="text-xs uppercase font-mono tracking-wider text-muted-light dark:text-muted-dark font-semibold mb-2">
                          Client Message
                        </h4>
                        <div className="p-4 rounded-xl border border-border-subtle-light dark:border-border-subtle-dark bg-surface-elevated-light dark:bg-surface-elevated-dark font-sans text-sm text-primary-light dark:text-primary-dark leading-relaxed whitespace-pre-wrap">
                          {selectedInquiry.message}
                        </div>
                      </div>

                      {/* Reply Action */}
                      <div className="pt-2">
                        <button
                          onClick={() => handleOpenEmailReply(selectedInquiry)}
                          className="w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-xl bg-accent-indigo text-white font-mono text-xs font-semibold hover:bg-indigo-600 transition-colors shadow-md"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Launch Mail Client with Pre-filled Reply</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="h-full flex items-center justify-center text-xs font-mono text-muted-light dark:text-muted-dark">
                      Select an incoming dispatch to view client details and triage.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 3: DATABASE & BACKUP */}
            {activeTab === 'database' && (
              <div className="flex-1 p-6 overflow-y-auto space-y-6">
                <div className="max-w-2xl space-y-6">
                  <div className="p-5 rounded-2xl border border-border-subtle-light dark:border-border-subtle-dark bg-surface-secondary-light/40 dark:bg-surface-secondary-dark/40">
                    <h3 className="text-base font-mono font-semibold text-primary-light dark:text-primary-dark flex items-center space-x-2">
                      <Database className="w-4 h-4 text-accent-indigo" />
                      <span>Supabase & PostgreSQL Synchronization</span>
                    </h3>
                    <p className="text-xs text-muted-light dark:text-muted-dark mt-1 font-sans leading-relaxed">
                      {isSupabaseConfigured
                        ? 'Your app is actively syncing with your Supabase remote instance.'
                        : 'Running in resilient Local-First Sandbox Mode. Mutations persist in browser localStorage with zero network latency.'}
                    </p>

                    <div className="mt-4 flex items-center space-x-3">
                      <button
                        onClick={handleCopySchema}
                        className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-border-subtle-light dark:border-border-subtle-dark bg-surface-elevated-light dark:bg-surface-elevated-dark text-xs font-mono"
                      >
                        <FileText className="w-3.5 h-3.5 text-accent-indigo" />
                        <span>{copiedSchema ? 'Copied Schema!' : 'Copy SQL Schema'}</span>
                      </button>

                      <button
                        onClick={handleExportData}
                        className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-border-subtle-light dark:border-border-subtle-dark bg-surface-elevated-light dark:bg-surface-elevated-dark text-xs font-mono"
                      >
                        <Download className="w-3.5 h-3.5 text-accent-emerald" />
                        <span>Export Backup JSON</span>
                      </button>
                    </div>
                  </div>

                  <div className="p-5 rounded-2xl border border-red-500/20 bg-red-500/5">
                    <h4 className="text-xs font-mono uppercase tracking-wider text-red-500 font-semibold mb-1">
                      Data Reset Danger Zone
                    </h4>
                    <p className="text-xs text-muted-light dark:text-muted-dark font-sans mb-3">
                      Reset all essays, inquiries, and subscriber lists to original sample seed state.
                    </p>
                    <button
                      onClick={() => {
                        if (window.confirm('Reset all portfolio and lead data to original seed state?')) {
                          StorageEngine.resetToInitial();
                          loadData();
                          onDataChanged();
                          alert('Database reset to initial demo seeds.');
                        }
                      }}
                      className="px-3 py-1.5 rounded-lg bg-red-500 text-white font-mono text-xs font-semibold hover:bg-red-600 transition-colors"
                    >
                      Reset to Initial Seed Data
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
