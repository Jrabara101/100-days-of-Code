import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as storage from '../services/storageService';
import { INITIAL_USER } from '../services/seedData';
import { useToast } from './ToastContext';

const BlogContext = createContext(null);

export const BlogProvider = ({ children }) => {
  const { showToast } = useToast();

  // Storage State
  const [posts, setPosts] = useState(() => storage.getPosts());
  const [tags, setTags] = useState(() => storage.getTags());
  const [bookmarks, setBookmarks] = useState(() => storage.getBookmarks());
  const [followedTags, setFollowedTags] = useState(() => storage.getFollowedTagIds());
  const [currentUser, setCurrentUser] = useState(INITIAL_USER);

  // Theme State
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('cc_editorial_theme_v1') || 'light';
  });

  // Navigation View State: { type: 'feed' | 'article' | 'editor' | 'tagHub', payload: ... }
  const [currentView, setCurrentView] = useState({
    type: 'feed',
    tagSlug: null,
    feedTab: 'all', // 'all' | 'following' | 'trending'
    searchQuery: '',
    articleSlug: null,
    editorPostId: null
  });

  // Modals & Drawers
  const [isBookmarksOpen, setIsBookmarksOpen] = useState(false);
  const [isRssModalOpen, setIsRssModalOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [tagModalData, setTagModalData] = useState({ isOpen: false, tag: null });
  const [quoteShareData, setQuoteShareData] = useState({ isOpen: false, quote: '', author: '', title: '' });

  // Quote-to-reply contextual bridge
  const [quoteForComposer, setQuoteForComposer] = useState('');

  // Sync theme to DOM
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('cc_editorial_theme_v1', theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  }, []);

  // Refresh lists from storage
  const refreshPosts = useCallback(() => {
    setPosts(storage.getPosts());
  }, []);

  const refreshTags = useCallback(() => {
    setTags(storage.getTags());
  }, []);

  // Post Actions
  const handleSavePost = useCallback((postData) => {
    const saved = storage.savePost(postData);
    refreshPosts();
    refreshTags();
    showToast(postData.id ? 'Story updated successfully' : 'Story published to editorial feed', 'success');
    return saved;
  }, [refreshPosts, refreshTags, showToast]);

  const handleDeletePost = useCallback((id) => {
    storage.deletePost(id);
    refreshPosts();
    refreshTags();
    showToast('Story deleted permanently', 'info');
    if (currentView.type === 'article') {
      setCurrentView({ type: 'feed', feedTab: 'all', searchQuery: '', tagSlug: null });
    }
  }, [refreshPosts, refreshTags, showToast, currentView]);

  const handleClapPost = useCallback((id, amount = 1) => {
    const newCount = storage.incrementClaps(id, amount);
    setPosts(prev => prev.map(p => p.id === id ? { ...p, clapsCount: newCount } : p));
    return newCount;
  }, []);

  const handleRestoreRevision = useCallback((postId, revisionId) => {
    const restored = storage.restorePostSnapshot(postId, revisionId);
    if (restored) {
      refreshPosts();
      showToast('Revision snapshot restored into active canvas', 'accent');
      return restored;
    }
    return null;
  }, [refreshPosts, showToast]);

  // Tag Actions
  const handleSaveTag = useCallback((tagData) => {
    const saved = storage.saveTag(tagData);
    refreshTags();
    refreshPosts();
    showToast(tagData.id ? 'Tag taxonomy updated' : `Topic #${saved.name} created`, 'success');
    return saved;
  }, [refreshTags, refreshPosts, showToast]);

  const handleDeleteTag = useCallback((id) => {
    storage.deleteTag(id);
    refreshTags();
    refreshPosts();
    showToast('Tag deleted and disassociated from stories', 'info');
  }, [refreshTags, refreshPosts, showToast]);

  const handleToggleFollowTag = useCallback((tagId) => {
    const isNowFollowing = storage.toggleFollowTag(tagId);
    setFollowedTags(storage.getFollowedTagIds());
    refreshTags();
    const tag = tags.find(t => t.id === tagId);
    showToast(isNowFollowing ? `Following #${tag?.name || 'topic'}` : `Unfollowed #${tag?.name || 'topic'}`, 'info');
    return isNowFollowing;
  }, [tags, refreshTags, showToast]);

  // Bookmark Actions
  const handleToggleBookmark = useCallback((postId) => {
    const isNowBookmarked = storage.toggleBookmark(postId);
    setBookmarks(storage.getBookmarks());
    const post = posts.find(p => p.id === postId);
    showToast(isNowBookmarked ? `Saved "${post?.title?.slice(0, 30)}..." to Read Later` : 'Removed from bookmarks', 'info');
    return isNowBookmarked;
  }, [posts, showToast]);

  // Comment Actions
  const handleAddComment = useCallback(({ postId, parentId = null, content }) => {
    const created = storage.addComment({ postId, parentId, content, user: currentUser });
    showToast('Comment published to discussion thread', 'success');
    return created;
  }, [currentUser, showToast]);

  const handleEditComment = useCallback((commentId, newContent) => {
    const updated = storage.editComment(commentId, newContent);
    showToast('Comment updated', 'info');
    return updated;
  }, [showToast]);

  const handleSoftDeleteComment = useCallback((commentId) => {
    const deleted = storage.softDeleteComment(commentId);
    showToast('Comment removed', 'info');
    return deleted;
  }, [showToast]);

  const handleUpvoteComment = useCallback((commentId) => {
    return storage.toggleUpvoteComment(commentId, currentUser.id);
  }, [currentUser]);

  const handleTogglePinComment = useCallback((commentId) => {
    const updated = storage.togglePinComment(commentId);
    showToast(updated.isPinned ? 'Comment pinned to top of discussion' : 'Comment unpinned', 'accent');
    return updated;
  }, [showToast]);

  const handleFlagComment = useCallback((commentId) => {
    const updated = storage.flagComment(commentId);
    showToast('Comment flagged for editorial moderation', 'info');
    return updated;
  }, [showToast]);

  // Quote bridge
  const activateQuoteInComment = useCallback((quoteText) => {
    setQuoteForComposer(quoteText);
    showToast('Quote added to discussion composer', 'accent');
  }, [showToast]);

  // Navigation helpers
  const navigateToFeed = useCallback((options = {}) => {
    setCurrentView({
      type: 'feed',
      feedTab: options.feedTab || 'all',
      searchQuery: options.searchQuery || '',
      tagSlug: options.tagSlug || null,
      articleSlug: null,
      editorPostId: null
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const navigateToArticle = useCallback((slug) => {
    storage.incrementViews(slug);
    refreshPosts();
    setCurrentView({
      type: 'article',
      articleSlug: slug,
      feedTab: 'all',
      searchQuery: '',
      tagSlug: null,
      editorPostId: null
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [refreshPosts]);

  const navigateToEditor = useCallback((postId = null) => {
    setCurrentView({
      type: 'editor',
      editorPostId: postId,
      articleSlug: null,
      feedTab: 'all',
      searchQuery: '',
      tagSlug: null
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const navigateToTagHub = useCallback((slug) => {
    setCurrentView({
      type: 'tagHub',
      tagSlug: slug,
      articleSlug: null,
      editorPostId: null,
      feedTab: 'all',
      searchQuery: ''
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <BlogContext.Provider
      value={{
        posts,
        tags,
        bookmarks,
        followedTags,
        currentUser,
        setCurrentUser,
        theme,
        toggleTheme,
        currentView,
        navigateToFeed,
        navigateToArticle,
        navigateToEditor,
        navigateToTagHub,
        // Post operations
        savePost: handleSavePost,
        deletePost: handleDeletePost,
        clapPost: handleClapPost,
        restoreRevision: handleRestoreRevision,
        // Tag operations
        saveTag: handleSaveTag,
        deleteTag: handleDeleteTag,
        toggleFollowTag: handleToggleFollowTag,
        // Bookmark operations
        toggleBookmark: handleToggleBookmark,
        isBookmarksOpen,
        setIsBookmarksOpen,
        // Comment operations
        addComment: handleAddComment,
        editComment: handleEditComment,
        deleteComment: handleSoftDeleteComment,
        upvoteComment: handleUpvoteComment,
        togglePinComment: handleTogglePinComment,
        flagComment: handleFlagComment,
        // Quote Bridge
        quoteForComposer,
        setQuoteForComposer,
        activateQuoteInComment,
        // Modals
        isRssModalOpen,
        setIsRssModalOpen,
        isCommandPaletteOpen,
        setIsCommandPaletteOpen,
        tagModalData,
        setTagModalData,
        quoteShareData,
        setQuoteShareData
      }}
    >
      {children}
    </BlogContext.Provider>
  );
};

export const useBlog = () => {
  const context = useContext(BlogContext);
  if (!context) throw new Error('useBlog must be used within BlogProvider');
  return context;
};
