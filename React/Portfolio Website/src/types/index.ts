export type PostStage = 'seedling' | 'budding' | 'evergreen';
export type PostStatus = 'draft' | 'published';

export interface Post {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  stage: PostStage;
  status: PostStatus;
  view_count: number;
  claps_count: number;
  published_at: string;
  updated_at: string;
  tags: string[];
  readTimeMinutes: number;
  coverImage?: string;
  featured?: boolean;
}

export type InquiryIntent = 
  | 'project_engagement' 
  | 'design_systems' 
  | 'advisory_speaking' 
  | 'coffee_chat';

export type BudgetTier = 'under_10k' | '10k_25k' | '25k_plus' | null;

export type InquiryStatus = 'new' | 'reviewed' | 'replied' | 'archived';

export interface Inquiry {
  id: string;
  sender_name: string;
  sender_email: string;
  intent: InquiryIntent;
  budget_tier?: BudgetTier;
  message: string;
  timeline?: string;
  status: InquiryStatus;
  ip_hash: string;
  created_at: string;
  notes?: string;
}

export interface CaseStudyKPI {
  label: string;
  value: string;
  hint?: string;
}

export interface CaseStudy {
  id: string;
  title: string;
  client: string;
  role: string;
  year: string;
  tagline: string;
  kpis: CaseStudyKPI[];
  tags: string[];
  overview: string;
  challenge: string;
  solution: string;
  architecture: string[];
  impact: string;
  beforeAfter?: {
    before: string;
    after: string;
    beforeLabel: string;
    afterLabel: string;
  };
  heroImage: string;
  demoUrl?: string;
  githubUrl?: string;
  featured?: boolean;
}

export interface NewsletterSubscriber {
  id: string;
  email: string;
  created_at: string;
  source_slug?: string;
}

export interface PersonalPulse {
  availability: 'available' | 'limited' | 'booked';
  availabilityLabel: string;
  availabilityQuarter: string;
  location: string;
  timezone: string;
  timeOffset: string;
  currentlyReading: {
    title: string;
    author: string;
    url?: string;
  };
  currentlyShipping: {
    title: string;
    description: string;
  };
  currentObsession: string;
}
