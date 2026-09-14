import { LogOut } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/ThemeToggle'

/** A single header for every full-page student view. */
export const StudentAppHeader = () => {
  const navigate = useNavigate()
  const { user, signOut } = useAuth()

  return (
    <header className="student-header sticky top-0 z-50 safe-area-top">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <button type="button" className="flex items-center" onClick={() => navigate('/student')} aria-label="CareerGuide AI home">
          <img src="/logos/CareerGuide_Logo.webp" alt="CareerGuide AI" className="h-8 w-auto" />
        </button>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          {user && <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-500" onClick={() => signOut()} aria-label="Sign out">
              <LogOut className="w-4 h-4" />
            </Button>}
        </div>
      </div>
    </header>
  )
}
