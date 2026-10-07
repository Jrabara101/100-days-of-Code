import { Post, CaseStudy, Inquiry, InquiryStatus, NewsletterSubscriber, PersonalPulse } from '../types';
import { initialPosts, initialCaseStudies, initialInquiries, initialPulse } from '../data/seedData';
import { supabase, isSupabaseConfigured } from './supabaseClient';

const STORAGE_KEYS = {
  POSTS: 'atelier_portfolio_posts_v1',
  INQUIRIES: 'atelier_portfolio_inquiries_v1',
  SUBSCRIBERS: 'atelier_portfolio_subscribers_v1',
  CASE_STUDIES: 'atelier_portfolio_case_studies_v1',
  PULSE: 'atelier_portfolio_pulse_v1',
  USER_CLAPS_PREFIX: 'atelier_user_claps_',
};

// Initialize localStorage with seeds if not present
function initializeStore() {
  if (typeof window === 'undefined') return;

  if (!localStorage.getItem(STORAGE_KEYS.POSTS)) {
    localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(initialPosts));
  }
  if (!localStorage.getItem(STORAGE_KEYS.INQUIRIES)) {
    localStorage.setItem(STORAGE_KEYS.INQUIRIES, JSON.stringify(initialInquiries));
  }
  if (!localStorage.getItem(STORAGE_KEYS.CASE_STUDIES)) {
    localStorage.setItem(STORAGE_KEYS.CASE_STUDIES, JSON.stringify(initialCaseStudies));
  }
  if (!localStorage.getItem(STORAGE_KEYS.PULSE)) {
    localStorage.setItem(STORAGE_KEYS.PULSE, JSON.stringify(initialPulse));
  }
  if (!localStorage.getItem(STORAGE_KEYS.SUBSCRIBERS)) {
    localStorage.setItem(STORAGE_KEYS.SUBSCRIBERS, JSON.stringify([]));
  }
}

initializeStore();

export const StorageEngine = {
  // --- Posts ---
  async getPosts(includeDrafts = false): Promise<Post[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        let query = supabase.from('posts').select('*').order('published_at', { ascending: false });
        if (!includeDrafts) {
          query = query.eq('status', 'published');
        }
        const { data, error } = await query;
        if (!error && data && data.length > 0) {
          return data as Post[];
        }
      } catch (err) {
        console.warn('Supabase fetch failed, falling back to local storage', err);
      }
    }

    const raw = localStorage.getItem(STORAGE_KEYS.POSTS);
    const posts: Post[] = raw ? JSON.parse(raw) : initialPosts;
    return includeDrafts ? posts : posts.filter(p => p.status === 'published');
  },

  async getPostBySlug(slug: string): Promise<Post | null> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('posts')
          .select('*')
          .eq('slug', slug)
          .single();
        if (!error && data) return data as Post;
      } catch (err) {
        console.warn('Supabase getPostBySlug failed, falling back to local storage', err);
      }
    }

    const posts = await this.getPosts(true);
    return posts.find(p => p.slug === slug) || null;
  },

  async savePost(post: Partial<Post> & { title: string; content: string }): Promise<Post> {
    const raw = localStorage.getItem(STORAGE_KEYS.POSTS);
    const posts: Post[] = raw ? JSON.parse(raw) : [...initialPosts];
    
    // Auto-calculate reading time: ~200 words per minute
    const words = post.content.trim().split(/\s+/).length;
    const readTimeMinutes = Math.max(1, Math.ceil(words / 200));

    // Auto-generate slug if empty
    const slug = post.slug || post.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const now = new Date().toISOString();
    let savedPost: Post;

    if (post.id) {
      // Update
      const index = posts.findIndex(p => p.id === post.id);
      if (index >= 0) {
        savedPost = {
          ...posts[index],
          ...post,
          slug,
          readTimeMinutes,
          updated_at: now,
        };
        posts[index] = savedPost;
      } else {
        savedPost = {
          id: post.id,
          slug,
          title: post.title,
          excerpt: post.excerpt || post.content.slice(0, 160) + '...',
          content: post.content,
          stage: post.stage || 'seedling',
          status: post.status || 'draft',
          view_count: post.view_count || 0,
          claps_count: post.claps_count || 0,
          published_at: post.published_at || now,
          updated_at: now,
          tags: post.tags || ['Design'],
          readTimeMinutes,
          coverImage: post.coverImage,
        };
        posts.unshift(savedPost);
      }
    } else {
      // Create new
      savedPost = {
        id: `post-${Date.now()}`,
        slug,
        title: post.title,
        excerpt: post.excerpt || post.content.slice(0, 160) + '...',
        content: post.content,
        stage: post.stage || 'seedling',
        status: post.status || 'draft',
        view_count: 0,
        claps_count: 0,
        published_at: post.status === 'published' ? now : '',
        updated_at: now,
        tags: post.tags || ['Digital Garden'],
        readTimeMinutes,
        coverImage: post.coverImage,
      };
      posts.unshift(savedPost);
    }

    localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(posts));

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('posts').upsert(savedPost);
      } catch (e) {
        console.warn('Supabase post upsert error', e);
      }
    }

    return savedPost;
  },

  async deletePost(id: string): Promise<boolean> {
    const raw = localStorage.getItem(STORAGE_KEYS.POSTS);
    if (!raw) return false;
    const posts: Post[] = JSON.parse(raw);
    const filtered = posts.filter(p => p.id !== id);
    localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(filtered));

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('posts').delete().eq('id', id);
      } catch (e) {
        console.warn('Supabase post delete error', e);
      }
    }
    return true;
  },

  async incrementClaps(postId: string, amount = 1): Promise<number> {
    const raw = localStorage.getItem(STORAGE_KEYS.POSTS);
    if (!raw) return 0;
    const posts: Post[] = JSON.parse(raw);
    const post = posts.find(p => p.id === postId);
    if (!post) return 0;

    post.claps_count = (post.claps_count || 0) + amount;
    localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(posts));

    // Record user claps locally
    const userClapKey = `${STORAGE_KEYS.USER_CLAPS_PREFIX}${postId}`;
    const curUserClaps = parseInt(localStorage.getItem(userClapKey) || '0', 10);
    localStorage.setItem(userClapKey, Math.min(50, curUserClaps + amount).toString());

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.rpc('increment_post_claps', { post_id: postId, amount });
      } catch (e) {
        // Fallback
        await supabase.from('posts').update({ claps_count: post.claps_count }).eq('id', postId);
      }
    }

    return post.claps_count;
  },

  getUserClapsForPost(postId: string): number {
    if (typeof window === 'undefined') return 0;
    const userClapKey = `${STORAGE_KEYS.USER_CLAPS_PREFIX}${postId}`;
    return parseInt(localStorage.getItem(userClapKey) || '0', 10);
  },

  async incrementViews(postId: string): Promise<number> {
    const raw = localStorage.getItem(STORAGE_KEYS.POSTS);
    if (!raw) return 0;
    const posts: Post[] = JSON.parse(raw);
    const post = posts.find(p => p.id === postId);
    if (!post) return 0;

    post.view_count = (post.view_count || 0) + 1;
    localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(posts));

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('posts').update({ view_count: post.view_count }).eq('id', postId);
      } catch (e) {
        console.warn('Supabase views update error', e);
      }
    }

    return post.view_count;
  },

  // --- Inquiries (Contact CRM) ---
  async getInquiries(): Promise<Inquiry[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('inquiries')
          .select('*')
          .order('created_at', { ascending: false });
        if (!error && data && data.length > 0) return data as Inquiry[];
      } catch (err) {
        console.warn('Supabase getInquiries failed, falling back to local storage', err);
      }
    }

    const raw = localStorage.getItem(STORAGE_KEYS.INQUIRIES);
    return raw ? JSON.parse(raw) : initialInquiries;
  },

  async submitInquiry(inquiryData: {
    sender_name: string;
    sender_email: string;
    intent: Inquiry['intent'];
    budget_tier?: Inquiry['budget_tier'];
    message: string;
    timeline?: string;
  }): Promise<Inquiry> {
    // Basic pseudo IP-hash calculation for anti-spam tracking
    const randomHash = Math.random().toString(36).substring(2, 8);
    const ip_hash = `${randomHash}...${Date.now().toString(36).substring(3, 7)}`;

    const newInquiry: Inquiry = {
      id: `inq-${Date.now()}`,
      ...inquiryData,
      status: 'new',
      ip_hash,
      created_at: new Date().toISOString(),
    };

    const raw = localStorage.getItem(STORAGE_KEYS.INQUIRIES);
    const inquiries: Inquiry[] = raw ? JSON.parse(raw) : [...initialInquiries];
    inquiries.unshift(newInquiry);
    localStorage.setItem(STORAGE_KEYS.INQUIRIES, JSON.stringify(inquiries));

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('inquiries').insert(newInquiry);
      } catch (e) {
        console.warn('Supabase inquiry insert error', e);
      }
    }

    return newInquiry;
  },

  async updateInquiryStatus(id: string, status: InquiryStatus, notes?: string): Promise<Inquiry | null> {
    const raw = localStorage.getItem(STORAGE_KEYS.INQUIRIES);
    if (!raw) return null;
    const inquiries: Inquiry[] = JSON.parse(raw);
    const target = inquiries.find(i => i.id === id);
    if (!target) return null;

    target.status = status;
    if (notes !== undefined) {
      target.notes = notes;
    }

    localStorage.setItem(STORAGE_KEYS.INQUIRIES, JSON.stringify(inquiries));

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('inquiries').update({ status, notes: target.notes }).eq('id', id);
      } catch (e) {
        console.warn('Supabase update inquiry error', e);
      }
    }

    return target;
  },

  async deleteInquiry(id: string): Promise<boolean> {
    const raw = localStorage.getItem(STORAGE_KEYS.INQUIRIES);
    if (!raw) return false;
    const inquiries: Inquiry[] = JSON.parse(raw);
    const filtered = inquiries.filter(i => i.id !== id);
    localStorage.setItem(STORAGE_KEYS.INQUIRIES, JSON.stringify(filtered));

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('inquiries').delete().eq('id', id);
      } catch (e) {
        console.warn('Supabase delete inquiry error', e);
      }
    }
    return true;
  },

  // --- Newsletter ---
  async subscribeNewsletter(email: string, source_slug?: string): Promise<{ success: boolean; message: string }> {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { success: false, message: 'Please provide a valid email address.' };
    }

    const raw = localStorage.getItem(STORAGE_KEYS.SUBSCRIBERS);
    const subscribers: NewsletterSubscriber[] = raw ? JSON.parse(raw) : [];

    if (subscribers.some(s => s.email.toLowerCase() === email.toLowerCase())) {
      return { success: true, message: 'You are already subscribed to the digital garden essays!' };
    }

    const newSub: NewsletterSubscriber = {
      id: `sub-${Date.now()}`,
      email: email.toLowerCase().trim(),
      created_at: new Date().toISOString(),
      source_slug,
    };

    subscribers.push(newSub);
    localStorage.setItem(STORAGE_KEYS.SUBSCRIBERS, JSON.stringify(subscribers));

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('newsletter_subscribers').insert(newSub);
      } catch (e) {
        console.warn('Supabase newsletter insert error', e);
      }
    }

    return { success: true, message: 'Welcome to the inner circle. New essays will land directly in your inbox.' };
  },

  async getNewsletterSubscribers(): Promise<NewsletterSubscriber[]> {
    const raw = localStorage.getItem(STORAGE_KEYS.SUBSCRIBERS);
    return raw ? JSON.parse(raw) : [];
  },

  // --- Case Studies ---
  async getCaseStudies(): Promise<CaseStudy[]> {
    const raw = localStorage.getItem(STORAGE_KEYS.CASE_STUDIES);
    return raw ? JSON.parse(raw) : initialCaseStudies;
  },

  async getCaseStudyById(id: string): Promise<CaseStudy | null> {
    const studies = await this.getCaseStudies();
    return studies.find(s => s.id === id) || null;
  },

  // --- Personal Pulse ---
  async getPulse(): Promise<PersonalPulse> {
    const raw = localStorage.getItem(STORAGE_KEYS.PULSE);
    return raw ? JSON.parse(raw) : initialPulse;
  },

  async updatePulse(pulse: PersonalPulse): Promise<PersonalPulse> {
    localStorage.setItem(STORAGE_KEYS.PULSE, JSON.stringify(pulse));
    return pulse;
  },

  // --- Backup & Restore ---
  exportAllData() {
    return {
      version: '1.0',
      exported_at: new Date().toISOString(),
      posts: JSON.parse(localStorage.getItem(STORAGE_KEYS.POSTS) || '[]'),
      inquiries: JSON.parse(localStorage.getItem(STORAGE_KEYS.INQUIRIES) || '[]'),
      subscribers: JSON.parse(localStorage.getItem(STORAGE_KEYS.SUBSCRIBERS) || '[]'),
      caseStudies: JSON.parse(localStorage.getItem(STORAGE_KEYS.CASE_STUDIES) || '[]'),
      pulse: JSON.parse(localStorage.getItem(STORAGE_KEYS.PULSE) || '{}'),
    };
  },

  importData(jsonString: string): boolean {
    try {
      const data = JSON.parse(jsonString);
      if (data.posts) localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(data.posts));
      if (data.inquiries) localStorage.setItem(STORAGE_KEYS.INQUIRIES, JSON.stringify(data.inquiries));
      if (data.subscribers) localStorage.setItem(STORAGE_KEYS.SUBSCRIBERS, JSON.stringify(data.subscribers));
      if (data.caseStudies) localStorage.setItem(STORAGE_KEYS.CASE_STUDIES, JSON.stringify(data.caseStudies));
      if (data.pulse) localStorage.setItem(STORAGE_KEYS.PULSE, JSON.stringify(data.pulse));
      return true;
    } catch {
      return false;
    }
  },

  resetToInitial() {
    localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(initialPosts));
    localStorage.setItem(STORAGE_KEYS.INQUIRIES, JSON.stringify(initialInquiries));
    localStorage.setItem(STORAGE_KEYS.CASE_STUDIES, JSON.stringify(initialCaseStudies));
    localStorage.setItem(STORAGE_KEYS.PULSE, JSON.stringify(initialPulse));
    localStorage.setItem(STORAGE_KEYS.SUBSCRIBERS, JSON.stringify([]));
  }
};
