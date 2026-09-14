import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Award, BookOpen, CheckCircle2, CreditCard, Loader2, MessageSquare, Search, Sparkles, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import PaymentWall from '@/components/PaymentWall'
import { StudentAppHeader } from '@/components/StudentAppHeader'
import { useAuth } from '@/contexts/AuthContext'
import { subscriptionService, type SubscriptionStatus } from '@/lib/subscription-service'

const StudentBillingPage = () => {
  const navigate = useNavigate()
  const { profile, refreshProfile } = useAuth()
  const [status, setStatus] = useState<SubscriptionStatus | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const dashboard = (activeTab?: string) => navigate('/student', { state: activeTab ? { activeTab } : undefined })

  useEffect(() => {
    if (!profile) return
    setIsLoading(true)
    subscriptionService.checkSubscriptionStatus(profile)
      .then(setStatus)
      .catch(() => setError('We could not load your plan details. Please try again.'))
      .finally(() => setIsLoading(false))
  }, [profile])

  const expiry = status?.expiresAt ? new Date(status.expiresAt).toLocaleDateString('en-KE', { day: 'numeric', month: 'long', year: 'numeric' }) : null
  const isTrial = status?.type === 'trial'

  return (
    <main className="student-billing-page student-courses-page student-shell min-h-screen">
      <StudentAppHeader />
      <section className="student-courses-content pb-28">
        <Button variant="ghost" className="student-courses-back" onClick={() => dashboard('profile')}><ArrowLeft className="h-4 w-4" /> Back to profile</Button>
        <div className="student-courses-intro">
          <span><CreditCard className="h-4 w-4" /> Plan & billing</span>
          <h1>Your access plan</h1>
          <p>Review your active access and complete a subscription here when you need one.</p>
        </div>

        {isLoading && <div className="student-billing-status"><Loader2 className="h-5 w-5 animate-spin text-primary" /><span>Loading your plan…</span></div>}
        {error && <p className="student-billing-error">{error}</p>}

        {!isLoading && status && <>
          <section className="student-billing-card">
            <div className="student-billing-plan-icon"><Sparkles className="h-5 w-5" /></div>
            <div className="flex-1">
              <p className="student-billing-eyebrow">Current plan</p>
              <h2>{status.isActive ? (isTrial ? 'Free student trial' : 'Student subscription') : 'No active plan'}</h2>
              <p>{status.isActive && expiry ? `Your access is active until ${expiry}.` : status.isTrialEligible ? 'Your free term trial is ready to activate.' : 'Choose a subscription to restore full access.'}</p>
            </div>
            {status.isActive ? <span className="student-billing-active"><CheckCircle2 className="h-4 w-4" /> Active</span> : <span className="student-billing-inactive">Action needed</span>}
          </section>

          {status.isTrialEligible && !status.isActive && <section className="student-billing-callout">
            <div><h2>Free trial availability</h2><p>Your free term access will become active when the next academic term starts. You do not need to activate it manually.</p></div>
          </section>}

          {!status.isActive && !status.isTrialEligible && <section className="student-billing-payment"><PaymentWall onPaymentSuccess={refreshProfile} /></section>}

          <section className="student-billing-includes">
            <p>What your plan includes</p>
            <div><span><CheckCircle2 className="h-4 w-4" /> Career matches from your profile</span><span><CheckCircle2 className="h-4 w-4" /> Database career exploration</span><span><CheckCircle2 className="h-4 w-4" /> Course and grade guidance</span></div>
          </section>
        </>}
      </section>
      <nav className="student-courses-nav" aria-label="Student navigation">
        <button type="button" onClick={() => dashboard()}><Award className="h-5 w-5" /><span>Home</span></button>
        <button type="button" onClick={() => dashboard('careers')}><Search className="h-5 w-5" /><span>Explore</span></button>
        <button type="button" onClick={() => dashboard('progress')}><BookOpen className="h-5 w-5" /><span>Plan</span></button>
        <button type="button" onClick={() => navigate('/student/chat')}><MessageSquare className="h-5 w-5" /><span>Chat</span></button>
        <button type="button" className="is-active" onClick={() => dashboard('profile')}><User className="h-5 w-5" /><span>Profile</span></button>
      </nav>
    </main>
  )
}

export default StudentBillingPage
