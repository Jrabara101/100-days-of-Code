export type SectionType = 
  | 'summary'
  | 'experience'
  | 'capabilities'
  | 'education'
  | 'patents'
  | 'custom';

export interface ExperienceItem {
  id: string;
  role: string;
  company: string;
  startDate: string;
  endDate: string;
  location: string;
  isCurrent: boolean;
  bullets: string[];
}

export interface EducationItem {
  id: string;
  degree: string;
  institution: string;
  graduationYear: string;
  location: string;
  honors?: string;
}

export interface PatentItem {
  id: string;
  title: string;
  patentNumberOrSource: string;
  dateOrStars: string;
  description: string;
}

export interface CapabilityCategory {
  id: string;
  category: string;
  skills: { name: string; proficiency?: number }[];
}

export interface ResumeHeader {
  fullName: string;
  roleTitle: string;
  secondaryTitle: string;
  location: string;
  email: string;
  github: string;
  phone: string;
  website?: string;
}

export interface ResumeSection {
  id: string;
  type: SectionType;
  title: string;
  isVisible: boolean;
  content: {
    text?: string;
    items?: ExperienceItem[];
    education?: EducationItem[];
    patents?: PatentItem[];
    capabilities?: CapabilityCategory[];
  };
}

export type FontFamilyChoice = 'Inter' | 'Merriweather' | 'Roboto Mono' | 'Cinzel';
export type DensityChoice = 'compact' | 'normal' | 'relaxed';
export type FontScaleChoice = '10pt' | '11pt' | '12pt';
export type LayoutPreset = 'Modern Split' | 'Minimal Single' | 'Executive Dual' | 'Technical Grid';

export interface ResumeStyle {
  fontFamily: FontFamilyChoice;
  fontSize: FontScaleChoice; // 10pt | 11pt | 12pt
  lineHeight: number; // 1.1 - 1.8
  density: DensityChoice; // compact | normal | relaxed
  primaryColor: string; // Hex color: '#0f172a' (Obsidian), '#4f46e5' (Indigo), '#059669' (Emerald), etc.
  primaryColorName: string;
  layoutPreset: LayoutPreset;
  pagePadding: number; // px
}

export interface DocumentState {
  header: ResumeHeader;
  sections: ResumeSection[];
  styles: ResumeStyle;
}

export type ViewMode = 'editor' | 'split' | 'preview';
export type CanvasTool = 'select' | 'pan';

export interface AtsDiagnosticResult {
  score: number; // 0 - 100
  rating: 'Strong Fit' | 'Competitive' | 'Needs Improvement';
  actionVerbCount: number;
  foundActionVerbs: string[];
  wordCount: number;
  targetRolePresent: boolean;
  bulletCount: number;
  metricsRatio: number; // percentage of bullets with numbers/metrics
  recommendations: string[];
}
