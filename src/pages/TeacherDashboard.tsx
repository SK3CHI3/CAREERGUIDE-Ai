import React, { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { classService, type ClassRecord } from '@/lib/class-service'
import CreateClass from '@/components/teacher/CreateClass'
import PaymentWall from '@/components/PaymentWall'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  LogOut, BookOpen, Users,
  ChevronRight, RefreshCw, FileSpreadsheet, Trash2
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { ThemeToggle } from '@/components/ThemeToggle'


const TeacherDashboard: React.FC = () => {
  const navigate = useNavigate()
  const { user, profile, signOut } = useAuth()
  const { toast } = useToast()

  const [classes, setClasses] = useState<ClassRecord[]>([])
  const [classCounts, setClassCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [subscriptionStatus, setSubscriptionStatus] = useState<any>(null)

  const loadData = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const { value: myClasses } = await Promise.allSettled([
        classService.getTeacherClasses(user.id),
      ]).then(results => ({ value: (results[0] as any).value || [] }))

      const classList = myClasses || []
      setClasses(classList)

      const counts: Record<string, number> = {}
      await Promise.allSettled(
        classList.map(async (cls: ClassRecord) => {
          counts[cls.id] = await classService.getClassStudentCount(cls.id)
        })
      )
      setClassCounts(counts)

      const { subscriptionService } = await import('@/lib/subscription-service')
      const status = await subscriptionService.checkSubscriptionStatus(profile)
      setSubscriptionStatus(status)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => { loadData() }, [loadData])

  const initials = (name: string | null) =>
    name ? name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2) : 'T'

  const totalStudents = Object.values(classCounts).reduce((a, b) => a + b, 0)

  const handleDeleteClass = async (e: React.MouseEvent, classId: string, name: string) => {
    e.stopPropagation()
    if (!window.confirm(`Are you sure you want to delete the class "${name}"? This action cannot be undone.`)) return
    try {
        await classService.deleteClass(classId)
        toast({ title: 'Class deleted', description: `"${name}" has been removed.` })
        loadData()
    } catch (err) {
        toast({ title: 'Error', description: err instanceof Error ? err.message : 'Failed to delete class', variant: 'destructive' })
    }
  }

  if (!loading && subscriptionStatus && !subscriptionStatus.isActive && !subscriptionStatus.isTrialEligible) {
    return <PaymentWall onPaymentSuccess={loadData} />
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--gradient-homepage)' }}>
      <header className="border-b border-card-border bg-background/80 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <img
                src="/logos/CareerGuide_Logo.webp"
                alt="CareerGuide AI"
                className="h-10 w-auto"
              />
            </div>
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <Button variant="ghost" size="icon" onClick={loadData} title="Refresh">
                <RefreshCw className="w-4 h-4" />
              </Button>
              <Avatar className="w-8 h-8">
                <AvatarFallback className="text-xs">{initials(profile?.full_name ?? null)}</AvatarFallback>
              </Avatar>
              <span className="text-sm text-foreground hidden md:block">{profile?.full_name ?? user?.email}</span>
              <Badge variant="secondary">Teacher</Badge>
              <Button variant="ghost" size="icon" onClick={() => signOut()} title="Sign out">
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Teacher Dashboard</h1>
            <p className="text-foreground-muted text-sm mt-1">Guide students in making better career choices</p>
          </div>
          {user && (
            <CreateClass
              teacherId={user.id}
              onCreated={loadData}
            />
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { label: 'My Classes', value: classes.length, icon: BookOpen, color: 'text-purple-400' },
            { label: 'Students', value: totalStudents, icon: Users, color: 'text-green-400' },
          ].map(({ label, value, icon: Icon, color }) => (
            <Card key={label} className="bg-gradient-surface border-card-border">
              <CardContent className="p-5 flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl bg-muted flex items-center justify-center ${color}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-bold text-foreground text-2xl">
                    {loading ? '—' : value}
                  </p>
                  <p className="text-sm text-foreground-muted">{label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="bg-gradient-surface border-card-border">
          <CardHeader>
            <div>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" /> My Classes
              </CardTitle>
              <CardDescription>Click a class to view students, grades, and upload marks</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-foreground-muted">Loading...</p>
            ) : classes.length === 0 ? (
              <div className="text-center py-10">
                <BookOpen className="w-12 h-12 text-foreground-muted mx-auto mb-3" />
                <p className="text-foreground font-medium mb-1">No classes yet</p>
                <p className="text-foreground-muted text-sm mb-4">Create your first class to start managing students and grades.</p>
                {user && (
                  <CreateClass teacherId={user.id} onCreated={loadData} />
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {classes.map((cls) => (
                  <div
                    key={cls.id}
                    className="p-4 rounded-xl bg-muted/30 border border-card-border hover:border-primary/40 hover:shadow-md transform hover:-translate-y-0.5 cursor-pointer transition-all group"
                    onClick={() => navigate(`/teacher/class/${cls.id}`)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-9 h-9 rounded-lg bg-gradient-primary flex items-center justify-center">
                        <BookOpen className="w-4 h-4 text-primary-foreground" />
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="w-7 h-7 text-foreground-muted hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => handleDeleteClass(e, cls.id, cls.name)}
                          title="Delete class"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                        <ChevronRight className="w-4 h-4 text-foreground-muted group-hover:text-primary transition-colors" />
                      </div>
                    </div>
                    <p className="font-semibold text-foreground">{cls.name}</p>
                    <p className="text-xs text-foreground-muted mt-0.5">{cls.grade_level} · {cls.academic_year}</p>
                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-card-border">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex-1 justify-start gap-1.5 h-8 px-2 text-xs text-foreground-muted hover:text-foreground hover:bg-muted/50"
                        onClick={(e) => { e.stopPropagation(); navigate(`/teacher/class/${cls.id}?tab=students`) }}
                      >
                        <Users className="w-3.5 h-3.5" />
                        {classCounts[cls.id] ?? 0} students
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex-1 justify-start gap-1.5 h-8 px-2 text-xs text-foreground-muted hover:text-primary hover:bg-primary/10"
                        onClick={(e) => { e.stopPropagation(); navigate(`/teacher/class/${cls.id}?tab=upload`) }}
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5" />
                        Upload grades
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

export default TeacherDashboard
