export interface RiasecActivity {
    id: string;
    text: string;
    code: 'R' | 'I' | 'A' | 'S' | 'E' | 'C';
    icon?: string;
}

export const RIASEC_ACTIVITIES: RiasecActivity[] = [
    // Realistic (R) - The Doers
    { id: 'r1', text: 'Engineering, building solutions, or working with advanced technology', code: 'R' },
    { id: 'r2', text: 'Fieldwork, environmental science, or wildlife conservation', code: 'R' },
    { id: 'r3', text: 'Operating complex machinery or precision equipment', code: 'R' },

    // Investigative (I) - The Thinkers
    { id: 'i1', text: 'Solving complex scientific or mathematical problems', code: 'I' },
    { id: 'i2', text: 'Conducting research and experiments to discover new knowledge', code: 'I' },
    { id: 'i3', text: 'Analyzing data to find patterns and drive decisions', code: 'I' },

    // Artistic (A) - The Creators
    { id: 'a1', text: 'Creative design, innovation, or media production', code: 'A' },
    { id: 'a2', text: 'Writing, storytelling, or content creation', code: 'A' },
    { id: 'a3', text: 'Developing apps, games, or digital experiences', code: 'A' },

    // Social (S) - The Helpers
    { id: 's1', text: 'Teaching, mentoring, or developing others', code: 'S' },
    { id: 's2', text: 'Healthcare, counseling, or community impact work', code: 'S' },
    { id: 's3', text: 'Collaborating in teams to achieve meaningful goals', code: 'S' },

    // Enterprising (E) - The Persuaders
    { id: 'e1', text: 'Entrepreneurship, business strategy, or venture building', code: 'E' },
    { id: 'e2', text: 'Sales, marketing, or influencing public opinion', code: 'E' },
    { id: 'e3', text: 'Leading organizations or managing strategic projects', code: 'E' },

    // Conventional (C) - The Organizers
    { id: 'c1', text: 'Managing complex systems, databases, or operations', code: 'C' },
    { id: 'c2', text: 'Financial analysis, budgeting, or investment strategy', code: 'C' },
    { id: 'c3', text: 'Ensuring quality, compliance, and precision in critical work', code: 'C' }
];

export const RIASEC_LABELS: Record<string, string> = {
    R: 'Realistic',
    I: 'Investigative',
    A: 'Artistic',
    S: 'Social',
    E: 'Enterprising',
    C: 'Conventional'
};

export interface CareerValue {
    id: string;
    text: string;
    description: string;
    icon?: string;
}

export const CAREER_VALUES: CareerValue[] = [
    { id: 'v1', text: 'Autonomy', description: 'Freedom to choose how and when you work' },
    { id: 'v2', text: 'Stability', description: 'Secure income and predictable work hours' },
    { id: 'v3', text: 'Impact', description: 'Making a difference in society or others lives' },
    { id: 'v4', text: 'Creativity', description: 'Expressing yourself and inventing new things' },
    { id: 'v5', text: 'High Income', description: 'Prioritizing strong financial rewards' },
    { id: 'v6', text: 'Work-Life Balance', description: 'Ample time for family and personal life' },
    { id: 'v7', text: 'Leadership', description: 'Leading others and taking responsibility' }
];

export const CONTEXTUAL_CONSTRAINTS = [
    { id: 'c1', text: 'Remote Work Only', category: 'geography' },
    { id: 'c2', text: 'Requires Scholarship/Aid', category: 'financial' },
    { id: 'c3', text: 'Local Opportunities Only', category: 'geography' },
    { id: 'c4', text: 'Part-time Study Required', category: 'time' }
];
