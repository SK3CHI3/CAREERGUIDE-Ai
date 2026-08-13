import { supabase } from './supabase'
import { Database } from './database.types'

export type TermDates = {
  [key: string]: {
    start: string
    end: string
  }
}

export interface SubscriptionStatus {
  isActive: boolean
  type: 'individual' | 'trial' | 'none'
  expiresAt: string | null
  isTrialEligible: boolean
}

const GRACE_PERIOD_DAYS = 3

class SubscriptionService {
  private async getTermDates(): Promise<TermDates> {
    const { data, error } = await supabase
      .from('global_settings')
      .select('value')
      .eq('key', 'current_term_dates')
      .single()

    if (error || !data) {
      // Fallback to default 2026 dates (Current Year)
      return {
        term1: { start: '2026-01-05', end: '2026-04-10' },
        term2: { start: '2026-05-04', end: '2026-08-07' },
        term3: { start: '2026-08-31', end: '2026-10-30' }
      }
    }

    return data.value as TermDates
  }

  async getCurrentTerm(): Promise<{ term: string; dates: { start: string; end: string } } | null> {
    const dates = await this.getTermDates()
    const now = new Date()

    for (const [term, range] of Object.entries(dates)) {
      const start = new Date(range.start)
      const end = new Date(range.end)
      if (now >= start && now <= end) {
        return { term, dates: range }
      }
    }

    // If between terms, return the upcoming term
    const entries = Object.entries(dates).sort((a, b) => new Date(a[1].start).getTime() - new Date(b[1].start).getTime())
    for (const [term, range] of entries) {
      if (now < new Date(range.start)) {
        return { term, dates: range }
      }
    }

    return null
  }

  async checkSubscriptionStatus(profile: any): Promise<SubscriptionStatus> {
    if (!profile) {
      return { isActive: false, type: 'none', expiresAt: null, isTrialEligible: false }
    }

    const now = new Date()
    const gracePeriodMs = GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000
    
    // 1. Check individual subscription
    if (profile.subscription_expires_at) {
      const individualExpiry = new Date(profile.subscription_expires_at)
      const individualGraceExpiry = new Date(individualExpiry.getTime() + gracePeriodMs)
      
      if (now <= individualGraceExpiry) {
        return {
          isActive: true,
          type: (profile.subscription_type as 'individual' | 'trial') || 'individual',
          expiresAt: profile.subscription_expires_at,
          isTrialEligible: !profile.is_trial_used
        }
      }
    }

    // 2. Check if user is eligible for trial (First Term Free)
    if (!profile.is_trial_used) {
        const currentTerm = await this.getCurrentTerm()
        if (currentTerm) {
            const userCreated = new Date(profile.created_at!)
            const termEnd = new Date(currentTerm.dates.end)
            const trialGraceEnd = new Date(termEnd.getTime() + gracePeriodMs)
            
            // If they signed up during this term (+ grace), they are in their free trial
            if (userCreated <= trialGraceEnd) {
                return {
                    isActive: true,
                    type: 'trial',
                    expiresAt: currentTerm.dates.end,
                    isTrialEligible: true
                }
            }
        }
    }

    return {
      isActive: false,
      type: 'none',
      expiresAt: null,
      isTrialEligible: !profile.is_trial_used
    }
  }

  async activateTrial(userId: string): Promise<void> {
    const currentTerm = await this.getCurrentTerm()
    if (!currentTerm) throw new Error('Could not determine current academic term')

    const { error } = await supabase
      .from('profiles')
      .update({
        subscription_type: 'trial' as any,
        subscription_expires_at: currentTerm.dates.end,
        is_trial_used: true
      })
      .eq('id', userId)

    if (error) throw new Error(error.message)
  }
}

export const subscriptionService = new SubscriptionService()
