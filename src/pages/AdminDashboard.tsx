import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, AreaChart, Area
} from 'recharts'
import {
  TrendingUp, Activity, MessageCircle, Users,
  RefreshCw, Calendar
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { motion } from 'framer-motion'

interface UsageStats {
  totalPageVisits: number
  totalAssessments: number
  totalChatSessions: number
  totalChatMessages: number
  pageVisitsTrend: { date: string; visits: number }[]
  assessmentsTrend: { date: string; completions: number }[]
  chatTrend: { date: string; sessions: number; messages: number }[]
}

const StatCard = ({ label, value, icon: Icon, color, trend }: any) => (
  <motion.div
    whileHover={{ y: -5, scale: 1.02 }}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="relative group h-full"
  >
    <Card className="h-full bg-card/50 backdrop-blur-md border-border shadow-glass overflow-hidden">
      <div className={`absolute top-0 right-0 w-32 h-32 -mr-12 -mt-12 rounded-full opacity-10 blur-3xl transition-opacity group-hover:opacity-20`} style={{ backgroundColor: color }} />
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="p-3 rounded-2xl bg-muted border border-border">
            <Icon className="w-6 h-6" style={{ color }} />
          </div>
          {trend && (
            <div className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[10px] py-0 px-2 rounded-full">
              {trend}
            </div>
          )}
        </div>
        <div>
          <h3 className="text-3xl font-black text-foreground tracking-tighter tabular-nums mb-1">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </h3>
          <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">{label}</p>
        </div>
      </CardContent>
    </Card>
  </motion.div>
)

const AdminDashboard = () => {
  const [stats, setStats] = useState<UsageStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState('30d')

  const rangeDays = dateRange === '7d' ? 7 : dateRange === '14d' ? 14 : dateRange === '30d' ? 30 : 90

  const loadStats = async () => {
    setLoading(true)
    setError(null)

    try {
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - rangeDays)
      const startDateStr = startDate.toISOString()

      // Fetch all stats in parallel
      const [
        { count: totalPageVisits },
        { count: totalAssessments },
        { count: totalChatSessions },
        { count: totalChatMessages },
        { data: pageVisitsData },
        { data: assessmentsData },
        { data: chatSessionsData },
      ] = await Promise.all([
        supabase.from('page_visits').select('*', { count: 'exact', head: true }).gte('visited_at', startDateStr),
        supabase.from('quick_assessment_completions').select('*', { count: 'exact', head: true }).gte('completed_at', startDateStr),
        supabase.from('ai_chat_interactions').select('*', { count: 'exact', head: true }).gte('started_at', startDateStr),
        supabase.from('ai_chat_messages').select('*', { count: 'exact', head: true }).gte('created_at', startDateStr),
        supabase.from('page_visits').select('visited_at').gte('visited_at', startDateStr).order('visited_at'),
        supabase.from('quick_assessment_completions').select('completed_at').gte('completed_at', startDateStr).order('completed_at'),
        supabase.from('ai_chat_interactions').select('started_at, message_count').gte('started_at', startDateStr).order('started_at'),
      ])

      // Aggregate page visits by date
      const pageVisitsByDate: Record<string, number> = {}
      pageVisitsData?.forEach(visit => {
        const date = new Date(visit.visited_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
        pageVisitsByDate[date] = (pageVisitsByDate[date] || 0) + 1
      })

      // Aggregate assessments by date
      const assessmentsByDate: Record<string, number> = {}
      assessmentsData?.forEach(assessment => {
        const date = new Date(assessment.completed_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
        assessmentsByDate[date] = (assessmentsByDate[date] || 0) + 1
      })

      // Aggregate chat by date
      const chatByDate: Record<string, { sessions: number; messages: number }> = {}
      chatSessionsData?.forEach(session => {
        const date = new Date(session.started_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
        if (!chatByDate[date]) {
          chatByDate[date] = { sessions: 0, messages: 0 }
        }
        chatByDate[date].sessions += 1
        chatByDate[date].messages += session.message_count || 0
      })

      // Convert to arrays for charts
      const pageVisitsTrend = Object.entries(pageVisitsByDate).map(([date, visits]) => ({ date, visits }))
      const assessmentsTrend = Object.entries(assessmentsByDate).map(([date, completions]) => ({ date, completions }))
      const chatTrend = Object.entries(chatByDate).map(([date, data]) => ({ date, ...data }))

      setStats({
        totalPageVisits: totalPageVisits || 0,
        totalAssessments: totalAssessments || 0,
        totalChatSessions: totalChatSessions || 0,
        totalChatMessages: totalChatMessages || 0,
        pageVisitsTrend,
        assessmentsTrend,
        chatTrend,
      })
    } catch (err: any) {
      console.error('Error loading stats:', err)
      setError(err.message || 'Failed to load statistics')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadStats()
  }, [dateRange])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading statistics...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md">
          <CardContent className="p-6">
            <p className="text-destructive mb-4">{error}</p>
            <Button onClick={loadStats}>Try Again</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Usage Analytics</h1>
              <p className="text-muted-foreground mt-1">Track platform engagement and activity</p>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-muted-foreground" />
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="px-3 py-2 rounded-lg border border-border bg-card text-foreground text-sm"
              >
                <option value="7d">Last 7 days</option>
                <option value="14d">Last 14 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
              </select>
              <Button onClick={loadStats} variant="outline" size="sm">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            label="Page Visits"
            value={stats?.totalPageVisits || 0}
            icon={Activity}
            color="#6366f1"
            trend={`+${rangeDays}d`}
          />
          <StatCard
            label="Assessments"
            value={stats?.totalAssessments || 0}
            icon={TrendingUp}
            color="#10b981"
            trend={`+${rangeDays}d`}
          />
          <StatCard
            label="Chat Sessions"
            value={stats?.totalChatSessions || 0}
            icon={MessageCircle}
            color="#f59e0b"
            trend={`+${rangeDays}d`}
          />
          <StatCard
            label="Chat Messages"
            value={stats?.totalChatMessages || 0}
            icon={Users}
            color="#ef4444"
            trend={`+${rangeDays}d`}
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Page Visits Chart */}
          <Card className="bg-card/50 backdrop-blur-md border-border">
            <CardContent className="p-6">
              <h3 className="text-lg font-bold text-foreground mb-4">Page Visits Trend</h3>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={stats?.pageVisitsTrend || []}>
                  <defs>
                    <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="date" className="text-xs text-muted-foreground" />
                  <YAxis className="text-xs text-muted-foreground" />
                  <Tooltip />
                  <Area type="monotone" dataKey="visits" stroke="#6366f1" fillOpacity={1} fill="url(#colorVisits)" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Assessments Chart */}
          <Card className="bg-card/50 backdrop-blur-md border-border">
            <CardContent className="p-6">
              <h3 className="text-lg font-bold text-foreground mb-4">Assessment Completions</h3>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={stats?.assessmentsTrend || []}>
                  <defs>
                    <linearGradient id="colorAssessments" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="date" className="text-xs text-muted-foreground" />
                  <YAxis className="text-xs text-muted-foreground" />
                  <Tooltip />
                  <Area type="monotone" dataKey="completions" stroke="#10b981" fillOpacity={1} fill="url(#colorAssessments)" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Chat Activity Chart */}
          <Card className="bg-card/50 backdrop-blur-md border-border lg:col-span-2">
            <CardContent className="p-6">
              <h3 className="text-lg font-bold text-foreground mb-4">Chat Activity</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats?.chatTrend || []}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="date" className="text-xs text-muted-foreground" />
                  <YAxis className="text-xs text-muted-foreground" />
                  <Tooltip />
                  <Bar dataKey="sessions" fill="#f59e0b" name="Sessions" />
                  <Bar dataKey="messages" fill="#ef4444" name="Messages" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard
