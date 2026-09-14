import { ArrowLeft, Award, BarChart3, BookOpen, MessageSquare, Search, User } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import GradesManager from '@/components/GradesManager'
import { StudentAppHeader } from '@/components/StudentAppHeader'

const StudentGradesPage = () => {
  const navigate = useNavigate()
  const dashboard = (activeTab?: string) => navigate('/student', { state: activeTab ? { activeTab } : undefined })

  return (
    <main className="student-grades-page student-shell min-h-screen">
      <StudentAppHeader />
      <section className="student-grades-content">
        <Button variant="ghost" className="student-courses-back" onClick={() => dashboard()}><ArrowLeft className="h-4 w-4" /> Back to dashboard</Button>
        <div className="student-courses-intro">
          <span><BarChart3 className="h-4 w-4" /> Academic profile</span>
          <h1>Your grades</h1>
          <p>Keep your academic record current. These results help tailor your career and short-course recommendations.</p>
        </div>
        <GradesManager />
      </section>
      <nav className="student-courses-nav" aria-label="Student navigation">
        <button type="button" onClick={() => dashboard()}><Award className="h-5 w-5" /><span>Home</span></button>
        <button type="button" onClick={() => dashboard('careers')}><Search className="h-5 w-5" /><span>Explore</span></button>
        <button type="button" onClick={() => dashboard('progress')}><BookOpen className="h-5 w-5" /><span>Plan</span></button>
        <button type="button" onClick={() => navigate('/student/chat')}><MessageSquare className="h-5 w-5" /><span>Chat</span></button>
        <button type="button" onClick={() => dashboard('profile')}><User className="h-5 w-5" /><span>Profile</span></button>
      </nav>
    </main>
  )
}

export default StudentGradesPage
