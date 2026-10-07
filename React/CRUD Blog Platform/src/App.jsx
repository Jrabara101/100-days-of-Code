import React from 'react';
import { ToastProvider } from './context/ToastContext';
import { BlogProvider, useBlog } from './context/BlogContext';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { CommandPalette } from './components/layout/CommandPalette';
import { BookmarksDrawer } from './components/bookmarks/BookmarksDrawer';
import { RssFeedModal } from './components/article/RssFeedModal';
import { QuoteShareModal } from './components/article/QuoteShareModal';
import { TagManageModal } from './components/tags/TagManageModal';

// Views
import { DiscoveryFeed } from './components/feed/DiscoveryFeed';
import { ArticleView } from './components/article/ArticleView';
import { PostEditor } from './components/editor/PostEditor';
import { TagHubView } from './components/tags/TagHubView';

const MainLayout = () => {
  const { currentView } = useBlog();

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAF8] dark:bg-[#0C0D0E] text-[#18181B] dark:text-[#F4F4F6] selection:bg-[#E11D48]/20 selection:text-[#E11D48] transition-colors duration-200">
      
      {/* Top Navigation */}
      {currentView.type !== 'editor' && <Navbar />}

      {/* Dynamic View Router */}
      <div className="flex-1">
        {currentView.type === 'feed' && <DiscoveryFeed />}
        {currentView.type === 'article' && <ArticleView slug={currentView.articleSlug} />}
        {currentView.type === 'editor' && <PostEditor postId={currentView.editorPostId} />}
        {currentView.type === 'tagHub' && <TagHubView tagSlug={currentView.tagSlug} />}
      </div>

      {/* Footer */}
      {currentView.type !== 'editor' && <Footer />}

      {/* Modals & Overlay Drawers */}
      <BookmarksDrawer />
      <CommandPalette />
      <RssFeedModal />
      <QuoteShareModal />
      <TagManageModal />
    </div>
  );
};

export function App() {
  return (
    <ToastProvider>
      <BlogProvider>
        <MainLayout />
      </BlogProvider>
    </ToastProvider>
  );
}

export default App;
