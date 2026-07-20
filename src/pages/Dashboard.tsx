import { useAuth } from '@/contexts/AuthContext'
import { getSessionMetadata } from '@/lib/cache-utils'
import { Navigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  User,
  BookOpen,
  Target,
  TrendingUp,
  Settings,
  LogOut,
  Bot,
  BarChart3,
  Calendar,
  MessageSquare
} from 'lucide-react'
import { ThemeToggle } from '@/components/ThemeToggle'

const Dashboard = () => {
  const { user, profile, signOut, loading, profileLoading } = useAuth()
  const cachedMeta = getSessionMetadata()
  
  const displayName = profile?.full_name || cachedMeta?.name || 'User'
  const displayRole = profile?.role || 'student'
  const displayLevel = profile?.school_level || cachedMeta?.level || ''

  // Redirect based on user role
  if (profile?.role === 'admin') return <Navigate to="/admin" replace />
  if (profile?.role === 'teacher') return <Navigate to="/teacher" replace />
  if (profile?.role === 'student') return <Navigate to="/student" replace />

  const handleSignOut = async () => {
    try {
      const { error } = await signOut()
      if (error) {
        console.error('Sign out failed:', error)
        // Still redirect to login even if there's an error
      }
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  const getInitials = (name: string | null) => {
    if (!name) return 'U'
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-destructive text-destructive-foreground'
      case 'teacher':
        return 'bg-secondary text-secondary-foreground'
      case 'student':
      default:
        return 'bg-primary text-primary-foreground'
    }
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--gradient-homepage)' }}>
      {/* Header */}
      <header className="border-b border-card-border bg-background/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <img
                src="/logos/CareerGuide_Logo.webp"
                alt="CareerGuide AI"
                className="h-10 w-auto"
              />
            </div>

            {/* User Menu */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <Avatar>
                  <AvatarImage src={profile?.avatar_url || ''} />
                  <AvatarFallback>{getInitials(profile?.full_name)}</AvatarFallback>
                </Avatar>
                <div className="hidden md:block">
                  <p className="text-sm font-medium text-foreground">
                    {displayName}
                  </p>
                  <Badge className={getRoleBadgeColor(displayRole)}>
                    {displayRole}
                  </Badge>
                </div>
              </div>
              <ThemeToggle />
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">
            Welcome back, {displayName.split(' ')[0] || 'there'}! 👋
          </h2>
          <p className="text-foreground-muted">
            Ready to continue your career discovery journey?
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-surface border-card-border hover:shadow-card transition-all duration-300 cursor-pointer">
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                  <Target className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">Take Assessment</CardTitle>
                  <CardDescription>Discover your strengths</CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>

          <Card className="bg-gradient-surface border-card-border hover:shadow-card transition-all duration-300 cursor-pointer">
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-secondary/20 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-secondary" />
                </div>
                <div>
                  <CardTitle className="text-lg">Career Paths</CardTitle>
                  <CardDescription>Explore opportunities</CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>

          <Card className="bg-gradient-surface border-card-border hover:shadow-card transition-all duration-300 cursor-pointer">
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-accent/20 rounded-lg flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <CardTitle className="text-lg">AI Chat</CardTitle>
                  <CardDescription>Get instant guidance</CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>

          <Card className="bg-gradient-surface border-card-border hover:shadow-card transition-all duration-300 cursor-pointer">
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-warning/20 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-warning" />
                </div>
                <div>
                  <CardTitle className="text-lg">Progress</CardTitle>
                  <CardDescription>Track your journey</CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>
        </div>

        {/* Recent Activity */}
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="bg-gradient-surface border-card-border">
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Your latest career exploration activities</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3 p-3 rounded-lg bg-background/50">
                    <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-foreground-muted">Welcome to CareerGuide AI!</p>
                    </div>
                    <span className="text-xs text-foreground-muted">Just now</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card className="bg-gradient-surface border-card-border">
              <CardHeader>
                <CardTitle>Next Steps</CardTitle>
                <CardDescription>Recommended actions for you</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span className="text-sm">Complete your profile</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-foreground-muted rounded-full"></div>
                  <span className="text-sm text-foreground-muted">Take personality assessment</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-foreground-muted rounded-full"></div>
                  <span className="text-sm text-foreground-muted">Explore career paths</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}

export default Dashboard
