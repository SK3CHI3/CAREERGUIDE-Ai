import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { LoginForm } from '@/components/auth/LoginForm'
import { SignupForm } from '@/components/auth/SignupForm'
import { useAuth } from '@/contexts/AuthContext'
import { getDashboardPathForRole } from '@/types/roles'
import { useSearchParams } from 'react-router-dom'
import BrandedLoader from '@/components/BrandedLoader'

type AuthMode = 'login' | 'signup'

const Auth = () => {
  const [searchParams] = useSearchParams()
  const initialMode = (searchParams.get('mode') as AuthMode) || 'login'
  const defaultRole = searchParams.get('role') as 'student' | 'mentor' | null

  const [mode, setMode] = useState<AuthMode>(initialMode)
  const { user, profile, loading, profileLoading, profileError } = useAuth()

  // Show loading state
  if (loading || (user && profileLoading && !profileError)) {
    return (
      <div className="auth-shell min-h-screen flex items-center justify-center p-4 bg-slate-50">
        <BrandedLoader size="lg" showText={true} text="Authenticating..." />
      </div>
    )
  }

  // Redirect if already authenticated
  if (user && profile) {
    return <Navigate to={getDashboardPathForRole(profile.role as any)} replace />
  }

  const renderForm = () => {
    switch (mode) {
      case 'login':
        return (
          <LoginForm onToggleMode={() => setMode('signup')} />
        )
      case 'signup':
        return (
          <SignupForm
            onToggleMode={() => setMode('login')}
            defaultRole={defaultRole || 'student'}
          />
        )
      default:
        return null
    }
  }

  return (
    <div className="auth-shell min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:py-12">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-center lg:min-h-[calc(100vh-6rem)] lg:justify-between lg:gap-16">
        <section className="hidden max-w-xl lg:block">
          <p className="mb-5 text-sm font-semibold uppercase tracking-[0.2em] text-blue-700">CareerGuide AI</p>
          <h1 className="auth-display max-w-lg text-5xl font-semibold leading-[0.98] text-slate-950">
            Your school journey deserves a clear direction.
          </h1>
          <p className="mt-6 max-w-md text-lg leading-8 text-slate-600">
            Understand your strengths, find realistic pathways, and take the next right step toward your future.
          </p>
          <div className="mt-10 grid max-w-md grid-cols-2 gap-3 text-sm text-slate-700">
            <div className="rounded-2xl border border-slate-200 bg-white p-4"><strong className="block text-xl text-slate-950">CBE + KUCCPS</strong><span className="mt-1 block">Guidance built for Kenya</span></div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4"><strong className="block text-xl text-slate-950">Your next step</strong><span className="mt-1 block">Clear, practical progress</span></div>
          </div>
        </section>

        <div className="w-full max-w-md">
          <div className="mb-7 flex items-center justify-between lg:hidden">
            <img
              src="/logos/CareerGuide_Logo.webp"
              alt="CareerGuide AI"
              className="h-10 w-auto"
            />
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Career guidance</span>
          </div>

          {/* Auth form behavior is preserved inside the redesigned shell. */}
          {renderForm()}

          <div className="mt-6 text-center text-xs leading-5 text-slate-500">
            <p>
              By continuing, you agree to our{' '}
              <a href="/terms" className="font-semibold text-blue-700 hover:underline">Terms of Service</a>{' '}
              and{' '}
              <a href="/privacy" className="font-semibold text-blue-700 hover:underline">Privacy Policy</a>.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Auth
