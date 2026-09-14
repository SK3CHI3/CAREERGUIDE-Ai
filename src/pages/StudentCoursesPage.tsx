import { ArrowLeft, Award, BookOpen, MessageSquare, Search, User } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/AuthContext'
import CourseRecommendations from '@/components/CourseRecommendations'
import { dashboardService } from '@/lib/dashboard-service'
import { StudentAppHeader } from '@/components/StudentAppHeader'

const StudentCoursesPage = () => {
  const navigate = useNavigate()
  const { profile, user } = useAuth()
  const [strongSubjects, setStrongSubjects] = useState<string[]>([])
  const [isGradesReady, setIsGradesReady] = useState(false)

  useEffect(() => {
    if (!user?.id) {
      setIsGradesReady(true)
      return
    }
    setIsGradesReady(false)
    dashboardService.getUserGrades(user.id).then((grades) => {
      const subjects = Object.entries(grades.reduce((result: Record<string, { total: number; count: number }>, grade: any) => {
        const subject = grade.subject_name
        result[subject] ||= { total: 0, count: 0 }
        result[subject].total += Number(grade.grade_value) || 0
        result[subject].count += 1
        return result
      }, {})).sort(([, a], [, b]) => (b.total / b.count) - (a.total / a.count)).slice(0, 3).map(([subject]) => subject)
      setStrongSubjects(subjects)
    }).catch(() => setStrongSubjects([])).finally(() => setIsGradesReady(true))
  }, [user?.id])

  return (
    <main className="student-courses-page student-shell min-h-screen">
      <StudentAppHeader />

      <section className="student-courses-content">
        <Button variant="ghost" className="student-courses-back" onClick={() => navigate('/student')}>
          <ArrowLeft className="h-4 w-4" /> Back to dashboard
        </Button>

        <div className="student-courses-intro">
          <span><BookOpen className="h-4 w-4" /> Skill building</span>
          <h1>Recommended short courses</h1>
          <p>Free, practical learning options selected around your subjects, interests, and career direction.</p>
        </div>

        <section className="student-courses-list" aria-label="Recommended short courses">
          {isGradesReady ? <CourseRecommendations
              careerInterests={profile?.career_interests || profile?.interests}
              cbeSubjects={profile?.cbe_subjects || profile?.subjects}
              strongSubjects={strongSubjects}
              limit={3}
            /> : <p className="student-courses-loading">Preparing recommendations from your academic profile…</p>}
        </section>
      </section>

      <nav className="student-courses-nav" aria-label="Student navigation">
        <button type="button" onClick={() => navigate('/student')}><Award className="h-5 w-5" /><span>Home</span></button>
        <button type="button" onClick={() => navigate('/student', { state: { activeTab: 'careers' } })}><Search className="h-5 w-5" /><span>Explore</span></button>
        <button type="button" onClick={() => navigate('/student', { state: { activeTab: 'progress' } })}><BookOpen className="h-5 w-5" /><span>Plan</span></button>
        <button type="button" onClick={() => navigate('/student/chat')}><MessageSquare className="h-5 w-5" /><span>Chat</span></button>
        <button type="button" onClick={() => navigate('/student', { state: { activeTab: 'profile' } })}><User className="h-5 w-5" /><span>Profile</span></button>
      </nav>
    </main>
  )
}

export default StudentCoursesPage
