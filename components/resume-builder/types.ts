// ─── Section Types ─────────────────────────────────────────────────────────────

export type SectionType = 'header' | 'summary' | 'skills' | 'experience' | 'projects' | 'education';

export const SECTION_LABELS: Record<SectionType, string> = {
  header: 'Contact Info',
  summary: 'Professional Summary',
  skills: 'Skills',
  experience: 'Experience',
  projects: 'Projects',
  education: 'Education',
};

// ─── Format Config ─────────────────────────────────────────────────────────────
// This config is embedded in ResumeData and applied consistently in preview + PDF export.

export interface FormatConfig {
  template: 'modern' | 'classic' | 'minimal';
  fontSize: {
    name: number;      // rem — candidate name
    heading: number;   // rem — section headings
    body: number;      // rem — body text
    small: number;     // rem — dates, labels
  };
  lineHeight: number;  // multiplier (1.2–2.0)
  margins: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };                   // px in screen preview (scaled to mm in PDF)
  sectionSpacing: number;  // px between sections
  headerAlignment: 'left' | 'center' | 'right';
  colors: {
    primary: string;   // candidate name + key text
    accent: string;    // section headings, dividers, borders
    text: string;      // body text
    muted: string;     // dates, labels, secondary
  };
  showDividers: boolean;
  bulletStyle: 'dash' | 'dot' | 'arrow' | 'none';
}

export const DEFAULT_FORMAT: FormatConfig = {
  template: 'modern',
  fontSize: { name: 1.75, heading: 0.82, body: 0.78, small: 0.68 },
  lineHeight: 1.5,
  margins: { top: 36, bottom: 36, left: 44, right: 44 },
  sectionSpacing: 14,
  headerAlignment: 'left',
  colors: {
    primary: '#111827',
    accent: '#059669',
    text: '#374151',
    muted: '#6b7280',
  },
  showDividers: true,
  bulletStyle: 'dash',
};

// ─── Resume Data ────────────────────────────────────────────────────────────────

export interface HeaderData {
  name: string;
  title: string;
  email: string;
  phone: string;
  linkedin: string;
  portfolio: string;
  location: string;
}

export interface SkillCategory {
  id: string;
  name: string;
  skills: string[];
}

export interface ExperienceItem {
  id: string;
  company: string;
  role: string;
  location: string;
  startDate: string;
  endDate: string;
  current: boolean;
  bullets: string[];
  link?: string;
}

export interface ProjectItem {
  id: string;
  title: string;
  description: string;
  techStack: string[];
  link?: string;
  github?: string;
  bullets: string[];
}

export interface EducationItem {
  id: string;
  institution: string;
  degree: string;
  field: string;
  startDate: string;
  endDate: string;
  gpa?: string;
  achievements: string[];
}

export interface ResumeData {
  header: HeaderData;
  summary: string;
  skills: SkillCategory[];
  experience: ExperienceItem[];
  projects: ProjectItem[];
  education: EducationItem[];
  sectionOrder: SectionType[];
  format: FormatConfig;
}

// ─── ATS ───────────────────────────────────────────────────────────────────────

export interface ATSResult {
  overall: number;
  keywordMatch: number;
  experienceRelevance: number;
  skillsCoverage: number;
  formatting: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  suggestions: string[];
  sectionScores: {
    skills: number;
    experience: number;
    projects: number;
  };
}

// ─── Default Resume ─────────────────────────────────────────────────────────────

export const DEFAULT_RESUME: ResumeData = {
  header: { name: '', title: '', email: '', phone: '', linkedin: '', portfolio: '', location: '' },
  summary: '',
  skills: [
    { id: 'cat-1', name: 'Technical Skills', skills: [] },
    { id: 'cat-2', name: 'Tools & Platforms', skills: [] },
  ],
  experience: [],
  projects: [],
  education: [],
  sectionOrder: ['header', 'summary', 'skills', 'experience', 'projects', 'education'],
  format: DEFAULT_FORMAT,
};
