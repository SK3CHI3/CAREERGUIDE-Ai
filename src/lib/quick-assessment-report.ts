export interface AssessmentCareerCatalogueItem {
  id?: string;
  title: string;
  category?: string;
  description?: string;
}

export interface QuickAssessmentInput {
  grade: string;
  pathway?: string;
  subjects: string[];
  interests: string[];
  values: string[];
  workStyle: string;
  preferences: {
    focus: string;
    decisions: string;
    structure: string;
  };
  barrier: string;
  experience: string;
  readiness: string;
  targetCareer?: string;
  availableCareers?: AssessmentCareerCatalogueItem[];
}

export interface CareerPossibility {
  career: string;
  catalogueId?: string;
  whyItAppeared: string;
  realityToTest: string;
  starterActivityTitle: string;
  starterActivity: string;
  reflectionPrompt: string;
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
  careers: CareerPossibility[];
  plan: ActionPlanStep[];
  reflectionPrompts: string[];
}

const DEFAULT_CAREERS: AssessmentCareerCatalogueItem[] = [
  { title: 'Software Developer', category: 'Technology' },
  { title: 'UX/UI Designer', category: 'Technology & Design' },
  { title: 'Cybersecurity Analyst', category: 'Technology' },
  { title: 'Architect', category: 'Built Environment' },
  { title: 'Civil Engineer', category: 'Engineering' },
  { title: 'Registered Nurse', category: 'Health' },
  { title: 'Environmental Scientist', category: 'Science' },
  { title: 'Data Analyst', category: 'Technology & Business' },
  { title: 'Journalist', category: 'Media' },
  { title: 'Graphic Designer', category: 'Creative Arts' },
  { title: 'Accountant', category: 'Business' },
  { title: 'Agronomist', category: 'Agriculture' },
];

const cleanText = (value: unknown, fallback: string, maxLength = 420): string => {
  if (typeof value !== 'string') return fallback;
  const cleaned = value.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  return cleaned.length >= 12 ? cleaned.slice(0, maxLength) : fallback;
};

const gradeDetails = (grade: string, pathway?: string) => {
  if (grade === 'Grade 7') {
    return {
      context: 'Grade 7 is for broad exploration. You are gathering evidence about subjects and activities before any pathway decision is needed.',
      focus: 'Try different kinds of work, notice which school subjects you want to return to, and keep a small record of what you learn.',
      firstTimeframe: 'This week',
      secondTimeframe: 'This term',
      thirdTimeframe: 'Before Grade 8',
    };
  }

  if (grade === 'Grade 9') {
    return {
      context: 'Grade 9 is a pathway-exploration year. These career ideas are evidence to test before you choose Senior School subjects - not a decision to lock in today.',
      focus: 'Use short projects and teacher feedback to decide which subject combinations and Senior School pathway keep the strongest options open.',
      firstTimeframe: 'This week',
      secondTimeframe: 'This term',
      thirdTimeframe: 'Before Senior School selection',
    };
  }

  return {
    context: `Grade 11 is a transition-planning stage${pathway ? ` within the ${pathway} pathway` : ''}. Use these career ideas to compare subject requirements, training routes, and first experiences - not as a guarantee of admission or employment.`,
    focus: 'Turn your strongest current subjects into evidence: compare training requirements, speak with a practitioner or teacher, and complete one relevant project before narrowing your options.',
    firstTimeframe: 'This week',
    secondTimeframe: 'This month',
    thirdTimeframe: 'Before your next application step',
  };
};

const pickCareerCatalogue = (input: QuickAssessmentInput): AssessmentCareerCatalogueItem[] => {
  const catalogue = input.availableCareers?.filter(item => item.title?.trim()) || [];
  return catalogue.length >= 3 ? catalogue : DEFAULT_CAREERS;
};

const findCareerMatches = (input: QuickAssessmentInput, catalogue: AssessmentCareerCatalogueItem[]) => {
  const evidence = [...input.subjects, ...input.interests, input.workStyle, ...input.values].join(' ').toLowerCase();
  const categories = (item: AssessmentCareerCatalogueItem) => `${item.title} ${item.category || ''} ${item.description || ''}`.toLowerCase();
  const score = (item: AssessmentCareerCatalogueItem) => {
    const source = categories(item);
    let points = 0;
    const weights: [RegExp, number][] = [
      [/(computer|coding|digital|technology|ict|pre-technical|software)/, 5],
      [/(math|data|analysis|statistics|logic)/, 4],
      [/(science|biology|chemistry|health)/, 4],
      [/(art|design|creative|media|film|music)/, 4],
      [/(business|economics|leadership|enterprise)/, 4],
      [/(agriculture|environment|geography)/, 4],
      [/(people|community|impact|service|social)/, 2],
    ];
    weights.forEach(([pattern, value]) => {
      if (pattern.test(evidence) && pattern.test(source)) points += value;
    });
    if (input.targetCareer && item.title.toLowerCase() === input.targetCareer.toLowerCase()) points += 100;
    return points;
  };

  return [...catalogue]
    .map((item, index) => ({ item, score: score(item), index }))
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map(result => result.item);
};

const evidenceLine = (input: QuickAssessmentInput) => {
  const subjects = input.subjects.slice(0, 3).join(', ') || 'the subjects you selected';
  const interests = input.interests.slice(0, 3).join(', ') || 'the interests you selected';
  return `It appeared because ${subjects} sit alongside ${interests} in your answers. Your values and preferred work style were also considered, but this is only a starting pattern - not proof that the career is right for you.`;
};

const activityFor = (career: string, grade: string) => {
  const prefix = grade === 'Grade 7' ? 'a 30-minute starter' : grade === 'Grade 9' ? 'a one-week school project' : 'a focused evidence task';
  const lower = career.toLowerCase();
  if (/(software|data|cyber)/.test(lower)) {
    return {
      title: `Try ${prefix} in digital problem-solving`,
      activity: 'Choose one repeated school or home problem. Sketch a simple digital solution, flowchart, or data table, then ask one person where it would fail or confuse them.',
      reflection: 'Did you enjoy working through the unclear middle, then improving the solution after feedback?'
    };
  }
  if (/(design|architect|media|journalist)/.test(lower)) {
    return {
      title: `Try ${prefix} in communication and design`,
      activity: 'Turn a difficult school topic or local issue into a one-page visual, short article plan, or space sketch for a real audience. Ask that audience what they understood without your explanation.',
      reflection: 'Did you enjoy learning what another person needed before changing your first idea?'
    };
  }
  if (/(nurse|health|environment|agronom)/.test(lower)) {
    return {
      title: `Try ${prefix} in evidence and care`,
      activity: 'Investigate one health, environment, or food issue around school or home. Collect two reliable observations, explain what is uncertain, and propose one safe next question to investigate.',
      reflection: 'Did careful observation and responsible decision-making hold your attention?'
    };
  }
  if (/(account|business|finance)/.test(lower)) {
    return {
      title: `Try ${prefix} in practical planning`,
      activity: 'Plan a small school or community activity with a simple budget, audience, and success measure. Ask someone to challenge one assumption before you improve the plan.',
      reflection: 'Did you enjoy balancing the numbers, the people involved, and the practical trade-offs?'
    };
  }
  return {
    title: `Try ${prefix} related to this career`,
    activity: 'Choose one small real-world problem connected to this field. Learn enough to explain the problem, make one practical response, and ask someone working or learning nearby for feedback.',
    reflection: 'Which part gave you energy, and which part would you be willing to practise again?'
  };
};

export const createFallbackQuickAssessmentBrief = (input: QuickAssessmentInput): QuickAssessmentBrief => {
  const grade = gradeDetails(input.grade, input.pathway);
  const selected = findCareerMatches(input, pickCareerCatalogue(input));
  const careers = selected.slice(0, 3).map((item, index) => {
    const activity = activityFor(item.title, input.grade);
    return {
      career: item.title,
      catalogueId: item.id,
      whyItAppeared: evidenceLine(input),
      realityToTest: index === 0
        ? 'Test whether you enjoy the day-to-day work, including revision after feedback, rather than only the idea of the career.'
        : index === 1
          ? 'Look for evidence that you can stay engaged when the task becomes detailed, repetitive, or difficult.'
          : 'Find out what the work actually involves and compare it with your own experience before giving it more weight.',
      starterActivityTitle: activity.title,
      starterActivity: activity.activity,
      reflectionPrompt: activity.reflection,
    };
  });

  return {
    studentSummary: `Your answers show a set of possible directions rather than one final answer. This brief combines your selected subjects, interests, values, work style, practical experience, and current concern so you can test ideas with real evidence.`,
    gradeContext: grade.context,
    gradeFocus: grade.focus,
    careers,
    plan: [
      { timeframe: grade.firstTimeframe, title: 'Choose one career to test', action: 'Pick the possibility you are most curious about and complete its starter activity before searching for more options.', careerGuideAction: 'Explore that career in CareerGuide.' },
      { timeframe: grade.secondTimeframe, title: 'Get outside feedback', action: 'Show what you made or learnt to a teacher, parent, mentor, or trusted adult. Ask what they notice about your process, not whether they think you should choose the career.', careerGuideAction: 'Use the AI counsellor to prepare better questions.' },
      { timeframe: grade.thirdTimeframe, title: 'Compare evidence', action: 'Write down what held your attention, what became difficult, and which subjects or skills you would be willing to improve.', careerGuideAction: 'Compare careers and subject pathways in CareerGuide.' },
    ],
    reflectionPrompts: [
      'What part of the activity pulled me in most?',
      'What part did I avoid or lose interest in?',
      'What did another person notice about my work?',
      'What would I like to test next?'
    ]
  };
};

export const normaliseQuickAssessmentBrief = (raw: unknown, input: QuickAssessmentInput): QuickAssessmentBrief => {
  const fallback = createFallbackQuickAssessmentBrief(input);
  if (!raw || typeof raw !== 'object') return fallback;
  const data = raw as Record<string, unknown>;
  const catalogue = pickCareerCatalogue(input);
  const rawCareers = Array.isArray(data.careers) ? data.careers : [];

  const careers = fallback.careers.map((fallbackCareer, index) => {
    const rawCareer = rawCareers[index] as Record<string, unknown> | undefined;
    const requestedTitle = typeof rawCareer?.career === 'string' ? rawCareer.career.trim() : '';
    const matched = catalogue.find(item => item.title.toLowerCase() === requestedTitle.toLowerCase());
    const activity = rawCareer?.starter_activity as Record<string, unknown> | undefined;
    return {
      career: matched?.title || fallbackCareer.career,
      catalogueId: matched?.id || fallbackCareer.catalogueId,
      whyItAppeared: cleanText(rawCareer?.why_it_appeared, fallbackCareer.whyItAppeared),
      realityToTest: cleanText(rawCareer?.reality_to_test, fallbackCareer.realityToTest),
      starterActivityTitle: cleanText(activity?.title, fallbackCareer.starterActivityTitle, 110),
      starterActivity: cleanText(activity?.instruction, fallbackCareer.starterActivity, 300),
      reflectionPrompt: cleanText(activity?.reflection_prompt, fallbackCareer.reflectionPrompt, 180),
    };
  });

  const rawPlan = Array.isArray(data.plan) ? data.plan : [];
  const plan = fallback.plan.map((fallbackStep, index) => {
    const rawStep = rawPlan[index] as Record<string, unknown> | undefined;
    return {
      timeframe: cleanText(rawStep?.timeframe, fallbackStep.timeframe, 70),
      title: cleanText(rawStep?.title, fallbackStep.title, 110),
      action: cleanText(rawStep?.action, fallbackStep.action, 300),
      careerGuideAction: cleanText(rawStep?.careerguide_action, fallbackStep.careerGuideAction, 120),
    };
  });

  return {
    studentSummary: cleanText(data.student_summary, fallback.studentSummary, 480),
    gradeContext: cleanText(data.grade_context, fallback.gradeContext, 380),
    gradeFocus: cleanText(data.grade_focus, fallback.gradeFocus, 330),
    careers,
    plan,
    reflectionPrompts: fallback.reflectionPrompts,
  };
};
