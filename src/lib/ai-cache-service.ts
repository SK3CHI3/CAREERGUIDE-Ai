import { supabase } from './supabase'
import * as cacheUtils from './cache-utils'
import { dashboardService } from './dashboard-service'

export interface CachedCareerRecommendation {
  id?: string
  user_id: string
  career_name: string
  match_percentage: number
  description?: string
  salary_range?: string
  education?: string
  growth?: string
  actionability_score?: number
  why_recommended?: string
  created_at?: string
  updated_at?: string
}

export interface CachedCareerDetails {
  id?: string
  user_id: string
  career_name: string
  details: Record<string, unknown>
  created_at?: string
  updated_at?: string
}

export interface CachedCourseRecommendations {
  id?: string
  user_id: string
  courses: Record<string, unknown>[]
  created_at?: string
  updated_at?: string
}

export interface CacheInvalidation {
  id?: string
  user_id: string
  cache_type: 'career_recommendations' | 'career_details' | 'course_recommendations'
  invalidated_at?: string
  reason?: string
}

class AICacheService {
  private readonly CACHE_DURATION_HOURS = 24 // Cache for 24 hours
  private readonly CACHE_DURATION_MS = this.CACHE_DURATION_HOURS * 60 * 60 * 1000

  // Check if cache is valid (not expired, not invalidated, and matches context hash)
  private async isCacheValid(userId: string, cacheType: string, currentHash?: string): Promise<boolean> {
    try {
      // 1. Check L1 Cookie Fingerprint
      if (currentHash) {
        const storedHash = cacheUtils.getCacheFingerprint(userId);
        if (storedHash !== currentHash) {
          console.log(`Cache fingerprint mismatch for ${userId}. Cache is invalid.`);
          return false;
        }
      }

      // 2. Check Database Invalidation
      // @ts-ignore - Database types not fully generated
      const { data: invalidation, error } = await supabase
        .from('cache_invalidation')
        .select('invalidated_at')
        .eq('user_id', userId)
        .eq('cache_type', cacheType)
        .order('invalidated_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      // If there's an error or no invalidation record, cache is valid
      if (error) {
        console.warn('Error checking cache invalidation:', error)
        return true // Assume cache is valid if we can't check
      }

      if (invalidation) {
        const invalidatedAt = new Date(invalidation.invalidated_at)
        const now = new Date()
        const hoursSinceInvalidation = (now.getTime() - invalidatedAt.getTime()) / (1000 * 60 * 60)

        // If invalidated within the last 24 hours, cache is not valid
        if (hoursSinceInvalidation < this.CACHE_DURATION_HOURS) {
          return false
        }
      }

      return true
    } catch (error) {
      console.error('Error checking cache validity:', error)
      return true // Assume cache is valid if we can't check
    }
  }

  // Mark cache as invalidated
  async invalidateCache(userId: string, cacheType: string, reason: string = 'manual_refresh'): Promise<void> {
    try {
      // @ts-ignore - Database types not fully generated
      const { error } = await supabase
        .from('cache_invalidation')
        .upsert({
          user_id: userId,
          cache_type: cacheType,
          reason: reason
        })

      if (error) {
        console.warn('Error invalidating cache:', error)
      } else {
        console.log(`Cache invalidated for user ${userId}, type: ${cacheType}, reason: ${reason}`)
      }
    } catch (error) {
      console.error('Error invalidating cache:', error)
    }
  }

  // Clear invalidation record when new cache is saved
  private async clearInvalidation(userId: string, cacheType: string): Promise<void> {
    try {
      // @ts-ignore
      await supabase
        .from('cache_invalidation')
        .delete()
        .eq('user_id', userId)
        .eq('cache_type', cacheType)
    } catch (error) {
      console.warn('Error clearing invalidation:', error)
    }
  }

  // Career Recommendations Caching with Hybrid L1/L2
  async getCachedCareerRecommendations(userId: string, currentHash?: string): Promise<CachedCareerRecommendation[] | null> {
    try {
      // 1. Try L1 Cache (LocalStorage) - Zero Latency
      if (currentHash) {
        const fingerPrint = cacheUtils.getCacheFingerprint(userId);
        if (fingerPrint === currentHash) {
          const l1Data = cacheUtils.getFromL1(userId, 'career_recommendations');
          if (l1Data) {
            console.log('L1 Cache Hit: Career Recommendations (Cookies/Local)');
            return l1Data;
          }
        } else {
          console.log('L1 Cache fingerprint mismatch, checking L2...');
        }
      }

      // 1b. Try L1 cache without hash validation (for app reload scenarios)
      const l1DataNoHash = cacheUtils.getFromL1(userId, 'career_recommendations');
      if (l1DataNoHash) {
        console.log('L1 Cache Hit (no hash validation): Career Recommendations');
        return l1DataNoHash;
      }

      // 2. Always try L2 Cache (Supabase) - don't block on hash mismatch
      // Hash mismatch means data might be stale, but we should still return it
      // The caller can decide whether to refresh
      // @ts-ignore - Database types not fully generated
      const { data, error } = await supabase
        .from('cached_career_recommendations')
        .select('*')
        .eq('user_id', userId)
        .order('match_percentage', { ascending: false })

      if (error) {
        console.warn('Error fetching cached career recommendations from L2:', error);
        return null;
      }

      if (data && data.length > 0) {
        console.log(`L2 Cache Hit: Found ${data.length} career recommendations in Supabase`);
        // Sync to L1 for faster future reads
        cacheUtils.saveToL1(userId, 'career_recommendations', data);
        if (currentHash) {
          cacheUtils.setCacheFingerprint(userId, currentHash);
        }
        return data;
      }

      return null;
    } catch (error) {
      console.error('Error getting cached career recommendations:', error);
      return null;
    }
  }

  async saveCareerRecommendations(userId: string, recommendations: Record<string, unknown>[], hash?: string): Promise<void> {
    try {
      // Normalize recommendations to consistent format
      const normalizedRecommendations = recommendations.map(rec => ({
        career_name: (rec.career_name || rec.title || rec.name || '').toString(),
        match_percentage: Number(rec.match_percentage || rec.matchPercentage || rec.value || 0),
        description: (rec.description || '').toString(),
        salary_range: (rec.salary_range || rec.salaryRange || '').toString(),
        education: (rec.education || rec.education_required || '').toString(),
        growth: (rec.growth || rec.growth_prospect || '').toString(),
        why_recommended: (rec.why_recommended || rec.whyRecommended || '').toString(),
        actionability_score: Number(rec.actionability_score || rec.actionabilityScore || 85)
      }));

      // 1. Save to L1 Cache (LocalStorage + Cookie) - normalized format
      cacheUtils.saveToL1(userId, 'career_recommendations', normalizedRecommendations);
      if (hash) cacheUtils.setCacheFingerprint(userId, hash);

      // 2. Save to L2 Cache (Supabase)
      // Clear existing recommendations for this user
      // @ts-ignore - Database types not fully generated
      const { error: deleteError } = await supabase
        .from('cached_career_recommendations')
        .delete()
        .eq('user_id', userId)

      if (deleteError) {
        console.warn('Error clearing existing career recommendations:', deleteError)
      }

      // Insert new recommendations
      const recommendationsToSave = normalizedRecommendations.map(rec => ({
        user_id: userId,
        career_name: rec.career_name,
        match_percentage: rec.match_percentage,
        description: rec.description,
        salary_range: rec.salary_range,
        education: rec.education,
        growth: rec.growth,
        why_recommended: rec.why_recommended
      }))

      // Ensure unique career names in case AI generates duplicates
      const uniqueRecommendations = Array.from(
        new Map(recommendationsToSave.map(item => [item.career_name, item])).values()
      );

      // @ts-ignore
      const { error } = await supabase
        .from('cached_career_recommendations')
        .upsert(uniqueRecommendations as any, { onConflict: 'user_id,career_name' })

      if (error) {
        console.warn('Error saving career recommendations to L2:', error)
      } else {
        console.log(`Saved ${recommendationsToSave.length} career recommendations to Hybrid Cache (L1+L2)`)
        await this.clearInvalidation(userId, 'career_recommendations')
      }
    } catch (error) {
      console.error('Error saving career recommendations:', error)
    }
  }

  // Career Details Caching with Hybrid L1/L2
  async getCachedCareerDetails(userId: string, careerName: string, currentHash?: string): Promise<Record<string, unknown> | null> {
    try {
      // 1. Try L1 Cache
      if (currentHash) {
        const fingerPrint = cacheUtils.getCacheFingerprint(userId);
        if (fingerPrint === currentHash) {
          const l1Data = cacheUtils.getFromL1(userId, `career_details_${careerName}`);
          if (l1Data) {
            console.log(`L1 Cache Hit: Career Details for ${careerName}`);
            return l1Data;
          }
        }
      }

      // 2. Fallback to L2
      const isValid = await this.isCacheValid(userId, 'career_details', currentHash)
      if (!isValid) {
        console.log(`Career details cache for ${careerName} is missing/invalid`)
        return null
      }

      // @ts-ignore - Database types not fully generated
      const { data, error } = await supabase
        .from('cached_career_details')
        .select('details')
        .eq('user_id', userId)
        .eq('career_name', careerName)
        .maybeSingle()

      if (error) {
        console.warn('Error fetching cached career details from L2:', error)
        return null
      }

      const details = (data?.details as Record<string, unknown>) ?? null;
      
      // Sync L1 if we found it in L2
      if (details && currentHash) {
        cacheUtils.saveToL1(userId, `career_details_${careerName}`, details);
      }

      return details;
    } catch (error) {
      console.error('Error getting cached career details:', error)
      return null
    }
  }

  async saveCareerDetails(userId: string, careerName: string, details: Record<string, unknown>, hash?: string): Promise<void> {
    try {
      // 1. Save to L1
      cacheUtils.saveToL1(userId, `career_details_${careerName}`, details);
      if (hash) cacheUtils.setCacheFingerprint(userId, hash);

      // 2. Save to L2
      // @ts-ignore
      const { error } = await supabase
        .from('cached_career_details')
        .upsert({
          user_id: userId,
          career_name: careerName,
          details: details as any
        })

      if (error) {
        console.warn('Error saving career details to L2:', error)
      } else {
        console.log(`Saved career details for ${careerName} to Hybrid Cache`)
        await this.clearInvalidation(userId, 'career_details')
      }
    } catch (error) {
      console.error('Error saving career details:', error)
    }
  }

  // Course Recommendations Caching with Hybrid L1/L2
  async getCachedCourseRecommendations(userId: string, currentHash?: string): Promise<Record<string, unknown>[] | null> {
    try {
      // 1. Try L1 Cache
      if (currentHash) {
        const fingerPrint = cacheUtils.getCacheFingerprint(userId);
        if (fingerPrint === currentHash) {
          const l1Data = cacheUtils.getFromL1(userId, 'course_recommendations');
          if (l1Data) {
            console.log('L1 Cache Hit: Course Recommendations');
            return l1Data;
          }
        } else {
          console.log('L1 Cache fingerprint mismatch for courses, checking L2...');
        }
      }

      // 1b. Try L1 cache without hash validation (for app reload scenarios)
      const l1DataNoHash = cacheUtils.getFromL1(userId, 'course_recommendations');
      if (l1DataNoHash) {
        console.log('L1 Cache Hit (no hash validation): Course Recommendations');
        return l1DataNoHash;
      }

      // 2. Always try L2 Cache (Supabase) - don't block on hash mismatch
      // @ts-ignore - Database types not fully generated
      const { data, error } = await supabase
        .from('cached_course_recommendations')
        .select('courses')
        .eq('user_id', userId)
        .maybeSingle()

      if (error) {
        console.warn('Error fetching cached course recommendations from L2:', error);
        return null;
      }

      const courses = (data?.courses as Record<string, unknown>[]) ?? null;

      if (courses && courses.length > 0) {
        console.log(`L2 Cache Hit: Found ${courses.length} course recommendations in Supabase`);
        // Sync to L1 for faster future reads
        cacheUtils.saveToL1(userId, 'course_recommendations', courses);
        if (currentHash) {
          cacheUtils.setCacheFingerprint(userId, currentHash);
        }
        return courses;
      }

      return null;
    } catch (error) {
      console.error('Error getting cached course recommendations:', error);
      return null;
    }
  }

  async saveCourseRecommendations(userId: string, courses: Record<string, unknown>[], hash?: string): Promise<void> {
    try {
      // 1. Save to L1
      cacheUtils.saveToL1(userId, 'course_recommendations', courses);
      if (hash) cacheUtils.setCacheFingerprint(userId, hash);

      // 2. Save to L2
      // @ts-ignore
      const { error } = await supabase
        .from('cached_course_recommendations')
        .upsert({
          user_id: userId,
          courses: courses as any
        })

      if (error) {
        console.warn('Error saving course recommendations to L2:', error)
      } else {
        console.log(`Saved ${courses.length} course recommendations to Hybrid Cache`)
        await this.clearInvalidation(userId, 'course_recommendations')
      }
    } catch (error) {
      console.error('Error saving course recommendations:', error)
    }
  }

  // Invalidate all caches for a user (useful when profile or grades change)
  async invalidateAllCaches(userId: string, reason: string = 'profile_updated'): Promise<void> {
    // Clear L1
    cacheUtils.clearL1(userId);
    cacheUtils.clearCacheFingerprint(userId);

    const cacheTypes = ['career_recommendations', 'career_details', 'course_recommendations']

    for (const cacheType of cacheTypes) {
      await this.invalidateCache(userId, cacheType, reason)
    }

    console.log(`Invalidated all caches for user ${userId}, reason: ${reason}`)
  }

  // Clear all cached data for a user
  async clearAllCaches(userId: string): Promise<void> {
    try {
      // @ts-ignore - Database types not fully generated
      const results = await Promise.allSettled([
        supabase.from('cached_career_recommendations').delete().eq('user_id', userId),
        supabase.from('cached_career_details').delete().eq('user_id', userId),
        supabase.from('cached_course_recommendations').delete().eq('user_id', userId),
        supabase.from('cache_invalidation').delete().eq('user_id', userId)
      ])

      // Check for any errors
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          console.warn(`Error clearing cache ${index}:`, result.reason)
        }
      })

      console.log(`Cleared all caches for user ${userId}`)
    } catch (error) {
      console.error('Error clearing caches:', error)
    }
  }
}

export const aiCacheService = new AICacheService()
