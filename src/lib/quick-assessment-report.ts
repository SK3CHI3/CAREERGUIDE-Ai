import type { CareerField } from './dashboard-service';

export interface QuickAssessmentInput {
  // Identity
  grade: string;
  pathway?: string; // Grade 11 only
  name: string;
  email: string;

  // Academics
  subjects: string[];
  subjectPerformance: Record<string, 'struggling' | 'passing' | 'good' | 'excelling'>;

  // School context (Grades 7-9)
  schoolPathways: string[];

  // Interests
  interests: string[];
  clubs: string[];

  // Parent expectations (Grades 7-9)
  parentExpectation: string;
  parentAlignment: 'same' | 'unsure' | 'different';

  // Grade 11 only
  postSecondaryPlan?: string;
  budgetRange?: string;

  // Future vision (all grades)
  futureVision: string;

  // Specific challenges (Grade 11 only)
  specificChallenges?: string[];

  // Optional
  targetCareer?: string;

  // Career fields data (loaded from database)
  availableCareerFields?: CareerField[];
}

export interface TrainingRoute {
  route: string; // "University", "College/TVET", "Polytechnic", "Apprenticeship"
  programme: string;
  requirements: string;
  budgetNote: string;
}

export interface CareerFieldPossibility {
  field: string; // e.g., "Technology and Computing"
  fieldId?: string; // links back to career_fields table
  cbc_pathway: 'STEM' | 'Social Sciences' | 'Arts & Sports Science';
  cbc_track: string;
  subjectsToPrioritise: string[];
  whyItAppeared: string;
  realityToTest: string;

  // Grades 7-9
  starterActivity?: {
    title: string;
    instruction: string;
    reflectionPrompt: string;
  };

  // Grade 11
  trainingRoutes?: TrainingRoute[];
  nextAction?: {
    title: string;
    instruction: string;
    deadline: string;
  };
}

export interface ActionPlanStep {
  timeframe: string;
  title: string;
  action: string;
  careerGuideAction: string;
}

export interface QuickAssessmentBrief {
  studentSummary: string;
  gradeContext: string;
  gradeFocus: string;

  // Grades 7-9
  parentNote?: string;

  // Grade 11
  visionNote?: string;

  careerFields: CareerFieldPossibility[];
  plan: ActionPlanStep[];
}

const cleanText = (value: unknown, fallback: string, maxLength = 420): string => {
  if (typeof value !== 'string') return fallback;
  const cleaned = value.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  return cleaned.length >= 12 ? cleaned.slice(0, maxLength) : fallback;
};

export const normaliseQuickAssessmentBrief = (raw: unknown, input: QuickAssessmentInput): QuickAssessmentBrief => {
  if (!raw || typeof raw !== 'object') {
    throw new Error('AI response is missing or invalid');
  }

  const data = raw as Record<string, unknown>;
  const availableFields = input.availableCareerFields || [];

  // Validate career fields array
  const rawFields = Array.isArray(data.career_fields) ? data.career_fields : [];
  if (rawFields.length === 0) {
    throw new Error('AI response contains no career fields');
  }

  // Map and validate each career field
  const careerFields = rawFields.map((rawField) => {
    const field = rawField as Record<string, unknown>;
    const fieldName = typeof field.field === 'string' ? field.field.trim() : '';

    // Validate against career_fields table
    const matchedField = availableFields.find(f => f.name.toLowerCase() === fieldName.toLowerCase());
    if (!matchedField) {
      throw new Error(`AI returned invalid career field: "${fieldName}"`);
    }

    // Validate pathway
    const pathway = field.cbc_pathway as string;
    if (!['STEM', 'Social Sciences', 'Arts & Sports Science'].includes(pathway)) {
      throw new Error(`Invalid pathway for field "${fieldName}": "${pathway}"`);
    }

    // Extract subjects to prioritise
    const subjectsToPrioritise = Array.isArray(field.subjects_to_prioritise)
      ? field.subjects_to_prioritise.slice(0, 3)
      : matchedField.subjects.slice(0, 3);

    // Extract starter activity (Grades 7-9)
    const starterActivity = field.starter_activity as Record<string, unknown> | undefined;
    const starterActivityData = starterActivity ? {
      title: cleanText(starterActivity.title, 'Explore this field', 110),
      instruction: cleanText(starterActivity.instruction, 'Research and reflect on this career field.', 300),
      reflectionPrompt: cleanText(starterActivity.reflection_prompt, 'What interested you most?', 180),
    } : undefined;

    // Extract training routes (Grade 11)
    const trainingRoutes = Array.isArray(field.training_routes)
      ? field.training_routes.map((route: any) => ({
          route: cleanText(route.route, 'Training route', 70),
          programme: cleanText(route.programme, 'Programme', 110),
          requirements: cleanText(route.requirements, 'Check specific requirements', 200),
          budgetNote: cleanText(route.budget_note, 'Consider funding options', 150),
        }))
      : undefined;

    // Extract next action (Grade 11)
    const nextAction = field.next_action as Record<string, unknown> | undefined;
    const nextActionData = nextAction ? {
      title: cleanText(nextAction.title, 'Take action', 110),
      instruction: cleanText(nextAction.instruction, 'Complete this step', 300),
      deadline: cleanText(nextAction.deadline, 'This term', 70),
    } : undefined;

    return {
      field: matchedField.name,
      fieldId: matchedField.id,
      cbc_pathway: pathway as 'STEM' | 'Social Sciences' | 'Arts & Sports Science',
      cbc_track: cleanText(field.cbc_track, matchedField.cbc_track, 70),
      subjectsToPrioritise,
      whyItAppeared: cleanText(field.why_it_appeared, 'Based on your interests and subjects.', 420),
      realityToTest: cleanText(field.reality_to_test, 'Explore this field further to confirm your interest.', 420),
      starterActivity: starterActivityData,
      trainingRoutes,
      nextAction: nextActionData,
    };
  });

  // Validate plan
  const rawPlan = Array.isArray(data.plan) ? data.plan : [];
  const plan = rawPlan.slice(0, 2).map((step) => {
    const s = step as Record<string, unknown>;
    return {
      timeframe: cleanText(s.timeframe, 'This term', 70),
      title: cleanText(s.title, 'Take action', 110),
      action: cleanText(s.action, 'Explore this field further', 300),
      careerGuideAction: cleanText(s.careerguide_action, 'Explore careers', 120),
    };
  });

  // Ensure at least one plan step
  if (plan.length === 0) {
    plan.push({
      timeframe: 'This term',
      title: 'Explore your top field',
      action: 'Complete a starter activity to test your interest.',
      careerGuideAction: 'Explore careers',
    });
  }

  return {
    studentSummary: cleanText(data.student_summary, 'Based on your interests and subjects, here are fields to explore.', 480),
    gradeContext: cleanText(data.grade_context, 'Use these suggestions to guide your exploration.', 380),
    gradeFocus: cleanText(data.grade_focus, 'Focus on subjects that align with these fields.', 330),
    parentNote: data.parent_note ? cleanText(data.parent_note, '', 330) : undefined,
    visionNote: data.vision_note ? cleanText(data.vision_note, '', 330) : undefined,
    careerFields,
    plan,
  };
};
