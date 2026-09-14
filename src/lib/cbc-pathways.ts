/**
 * CBC (Competency-Based Curriculum) Pathway Data
 * Single source of truth for all CBC pathway definitions and subjects
 */

export interface CBCPathway {
  id: string;
  name: string;
  description: string;
  subjects: string[];
  careerClusters: string[]; // Related KUCCPS clusters
}

export const CBC_COMPETENCY_LEVELS = {
  EXCEEDING: { label: 'Exceeding Expectations', points: 12, kcseEquivalent: 'A' },
  MEETING: { label: 'Meeting Expectations', points: 10, kcseEquivalent: 'B+' },
  APPROACHING: { label: 'Approaching Expectations', points: 7, kcseEquivalent: 'C+' },
  BELOW: { label: 'Below Expectations', points: 4, kcseEquivalent: 'D' }
} as const;

export type CompetencyLevel = keyof typeof CBC_COMPETENCY_LEVELS;

export const CBC_PATHWAYS: Record<string, CBCPathway> = {
  STEM: {
    id: 'stem',
    name: 'Science, Technology, Engineering & Mathematics',
    description: 'For students interested in scientific inquiry, technology, engineering, and mathematical problem-solving',
    subjects: [
      'Mathematics',
      'Physics',
      'Chemistry',
      'Biology',
      'Computer Science',
      'Geography',
      'Agriculture',
      'Technical Drawing',
      'Power Mechanics',
      'Electricity',
      'Metalwork',
      'Building Construction',
      'Woodwork',
      'Further Mathematics'
    ],
    careerClusters: [
      'Medicine & Health Sciences',
      'Engineering',
      'Computer Science & IT',
      'Natural Sciences',
      'Actuarial Science & Statistics',
      'Architecture & Built Environment'
    ]
  },
  ARTS_SPORTS: {
    id: 'arts_sports',
    name: 'Arts & Sports Science',
    description: 'For students passionate about creative expression, performing arts, languages, and sports',
    subjects: [
      'English',
      'Kiswahili',
      'French',
      'German',
      'Arabic',
      'Kenya Sign Language',
      'Music',
      'Dance',
      'Theatre & Film',
      'Visual Arts',
      'Creative Writing',
      'Media Studies',
      'Physical Education',
      'Sports Science',
      'Home Science',
      'Fashion & Design',
      'Photography',
      'Animation & Graphic Design'
    ],
    careerClusters: [
      'Arts & Humanities',
      'Media & Communication',
      'Education',
      'Hospitality & Tourism',
      'Social Sciences'
    ]
  },
  SOCIAL_SCIENCES: {
    id: 'social_sciences',
    name: 'Social Sciences',
    description: 'For students interested in human behavior, society, governance, and community development',
    subjects: [
      'English',
      'Kiswahili',
      'History & Government',
      'Geography',
      'Christian Religious Education',
      'Islamic Religious Education',
      'Hindu Religious Education',
      'Business Studies',
      'Economics',
      'Sociology',
      'Psychology',
      'Political Science',
      'Law',
      'Public Administration'
    ],
    careerClusters: [
      'Law',
      'Education',
      'Business Administration',
      'Social Sciences',
      'Public Administration',
      'Psychology & Counseling'
    ]
  },
  TECHNICAL_VOCATIONAL: {
    id: 'technical_vocational',
    name: 'Technical & Vocational',
    description: 'For students focused on practical skills, trades, and technical expertise',
    subjects: [
      'Mathematics',
      'English',
      'Kiswahili',
      'Technical Drawing',
      'Building & Construction',
      'Electrical & Electronics',
      'Mechanical Engineering',
      'Plumbing',
      'Carpentry & Joinery',
      'Welding & Fabrication',
      'Automotive Engineering',
      'Agriculture',
      'Home Science',
      'Hairdressing & Beauty Therapy',
      'ICT / Computer Studies'
    ],
    careerClusters: [
      'Engineering',
      'Technical & Vocational',
      'Built Environment',
      'Hospitality & Tourism',
      'Agriculture & Food Science'
    ]
  }
};

/**
 * Junior Secondary subjects (Grade 7-9)
 */
export const JUNIOR_SECONDARY_SUBJECTS = [
  'Mathematics',
  'English',
  'Kiswahili',
  'Integrated Science',
  'Social Studies',
  'Religious Education',
  'Business Studies',
  'Agriculture',
  'Creative Arts & Sports',
  'Pre-Technical Studies',
  'Life Skills Education',
  'Health Education'
];

/**
 * Map CBC competency level to KCSE points
 */
export function competencyToKCSEPoints(level: CompetencyLevel): number {
  return CBC_COMPETENCY_LEVELS[level].points;
}

/**
 * Map CBC competency level to KCSE grade
 */
export function competencyToKCSEGrade(level: CompetencyLevel): string {
  return CBC_COMPETENCY_LEVELS[level].kcseEquivalent;
}

/**
 * Calculate KCSE equivalent aggregate from CBC competencies
 */
export function calculateKCSEAggregateFromCBC(
  grades: Record<string, CompetencyLevel>
): { total: number; grade: string } {
  const points = Object.values(grades)
    .slice(0, 7) // Top 7 subjects
    .map(level => competencyToKCSEPoints(level))
    .reduce((sum, points) => sum + points, 0);

  // Convert total points to KCSE grade
  let grade = 'E';
  if (points >= 70) grade = 'A';
  else if (points >= 63) grade = 'A-';
  else if (points >= 56) grade = 'B+';
  else if (points >= 49) grade = 'B';
  else if (points >= 42) grade = 'B-';
  else if (points >= 35) grade = 'C+';
  else if (points >= 28) grade = 'C';
  else if (points >= 21) grade = 'C-';
  else if (points >= 14) grade = 'D+';
  else if (points >= 7) grade = 'D';
  else grade = 'E';

  return { total: points, grade };
}

/**
 * Get pathway by ID
 */
export function getPathwayById(id: string): CBCPathway | undefined {
  return Object.values(CBC_PATHWAYS).find(p => p.id === id);
}

/**
 * Get all pathway IDs
 */
export function getAllPathwayIds(): string[] {
  return Object.keys(CBC_PATHWAYS);
}

/**
 * Check if subject exists in a pathway
 */
export function isSubjectInPathway(subject: string, pathwayId: string): boolean {
  const pathway = getPathwayById(pathwayId);
  if (!pathway) return false;
  return pathway.subjects.includes(subject);
}

/**
 * Get pathways that contain a subject
 */
export function getPathwaysForSubject(subject: string): CBCPathway[] {
  return Object.values(CBC_PATHWAYS).filter(pathway => 
    pathway.subjects.includes(subject)
  );
}
