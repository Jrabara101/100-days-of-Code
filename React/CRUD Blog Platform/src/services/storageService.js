import { INITIAL_POSTS, INITIAL_TAGS, INITIAL_COMMENTS, INITIAL_USER, MOCK_USERS } from './seedData';

const STORAGE_KEYS = {
  POSTS: 'cc_editorial_posts_v1',
  TAGS: 'cc_editorial_tags_v1',
  COMMENTS: 'cc_editorial_comments_v1',
  BOOKMARKS: 'cc_editorial_bookmarks_v1',
  FOLLOWED_TAGS: 'cc_editorial_followed_tags_v1',
  USER_UPVOTES: 'cc_editorial_user_upvotes_v1',
  DRAFT_BACKUP: 'cc_editorial_editor_draft_v1',
  THEME: 'cc_editorial_theme_v1'
};

// Calculate reading time from word count
export const calculateReadingTime = (content = '') => {
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  const minutes = Math.ceil(words / 220);
  return Math.max(1, minutes);
};

// Calculate auto-excerpt from first paragraph
export const generateAutoExcerpt = (content = '') => {
  if (!content) return '';
  const lines = content.split('\n').map(l => l.trim()).filter(l => l.length > 0 && !l.startsWith('#') && !l.startsWith('>') && !l.startsWith('```'));
  const firstParagraph = lines[0] || '';
  return firstParagraph.length > 180 ? firstParagraph.slice(0, 177) + '...' : firstParagraph;
};

// Initialize default data if not present
export const initStorage = () => {
  if (!localStorage.getItem(STORAGE_KEYS.POSTS)) {
    localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(INITIAL_POSTS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.TAGS)) {
    localStorage.setItem(STORAGE_KEYS.TAGS, JSON.stringify(INITIAL_TAGS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.COMMENTS)) {
    localStorage.setItem(STORAGE_KEYS.COMMENTS, JSON.stringify(INITIAL_COMMENTS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.BOOKMARKS)) {
    localStorage.setItem(STORAGE_KEYS.BOOKMARKS, JSON.stringify(['post-1']));
  }
  if (!localStorage.getItem(STORAGE_KEYS.FOLLOWED_TAGS)) {
    localStorage.setItem(STORAGE_KEYS.FOLLOWED_TAGS, JSON.stringify(['tag-react', 'tag-design', 'tag-architecture']));
  }
  if (!localStorage.getItem(STORAGE_KEYS.USER_UPVOTES)) {
    localStorage.setItem(STORAGE_KEYS.USER_UPVOTES, JSON.stringify({}));
  }
};

// ================= POSTS CRUD ================= //
export const getPosts = () => {
  initStorage();
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.POSTS)) || [];
  } catch (e) {
    console.error('Error reading posts:', e);
    return INITIAL_POSTS;
  }
};

export const getPostById = (id) => {
  const posts = getPosts();
  return posts.find(p => p.id === id);
};

export const getPostBySlug = (slug) => {
  const posts = getPosts();
  return posts.find(p => p.slug === slug);
};

export const savePost = (postData) => {
  const posts = getPosts();
  const now = new Date().toISOString();
  
  const readingTime = calculateReadingTime(postData.content);
  const excerpt = postData.excerpt?.trim() || generateAutoExcerpt(postData.content);
  const slug = postData.slug?.trim() || postData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') || `post-${Date.now()}`;

  let updatedPost;
  let updatedList;

  if (postData.id) {
    // Update existing post
    const existingIndex = posts.findIndex(p => p.id === postData.id);
    const existing = posts[existingIndex] || {};
    
    // Auto-create snapshot if content changed significantly
    const revisions = existing.revisions ? [...existing.revisions] : [];
    if (existing.content && existing.content !== postData.content) {
      revisions.unshift({
        id: `rev-${Date.now()}`,
        timestamp: now,
        title: existing.title,
        excerpt: existing.excerpt,
        content: existing.content,
        note: postData.snapshotNote || 'Auto snapshot prior to update'
      });
      // Cap at 15 revisions to avoid localStorage bloat
      if (revisions.length > 15) revisions.pop();
    }

    updatedPost = {
      ...existing,
      ...postData,
      slug,
      excerpt,
      readingTime,
      updatedAt: now,
      revisions
    };

    if (existingIndex >= 0) {
      updatedList = [...posts];
      updatedList[existingIndex] = updatedPost;
    } else {
      updatedList = [updatedPost, ...posts];
    }
  } else {
    // Create new post
    const newId = `post-${Date.now()}`;
    updatedPost = {
      id: newId,
      authorId: INITIAL_USER.id,
      author: INITIAL_USER,
      title: postData.title || 'Untitled Story',
      slug,
      coverImage: postData.coverImage || '',
      excerpt,
      content: postData.content || '',
      status: postData.status || 'published',
      readingTime,
      viewsCount: 0,
      clapsCount: 0,
      publishedAt: postData.status === 'published' ? now : (postData.publishedAt || null),
      updatedAt: now,
      canonicalUrl: postData.canonicalUrl || '',
      tagIds: postData.tagIds || [],
      revisions: [
        {
          id: `rev-${Date.now()}`,
          timestamp: now,
          title: postData.title || 'Initial draft',
          excerpt,
          content: postData.content || '',
          note: 'Initial snapshot'
        }
      ]
    };
    updatedList = [updatedPost, ...posts];
  }

  localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(updatedList));
  syncTagCounts();
  return updatedPost;
};

export const deletePost = (id) => {
  const posts = getPosts().filter(p => p.id !== id);
  localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(posts));
  syncTagCounts();
  return true;
};

export const incrementViews = (id) => {
  const posts = getPosts();
  const idx = posts.findIndex(p => p.id === id);
  if (idx !== -1) {
    posts[idx].viewsCount = (posts[idx].viewsCount || 0) + 1;
    localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(posts));
    return posts[idx].viewsCount;
  }
  return 0;
};

export const incrementClaps = (id, amount = 1) => {
  const posts = getPosts();
  const idx = posts.findIndex(p => p.id === id);
  if (idx !== -1) {
    posts[idx].clapsCount = (posts[idx].clapsCount || 0) + amount;
    localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(posts));
    return posts[idx].clapsCount;
  }
  return 0;
};

export const restorePostSnapshot = (postId, revisionId) => {
  const posts = getPosts();
  const idx = posts.findIndex(p => p.id === postId);
  if (idx === -1) return null;

  const post = posts[idx];
  const rev = post.revisions?.find(r => r.id === revisionId);
  if (!rev) return null;

  // Create snapshot of current state before restoration
  const newRevisions = [...(post.revisions || [])];
  newRevisions.unshift({
    id: `rev-${Date.now()}`,
    timestamp: new Date().toISOString(),
    title: post.title,
    excerpt: post.excerpt,
    content: post.content,
    note: `State prior to restoring snapshot ${revisionId}`
  });

  post.title = rev.title;
  post.excerpt = rev.excerpt;
  post.content = rev.content;
  post.readingTime = calculateReadingTime(rev.content);
  post.updatedAt = new Date().toISOString();
  post.revisions = newRevisions;

  posts[idx] = post;
  localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(posts));
  return post;
};

// ================= TAGS CRUD ================= //
export const getTags = () => {
  initStorage();
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.TAGS)) || [];
  } catch (e) {
    console.error('Error reading tags:', e);
    return INITIAL_TAGS;
  }
};

export const getTagBySlug = (slug) => {
  const tags = getTags();
  return tags.find(t => t.slug === slug);
};

export const saveTag = (tagData) => {
  const tags = getTags();
  const slug = tagData.slug?.trim() || tagData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  
  let updatedTag;
  let updatedList;

  if (tagData.id) {
    const idx = tags.findIndex(t => t.id === tagData.id);
    updatedTag = {
      ...tags[idx],
      ...tagData,
      slug
    };
    updatedList = [...tags];
    if (idx >= 0) updatedList[idx] = updatedTag;
  } else {
    // Check if slug or name exists
    const existing = tags.find(t => t.slug === slug || t.name.toLowerCase() === tagData.name.toLowerCase());
    if (existing) {
      return existing; // Guardrail against duplicate tag creation
    }

    const newId = `tag-${slug}-${Date.now().toString().slice(-4)}`;
    updatedTag = {
      id: newId,
      name: tagData.name,
      slug,
      color: tagData.color || '#2563EB',
      bgColor: tagData.bgColor || 'rgba(37, 99, 235, 0.12)',
      description: tagData.description || `Curated stories, analysis, and discussions under #${tagData.name}.`,
      postsCount: 0,
      followersCount: 1
    };
    updatedList = [...tags, updatedTag];
  }

  localStorage.setItem(STORAGE_KEYS.TAGS, JSON.stringify(updatedList));
  syncTagCounts();
  return updatedTag;
};

export const deleteTag = (id) => {
  const tags = getTags().filter(t => t.id !== id);
  localStorage.setItem(STORAGE_KEYS.TAGS, JSON.stringify(tags));
  // Disassociate tag from all posts
  const posts = getPosts().map(p => ({
    ...p,
    tagIds: (p.tagIds || []).filter(tid => tid !== id)
  }));
  localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(posts));
  return true;
};

export const syncTagCounts = () => {
  const posts = getPosts();
  const tags = getTags();

  const countMap = {};
  posts.forEach(post => {
    if (post.status === 'published' && post.tagIds) {
      post.tagIds.forEach(tid => {
        countMap[tid] = (countMap[tid] || 0) + 1;
      });
    }
  });

  const updatedTags = tags.map(tag => ({
    ...tag,
    postsCount: countMap[tag.id] || 0
  }));

  localStorage.setItem(STORAGE_KEYS.TAGS, JSON.stringify(updatedTags));
};

// ================= COMMENTS CRUD ================= //
export const getComments = (postId) => {
  initStorage();
  try {
    const all = JSON.parse(localStorage.getItem(STORAGE_KEYS.COMMENTS)) || [];
    return all.filter(c => c.postId === postId);
  } catch (e) {
    console.error('Error reading comments:', e);
    return [];
  }
};

export const addComment = ({ postId, parentId = null, content, user = INITIAL_USER }) => {
  const allComments = JSON.parse(localStorage.getItem(STORAGE_KEYS.COMMENTS)) || [];
  const now = new Date().toISOString();

  const newComment = {
    id: `comm-${Date.now()}`,
    postId,
    parentId: parentId || null,
    userId: user.id,
    user: user,
    content: content.trim(),
    isPinned: false,
    status: 'visible',
    upvotesCount: 0,
    createdAt: now,
    updatedAt: now
  };

  const updated = [newComment, ...allComments];
  localStorage.setItem(STORAGE_KEYS.COMMENTS, JSON.stringify(updated));
  return newComment;
};

export const editComment = (commentId, newContent) => {
  const allComments = JSON.parse(localStorage.getItem(STORAGE_KEYS.COMMENTS)) || [];
  const idx = allComments.findIndex(c => c.id === commentId);
  if (idx === -1) return null;

  allComments[idx].content = newContent.trim();
  allComments[idx].updatedAt = new Date().toISOString();
  allComments[idx].isEdited = true;

  localStorage.setItem(STORAGE_KEYS.COMMENTS, JSON.stringify(allComments));
  return allComments[idx];
};

export const softDeleteComment = (commentId) => {
  const allComments = JSON.parse(localStorage.getItem(STORAGE_KEYS.COMMENTS)) || [];
  const idx = allComments.findIndex(c => c.id === commentId);
  if (idx === -1) return null;

  allComments[idx].status = 'deleted';
  allComments[idx].content = '[Comment deleted by user]';
  allComments[idx].updatedAt = new Date().toISOString();

  localStorage.setItem(STORAGE_KEYS.COMMENTS, JSON.stringify(allComments));
  return allComments[idx];
};

export const toggleUpvoteComment = (commentId, userId = INITIAL_USER.id) => {
  const allComments = JSON.parse(localStorage.getItem(STORAGE_KEYS.COMMENTS)) || [];
  const upvoteMap = JSON.parse(localStorage.getItem(STORAGE_KEYS.USER_UPVOTES)) || {};
  const idx = allComments.findIndex(c => c.id === commentId);
  if (idx === -1) return null;

  const key = `${userId}_${commentId}`;
  const hasUpvoted = !!upvoteMap[key];

  if (hasUpvoted) {
    allComments[idx].upvotesCount = Math.max(0, (allComments[idx].upvotesCount || 1) - 1);
    delete upvoteMap[key];
  } else {
    allComments[idx].upvotesCount = (allComments[idx].upvotesCount || 0) + 1;
    upvoteMap[key] = true;
  }

  localStorage.setItem(STORAGE_KEYS.COMMENTS, JSON.stringify(allComments));
  localStorage.setItem(STORAGE_KEYS.USER_UPVOTES, JSON.stringify(upvoteMap));
  return {
    upvotesCount: allComments[idx].upvotesCount,
    hasUpvoted: !hasUpvoted
  };
};

export const togglePinComment = (commentId) => {
  const allComments = JSON.parse(localStorage.getItem(STORAGE_KEYS.COMMENTS)) || [];
  const idx = allComments.findIndex(c => c.id === commentId);
  if (idx === -1) return null;

  allComments[idx].isPinned = !allComments[idx].isPinned;
  localStorage.setItem(STORAGE_KEYS.COMMENTS, JSON.stringify(allComments));
  return allComments[idx];
};

export const flagComment = (commentId) => {
  const allComments = JSON.parse(localStorage.getItem(STORAGE_KEYS.COMMENTS)) || [];
  const idx = allComments.findIndex(c => c.id === commentId);
  if (idx === -1) return null;

  allComments[idx].status = 'flagged';
  localStorage.setItem(STORAGE_KEYS.COMMENTS, JSON.stringify(allComments));
  return allComments[idx];
};

// ================= BOOKMARKS & FOLLOWS ================= //
export const getBookmarks = () => {
  initStorage();
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.BOOKMARKS)) || [];
  } catch (e) {
    return [];
  }
};

export const toggleBookmark = (postId) => {
  const bookmarks = getBookmarks();
  const exists = bookmarks.includes(postId);
  const updated = exists ? bookmarks.filter(id => id !== postId) : [...bookmarks, postId];
  localStorage.setItem(STORAGE_KEYS.BOOKMARKS, JSON.stringify(updated));
  return !exists;
};

export const getFollowedTagIds = () => {
  initStorage();
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.FOLLOWED_TAGS)) || [];
  } catch (e) {
    return [];
  }
};

export const toggleFollowTag = (tagId) => {
  const followed = getFollowedTagIds();
  const exists = followed.includes(tagId);
  const updated = exists ? followed.filter(id => id !== tagId) : [...followed, tagId];
  localStorage.setItem(STORAGE_KEYS.FOLLOWED_TAGS, JSON.stringify(updated));

  // Update tag follower count optimistically
  const tags = getTags();
  const idx = tags.findIndex(t => t.id === tagId);
  if (idx !== -1) {
    tags[idx].followersCount = (tags[idx].followersCount || 0) + (exists ? -1 : 1);
    localStorage.setItem(STORAGE_KEYS.TAGS, JSON.stringify(tags));
  }

  return !exists;
};

// ================= DRAFT PERSISTENCE ================= //
export const saveEditorDraft = (draft) => {
  try {
    localStorage.setItem(STORAGE_KEYS.DRAFT_BACKUP, JSON.stringify(draft));
  } catch (e) {
    console.error('Error saving draft backup:', e);
  }
};

export const getEditorDraft = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.DRAFT_BACKUP)) || null;
  } catch (e) {
    return null;
  }
};

export const clearEditorDraft = () => {
  localStorage.removeItem(STORAGE_KEYS.DRAFT_BACKUP);
};
