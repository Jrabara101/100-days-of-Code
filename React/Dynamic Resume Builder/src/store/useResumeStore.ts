import { create } from 'zustand';
import {
  DocumentState,
  ResumeSection,
  ResumeStyle,
  ResumeHeader,
  ExperienceItem,
  ViewMode,
  CanvasTool,
} from '../types/resume';
import { autoEnhanceDoc } from '../utils/atsDiagnostics';

const INITIAL_STYLES: ResumeStyle = {
  fontFamily: 'Inter',
  fontSize: '11pt',
  lineHeight: 1.45,
  density: 'normal',
  primaryColor: '#0f172a', // Obsidian
  primaryColorName: 'Obsidian',
  layoutPreset: 'Modern Split',
  pagePadding: 48,
};

const INITIAL_HEADER: ResumeHeader = {
  fullName: 'ALEXANDER CHEN',
  roleTitle: 'Staff Design Technologist',
  secondaryTitle: 'UI Architect',
  location: 'San Francisco, CA',
  email: 'alex.chen@spatial.design',
  github: 'github.com/alexchen',
  phone: '+1 (415) 892-0192',
};

const INITIAL_SECTIONS: ResumeSection[] = [
  {
    id: 'sec-summary',
    type: 'summary',
    title: 'Executive Summary',
    isVisible: true,
    content: {
      text: 'Design Technologist with 9+ years bridging high-fidelity interaction craft and ultra-scalable production systems. Pioneer in tokenized UI architectures, multi-platform design compiler infrastructure, and spatial web experiences across web, canvas, and WebGL runtimes. Proven leader delivering low-latency design pipelines for Tier-1 technology companies.',
    },
  },
  {
    id: 'sec-experience',
    type: 'experience',
    title: 'Professional Experience',
    isVisible: true,
    content: {
      items: [
        {
          id: 'exp-stripe',
          role: 'Staff Design Technologist',
          company: 'Stripe',
          startDate: '2022',
          endDate: 'Present',
          location: 'San Francisco, CA',
          isCurrent: true,
          bullets: [
            'Scaled design token architecture across 42 web surfaces, decreasing engineering handoff time by 34% and accelerating release cycles.',
            'Architected headless design system components handling 18M+ daily checkout sessions with strict sub-50ms render latency.',
            'Mentored team of 14 front-end engineers and designers in accessible WCAG AAA patterns and high-performance WebGL visualization.',
          ],
        },
        {
          id: 'exp-airbnb',
          role: 'Senior UI Architect',
          company: 'Airbnb',
          startDate: '2019',
          endDate: '2022',
          location: 'San Francisco, CA',
          isCurrent: false,
          bullets: [
            'Formulated core design token compilers converting Figma styles to multi-platform CSS, Swift, and Jetpack Compose tokens.',
            'Created browser-based vector layout rendering engine reducing interactive mockup latency by 58%.',
            'Authored universal motion primitives standard adopted by 120+ cross-functional platform engineers.',
          ],
        },
        {
          id: 'exp-palantir',
          role: 'Lead Design Systems Engineer',
          company: 'Palantir Technologies',
          startDate: '2016',
          endDate: '2019',
          location: 'Palo Alto, CA',
          isCurrent: false,
          bullets: [
            'Constructed Blueprint UI data visualization library rendering up to 200,000 real-time nodes on canvas.',
            'Standardized developer documentation portals driving 94% component reuse across 6 foundational mission suites.',
          ],
        },
      ],
    },
  },
  {
    id: 'sec-capabilities',
    type: 'capabilities',
    title: 'Technical Competencies',
    isVisible: true,
    content: {
      capabilities: [
        {
          id: 'cap-1',
          category: 'Languages',
          skills: [
            { name: 'TypeScript', proficiency: 95 },
            { name: 'Rust', proficiency: 85 },
            { name: 'GLSL', proficiency: 80 },
            { name: 'HTML5/CSS3', proficiency: 98 },
          ],
        },
        {
          id: 'cap-2',
          category: 'Frameworks',
          skills: [
            { name: 'React', proficiency: 98 },
            { name: 'Next.js', proficiency: 92 },
            { name: 'WebGL / Canvas', proficiency: 92 },
            { name: 'Tailwind CSS', proficiency: 96 },
          ],
        },
        {
          id: 'cap-3',
          category: 'Methodologies',
          skills: [
            { name: 'Design Systems', proficiency: 98 },
            { name: 'Token Architecture', proficiency: 95 },
            { name: 'WCAG AAA', proficiency: 90 },
            { name: 'ATS Tuning', proficiency: 100 },
          ],
        },
      ],
    },
  },
  {
    id: 'sec-patents',
    type: 'patents',
    title: 'Patents & Open Source',
    isVisible: true,
    content: {
      patents: [
        {
          id: 'pat-1',
          title: 'Dynamic Token Compiler for Vector Interfaces',
          patentNumberOrSource: 'US Patent 11,489,201',
          dateOrStars: 'Granted 2023',
          description: 'Method and apparatus for instant hot-reloading of visual variables across heterogenous runtime environments.',
        },
        {
          id: 'pat-2',
          title: 'Spatial-Engine-Core (Creator & Maintainer)',
          patentNumberOrSource: 'GitHub: 4.8k Stars',
          dateOrStars: 'Active',
          description: 'High-performance canvas layout math engine designed for real-time document manipulation.',
        },
      ],
    },
  },
  {
    id: 'sec-education',
    type: 'education',
    title: 'Education',
    isVisible: true,
    content: {
      education: [
        {
          id: 'edu-berkeley',
          degree: 'B.S. Computer Science & Human Computer Interaction',
          institution: 'UC Berkeley',
          graduationYear: '2016',
          location: 'Berkeley, CA',
          honors: 'Magna Cum Laude',
        },
      ],
    },
  },
];

const MAX_HISTORY = 30;

export interface ResumeStore {
  // Document State
  present: DocumentState;
  past: DocumentState[];
  future: DocumentState[];
  canUndo: boolean;
  canRedo: boolean;

  // Workspace View State
  viewMode: ViewMode;
  zoom: number; // 0.5 to 1.5
  canvasTool: CanvasTool;
  activeSectionId: string | null;
  documentTitle: string;
  isAutoSaved: boolean;

  // Actions
  undo: () => void;
  redo: () => void;
  updateHeader: (updates: Partial<ResumeHeader>) => void;
  updateSection: (id: string, updates: Partial<ResumeSection>) => void;
  reorderSections: (newSections: ResumeSection[]) => void;
  moveSection: (fromIndex: number, toIndex: number) => void;
  toggleSectionVisibility: (id: string) => void;
  
  // Experience sub-actions
  updateExperienceItem: (sectionId: string, itemId: string, updates: Partial<ExperienceItem>) => void;
  addExperienceItem: (sectionId: string) => void;
  deleteExperienceItem: (sectionId: string, itemId: string) => void;
  updateBullet: (sectionId: string, itemId: string, bulletIndex: number, text: string) => void;
  addBullet: (sectionId: string, itemId: string, text?: string) => void;
  deleteBullet: (sectionId: string, itemId: string, bulletIndex: number) => void;

  // Style actions
  updateStyles: (styles: Partial<ResumeStyle>) => void;
  resetStyles: () => void;

  // View & Tool actions
  setViewMode: (mode: ViewMode) => void;
  setZoom: (zoom: number) => void;
  setCanvasTool: (tool: CanvasTool) => void;
  setActiveSectionId: (id: string | null) => void;
  setDocumentTitle: (title: string) => void;
  applyAutoTune: () => number;
}

export const useResumeStore = create<ResumeStore>((set, get) => ({
  present: {
    header: INITIAL_HEADER,
    sections: INITIAL_SECTIONS,
    styles: INITIAL_STYLES,
  },
  past: [],
  future: [],
  canUndo: false,
  canRedo: false,

  viewMode: 'split',
  zoom: 1.0,
  canvasTool: 'select',
  activeSectionId: 'sec-summary',
  documentTitle: 'Senior_Product_Designer_Resume_2025.pdf',
  isAutoSaved: true,

  undo: () => {
    const { past, present, future } = get();
    if (past.length === 0) return;

    const previous = past[past.length - 1];
    const newPast = past.slice(0, past.length - 1);

    set({
      past: newPast,
      present: previous,
      future: [present, ...future],
      canUndo: newPast.length > 0,
      canRedo: true,
      isAutoSaved: true,
    });
  },

  redo: () => {
    const { past, present, future } = get();
    if (future.length === 0) return;

    const next = future[0];
    const newFuture = future.slice(1);

    set({
      past: [...past, present],
      present: next,
      future: newFuture,
      canUndo: true,
      canRedo: newFuture.length > 0,
      isAutoSaved: true,
    });
  },

  updateHeader: (updates) => {
    const { present, past } = get();
    const newPast = [...past, present].slice(-MAX_HISTORY);
    set({
      past: newPast,
      present: {
        ...present,
        header: { ...present.header, ...updates },
      },
      future: [],
      canUndo: true,
      canRedo: false,
      isAutoSaved: true,
    });
  },

  updateSection: (id, updates) => {
    const { present, past } = get();
    const newPast = [...past, present].slice(-MAX_HISTORY);
    const newSections = present.sections.map((sec) =>
      sec.id === id ? { ...sec, ...updates } : sec
    );
    set({
      past: newPast,
      present: { ...present, sections: newSections },
      future: [],
      canUndo: true,
      canRedo: false,
      isAutoSaved: true,
    });
  },

  reorderSections: (newSections) => {
    const { present, past } = get();
    set({
      past: [...past, present].slice(-MAX_HISTORY),
      present: { ...present, sections: newSections },
      future: [],
      canUndo: true,
      canRedo: false,
      isAutoSaved: true,
    });
  },

  moveSection: (fromIndex, toIndex) => {
    const { present, past } = get();
    if (toIndex < 0 || toIndex >= present.sections.length) return;
    const newSections = [...present.sections];
    const [moved] = newSections.splice(fromIndex, 1);
    newSections.splice(toIndex, 0, moved);

    set({
      past: [...past, present].slice(-MAX_HISTORY),
      present: { ...present, sections: newSections },
      future: [],
      canUndo: true,
      canRedo: false,
      isAutoSaved: true,
    });
  },

  toggleSectionVisibility: (id) => {
    const { present, past } = get();
    const newSections = present.sections.map((sec) =>
      sec.id === id ? { ...sec, isVisible: !sec.isVisible } : sec
    );
    set({
      past: [...past, present].slice(-MAX_HISTORY),
      present: { ...present, sections: newSections },
      future: [],
      canUndo: true,
      canRedo: false,
      isAutoSaved: true,
    });
  },

  updateExperienceItem: (sectionId, itemId, updates) => {
    const { present, past } = get();
    const newPast = [...past, present].slice(-MAX_HISTORY);
    const newSections = present.sections.map((sec) => {
      if (sec.id !== sectionId || !sec.content.items) return sec;
      const newItems = sec.content.items.map((item) =>
        item.id === itemId ? { ...item, ...updates } : item
      );
      return { ...sec, content: { ...sec.content, items: newItems } };
    });

    set({
      past: newPast,
      present: { ...present, sections: newSections },
      future: [],
      canUndo: true,
      canRedo: false,
      isAutoSaved: true,
    });
  },

  addExperienceItem: (sectionId) => {
    const { present, past } = get();
    const newPast = [...past, present].slice(-MAX_HISTORY);
    const newItem: ExperienceItem = {
      id: `exp-${Date.now()}`,
      role: 'New Role Title',
      company: 'Company Name',
      startDate: '2024',
      endDate: 'Present',
      location: 'City, Country',
      isCurrent: true,
      bullets: ['Pioneered initiative resulting in 25% efficiency gain.'],
    };

    const newSections = present.sections.map((sec) => {
      if (sec.id !== sectionId) return sec;
      return {
        ...sec,
        content: {
          ...sec.content,
          items: [newItem, ...(sec.content.items || [])],
        },
      };
    });

    set({
      past: newPast,
      present: { ...present, sections: newSections },
      future: [],
      canUndo: true,
      canRedo: false,
      isAutoSaved: true,
    });
  },

  deleteExperienceItem: (sectionId, itemId) => {
    const { present, past } = get();
    const newPast = [...past, present].slice(-MAX_HISTORY);
    const newSections = present.sections.map((sec) => {
      if (sec.id !== sectionId || !sec.content.items) return sec;
      return {
        ...sec,
        content: {
          ...sec.content,
          items: sec.content.items.filter((item) => item.id !== itemId),
        },
      };
    });

    set({
      past: newPast,
      present: { ...present, sections: newSections },
      future: [],
      canUndo: true,
      canRedo: false,
      isAutoSaved: true,
    });
  },

  updateBullet: (sectionId, itemId, bulletIndex, text) => {
    const { present, past } = get();
    const newPast = [...past, present].slice(-MAX_HISTORY);
    const newSections = present.sections.map((sec) => {
      if (sec.id !== sectionId || !sec.content.items) return sec;
      const newItems = sec.content.items.map((item) => {
        if (item.id !== itemId) return item;
        const newBullets = [...item.bullets];
        newBullets[bulletIndex] = text;
        return { ...item, bullets: newBullets };
      });
      return { ...sec, content: { ...sec.content, items: newItems } };
    });

    set({
      past: newPast,
      present: { ...present, sections: newSections },
      future: [],
      canUndo: true,
      canRedo: false,
      isAutoSaved: true,
    });
  },

  addBullet: (sectionId, itemId, text = 'Spearheaded project delivering measurable business growth.') => {
    const { present, past } = get();
    const newPast = [...past, present].slice(-MAX_HISTORY);
    const newSections = present.sections.map((sec) => {
      if (sec.id !== sectionId || !sec.content.items) return sec;
      const newItems = sec.content.items.map((item) => {
        if (item.id !== itemId) return item;
        return { ...item, bullets: [...item.bullets, text] };
      });
      return { ...sec, content: { ...sec.content, items: newItems } };
    });

    set({
      past: newPast,
      present: { ...present, sections: newSections },
      future: [],
      canUndo: true,
      canRedo: false,
      isAutoSaved: true,
    });
  },

  deleteBullet: (sectionId, itemId, bulletIndex) => {
    const { present, past } = get();
    const newPast = [...past, present].slice(-MAX_HISTORY);
    const newSections = present.sections.map((sec) => {
      if (sec.id !== sectionId || !sec.content.items) return sec;
      const newItems = sec.content.items.map((item) => {
        if (item.id !== itemId) return item;
        const newBullets = item.bullets.filter((_, idx) => idx !== bulletIndex);
        return { ...item, bullets: newBullets };
      });
      return { ...sec, content: { ...sec.content, items: newItems } };
    });

    set({
      past: newPast,
      present: { ...present, sections: newSections },
      future: [],
      canUndo: true,
      canRedo: false,
      isAutoSaved: true,
    });
  },

  updateStyles: (newStyles) => {
    const { present, past } = get();
    set({
      past: [...past, present].slice(-MAX_HISTORY),
      present: { ...present, styles: { ...present.styles, ...newStyles } },
      future: [],
      canUndo: true,
      canRedo: false,
      isAutoSaved: true,
    });
  },

  resetStyles: () => {
    const { present, past } = get();
    set({
      past: [...past, present].slice(-MAX_HISTORY),
      present: { ...present, styles: INITIAL_STYLES },
      future: [],
      canUndo: true,
      canRedo: false,
      isAutoSaved: true,
    });
  },

  setViewMode: (mode) => set({ viewMode: mode }),
  setZoom: (zoom) => set({ zoom: Math.min(1.5, Math.max(0.5, zoom)) }),
  setCanvasTool: (tool) => set({ canvasTool: tool }),
  setActiveSectionId: (id) => set({ activeSectionId: id }),
  setDocumentTitle: (title) => set({ documentTitle: title }),

  applyAutoTune: () => {
    const { present, past } = get();
    const { updatedDoc, enhancementsApplied } = autoEnhanceDoc(present);
    if (enhancementsApplied > 0) {
      set({
        past: [...past, present].slice(-MAX_HISTORY),
        present: updatedDoc,
        future: [],
        canUndo: true,
        canRedo: false,
        isAutoSaved: true,
      });
    }
    return enhancementsApplied;
  },
}));
