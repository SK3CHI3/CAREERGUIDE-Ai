// Dashboard Data Service - Dynamic Data Management
import { supabase } from './supabase'
import { aiCacheService } from './ai-cache-service'
import { aiCareerService } from './ai-service'
import { generateContextHash } from './cache-utils'

export interface UserActivity {
  id: string
  user_id: string
  activity_type: string
  activity_title: string
  activity_description: string
  activity_data?: any
  progress_percentage: number
  created_at: string
  updated_at: string
}

export interface UserStat {
  id: string
  user_id: string
  stat_type: string
  stat_value: string
  stat_change: string
  stat_trend: 'up' | 'down' | 'stable'
  calculated_at: string
}

export interface CareerRecommendation {
  id: string
  user_id: string
  career_name: string
  match_percentage: number
  description: string
  salary_range: string
  growth_prospect: string
  education_required: string
  skills_required: string[]
  actionability_score?: number
  created_at: string
  expires_at: string
}

export interface CareerPath {
  id: string;
  title: string;
  slug: string;
  category: string;
  demand_level: string;
  salary_range: string;
  growth_percentage: string;
  skills_required: string[];
  description: string;
  education_requirements: string;
  career_level: string;
  is_active: boolean;
  is_featured?: boolean;
  image_url?: string;
  one_liner?: string;
  universities?: string[];
  pros?: string[];
  cons?: string[];
  related_roles?: string[];
  created_at: string;
  updated_at: string;
}

export interface CbeSubject {
  id: string
  subject_name: string
  subject_code: string
  category: string
  description: string
  is_active: boolean
  levels?: string[]
  created_at: string
}

export interface CareerField {
  id: string
  name: string
  description: string
  cbc_pathway: 'STEM' | 'Social Sciences' | 'Arts & Sports Science'
  cbc_track: string
  example_roles: string[]
  jss_subjects: string[]  // Junior Secondary subjects (Grades 7-9) - 12 core subjects
  ss_subjects: string[]  // Senior Secondary subjects (Grades 10-12) - pathway-specific
  grade_appropriateness: string[]
  keywords: string[]
  created_at: string
}

export interface CareerInterest {
  id: string
  interest_name: string
  category: string
  description: string
  related_subjects: string[]
  is_active: boolean
  created_at: string
}

export interface PlatformAnalytics {
  id: string
  metric_name: string
  metric_value: number
  metric_period: string
  metric_date: string
  additional_data?: any
  created_at: string
}

export interface UserSession {
  id: string
  user_id: string
  session_start: string
  session_end?: string
  session_duration?: number
  page_views: number
  actions_count: number
  device_type?: string
  browser?: string
  created_at: string
}

class DashboardService {
  // User Activities
  async getUserActivities(userId: string, limit: number = 10): Promise<UserActivity[]> {
    const { data, error } = await supabase
      .from('user_activities')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data || []
  }

  async createUserActivity(activity: Omit<UserActivity, 'id' | 'created_at' | 'updated_at'>): Promise<UserActivity> {
    try {
      const { data, error } = await supabase
        .from('user_activities')
        .insert(activity)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      // Handle network errors gracefully
      if (error instanceof Error && error.message.includes('Failed to fetch')) {
        console.warn('User activity creation failed due to network issue')
        throw new Error('Network connection failed')
      }
      throw error
    }
  }

  async updateUserActivity(id: string, updates: Partial<UserActivity>): Promise<UserActivity> {
    const { data, error } = await supabase
      .from('user_activities')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  // User Stats
  async getUserStats(userId: string): Promise<UserStat[]> {
    const { data, error } = await supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', userId)
      .order('calculated_at', { ascending: false })

    if (error) throw error
    return (data || []).map(stat => ({
      ...stat,
      stat_trend: stat.stat_trend as 'up' | 'down' | 'stable'
    }))
  }

  async upsertUserStat(stat: Omit<UserStat, 'id' | 'calculated_at'>): Promise<UserStat> {
    const { data, error } = await supabase
      .from('user_stats')
      .upsert(stat, { onConflict: 'user_id,stat_type' })
      .select()
      .single()

    if (error) throw error
    return {
      ...data,
      stat_trend: data.stat_trend as 'up' | 'down' | 'stable'
    }
  }

  // Career Recommendations - Now uses Hybrid Caching with Context Hashing
  async getCareerRecommendations(userId: string): Promise<CareerRecommendation[]> {
    try {
      // 1. Generate Context Hash for fingerprinting
      const profile = await this.getProfile(userId)
      const grades = await this.getUserGrades(userId)
      const currentHash = generateContextHash(userId, profile, grades)

      // 2. Try to get from Hybrid Cache (L1 or L2)
      const cachedRecommendations = await aiCacheService.getCachedCareerRecommendations(userId, currentHash)

      if (cachedRecommendations && cachedRecommendations.length > 0) {
        return cachedRecommendations.map(rec => ({
          id: rec.id || '',
          user_id: rec.user_id,
          career_name: rec.career_name,
          match_percentage: rec.match_percentage,
          description: rec.description || '',
          salary_range: rec.salary_range || '',
          growth_prospect: rec.growth || '',
          education_required: rec.education || '',
          skills_required: [],
          created_at: rec.created_at || new Date().toISOString(),
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        }))
      }

      // 3. Fallback to old table (legacy sync) if no AI cache exists
      const { data, error } = await supabase
        .from('career_recommendations')
        .select('*')
        .eq('user_id', userId)
        .gt('expires_at', new Date().toISOString())
        .order('match_percentage', { ascending: false })

      if (error) {
        console.error('Error fetching legacy career recommendations:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Error in getCareerRecommendations:', error)
      return []
    }
  }

  // Helper to get user profile
  private async getProfile(userId: string) {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
    return data
  }

  async saveCareerRecommendations(userId: string, recommendations: Omit<CareerRecommendation, 'id' | 'user_id' | 'created_at' | 'expires_at'>[]): Promise<CareerRecommendation[]> {
    try {
      // 1. Generate Context Hash
      const profile = await this.getProfile(userId)
      const grades = await this.getUserGrades(userId)
      const currentHash = generateContextHash(userId, profile, grades)

      // 2. Save to Hybrid Cache (L1 + L2)
      await aiCacheService.saveCareerRecommendations(userId, recommendations as any, currentHash)

      // Also save to old table for backward compatibility (Legacy Sync)
      try {
        await supabase
          .from('career_recommendations')
          .delete()
          .eq('user_id', userId)

        const recommendationsWithUserId = recommendations.map(rec => ({
          ...rec,
          user_id: userId,
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        }))

        await supabase.from('career_recommendations').insert(recommendationsWithUserId)
      } catch (e) {
        console.warn('Legacy sync failed:', e)
      }

      return recommendations as any
    } catch (error) {
      console.error('Error saving career recommendations:', error)
      return []
    }
  }

  // Get Career Details with Perfect Caching
  async getCareerDetails(userId: string, careerName: string): Promise<any | null> {
    try {
      const profile = await this.getProfile(userId)
      const grades = await this.getUserGrades(userId)
      const currentHash = generateContextHash(userId, profile, grades)

      return await aiCacheService.getCachedCareerDetails(userId, careerName, currentHash)
    } catch (error) {
      console.error('Error in getCareerDetails:', error)
      return null
    }
  }

  // Get Course Recommendations with Perfect Caching
  async getCourseRecommendations(userId: string): Promise<any[] | null> {
    try {
      const profile = await this.getProfile(userId)
      const grades = await this.getUserGrades(userId)
      const currentHash = generateContextHash(userId, profile, grades)

      return await aiCacheService.getCachedCourseRecommendations(userId, currentHash)
    } catch (error) {
      console.error('Error in getCourseRecommendations:', error)
      return null
    }
  }

  async saveCourseRecommendations(userId: string, courses: any[]): Promise<void> {
    try {
      const profile = await this.getProfile(userId)
      const grades = await this.getUserGrades(userId)
      const currentHash = generateContextHash(userId, profile, grades)

      await aiCacheService.saveCourseRecommendations(userId, courses, currentHash)
    } catch (error) {
      console.error('Error in saveCourseRecommendations:', error)
    }
  }

  async saveCareerDetails(userId: string, careerName: string, details: any): Promise<void> {
    try {
      const profile = await this.getProfile(userId)
      const grades = await this.getUserGrades(userId)
      const currentHash = generateContextHash(userId, profile, grades)

      await aiCacheService.saveCareerDetails(userId, careerName, details, currentHash)
    } catch (error) {
      console.error('Error in saveCareerDetails:', error)
    }
  }

  // Career Paths (for browsing feature)
  async getCareerPaths(category?: string, limit: number = 1000): Promise<CareerPath[]> {
    try {
      // Data is now managed strictly via the Admin Dashboard.
      // Auto-sync from AI is disabled to prevent overwriting manual image/description updates.
      let query = supabase
        .from('career_paths')
        .select('*')
        .eq('is_active', true)
        .order('is_featured', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(limit)

      if (category) {
        query = query.eq('category', category)
      }

      const { data, error } = await query

      if (error) throw error
      return data || []
    } catch (err) {
      console.error('Error in getCareerPaths:', err);
      // Fallback to whatever is in the DB if AI refresh fails
      const { data } = await supabase.from('career_paths').select('*').limit(limit);
      return data || [];
    }
  }

  // Career Fields (for Quick Assessment only)
  async getCareerFields(grade?: string): Promise<CareerField[]> {
    try {
      console.log('getCareerFields called with grade:', grade);
      
      let query = supabase
        .from('career_fields')
        .select('*')
        .order('name', { ascending: true })

      const { data, error } = await query

      if (error) throw error

      console.log('Total career fields from DB:', data?.length);
      if (data && data.length > 0) {
        console.log('Sample grade_appropriateness:', data[0].grade_appropriateness);
      }

      // Filter by grade appropriateness if grade is provided
      if (grade && data) {
        // Extract just the number from grade string (e.g., "Grade 9" -> "9")
        const gradeNumber = grade.replace('Grade ', '').trim();
        console.log('Filtering for grade number:', gradeNumber);
        
        const filtered = data.filter(field => {
          const matches = field.grade_appropriateness?.includes(gradeNumber);
          if (!matches) {
            console.log(`Field "${field.name}" doesn't match grade "${gradeNumber}". Has:`, field.grade_appropriateness);
          }
          return matches;
        });
        console.log('Filtered career fields:', filtered.length);
        return filtered;
      }

      return data || []
    } catch (err) {
      console.error('Error in getCareerFields:', err);
      return [];
    }
  }

  private async syncCareerPathsWithAI() {
    try {
      const trendingCareers = await aiCareerService.getTrendingCareers();
      
      if (trendingCareers && trendingCareers.length > 0) {
        // Deactivate old careers (or just keep them as inactive)
        await supabase
          .from('career_paths')
          .update({ is_active: false })
          .eq('is_active', true);

        // Insert new ones
        const { error: insertError } = await supabase
          .from('career_paths')
          .insert(trendingCareers.map(c => ({
            ...c,
            is_active: true,
            updated_at: new Date().toISOString()
          })));

        if (insertError) throw insertError;
        console.log(`Successfully synced ${trendingCareers.length} career paths from AI.`);
      }
    } catch (error) {
      console.error('Failed to sync career paths with AI:', error);
    }
  }

  // CBE Subjects
  async getCbeSubjects(category?: string): Promise<CbeSubject[]> {
    let query = supabase
      .from('cbe_subjects')
      .select('*')
      .eq('is_active', true)
      .order('subject_name', { ascending: true })

    if (category) {
      query = query.eq('category', category)
    }

    const { data, error } = await query

    if (error) throw error
    return data || []
  }

  // Career Interests
  async getCareerInterests(category?: string): Promise<CareerInterest[]> {
    let query = supabase
      .from('career_interests')
      .select('*')
      .eq('is_active', true)
      .order('interest_name', { ascending: true })

    if (category) {
      query = query.eq('category', category)
    }

    const { data, error } = await query

    if (error) throw error
    return data || []
  }

  // Platform Analytics (Admin only)
  async getPlatformAnalytics(metricName?: string, period?: string, limit: number = 30): Promise<PlatformAnalytics[]> {
    let query = supabase
      .from('platform_analytics')
      .select('*')
      .order('metric_date', { ascending: false })
      .limit(limit)

    if (metricName) {
      query = query.eq('metric_name', metricName)
    }

    if (period) {
      query = query.eq('metric_period', period)
    }

    const { data, error } = await query

    if (error) throw error
    return data || []
  }

  async createPlatformAnalytics(analytics: Omit<PlatformAnalytics, 'id' | 'created_at'>): Promise<PlatformAnalytics> {
    const { data, error } = await supabase
      .from('platform_analytics')
      .insert(analytics)
      .select()
      .single()

    if (error) throw error
    return data
  }

  // User Sessions
  async startUserSession(userId: string, deviceType?: string, browser?: string): Promise<UserSession> {
    const { data, error } = await supabase
      .from('user_sessions')
      .insert({
        user_id: userId,
        device_type: deviceType,
        browser: browser
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  async endUserSession(sessionId: string): Promise<UserSession> {
    const { data, error } = await supabase
      .from('user_sessions')
      .update({
        session_end: new Date().toISOString(),
        session_duration: Math.floor((Date.now() - new Date().getTime()) / 1000)
      })
      .eq('id', sessionId)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async updateSessionActivity(sessionId: string, pageViews?: number, actionsCount?: number): Promise<UserSession> {
    const updates: any = {}
    if (pageViews !== undefined) updates.page_views = pageViews
    if (actionsCount !== undefined) updates.actions_count = actionsCount

    try {
      const { data, error } = await supabase
        .from('user_sessions')
        .update(updates)
        .eq('id', sessionId)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      // Handle network errors gracefully
      if (error instanceof Error && error.message.includes('Failed to fetch')) {
        console.warn('Session activity update failed due to network issue')
        throw new Error('Network connection failed')
      }
      throw error
    }
  }

  // Get user grades for career recommendations
  async getUserGrades(userId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('student_grades')
      .select('*')
      .eq('user_id', userId)
      .order('academic_year', { ascending: false })
      .order('term', { ascending: false })

    if (error) throw error
    return data || []
  }

  // Calculate academic performance metrics
  async calculateAcademicPerformance(userId: string): Promise<{
    overallAverage: number
    subjectAverages: Record<string, number>
    strongSubjects: string[]
    weakSubjects: string[]
    performanceTrend: 'improving' | 'declining' | 'stable'
  }> {
    const grades = await this.getUserGrades(userId)

    if (grades.length === 0) {
      return {
        overallAverage: 0,
        subjectAverages: {},
        strongSubjects: [],
        weakSubjects: [],
        performanceTrend: 'stable'
      }
    }

    // Calculate overall average
    const overallAverage = grades.reduce((sum, grade) => sum + grade.grade_value, 0) / grades.length

    // Calculate subject averages
    const subjectTotals: Record<string, { sum: number; count: number }> = {}
    grades.forEach(grade => {
      if (!subjectTotals[grade.subject_name]) {
        subjectTotals[grade.subject_name] = { sum: 0, count: 0 }
      }
      subjectTotals[grade.subject_name].sum += grade.grade_value
      subjectTotals[grade.subject_name].count += 1
    })

    const subjectAverages: Record<string, number> = {}
    Object.entries(subjectTotals).forEach(([subject, data]) => {
      subjectAverages[subject] = data.sum / data.count
    })

    // Identify strong and weak subjects
    const strongSubjects = Object.entries(subjectAverages)
      .filter(([_, average]) => average >= 75)
      .map(([subject, _]) => subject)

    const weakSubjects = Object.entries(subjectAverages)
      .filter(([_, average]) => average < 50)
      .map(([subject, _]) => subject)

    // Calculate performance trend (simplified)
    const recentGrades = grades.slice(0, Math.min(5, grades.length))
    const olderGrades = grades.slice(-Math.min(5, grades.length))

    const recentAverage = recentGrades.reduce((sum, grade) => sum + grade.grade_value, 0) / recentGrades.length
    const olderAverage = olderGrades.reduce((sum, grade) => sum + grade.grade_value, 0) / olderGrades.length

    let performanceTrend: 'improving' | 'declining' | 'stable' = 'stable'
    if (recentAverage > olderAverage + 5) performanceTrend = 'improving'
    else if (recentAverage < olderAverage - 5) performanceTrend = 'declining'

    return {
      overallAverage,
      subjectAverages,
      strongSubjects,
      weakSubjects,
      performanceTrend
    }
  }

  // Analytics and Statistics
  async calculateUserStats(userId: string, profile: any): Promise<UserStat[]> {
    const stats: Omit<UserStat, 'id' | 'calculated_at'>[] = []

    const lastWeekDate = new Date()
    lastWeekDate.setDate(lastWeekDate.getDate() - 7)

    // Calculate AI sessions and profile updates first to use them across stats
    const activities = await this.getUserActivities(userId, 100)
    const aiSessionsAll = activities.filter(a => a.activity_type === 'ai_chat')
    const aiSessionsThisWeek = aiSessionsAll.filter(a => new Date(a.created_at) > lastWeekDate).length

    const profileUpdatesThisWeek = activities.filter(
      a => (a.activity_type === 'profile' || a.activity_type === 'assessment') && new Date(a.created_at) > lastWeekDate
    ).length

    // Calculate profile completeness
    const profileCompleteness = this.calculateProfileCompleteness(profile)
    stats.push({
      user_id: userId,
      stat_type: 'profile_completeness',
      stat_value: `${profileCompleteness}%`,
      stat_change: profileCompleteness === 100 
        ? 'Maximum profile strength' 
        : profileUpdatesThisWeek > 0 ? 'Updated this week' : 'Expand to get better matches',
      stat_trend: profileCompleteness === 100 || profileUpdatesThisWeek > 0 ? 'up' : 'stable'
    })

    // Calculate career matches count
    const careerRecommendations = await this.getCareerRecommendations(userId)
    const recentMatches = careerRecommendations.filter(r => r.created_at && new Date(r.created_at) > lastWeekDate).length
    stats.push({
      user_id: userId,
      stat_type: 'career_matches',
      stat_value: careerRecommendations.length.toString(),
      stat_change: recentMatches > 0 ? `+${recentMatches} fresh matches` : 'Matches based on current inputs',
      stat_trend: recentMatches > 0 ? 'up' : 'stable'
    })

    // Calculate AI sessions
    stats.push({
      user_id: userId,
      stat_type: 'ai_sessions',
      stat_value: aiSessionsAll.length.toString(),
      stat_change: aiSessionsThisWeek > 0 ? `+${aiSessionsThisWeek} this week` : 'No recent sessions',
      stat_trend: aiSessionsThisWeek > 0 ? 'up' : 'stable'
    })

    // Calculate academic performance
    const academicPerformance = await this.calculateAcademicPerformance(userId)
    stats.push({
      user_id: userId,
      stat_type: 'academic_performance',
      stat_value: `${academicPerformance.overallAverage.toFixed(1)}%`,
      stat_change: academicPerformance.overallAverage === 0 ? 'No grade data' : `${academicPerformance.performanceTrend.charAt(0).toUpperCase() + academicPerformance.performanceTrend.slice(1)} performance`,
      stat_trend: academicPerformance.overallAverage === 0 ? 'stable' :
        academicPerformance.performanceTrend === 'improving' ? 'up' :
        academicPerformance.performanceTrend === 'declining' ? 'down' : 'stable'
    })

    // Save all stats
    const savedStats: UserStat[] = []
    for (const stat of stats) {
      const saved = await this.upsertUserStat(stat)
      savedStats.push(saved)
    }

    return savedStats
  }

  private calculateProfileCompleteness(profile: any): number {
    const fields = [
      'school_level',
      'current_grade',
      'cbe_subjects',
      'career_interests',
      'career_goals',
      // This is saved when the student completes the onboarding assessment.
      // `strengths` and `challenges` are not currently collected anywhere,
      // so including them made a fully completed profile unable to reach 100%.
      'assessment_results'
    ]

    const completedFields = fields.filter(field => {
      const value = profile[field]
      return value && (Array.isArray(value) ? value.length > 0 : value.toString().trim() !== '')
    })

    return Math.round((completedFields.length / fields.length) * 100)
  }

  // Generate dynamic activities based on user profile
  async generateDynamicActivities(userId: string, profile: any): Promise<UserActivity[]> {
    const activities: Omit<UserActivity, 'id' | 'user_id' | 'created_at' | 'updated_at'>[] = []
    const now = new Date()

    // Profile-based activities
    if (profile.cbe_subjects && profile.cbe_subjects.length > 0) {
      activities.push({
        activity_type: 'profile',
        activity_title: 'CBE Subjects Updated',
        activity_description: `Added ${profile.cbe_subjects.length} subjects to your profile`,
        progress_percentage: 100
      })
    }

    if (profile.career_interests && profile.career_interests.length > 0) {
      activities.push({
        activity_type: 'interests',
        activity_title: 'Career Interests Defined',
        activity_description: `Explored ${profile.career_interests.length} career areas`,
        progress_percentage: 90
      })
    }

    // AI-generated activities
    activities.push({
      activity_type: 'ai',
      activity_title: 'AI Career Analysis',
      activity_description: 'Received personalized career recommendations',
      progress_percentage: 95
    })

    // Assessment activity
    const profileCompleteness = this.calculateProfileCompleteness(profile)
    activities.push({
      activity_type: 'assessment',
      activity_title: 'Profile Assessment',
      activity_description: `Completed ${profileCompleteness}% of your career profile`,
      progress_percentage: profileCompleteness
    })

    // Save activities
    const savedActivities: UserActivity[] = []
    for (const activity of activities) {
      const saved = await this.createUserActivity({
        ...activity,
        user_id: userId
      })
      savedActivities.push(saved)
    }

    return savedActivities
  }
}

export const dashboardService = new DashboardService()
