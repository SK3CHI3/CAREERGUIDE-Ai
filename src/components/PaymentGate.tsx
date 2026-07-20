import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { ProfileSetup } from './ProfileSetup'

interface PaymentGateProps {
  children: React.ReactNode
}

const PaymentGate: React.FC<PaymentGateProps> = ({ children }) => {
  const { user, profile, loading: authLoading } = useAuth()
  const [isProfileComplete, setIsProfileComplete] = useState(false)
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    const checkUserStatus = async () => {
      if (!user || !profile || authLoading) {
        setIsChecking(false)
        return
      }

      try {
        const profileComplete = checkProfileCompletion(profile)
        setIsProfileComplete(profileComplete)
      } catch (error) {
        console.error('Error checking user status:', error)
      } finally {
        setIsChecking(false)
      }
    }

    checkUserStatus()
  }, [user?.id, profile?.id, authLoading])

  const checkProfileCompletion = (profile: {
    full_name?: string | null;
    school_level?: string | null;
    cbe_subjects?: string[] | null;
    career_interests?: string[] | null;
    [key: string]: any;
  }): boolean => {
    const requiredFields = [
      'full_name',
      'school_level',
      'cbe_subjects',
      'career_interests'
    ]

    const basicFieldsComplete = requiredFields.every(field => {
      const value = profile[field]
      if (Array.isArray(value)) {
        return value.length > 0
      }
      return value && typeof value === 'string' && value.trim() !== ''
    })

    const cbeSubjectsComplete = profile.cbe_subjects &&
      Array.isArray(profile.cbe_subjects) &&
      profile.cbe_subjects.length >= 3

    const careerInterestsComplete = profile.career_interests &&
      Array.isArray(profile.career_interests) &&
      profile.career_interests.length >= 1

    return basicFieldsComplete && cbeSubjectsComplete && careerInterestsComplete
  }

  const handleProfileComplete = (_paymentStatus: boolean) => {
    setIsProfileComplete(true)
  }

  if (authLoading || isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--gradient-homepage)' }}>
        <img
          src="/logos/CareerGuide_Logo.webp"
          alt="CareerGuide AI"
          className="h-10 w-auto animate-pulse drop-shadow-md"
        />
      </div>
    )
  }

  if (!isProfileComplete) {
    return <ProfileSetup onComplete={handleProfileComplete} />
  }

  // Students proceed to dashboard after profile setup
  // Payment prompts appear inside the dashboard as alerts/banners
  return <>{children}</>
}

export default PaymentGate
