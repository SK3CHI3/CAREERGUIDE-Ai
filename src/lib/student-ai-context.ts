import { supabase } from './supabase'
import type { UserContext } from './ai-service'
import type { UserProfile } from '../types/database'

type GradeRecord = {
  subject_name?: string | null
  grade_value?: number | null
}

const asStringList = (value: unknown): string[] => (
  Array.isArray(value)
    ? [...new Set(value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0))]
    : []
)

const asAssessment = (value: unknown): UserProfile['assessment_results'] | undefined => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined

  const record = value as Record<string, unknown>
  const scores = record.riasec_scores
  const riasecScores = scores && typeof scores === 'object' && !Array.isArray(scores)
    ? Object.fromEntries(
      ['realistic', 'investigative', 'artistic', 'social', 'enterprising', 'conventional']
        .map(key => [key, Number((scores as Record<string, unknown>)[key])])
        .filter(([, score]) => Number.isFinite(score))
    )
    : undefined

  return {
    ...(riasecScores && Object.keys(riasecScores).length === 6
      ? { riasec_scores: riasecScores as NonNullable<UserProfile['assessment_results']>['riasec_scores'] }
      : {}),
    personality_type: asStringList(record.personality_type),
    values: asStringList(record.values),
    constraints: asStringList(record.constraints),
    skills: asStringList(record.skills),
    strengths: asStringList(record.strengths),
    interests: asStringList(record.interests),
    recommendations: asStringList(record.recommendations),
  }
}

const buildGradeContext = (grades: GradeRecord[]) => {
  const totals = new Map<string, { total: number; count: number }>()
  let overallTotal = 0
  let overallCount = 0

  grades.forEach((grade) => {
    const subject = grade.subject_name?.trim()
    const value = Number(grade.grade_value)
    if (!subject || !Number.isFinite(value)) return

    const existing = totals.get(subject) || { total: 0, count: 0 }
    totals.set(subject, { total: existing.total + value, count: existing.count + 1 })
    overallTotal += value
    overallCount += 1
  })

  const subjectGrades = [...totals.entries()]
    .map(([subject, values]) => ({ subject, average: Math.round((values.total / values.count) * 10) / 10 }))
    .sort((a, b) => b.average - a.average)

  const overallAverage = overallCount ? overallTotal / overallCount : 0
  const strongSubjects = subjectGrades.filter(item => item.average >= 75).map(item => item.subject)
  const weakSubjects = subjectGrades.filter(item => item.average < 50).map(item => item.subject)

  // The grade service returns newest records first. Comparing the first and last
  // five records gives the adviser a useful direction without inventing a trend.
  const numericGrades = grades
    .map(grade => Number(grade.grade_value))
    .filter(value => Number.isFinite(value))
  const sampleSize = Math.min(5, numericGrades.length)
  const recent = numericGrades.slice(0, sampleSize)
  const older = numericGrades.slice(-sampleSize)
  const recentAverage = recent.length ? recent.reduce((sum, value) => sum + value, 0) / recent.length : 0
  const olderAverage = older.length ? older.reduce((sum, value) => sum + value, 0) / older.length : 0
  const performanceTrend = recentAverage > olderAverage + 5
    ? 'improving'
    : recentAverage < olderAverage - 5
      ? 'declining'
      : 'stable'

  return {
    hasRecordedGrades: overallCount > 0,
    subjectGrades,
    academicPerformance: {
      overallAverage,
      strongSubjects,
      weakSubjects,
      performanceTrend,
    },
  }
}

/**
 * Builds the exact student-only context the adviser may use. It deliberately
 * excludes contact, payment and account data; only learning and guidance data
 * reaches the model.
 */
export const loadStudentAIContext = async (userId: string, fallbackName?: string | null): Promise<UserContext> => {
  const [{ data: profile, error: profileError }, { data: grades, error: gradesError }] = await Promise.all([
    supabase
      .from('profiles')
      .select('full_name, curriculum, school_level, current_grade, cbe_subjects, subjects, career_interests, interests, career_goals, assessment_results')
      .eq('id', userId)
      .single(),
    supabase
      .from('student_grades')
      .select('subject_name, grade_value, academic_year, term')
      .eq('user_id', userId)
      .order('academic_year', { ascending: false })
      .order('term', { ascending: false }),
  ])

  if (profileError) throw profileError
  if (gradesError) throw gradesError

  const assessmentResults = asAssessment(profile?.assessment_results)
  const selectedSubjects = asStringList(profile?.cbe_subjects)
  const legacySubjects = asStringList(profile?.subjects)
  const assessmentSubjects = asStringList(
    profile?.assessment_results && typeof profile.assessment_results === 'object' && !Array.isArray(profile.assessment_results)
      ? (profile.assessment_results as Record<string, unknown>).subjects
      : undefined
  )
  const subjects = selectedSubjects.length ? selectedSubjects : legacySubjects.length ? legacySubjects : assessmentSubjects
  const interests = [...new Set([
    ...asStringList(profile?.career_interests),
    ...asStringList(profile?.interests),
    ...(assessmentResults?.interests || []),
  ])]
  const gradeContext = buildGradeContext((grades || []) as GradeRecord[])

  return {
    name: profile?.full_name || fallbackName || undefined,
    curriculum: profile?.curriculum || 'cbc',
    schoolLevel: (profile?.school_level as UserProfile['school_level']) || undefined,
    currentGrade: profile?.current_grade || undefined,
    subjects,
    interests,
    careerGoals: profile?.career_goals || undefined,
    assessmentResults,
    constraints: assessmentResults?.constraints,
    academicPerformance: gradeContext.academicPerformance,
    gradeSnapshot: gradeContext.subjectGrades,
    hasRecordedGrades: gradeContext.hasRecordedGrades,
  }
}
