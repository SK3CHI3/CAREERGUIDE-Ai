// cbc-pathway-mapping.ts
//
// Ground-truth CBC/CBE Senior School pathway + track data for tagging
// career_paths. Source: KICD Basic Education Curriculum Framework and
// Grade 10 subject-combination reporting (2025/2026 rollout).
//
// SOFT SPOT: Arts & Sports Science track count is the one place official
// reporting disagrees (2 tracks vs 3). Using the 3-track version here for
// finer tagging resolution. If you hit an authoritative KICD doc that
// insists on 2 tracks, collapse PERFORMING_ARTS + VISUAL_ARTS back into
// a single 'Arts' track.

export const CBC_PATHWAYS = [
  'STEM',
  'Social Sciences',
  'Arts & Sports Science',
] as const;
export type CbcPathway = (typeof CBC_PATHWAYS)[number];

export const CBC_TRACKS: Record<CbcPathway, string[]> = {
  STEM: ['Pure Sciences', 'Applied Sciences', 'Technical Studies'],
  'Social Sciences': ['Languages & Literature', 'Humanities & Business Studies'],
  'Arts & Sports Science': ['Sports Science', 'Performing Arts', 'Visual Arts'],
};

// Representative (not exhaustive) subjects per track -- useful for
// eyeballing which track an unfamiliar career title belongs to.
export const TRACK_SUBJECTS: Record<string, string[]> = {
  'Pure Sciences': ['Mathematics', 'Biology', 'Chemistry', 'Physics', 'General Science'],
  'Applied Sciences': ['Agriculture', 'Computer Science', 'Home Science', 'Business Studies'],
  'Technical Studies': ['Aviation', 'Building & Construction', 'Electricity', 'Metal Work', 'Power Mechanics', 'Woodwork', 'Media Technology', 'Marine & Fisheries Technology'],
  'Languages & Literature': ['English', 'Literature in English', 'Kiswahili/KSL', 'Fasihi ya Kiswahili', 'Indigenous Languages', 'Arabic', 'French', 'German', 'Mandarin'],
  'Humanities & Business Studies': ['CRE/IRE/HRE', 'Business Studies', 'History & Citizenship', 'Geography'],
  'Sports Science': ['Physical Education', 'Sports & Recreation'],
  'Performing Arts': ['Music', 'Dance', 'Theatre', 'Film'],
  'Visual Arts': ['Applied Arts', 'Fine Arts'],
};

export interface CategoryDefault {
  pathway: CbcPathway;
  track: string;
  confidence: 'high' | 'review';
  note?: string;
}

// category -> default pathway/track, keyed off your existing `category`
// field. This is a STARTING heuristic, not a substitute for per-career
// review. Anything marked 'review' should get eyeballed before you trust
// it in production, not auto-applied.
export const CATEGORY_DEFAULTS: Record<string, CategoryDefault> = {
  'Technology': { pathway: 'STEM', track: 'Applied Sciences', confidence: 'high' },
  'Technology & Design': { pathway: 'STEM', track: 'Applied Sciences', confidence: 'review', note: 'Design-first roles may fit Arts & Sports Science / Visual Arts instead' },
  'Technology & Business': { pathway: 'STEM', track: 'Applied Sciences', confidence: 'review', note: 'Business-analytics-leaning roles may fit Social Sciences / Humanities & Business Studies instead' },
  'Built Environment': { pathway: 'STEM', track: 'Technical Studies', confidence: 'review', note: 'Degree-track roles (architect, civil engineer) often fit Pure Sciences instead; vocational roles fit Technical Studies' },
  'Engineering': { pathway: 'STEM', track: 'Pure Sciences', confidence: 'review', note: 'University-bound engineering = Pure Sciences; polytechnic/vocational engineering = Technical Studies' },
  'Health': { pathway: 'STEM', track: 'Pure Sciences', confidence: 'high' },
  'Science': { pathway: 'STEM', track: 'Pure Sciences', confidence: 'high', note: 'Agriculture/environmental-leaning roles may fit Applied Sciences instead' },
  'Media': { pathway: 'Social Sciences', track: 'Languages & Literature', confidence: 'review', note: 'Writing/editorial roles fit here; production/broadcast/technical media roles fit STEM / Technical Studies instead' },
  'Creative Arts': { pathway: 'Arts & Sports Science', track: 'Visual Arts', confidence: 'review', note: 'Music/dance/theatre/film roles fit Performing Arts instead' },
  'Business': { pathway: 'Social Sciences', track: 'Humanities & Business Studies', confidence: 'high' },
  'Agriculture': { pathway: 'STEM', track: 'Applied Sciences', confidence: 'high' },

  // Likely present in your full ~160-career catalogue but not in the
  // current 12-item fallback list:
  'Law': { pathway: 'Social Sciences', track: 'Humanities & Business Studies', confidence: 'high' },
  'Education': { pathway: 'Social Sciences', track: 'Humanities & Business Studies', confidence: 'review', note: 'Subject-specific teaching roles (future Maths/Science teacher) may fit the matching STEM track instead' },
  'Finance & Banking': { pathway: 'Social Sciences', track: 'Humanities & Business Studies', confidence: 'high' },
  'Government & Public Service': { pathway: 'Social Sciences', track: 'Humanities & Business Studies', confidence: 'high' },
  'Hospitality & Tourism': { pathway: 'STEM', track: 'Applied Sciences', confidence: 'review', note: 'Home Science underpins culinary/hospitality; tourism-management roles fit Social Sciences / Humanities & Business Studies instead' },
  'Trades (Plumbing, Auto, Electrical)': { pathway: 'STEM', track: 'Technical Studies', confidence: 'high' },
  'Performing Arts': { pathway: 'Arts & Sports Science', track: 'Performing Arts', confidence: 'high' },
  'Sports & Athletics': { pathway: 'Arts & Sports Science', track: 'Sports Science', confidence: 'high' },
  'Religion & Ministry': { pathway: 'Social Sciences', track: 'Humanities & Business Studies', confidence: 'high' },
  'Languages & Translation': { pathway: 'Social Sciences', track: 'Languages & Literature', confidence: 'high' },
  'Veterinary': { pathway: 'STEM', track: 'Pure Sciences', confidence: 'review', note: 'Livestock/animal husbandry roles fit Applied Sciences / Agriculture instead' },
  'Pharmacy': { pathway: 'STEM', track: 'Pure Sciences', confidence: 'high' },
  'Aviation & Marine': { pathway: 'STEM', track: 'Technical Studies', confidence: 'high' },
};

export interface CareerMapping {
  title: string;
  category: string;
  cbc_pathway: CbcPathway;
  cbc_track: string;
  note?: string;
}

// Worked mapping for your existing DEFAULT_CAREERS fallback list.
// Ready to paste into quick-assessment-report.ts and your career_paths
// seed data.
export const DEFAULT_CAREERS_MAPPED: CareerMapping[] = [
  { title: 'Software Developer', category: 'Technology', cbc_pathway: 'STEM', cbc_track: 'Applied Sciences' },
  { title: 'UX/UI Designer', category: 'Technology & Design', cbc_pathway: 'STEM', cbc_track: 'Applied Sciences', note: 'Alt: Arts & Sports Science / Visual Arts for design-first learners' },
  { title: 'Cybersecurity Analyst', category: 'Technology', cbc_pathway: 'STEM', cbc_track: 'Applied Sciences' },
  { title: 'Architect', category: 'Built Environment', cbc_pathway: 'STEM', cbc_track: 'Technical Studies', note: 'Alt: Pure Sciences for university degree-track architecture (needs strong Math/Physics)' },
  { title: 'Civil Engineer', category: 'Engineering', cbc_pathway: 'STEM', cbc_track: 'Pure Sciences', note: 'Alt: Technical Studies / Building & Construction for polytechnic-track route' },
  { title: 'Registered Nurse', category: 'Health', cbc_pathway: 'STEM', cbc_track: 'Pure Sciences' },
  { title: 'Environmental Scientist', category: 'Science', cbc_pathway: 'STEM', cbc_track: 'Pure Sciences', note: 'Alt: Applied Sciences / Agriculture for a conservation/agri angle' },
  { title: 'Data Analyst', category: 'Technology & Business', cbc_pathway: 'STEM', cbc_track: 'Applied Sciences' },
  { title: 'Journalist', category: 'Media', cbc_pathway: 'Social Sciences', cbc_track: 'Languages & Literature' },
  { title: 'Graphic Designer', category: 'Creative Arts', cbc_pathway: 'Arts & Sports Science', cbc_track: 'Visual Arts' },
  { title: 'Accountant', category: 'Business', cbc_pathway: 'Social Sciences', cbc_track: 'Humanities & Business Studies' },
  { title: 'Agronomist', category: 'Agriculture', cbc_pathway: 'STEM', cbc_track: 'Applied Sciences' },
];