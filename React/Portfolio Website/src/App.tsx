import React, { useState, useEffect } from 'react';
import { Post, CaseStudy, PersonalPulse, Inquiry } from './types';
import { StorageEngine } from './lib/storage';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { SelectedWork } from './components/SelectedWork';
import { WritingStream } from './components/WritingStream';
import { ArticleView } from './components/ArticleView';
import { ContactConsole } from './components/ContactConsole';
import { Footer } from './components/Footer';
import { AdminDashboard } from './components/AdminDashboard';
import { NowModal } from './components/NowModal';
import { RSSModal } from './components/RSSModal';
import { OGPreviewModal } from './components/OGPreviewModal';

export const App: React.FC = () => {
  // Theme state: defaults to dark (Obsidian Slate), supports Warm Linen Light
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('atelier_theme');
      if (saved) return saved === 'dark';
      return true; // Default to Obsidian Slate
    }
    return true;
  });

  // App data state
  const [posts, setPosts] = useState<Post[]>([]);
  const [caseStudies, setCaseStudies] = useState<CaseStudy[]>([]);
  const [pulse, setPulse] = useState<PersonalPulse>(StorageEngine.getPulse as unknown as PersonalPulse);

  // Active view & modals state
  const [activePost, setActivePost] = useState<Post | null>(null);
  const [currentSection, setCurrentSection] = useState<string>('work');
  
  const [isAdminOpen, setIsAdminOpen] = useState<boolean>(false);
  const [isNowModalOpen, setIsNowModalOpen] = useState<boolean>(false);
  const [isRSSOpen, setIsRSSOpen] = useState<boolean>(false);
  const [activeOGPost, setActiveOGPost] = useState<Post | null>(null);

  // Apply dark mode class to root HTML
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('atelier_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('atelier_theme', 'light');
    }
  }, [darkMode]);

  // Load initial data
  const refreshData = async () => {
    const fetchedPosts = await StorageEngine.getPosts(false);
    setPosts(fetchedPosts);
    const fetchedStudies = await StorageEngine.getCaseStudies();
    setCaseStudies(fetchedStudies);
    const fetchedPulse = await StorageEngine.getPulse();
    setPulse(fetchedPulse);
  };

  useEffect(() => {
    refreshData();
  }, []);

  // Handle URL hash routing (e.g. #essays/architecting-zero-latency...)
  useEffect(() => {
    const handleHash = async () => {
      const hash = window.location.hash.replace('#', '');
      if (hash.startsWith('essays/')) {
        const slug = hash.replace('essays/', '');
        const found = await StorageEngine.getPostBySlug(slug);
        if (found) {
          setActivePost(found);
          window.scrollTo({ top: 0, behavior: 'instant' });
          return;
        }
      } else if (hash === 'admin') {
        setIsAdminOpen(true);
      } else if (hash === 'now') {
        setIsNowModalOpen(true);
      } else if (hash === 'rss') {
        setIsRSSOpen(true);
      } else if (hash) {
        const el = document.getElementById(hash);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }
    };

    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  // Keyboard navigation & quick shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsAdminOpen(false);
        setIsNowModalOpen(false);
        setIsRSSOpen(false);
        setActiveOGPost(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSelectPost = (post: Post) => {
    setActivePost(post);
    window.location.hash = `essays/${post.slug}`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToHome = () => {
    setActivePost(null);
    window.location.hash = '';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigateSection = (sectionId: string) => {
    if (activePost) {
      setActivePost(null);
      window.location.hash = '';
      setTimeout(() => {
        const el = document.getElementById(sectionId);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 50);
    } else {
      setCurrentSection(sectionId);
      const el = document.getElementById(sectionId);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-canvas-light dark:bg-canvas-dark text-primary-light dark:text-primary-dark transition-colors duration-200">
      {/* Navigation Header */}
      <Navbar
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
        pulse={pulse}
        onOpenAdmin={() => setIsAdminOpen(true)}
        onOpenNowModal={() => setIsNowModalOpen(true)}
        currentSection={currentSection}
        onNavigate={handleNavigateSection}
        isArticleOpen={Boolean(activePost)}
        onHomeClick={handleBackToHome}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {activePost ? (
          /* Editorial Long-Form Article View */
          <ArticleView
            post={activePost}
            allPosts={posts}
            onBack={handleBackToHome}
            onSelectPost={handleSelectPost}
            onOpenOGPreview={(p) => setActiveOGPost(p)}
          />
        ) : (
          /* Flagship Homepage Stage */
          <>
            {/* Hero Banner with Manifesto & Live Time Clock */}
            <Hero
              pulse={pulse}
              onExploreWork={() => handleNavigateSection('work')}
              onExploreEssays={() => handleNavigateSection('essays')}
              onOpenContact={() => handleNavigateSection('contact')}
              onOpenNowModal={() => setIsNowModalOpen(true)}
            />

            {/* Selected Work: Asymmetric 2-column grid of Case Studies */}
            <SelectedWork caseStudies={caseStudies} />

            {/* Digital Garden Writing Stream */}
            <WritingStream
              posts={posts}
              onSelectPost={handleSelectPost}
              onOpenRSS={() => setIsRSSOpen(true)}
            />

            {/* Interactive Opportunity & Contact Gateway */}
            <ContactConsole
              onInquirySubmitted={() => {
                refreshData();
              }}
            />
          </>
        )}
      </main>

      {/* Editorial Footer */}
      <Footer
        onOpenAdmin={() => setIsAdminOpen(true)}
        onOpenRSS={() => setIsRSSOpen(true)}
        onOpenNowModal={() => setIsNowModalOpen(true)}
        onNavigate={handleNavigateSection}
      />

      {/* Admin Triage & Editorial Studio Drawer */}
      <AdminDashboard
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        onDataChanged={refreshData}
      />

      {/* "Now" Manifest Modal */}
      <NowModal
        isOpen={isNowModalOpen}
        onClose={() => setIsNowModalOpen(false)}
        pulse={pulse}
      />

      {/* RSS Feed Modal */}
      <RSSModal
        isOpen={isRSSOpen}
        onClose={() => setIsRSSOpen(false)}
        posts={posts}
      />

      {/* Dynamic OpenGraph Social Card Preview Modal */}
      <OGPreviewModal
        post={activeOGPost}
        onClose={() => setActiveOGPost(null)}
      />
    </div>
  );
};
