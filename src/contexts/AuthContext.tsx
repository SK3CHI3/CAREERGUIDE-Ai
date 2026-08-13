// Production-Ready Auth Context - Official Supabase Pattern
import React, { createContext, useContext, useEffect, useState } from 'react'

const isDev = typeof import.meta !== 'undefined' && import.meta.env?.DEV
import { User, Session, AuthError } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/supabase'
import { getJWTClaims, hasMFAEnabled, validateJWTForSensitiveOperation } from '@/lib/auth-utils'
import { isSessionValid, destroySessionManager } from '@/lib/session-utils'
import { setSessionMetadata, clearSessionMetadata } from '@/lib/cache-utils'

interface Profile {
  id: string
  email: string
  upi_number: string | null
  phone: string | null
  full_name: string | null
  avatar_url: string | null
  role: 'student' | 'admin' | 'mentor'
  school_id?: string | null
  school_level?: 'primary' | 'secondary' | 'tertiary'
  current_grade?: string
  cbe_subjects?: string[]
  subjects?: string[]
  career_interests?: string[]
  interests?: string[]
  career_goals?: string
  assessment_results?: {
    riasec_scores: Record<string, number>
    personality_type: string[]
    values: string[]
    constraints: string[]
  } | null
  payment_status?: 'pending' | 'completed' | 'failed' | 'refunded'
  payment_reference?: string
  payment_date?: string
  payment_amount?: number
  payment_currency?: string
  intasend_transaction_id?: string
  mentor_student_count?: '1-5' | '6-20' | '21-50' | '50+' | null
  mentor_type?: 'individual' | 'classroom' | 'school' | 'organization' | null
  created_at: string
  updated_at: string
}

interface AuthContextType {
  user: User | null
  profile: Profile | null
  session: Session | null
  loading: boolean
  profileLoading: boolean
  profileError: Error | null
  isMFAEnabled: boolean
  signUp: (email: string, password: string, fullName: string, upiOrPhone: string, role?: Profile['role'], mentorData?: { studentCount?: Profile['mentor_student_count']; mentorType?: Profile['mentor_type'] }) => Promise<{ data: any; error: AuthError | null }>
  signIn: (identifier: string, password: string) => Promise<{ error: AuthError | null }>
  signOut: () => Promise<{ error: AuthError | null }>
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: Error | null }>
  refreshProfile: () => Promise<void>
  validateForSensitiveOperation: () => { isValid: boolean; reason?: string }
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [profileLoading, setProfileLoading] = useState(false)
  const [profileError, setProfileError] = useState<Error | null>(null)
  const [isMFAEnabled, setIsMFAEnabled] = useState(false)

  // Fetch user profile - Simple and fast
  const fetchProfile = async (userId: string, forceRefresh = false) => {
    try {
      setProfileLoading(true)
      setProfileError(null)

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle() // Use maybeSingle to avoid 0-row errors

      if (error) {
        // Only treat as error if it's not a "not found" error
        // though maybeSingle should handle "not found" by returning data=null
        const err = new Error(error.message)
        setProfileError(err)
        setProfile(null)
      } else if (!data) {
        // No profile found - common for new users
        if (isDev) console.log('🔐 AuthContext: No profile yet for user:', userId)
        setProfile(null)
      } else {
        const profileData = data as Profile
        setProfile(profileData)
        setProfileError(null)
        
        // Save light metadata for instant UI on next load
        setSessionMetadata({
          name: profileData.full_name || '',
          level: profileData.school_level || '',
          score: 100, // Placeholder or calculated completeness
          lastVisit: new Date().toISOString()
        })
      }
    } catch (error) {
      setProfileError(error instanceof Error ? error : new Error(String(error)))
      setProfile(null)
    } finally {
      setProfileLoading(false)
    }
  }

  // Initialize auth state - Simple and reliable
  useEffect(() => {
    let mounted = true

    const initializeAuth = async () => {
      try {
        if (isDev) console.log('🔐 AuthContext: Starting initialization')

        // Get initial session
        const { data: { session } } = await supabase.auth.getSession()
        if (isDev) console.log('🔐 AuthContext: Got session:', session ? 'exists' : 'null')

        if (!mounted) return

        setSession(session)
        setUser(session?.user ?? null)

        if (session?.user) {
          if (isDev) console.log('🔐 AuthContext: User found, setting MFA and fetching profile')
          setIsMFAEnabled(hasMFAEnabled(session.user))
          // Fetch profile in background - don't wait for it
          fetchProfile(session.user.id).catch(error => {
            if (isDev) console.error('Background profile fetch failed:', error)
          })
        } else {
          if (isDev) console.log('🔐 AuthContext: No user found')
          setIsMFAEnabled(false)
        }
      } catch (error) {
        if (isDev) console.error('Auth initialization error:', error)
      } finally {
        if (mounted) {
          if (isDev) console.log('🔐 AuthContext: Setting loading to false')
          setLoading(false)
        }
      }
    }

    initializeAuth()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return

      setSession(session)
      setUser(session?.user ?? null)

      if (session?.user) {
        setIsMFAEnabled(hasMFAEnabled(session.user))
        // Fetch profile in background
        fetchProfile(session.user.id).catch(error => {
          console.error('Background profile fetch failed:', error)
        })
      } else {
        setProfile(null)
        setProfileError(null)
        setIsMFAEnabled(false)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, []) // Empty dependency array - only run once

  // Check session validity periodically (30-day limit)
  useEffect(() => {
    if (!user) return

    let isMounted = true

    const sessionCheckInterval = setInterval(async () => {
      const stillValid = await isSessionValid()
      if (stillValid) {
        return
      }

      if (isDev) console.log('🔄 Session reported as invalid, attempting silent refresh')
      const { data, error } = await supabase.auth.refreshSession()

      if (error || !data.session) {
        if (isDev) console.warn('Session refresh failed, signing user out', error)
        if (!isMounted) return
        setUser(null)
        setSession(null)
        setProfile(null)
        return
      }

      if (!isMounted) return
      setSession(data.session)
      setUser(data.session.user)
    }, 60000) // Check every minute

    return () => {
      isMounted = false
      clearInterval(sessionCheckInterval)
    }
  }, [user])

  // Sign up with email and password
  // upiOrPhone: UPI number for students (6-char NEMIS code), phone for mentors
  const signUp = async (email: string, password: string, fullName: string, upiOrPhone: string, role: Profile['role'] = 'student', mentorData?: { studentCount?: Profile['mentor_student_count']; mentorType?: Profile['mentor_type'] }) => {
    const isStudent = role === 'student'
    const isMentor = role === 'mentor'
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          // Store UPI for students, phone for mentors
          ...(isStudent ? { upi_number: upiOrPhone } : { phone: upiOrPhone }),
          role: role,
        },
      },
    })
    // If signup succeeded, also save UPI/phone to profiles
    if (!error && data.user) {
      if (isStudent) {
        await supabase.from('profiles').update({ upi_number: upiOrPhone } as any).eq('id', data.user.id)

        // Sync any orphaned grades and class enrollments that were uploaded before the student created an account
        const { error: syncError } = await supabase.rpc('sync_student_data' as any, {
          p_user_id: data.user.id,
          p_upi: upiOrPhone.toUpperCase()
        })

        if (syncError) {
          console.error("Warning: Failed to sync orphaned student data automatically:", syncError)
        }
      } else {
        // For mentors, save phone + mentor fields
        const updateData: any = { phone: upiOrPhone }
        if (isMentor && mentorData) {
          if (mentorData.studentCount) updateData.mentor_student_count = mentorData.studentCount
          if (mentorData.mentorType) updateData.mentor_type = mentorData.mentorType
        }
        await supabase.from('profiles').update(updateData).eq('id', data.user.id)
      }
    }
    return { data, error }
  }

  // Unified Sign In (Email, UPI, or Phone)
  const signIn = async (identifier: string, password: string) => {
    try {
      let email = identifier;

      // Check if identifier is NOT an email — try resolving from UPI or phone
      const isEmail = identifier.includes('@');

      if (!isEmail) {
        if (isDev) console.log('🔍 AuthContext: Non-email identifier, resolving email...');
        const cleanIdentifier = identifier.replace(/[\s-]/g, '');

        // Try resolving using the secure RPC function to bypass RLS restrictions for anon users
        const isUPI = /^[A-Za-z0-9]{4,12}$/.test(cleanIdentifier) && !cleanIdentifier.startsWith('07') && !cleanIdentifier.startsWith('+');

        const { data: resolvedEmail, error } = await (supabase.rpc as any)('get_user_email', { p_identifier: cleanIdentifier });

        if (!error && resolvedEmail) {
          email = resolvedEmail as string;
          if (isDev) console.log('🎓 AuthContext: Resolved email:', email);
        } else {
          if (error && error.code !== 'PGRST116') {
            console.error('Server error during identifier lookup:', error);
            return { error: { message: `Server error during login: ${error.message} (Code: ${error.code})`, name: 'AuthError' } as any };
          }
          if (isUPI) {
            return { error: { message: 'No account found with this UPI number. Please check your NEMIS UPI and try again.', name: 'AuthError' } as any };
          } else {
            return { error: { message: 'No account found with this identifier. Please use your email, UPI number, or phone.', name: 'AuthError' } as any };
          }
        }
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      setSession(data.session)
      setUser(data.user)

      return { error: null }
    } catch (error) {
      if (isDev) console.error('Sign in error:', error)
      return { error: error as AuthError }
    }
  }

  // Sign out
  const signOut = async () => {
    try {
      destroySessionManager()
      clearSessionMetadata()
      // Clear local state first
      setUser(null)
      setProfile(null)
      setProfileError(null)
      setSession(null)

      // Sign out from Supabase
      const { error } = await supabase.auth.signOut()

      if (error) {
        if (isDev) console.error('Sign out error:', error)
        return { error }
      }

      if (isDev) console.log('Successfully signed out')
      return { error: null }
    } catch (error) {
      if (isDev) console.error('Sign out error:', error)
      return { error: error as AuthError }
    }
  }

  // Update profile
  const updateProfile = async (updates: Partial<Profile>) => {
    try {
      if (!user) throw new Error('No user logged in')

      type ProfileUpdate = Database['public']['Tables']['profiles']['Update']
      const { error } = await supabase
        .from('profiles')
        .update(updates as ProfileUpdate)
        .eq('id', user.id)

      if (error) throw error

      // Update local profile state
      setProfile(prev => prev ? { ...prev, ...updates } : null)

      return { error: null }
    } catch (error) {
      return { error: error as Error }
    }
  }

  // Refresh profile from database
  const refreshProfile = async () => {
    if (user) {
      if (isDev) console.log('Refreshing profile for user:', user.id)
      await fetchProfile(user.id, true) // Force refresh
    }
  }

  // Validate JWT for sensitive operations
  const validateForSensitiveOperation = () => {
    return validateJWTForSensitiveOperation(user)
  }

  const value = {
    user,
    profile,
    session,
    loading,
    profileLoading,
    profileError,
    isMFAEnabled,
    signUp,
    signIn,
    signOut,
    updateProfile,
    refreshProfile,
    validateForSensitiveOperation,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
