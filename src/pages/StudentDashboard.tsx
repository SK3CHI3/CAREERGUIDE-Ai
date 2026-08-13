import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts'
import { useNavigate } from 'react-router-dom'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { RIASEC_LABELS } from '@/data/riasec-assessment'


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
  MessageSquare,
  Award,
  Clock,
  ChevronRight,
  Star,
  Loader2,
  GraduationCap,
  Briefcase,
  Brain,
  Zap,
  Trophy,
  Users,
  FileText,
  ArrowRight,
  Sparkles,
  TrendingDown,
  Activity,
  BookMarked,
  DollarSign,
  Lock,
  XCircle,
  Lightbulb,
  RefreshCw,
  X,
  UserCog,
  Search,
  Palette,
  Heart,
  Megaphone,
  ClipboardCheck,
  Hammer
} from 'lucide-react'
import { ThemeToggle } from '@/components/ThemeToggle'
import { FieldDayRequestModal } from '@/components/FieldDayRequestModal'
import { subscriptionService } from '@/lib/subscription-service'
import PaymentWall from '@/components/PaymentWall'
import TrialActivationModal from '@/components/TrialActivationModal'
import { ReportGenerator } from '@/lib/report-generator'
import { ProfileSetup } from '@/components/ProfileSetup'
import GradesManager from '@/components/GradesManager'
import CourseRecommendations, { type CourseRecommendation } from '@/components/CourseRecommendations'

import GradesModal from '@/components/GradesModal'
import { CounselorDirectory } from '@/components/CounselorDirectory'
import InstallPrompt from '@/components/InstallPrompt'
import BrandedLoader from '@/components/BrandedLoader'

import { supabase } from '@/lib/supabase'
import { aiCareerService } from '@/lib/ai-service'
import { aiCacheService } from '@/lib/ai-cache-service'
import { dashboardService, UserStat, UserActivity, CareerRecommendation } from '@/lib/dashboard-service'
import { generateContextHash } from '@/lib/cache-utils'
import { useActivityTracking } from '@/hooks/useActivityTracking'
import CareerDetailModal from '@/components/CareerDetailModal'

// Default career data - will be replaced with AI recommendations
interface CareerDataItem {
  name: string
  value: number
  color: string
  description?: string
  salaryRange?: string
  growth?: string
  education?: string
  actionabilityScore?: number
}



const StudentDashboard = () => {
  const navigate = useNavigate()
  const { user, profile, signOut } = useAuth()
  const [activeTab, setActiveTab] = useState('overview')
  const [isActivatingTrial, setIsActivatingTrial] = useState(false)
  const [showTrialBanner, setShowTrialBanner] = useState(true)
  const [showExpiryBanner, setShowExpiryBanner] = useState(true)

  const [careerData, setCareerData] = useState<CareerDataItem[]>([])
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false)
  const [dynamicStats, setDynamicStats] = useState<UserStat[]>([])
  const [isLoadingStats, setIsLoadingStats] = useState(true)
  const [selectedCareer, setSelectedCareer] = useState<CareerDataItem | null>(null)
  const [isCareerModalOpen, setIsCareerModalOpen] = useState(false)
  const [isFieldDayModalOpen, setIsFieldDayModalOpen] = useState(false)
  const [isTrialModalOpen, setIsTrialModalOpen] = useState(false)
  const [subscriptionStatus, setSubscriptionStatus] = useState<any>(null)
  const [isGradesModalOpen, setIsGradesModalOpen] = useState(false)
  const [schoolInfo, setSchoolInfo] = useState<{ name: string; status: string } | null>(null)
  const [courseRecommendations, setCourseRecommendations] = useState<CourseRecommendation[]>([])

  const [isLoadingCourses, setIsLoadingCourses] = useState(false)
  const [aiInsights, setAiInsights] = useState<{ weeklyTip?: string; nextStep?: string; motivation?: string } | null>(null)



  // Activity tracking
  const { trackPageView, trackButtonClick, trackAIChat } = useActivityTracking({
    trackPageViews: true,
    trackClicks: true,
    trackScroll: true,
    trackTimeOnPage: true,
    trackFormInteractions: true
  })

  // Load data when component mounts (user and profile guaranteed by ProtectedRoute)
  useEffect(() => {
    if (user && profile) {
      loadDashboardData();
      checkAccessStatus();
      trackPageView('Student Dashboard');
    }
  }, [user, profile])

  // Reload careers when profile changes (after initial load)
  const [initialLoadComplete, setInitialLoadComplete] = useState(false)
  useEffect(() => {
    if (user && profile && initialLoadComplete) {
      loadCareerRecommendations(profile)
    }
    if (user && profile && !initialLoadComplete) {
      setInitialLoadComplete(true)
    }
  }, [profile])

  const checkAccessStatus = async () => {
    if (!profile) return;

    try {
        const status = await subscriptionService.checkSubscriptionStatus(profile);
        setSubscriptionStatus(status);
    } catch (err) {
        console.error('Error checking access status:', err);
    }
  }

  const handleActivateTrial = async () => {
    if (!user) return;
    try {
      setIsActivatingTrial(true);
      await subscriptionService.activateTrial(user.id);
      await checkAccessStatus();
      setShowTrialBanner(false);
    } catch (err) {
      console.error('Error activating trial:', err);
    } finally {
      setIsActivatingTrial(false);
    }
  }

  // If user is truly expired (past grace period), show Payment Wall as a hard lockout
  if (!isLoadingStats && subscriptionStatus && !subscriptionStatus.isActive && !subscriptionStatus.isTrialEligible) {
    return <PaymentWall onPaymentSuccess={checkAccessStatus} />
  }

  const isAuthorized = true;

  // Load all dashboard data
  const loadDashboardData = async () => {
    if (!user || !profile) return;

    // Session cache key — skip if data was loaded within 2 minutes
    const CACHE_KEY = `sd_cache_${user.id}`;
    const CACHE_TTL = 2 * 60 * 1000; // 2 minutes

    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      try {
        const { timestamp, stats } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_TTL && stats) {
          setDynamicStats(stats);
          setIsLoadingStats(false);
          // Still load career recommendations and access status in background
          loadCareerRecommendations(profile);
          checkAccessStatus();
          return;
        }
      } catch {}
    }

    try {
      setIsLoadingStats(true);

      // Parallelize all independent loads
      const [stats, , accessStatus] = await Promise.all([
        dashboardService.calculateUserStats(user.id, profile),
        loadCareerRecommendations(profile),
        subscriptionService.checkSubscriptionStatus(profile),
      ]);

      setDynamicStats(stats);
      setSubscriptionStatus(accessStatus);

      // Cache stats in localStorage for quick re-mount
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        timestamp: Date.now(),
        stats,
      }));

      // Load these in background — don't block UI
      loadCourseRecommendations();
      fetchAIInsights();

    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setIsLoadingStats(false);
    }
  };

  // Calculate profile completeness percentage
  const calculateProfileCompleteness = (profileData: any) => {
    const fields = [
      'school_level',
      'current_grade',
      'cbe_subjects',
      'career_interests',
      'career_goals',
      'strengths',
      'challenges'
    ];

    const completedFields = fields.filter(field => {
      const value = profileData[field];
      return value && (Array.isArray(value) ? value.length > 0 : value.toString().trim() !== '');
    });

    return Math.round((completedFields.length / fields.length) * 100);
  };


  // Fetch AI-powered insights for the dashboard
  const fetchAIInsights = async () => {
    if (!profile || !user) return;

    // Check sessionStorage cache first — skip API call if already fetched this session
    const INSIGHTS_KEY = `ai_insights_${user.id}`;
    const cached = sessionStorage.getItem(INSIGHTS_KEY);
    if (cached) {
      try {
        setAiInsights(JSON.parse(cached));
        return;
      } catch {}
    }

    try {
      const userContext = {
        name: profile?.full_name || undefined,
        schoolLevel: profile.school_level,
        currentGrade: profile.current_grade || undefined,
        subjects: profile.cbe_subjects || profile.subjects || undefined,
        interests: profile.career_interests || profile.interests || undefined,
        careerGoals: profile.career_goals || undefined
      };

      // Get AI insights for dashboard personalization
      const insights = await aiCareerService.sendMessage(
        `Based on this student profile, provide 3 personalized insights for their dashboard in JSON format:
        {
          "weeklyTip": "One actionable tip for this week",
          "nextStep": "Most important next step in their career journey",
          "motivation": "Encouraging message based on their progress"
        }`,
        [],
        userContext
      );

      try {
        const parsedInsights = JSON.parse(insights);
        setAiInsights(parsedInsights);
        sessionStorage.setItem(INSIGHTS_KEY, JSON.stringify(parsedInsights));
      } catch (e) {
        console.log('Could not parse AI insights, using defaults');
      }

    } catch (error) {
      console.error('Error fetching AI insights:', error);
    }
  };

  // ProtectedRoute handles loading and authentication checks



  const loadCareerRecommendations = async (profileData: any) => {
    if (!user) return;

    if (import.meta.env.DEV) {
      console.log('🤖 loadCareerRecommendations started with profile:', {
        school_level: profileData.school_level,
        current_grade: profileData.current_grade,
        subjects: profileData.cbe_subjects || profileData.subjects,
        interests: profileData.career_interests || profileData.interests
      });
    }

    setIsLoadingRecommendations(true);

    try {
      // Get academic performance data and generate hash early
      const academicPerformance = await dashboardService.calculateAcademicPerformance(user.id);
      const userGrades = await dashboardService.getUserGrades(user.id);
      const currentHash = generateContextHash(user.id, profileData, userGrades);

      // First, try to get cached recommendations (with hash validation)
      console.log('🔍 Checking for cached career recommendations...');
      const cachedRecommendations = await aiCacheService.getCachedCareerRecommendations(user.id, currentHash);

      if (cachedRecommendations && cachedRecommendations.length > 0) {
        console.log('✅ Using cached career recommendations:', cachedRecommendations.length);

        // Convert cached data to chart format
        const top3 = cachedRecommendations.slice(0, 3).map((rec, index) => ({
          name: rec.career_name,
          value: rec.match_percentage,
          color: index === 0 ? '#3b82f6' : index === 1 ? '#10b981' : '#f59e0b',
          description: rec.description || "Exciting career opportunity aligned with your interests and skills.",
          salaryRange: rec.salary_range || 'KES 40K - 100K',
          growth: rec.growth || 'Moderate Growth',
          education: rec.education || "Bachelor's Degree or Diploma Required",
          actionabilityScore: rec.actionability_score || 85
        }));

        setCareerData(top3);
        console.log('✅ Cached career recommendations loaded');
        return;
      }

      // No cached data, try to load from cache without hash validation (for app reload)
      console.log('🔍 No cached data with hash, trying cache without validation...');
      const cachedWithoutHash = await aiCacheService.getCachedCareerRecommendations(user.id);

      if (cachedWithoutHash && cachedWithoutHash.length > 0) {
        console.log('✅ Using cached recommendations (no hash validation):', cachedWithoutHash.length);

        const top3 = cachedWithoutHash.slice(0, 3).map((rec, index) => ({
          name: rec.career_name,
          value: rec.match_percentage,
          color: index === 0 ? '#3b82f6' : index === 1 ? '#10b981' : '#f59e0b',
          description: rec.description || "Exciting career opportunity aligned with your interests and skills.",
          salaryRange: rec.salary_range || 'KES 40K - 100K',
          growth: rec.growth || 'Moderate Growth',
          education: rec.education || "Bachelor's Degree or Diploma Required",
          actionabilityScore: rec.actionability_score || 85
        }));

        setCareerData(top3);
        console.log('✅ Cached recommendations loaded (no hash)');
        return;
      }

      // No cached data at all, generate fresh recommendations
      console.log('🤖 No cached data found, generating fresh career recommendations with AI...');

      console.log('📊 Academic performance data:', academicPerformance);

      const userContext = {
        name: profile?.full_name || undefined,
        schoolLevel: profileData.school_level,
        currentGrade: profileData.current_grade || undefined,
        subjects: profileData.cbe_subjects || profileData.subjects || undefined,
        interests: profileData.career_interests || profileData.interests || undefined,
        careerGoals: profileData.career_goals || undefined,
        assessmentResults: profileData.assessment_results,
        academicPerformance: {
          overallAverage: academicPerformance.overallAverage,
          strongSubjects: academicPerformance.strongSubjects,
          weakSubjects: academicPerformance.weakSubjects,
          performanceTrend: academicPerformance.performanceTrend
        }
      }

      // Generate AI recommendations
      const recommendations = await aiCareerService.generateCareerRecommendations(userContext) as any[];

      if (recommendations && recommendations.length > 0) {
        // Save recommendations to cache
        await aiCacheService.saveCareerRecommendations(user.id, recommendations, currentHash);
        console.log('💾 Career recommendations saved to cache');

        // Update chart data
        const top3 = recommendations.slice(0, 3).map((rec, index) => ({
          name: rec.title,
          value: rec.matchPercentage,
          color: index === 0 ? '#3b82f6' : index === 1 ? '#10b981' : '#f59e0b',
          description: rec.description || "Exciting career opportunity aligned with your interests and skills.",
          salaryRange: rec.salaryRange || 'KES 40K - 100K',
          growth: rec.growth || 'Moderate Growth',
          education: rec.education || "Bachelor's Degree or Diploma Required",
          actionabilityScore: rec.actionabilityScore || 80
        }));

        setCareerData(top3);
        console.log('✅ Fresh career recommendations generated and cached');

        // Track the AI recommendation generation
        trackButtonClick('AI Career Recommendations Generated', 'Dashboard');
      } else {
        console.warn('⚠️ No recommendations returned from AI service');
        setCareerData([]);
      }
    } catch (error) {
      console.error('❌ Failed to load career recommendations:', error);
      // Try one more time to load from cache as a last resort
      try {
        const lastResortCache = await aiCacheService.getCachedCareerRecommendations(user.id);
        if (lastResortCache && lastResortCache.length > 0) {
          console.log('✅ Last resort: loaded from cache after error');
          const top3 = lastResortCache.slice(0, 3).map((rec, index) => ({
            name: rec.career_name,
            value: rec.match_percentage,
            color: index === 0 ? '#3b82f6' : index === 1 ? '#10b981' : '#f59e0b',
            description: rec.description || "Exciting career opportunity.",
            salaryRange: rec.salary_range || 'KES 40K - 100K',
            growth: rec.growth || 'Moderate Growth',
            education: rec.education || "Bachelor's Degree",
            actionabilityScore: rec.actionability_score || 85
          }));
          setCareerData(top3);
        } else {
          setCareerData([]);
        }
      } catch (cacheError) {
        console.error('❌ Cache fallback also failed:', cacheError);
        setCareerData([]);
      }
    } finally {
      setIsLoadingRecommendations(false)
    }
  }

  const loadCourseRecommendations = async () => {
    if (!user?.id) return;
    
    setIsLoadingCourses(true);
    try {
      // Check cache first
      const cached = await aiCacheService.getCachedCourseRecommendations(user.id);
      if (cached && cached.length > 0) {
        setCourseRecommendations(cached as unknown as CourseRecommendation[]);
        setIsLoadingCourses(false);
        return;
      }
      
      // If not in cache, the component will handle initial generation or we can trigger it here
      // For now, just setting up the infrastructure
    } catch (error) {
      console.error('Failed to load course recommendations from dashboard:', error);
    } finally {
      setIsLoadingCourses(false);
    }
  }

  const handleRefreshRecommendations = async () => {
    if (!profile || !user) return;
    try {
      // Invalidate cache first
      await aiCacheService.invalidateCache(user.id, 'career_recommendations', 'manually_refreshed');
      // Load fresh
      await loadCareerRecommendations(profile);
    } catch (err) {
      console.error('Refresh failed:', err);
    }
  }

  // RIASEC Data for Chart
  const riasecChartData = profile?.assessment_results?.riasec_scores ?
    Object.entries(profile.assessment_results.riasec_scores).map(([key, value]) => ({
      subject: key.charAt(0).toUpperCase() + key.slice(1),
      A: value,
      fullMark: 5,
    })) : []

  const dominantType = profile?.assessment_results?.personality_type || 'Discovery Pending'

  const RIASEC_INFO: Record<string, { moniker: string; description: string; color: string; icon: any }> = {
    Realistic: { 
      moniker: 'Technical Specialist', 
      description: 'Hands-on problem solver with a focus on practical implementations and tangible results.', 
      color: '#ef4444', 
      icon: Hammer 
    },
    Investigative: { 
      moniker: 'Analytical Strategist', 
      description: 'Curious researcher who excels at solving complex problems through data and research.', 
      color: '#3b82f6', 
      icon: Search 
    },
    Artistic: { 
      moniker: 'Creative Visionary', 
      description: 'Imaginative designer who creates original solutions and meaningful self-expression.', 
      color: '#ec4899', 
      icon: Palette 
    },
    Social: { 
      moniker: 'Collaborative Leader', 
      description: 'Empathetic professional dedicated to teaching, helping, and empowering others.', 
      color: '#10b981', 
      icon: Heart 
    },
    Enterprising: { 
      moniker: 'Dynamic Entrepreneur', 
      description: 'Ambitious communicator who excels at leading teams and making strategic decisions.', 
      color: '#f59e0b', 
      icon: Megaphone 
    },
    Conventional: { 
      moniker: 'Process Architect', 
      description: 'Systematic expert focused on efficiency, precision, and organizational structure.', 
      color: '#6366f1', 
      icon: ClipboardCheck 
    }
  };


  const dominantInfo = useMemo(() => {
    if (!profile?.assessment_results?.riasec_scores) return null;
    const scores = profile.assessment_results.riasec_scores;
    const topEntry = Object.entries(scores).reduce((a, b) => (a[1] > b[1] ? a : b));
    const label = topEntry[0].charAt(0).toUpperCase() + topEntry[0].slice(1);
    const info = RIASEC_INFO[label];
    if (!info) return null;
    return { label, ...info };
  }, [profile]);



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
    if (!name) return 'S'
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const getTimeAgo = (dateString: string) => {
    const now = new Date()
    const date = new Date(dateString)
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) return 'Just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`
    return `${Math.floor(diffInSeconds / 604800)}w ago`
  }

  const handleCareerDetailClick = async (career: CareerDataItem) => {
    try {
      // Find the full career path in our existing data or fetch it
      const allPaths = await dashboardService.getCareerPaths();
      const fullPath = allPaths.find(p => p.title.toLowerCase() === career.name.toLowerCase());
      
      if (fullPath) {
        setSelectedCareer(fullPath as any);
      } else {
        // Fallback to basic data if not found
        setSelectedCareer({
          title: career.name,
          description: career.description,
          salary_range: career.salaryRange,
          growth_percentage: career.growth,
          skills_required: [],
          category: 'Recommended',
          demand_level: 'High'
        } as any);
      }
      setIsCareerModalOpen(true)
      trackButtonClick('View Career Details', 'Career Card')
    } catch (err) {
      console.error('Failed to load full career details:', err);
      setSelectedCareer(career as any);
      setIsCareerModalOpen(true);
    }
  }

  // Function to invalidate cache when grades are updated
  const handleGradesUpdated = async () => {
    if (user?.id && profile) {
      console.log('🔄 Grades updated, invalidating AI caches')
      await aiCacheService.invalidateAllCaches(user.id, 'grades_updated')

      // Reload career recommendations with fresh data
      await loadCareerRecommendations(profile)
    }
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-card-border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{payload[0].name}</p>
          <p className="text-sm text-muted-foreground">
            Match: {payload[0].value}%
          </p>
        </div>
      )
    }
    return null
  }

  // At this point, user and profile are guaranteed by ProtectedRoute
  // Render the dashboard directly



  return (
    <div className="min-h-screen" style={{ background: 'var(--gradient-page-subtle)' }}>
      {/* Header */}
      <header className="border-b border-card-border bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            {/* Logo */}
            <div className="flex items-center space-x-2">
              <img
                src="/logos/CareerGuide_Logo.webp"
                alt="CareerGuide AI"
                className="h-8 sm:h-10 w-auto"
              />
            </div>

            {/* User Menu */}
            <div className="flex items-center space-x-2 sm:space-x-4">
              <Avatar className="w-8 h-8 sm:w-10 sm:h-10">
                <AvatarImage src={profile?.avatar_url || ''} />
                <AvatarFallback className="text-xs sm:text-sm">{getInitials(profile?.full_name)}</AvatarFallback>
              </Avatar>
              <div className="hidden md:block">
                <p className="text-sm font-medium text-foreground">
                  {profile?.full_name || 'Student'}
                </p>
                <Badge className="bg-primary text-primary-foreground text-xs">
                  Student
                </Badge>
              </div>
              <ThemeToggle />
              <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-9 sm:w-9" onClick={handleSignOut}>
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-8">
        {/* Banner removed */}
        {/* Welcome Section */}
        <div className="mb-6 sm:mb-8">
          {/* Subscription / Trial Banner */}
        {subscriptionStatus && !subscriptionStatus.isActive && subscriptionStatus.isTrialEligible && showTrialBanner && (
          <Alert className="mb-4 sm:mb-6 border-primary/20 bg-primary/5 flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 sm:p-6 rounded-2xl shadow-sm animate-in fade-in slide-in-from-top duration-500 gap-3 sm:gap-4">
            <div className="flex items-center gap-3 sm:gap-4 flex-1">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-primary animate-pulse" />
              </div>
              <div>
                <AlertTitle className="text-lg sm:text-xl font-bold text-foreground">Free Trial Available!</AlertTitle>
                <AlertDescription className="text-sm text-foreground-muted font-medium">
                  Activate your free term trial to unlock all features.
                </AlertDescription>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
              <Button
                onClick={() => setIsTrialModalOpen(true)}
                className="flex-1 sm:flex-none bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-4 sm:px-6 h-10 sm:h-11 rounded-xl shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95"
              >
                Learn More
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowTrialBanner(false)}
                className="rounded-full hover:bg-primary/10 h-10 w-10"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </Button>
            </div>
          </Alert>
        )}

        {subscriptionStatus?.type === 'trial' && showExpiryBanner && (
          <div className="mb-4 sm:mb-6 px-3 sm:px-4 py-2.5 sm:py-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4">
            <div className="flex items-center gap-2 text-yellow-600 font-bold text-xs sm:text-sm tracking-tight uppercase">
              <Clock className="w-4 h-4" />
              <span>Trial ends {new Date(subscriptionStatus.expiresAt).toLocaleDateString('en-KE', { month: 'short', day: 'numeric' })}</span>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 sm:flex-none border-yellow-500/30 text-yellow-600 hover:bg-yellow-500/10 h-8 text-xs font-bold"
                onClick={() => navigate('/pricing')}
              >
                Upgrade
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowExpiryBanner(false)}
                className="h-8 w-8 rounded-full hover:bg-yellow-500/20"
              >
                <X className="w-3 h-3 text-yellow-600" />
              </Button>
            </div>
          </div>
        )}

        <div className="mb-4 sm:mb-6 hidden sm:block">
          <h2 className="text-2xl lg:text-3xl font-bold text-foreground flex items-center gap-3">
            <span>Welcome, {profile?.full_name?.split(' ')[0] || 'Student'}</span>
            <span className="animate-bounce text-2xl">👋</span>
          </h2>
          <p className="text-base text-muted-foreground mt-1">
            Continue your career discovery journey and unlock your potential.
          </p>
        </div>
        </div>

        {/* Tabs Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6">
          <TabsList className="grid w-full grid-cols-4 h-10 sm:h-11">
            <TabsTrigger value="overview" className="text-xs sm:text-sm">Overview</TabsTrigger>
            <TabsTrigger value="careers" className="text-xs sm:text-sm relative">
              Careers
              {careerData.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-blue-500"></span>
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="chat" className="text-xs sm:text-sm">Chat</TabsTrigger>
            <TabsTrigger value="progress" className="text-xs sm:text-sm">Journey</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-3 sm:space-y-6">
            {/* Quick Stats - 2x2 Grid on Mobile */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 w-full">
              {isLoadingStats ? (
                // Loading skeleton for stats
                Array.from({ length: 4 }).map((_, index) => (
                  <Card key={index} className="bg-gradient-to-br from-card to-card/80 border-card-border/50">
                    <CardHeader className="pb-2 sm:pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="h-3 sm:h-4 bg-muted rounded animate-pulse mb-1 sm:mb-2"></div>
                          <div className="h-6 sm:h-8 bg-muted rounded animate-pulse mb-1 sm:mb-2"></div>
                          <div className="h-2.5 sm:h-3 bg-muted rounded animate-pulse w-2/3"></div>
                        </div>
                        <div className="w-9 h-9 sm:w-12 sm:h-12 bg-muted rounded-xl animate-pulse"></div>
                      </div>
                    </CardHeader>
                  </Card>
                ))
              ) : (
                dynamicStats.map((stat, index) => {
                  const statConfig = {
                    'profile_completeness': { title: 'Profile', icon: User, color: 'text-emerald-500', bgColor: 'bg-emerald-500/10' },
                    'career_matches': { title: 'Careers', icon: Target, color: 'text-blue-500', bgColor: 'bg-blue-500/10' },
                    'ai_sessions': { title: 'AI Sessions', icon: Bot, color: 'text-purple-500', bgColor: 'bg-purple-500/10' },
                    'learning_hours': { title: 'Learning', icon: BookMarked, color: 'text-orange-500', bgColor: 'bg-orange-500/10' },
                    'academic_performance': { title: 'Academic', icon: GraduationCap, color: 'text-indigo-500', bgColor: 'bg-indigo-500/10' }
                  }[stat.stat_type] || { title: stat.stat_type, icon: Activity, color: 'text-muted-foreground', bgColor: 'bg-muted' };

                  const IconComponent = statConfig.icon;

                  return (
                    <Card key={stat.id} className="bg-gradient-to-br from-card to-card/80 border-card-border/50 shadow-sm hover:shadow-md dark:shadow-none dark:hover:shadow-primary/10 transition-all duration-300 overflow-hidden relative group">
                      {/* Subtle hover accent line */}
                      <div className={`absolute top-0 left-0 w-full h-0.5 sm:h-1 ${statConfig.bgColor} opacity-0 group-hover:opacity-100 transition-opacity`} />
                      <CardHeader className="p-3 sm:p-4 pb-2 sm:pb-3">
                        <div className="flex items-start justify-between gap-1">
                          <div className="flex-1 min-w-0">
                            <CardDescription className="text-[10px] sm:text-sm font-medium truncate">{statConfig.title}</CardDescription>
                            <CardTitle className="text-xl sm:text-3xl font-bold mt-0.5 sm:mt-1">{stat.stat_value}</CardTitle>
                            <p className={`text-[10px] sm:text-xs flex items-center gap-0.5 sm:gap-1 mt-0.5 sm:mt-1 ${stat.stat_trend === 'up' ? 'text-emerald-500' :
                              stat.stat_trend === 'down' ? 'text-red-500' : 'text-muted-foreground'
                              }`}>
                              <TrendingUp className={`w-2.5 h-2.5 sm:w-3 sm:h-3 ${stat.stat_trend === 'down' ? 'rotate-180' : ''}`} />
                              {stat.stat_change}
                            </p>
                          </div>
                          <div className={`w-8 h-8 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl ${statConfig.bgColor} flex items-center justify-center flex-shrink-0`}>
                            <IconComponent className={`w-4 h-4 sm:w-6 sm:h-6 ${statConfig.color}`} />
                          </div>
                        </div>
                      </CardHeader>
                    </Card>
                  );
                })
              )}
            </div>

            {/* AI Insights / Tip of the Day */}
            {aiInsights?.weeklyTip && (
              <Card className="bg-primary/5 border border-primary/20 shadow-sm overflow-hidden relative">
                <div className="absolute top-0 right-0 p-2 opacity-10">
                  <Sparkles className="w-8 h-8 sm:w-12 sm:h-12 text-primary" />
                </div>
                <CardContent className="p-3 sm:p-4 flex items-start sm:items-center gap-3 sm:gap-4 flex-col sm:flex-row">
                  <div className="p-1.5 sm:p-2 bg-primary/10 rounded-full flex-shrink-0">
                    <Lightbulb className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-xs sm:text-sm font-bold text-primary">AI Career Insight</h4>
                    <p className="text-xs sm:text-sm text-foreground leading-relaxed mt-0.5">{aiInsights.weeklyTip}</p>
                  </div>
                  {aiInsights.motivation && (
                    <div className="hidden md:block pl-4 border-l border-primary/20 max-w-[30%]">
                      <p className="text-xs italic text-muted-foreground">"{aiInsights.motivation}"</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Main Dashboard Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-6 w-full">
              {/* Career Recommendations Chart */}
              <Card className="lg:col-span-2 bg-gradient-to-br from-card to-card/50 border-card-border/60 shadow-lg dark:shadow-primary/5 overflow-hidden relative">
                {/* Decorative glow in dark mode */}
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6">
                  <div className="space-y-0.5 sm:space-y-1">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500" />
                      <CardTitle className="text-base sm:text-lg">AI Career Recommendations</CardTitle>
                    </div>
                    <CardDescription className="text-[10px] sm:text-xs">Based on your personality, grades, and Kenyan market</CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 sm:h-8 sm:w-8 text-muted-foreground hover:text-primary"
                    onClick={handleRefreshRecommendations}
                    disabled={isLoadingRecommendations}
                  >
                    <RefreshCw className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isLoadingRecommendations ? 'animate-spin' : ''}`} />
                  </Button>
                </CardHeader>
                <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
                  {isLoadingRecommendations ? (
                    <div className="flex items-center justify-center h-64">
                      <BrandedLoader showText={true} text="Analyzing your career potential..." />
                    </div>
                  ) : (
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={careerData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {careerData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip
                            formatter={(value) => [`${value}%`, 'Match']}
                            labelStyle={{ color: 'hsl(var(--foreground))' }}
                            contentStyle={{
                              backgroundColor: 'hsl(var(--background))',
                              border: '1px solid hsl(var(--border))',
                              borderRadius: '8px'
                            }}
                          />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* RIASEC Personality Profile Card */}
              {riasecChartData.length > 0 && (
                <Card className="lg:col-span-1 bg-gradient-to-br from-card to-card/50 border-card-border/60 shadow-lg dark:shadow-purple-500/5 overflow-hidden relative group">
                  <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-purple-500/20 transition-colors duration-500" />
                  
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-purple-500/10 rounded-lg">
                          <Brain className="w-5 h-5 text-purple-500" />
                        </div>
                        <CardTitle className="text-lg bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-blue-500">Professional DNA</CardTitle>
                      </div>
                      {dominantInfo && (
                        <Badge variant="outline" className="bg-purple-500/10 text-purple-600 border-purple-500/30 hover:bg-purple-500/20 transition-all shadow-sm">
                          {dominantInfo.label}
                        </Badge>
                      )}
                    </div>
                    <CardDescription className="text-xs font-medium">Your unique RIASEC archetype mix</CardDescription>
                  </CardHeader>
                  
                  <CardContent className="space-y-4 pb-4">
                    {dominantInfo && (
                      <div className="relative overflow-hidden group/card bg-gradient-to-br from-muted/30 to-background border border-card-border/40 rounded-2xl p-4 transition-all duration-500 hover:shadow-lg hover:shadow-primary/5 hover:border-primary/20">
                        {/* Decorative background pulse */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-700" />
                        
                        <div className="relative flex items-start gap-4">
                          <div className="p-3 rounded-xl bg-card shadow-inner-sm flex-shrink-0 group-hover/card:scale-110 transition-transform duration-500" style={{ boxShadow: `0 0 20px ${dominantInfo.color}15` }}>
                            <dominantInfo.icon className="w-6 h-6" style={{ color: dominantInfo.color }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-base font-bold tracking-tight text-foreground mb-1">
                              {dominantInfo.moniker}
                            </h4>
                            <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                              {dominantInfo.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}


                    <div className="h-[160px] mt-1 relative">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="68%" data={riasecChartData}>
                          <PolarGrid stroke="rgba(156, 163, 175, 0.15)" />
                          <PolarAngleAxis
                            dataKey="subject"
                            tick={{ fill: 'hsl(var(--foreground-muted))', fontSize: 9, fontWeight: 500 }}
                          />
                          <Tooltip
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                return (
                                  <div className="bg-background/95 backdrop-blur-md border border-card-border p-1.5 rounded-lg shadow-xl text-[9px]">
                                    <p className="font-bold text-foreground">{payload[0].payload.subject}</p>
                                    <p className="text-primary font-medium">Score: {payload[0].value}/5</p>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <Radar
                            name="Personality"
                            dataKey="A"
                            stroke="hsl(var(--primary))"
                            fill="hsl(var(--primary))"
                            fillOpacity={0.35}
                            animationDuration={1500}
                          />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>

                    <p className="text-[10px] text-center text-muted-foreground font-medium px-4">
                      Explore your strengths across all six professional domains to build a target career roadmap.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Action Cards - Compact on mobile */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 sm:gap-4 w-full">
              {/* Assessment Card */}
              <Card className="bg-primary/5 border border-primary/20 hover:bg-primary/10 transition-all cursor-pointer group" onClick={() => { trackButtonClick('Start Assessment', 'Action Cards'); setActiveTab('chat'); }}>
                <CardHeader className="p-3 sm:p-5 pb-2 sm:pb-3">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-9 h-9 sm:w-12 sm:h-12 bg-primary/20 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                      <Brain className="w-4 h-4 sm:w-6 sm:h-6 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <CardTitle className="text-sm sm:text-lg leading-tight">Take Assessment</CardTitle>
                      <CardDescription className="text-[10px] sm:text-xs">Discover your strengths</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-3 sm:p-5 pt-0">
                  <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4 hidden sm:block">Complete our comprehensive career assessment to get personalized recommendations.</p>
                  <Button className="w-full h-9 sm:h-10 text-sm" size="sm">
                    Start <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </CardContent>
              </Card>

              {/* CBE Paths Card */}
              <Card className="bg-emerald-500/5 border border-emerald-500/20 hover:bg-emerald-500/10 transition-all cursor-pointer group" onClick={() => { trackButtonClick('Explore Paths', 'Action Cards'); setActiveTab('careers'); }}>
                <CardHeader className="p-3 sm:p-5 pb-2 sm:pb-3">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-9 h-9 sm:w-12 sm:h-12 bg-emerald-500/20 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                      <GraduationCap className="w-4 h-4 sm:w-6 sm:h-6 text-emerald-500" />
                    </div>
                    <div className="min-w-0">
                      <CardTitle className="text-sm sm:text-lg leading-tight">Explore CBE Paths</CardTitle>
                      <CardDescription className="text-[10px] sm:text-xs">Plan your pathway</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-3 sm:p-5 pt-0">
                  <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4 hidden sm:block">Learn about Senior Secondary pathways and university requirements.</p>
                  <Button className="w-full h-9 sm:h-10 text-sm bg-emerald-600 hover:bg-emerald-700 text-white" size="sm">
                    Explore <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </CardContent>
              </Card>

              {/* Counselor Card */}
              <Card className="bg-purple-500/5 border border-purple-500/20 hover:bg-purple-500/10 transition-all cursor-pointer group" onClick={() => { navigate('/student/counselors'); trackButtonClick('Start Counselor Directory', 'Action Cards'); }}>
                <CardHeader className="p-3 sm:p-5 pb-2 sm:pb-3">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-9 h-9 sm:w-12 sm:h-12 bg-purple-500/20 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                      <Users className="w-4 h-4 sm:w-6 sm:h-6 text-purple-500" />
                    </div>
                    <div className="min-w-0">
                      <CardTitle className="text-sm sm:text-lg leading-tight">Talk to a Counselor</CardTitle>
                      <CardDescription className="text-[10px] sm:text-xs">Book a human expert</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-3 sm:p-5 pt-0">
                  <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4 hidden sm:block">Connect with verified professional career counselors for 1-on-1 guidance.</p>
                  <Button className="w-full h-9 sm:h-10 text-sm bg-purple-600 hover:bg-purple-700 text-white" size="sm">
                    View <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Careers Tab */}
          <TabsContent value="careers" className="space-y-2 sm:space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4 w-full">
              {careerData.map((career, index) => (
                <Card key={index} className="bg-card border-card-border hover:shadow-lg transition-all duration-300 cursor-pointer group" onClick={() => handleCareerDetailClick(career)}>
                  <CardHeader className="p-3 sm:p-5 pb-2 sm:pb-4">
                    <div className="flex items-start justify-between mb-2 sm:mb-4">
                      <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                        <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-lg sm:rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Briefcase className="w-5 h-5 sm:w-7 sm:h-7 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-base sm:text-xl font-bold mb-0.5 sm:mb-1 text-foreground truncate">{career.name}</CardTitle>
                          <div className="flex flex-col gap-1 sm:gap-2">
                            <div className="flex items-center gap-1.5 sm:gap-2">
                              <Badge variant="secondary" className="text-[9px] sm:text-[10px] h-4 sm:h-5 flex-shrink-0">
                                {career.value}%
                              </Badge>
                              <Progress
                                value={career.value}
                                className="h-1 sm:h-1.5 bg-muted flex-1"
                                indicatorClassName="bg-primary"
                              />
                            </div>
                            <div className="flex items-center gap-1.5 sm:gap-2">
                              <Badge variant="outline" className="text-[9px] sm:text-[10px] h-4 sm:h-5 border-primary/20 text-primary bg-primary/5 flex-shrink-0">
                                {(career.actionabilityScore || 85)}%
                              </Badge>
                              <Progress
                                value={career.actionabilityScore || 85}
                                className="h-1 sm:h-1.5 bg-muted flex-1"
                                indicatorClassName="bg-primary/60"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-3 sm:space-y-4 p-3 sm:p-5 pt-0">
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed line-clamp-2 sm:line-clamp-none">
                      {career.description || "A promising career path that aligns with your interests, offering strong growth potential in Kenya's evolving job market."}
                    </p>

                    <div className="grid grid-cols-2 gap-2 sm:gap-3">
                      <div className="p-2 sm:p-3 rounded-lg bg-primary/5 border border-primary/10">
                        <div className="flex items-center gap-1.5 sm:gap-2 mb-0.5 sm:mb-1">
                          <DollarSign className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
                          <span className="text-[10px] sm:text-xs font-semibold text-primary">Salary</span>
                        </div>
                        <p className="text-xs sm:text-sm font-bold text-foreground truncate">{career.salaryRange || 'KSh 60K - 200K'}</p>
                      </div>
                      <div className="p-2 sm:p-3 rounded-lg bg-primary/5 border border-primary/10">
                        <div className="flex items-center gap-1.5 sm:gap-2 mb-0.5 sm:mb-1">
                          <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
                          <span className="text-[10px] sm:text-xs font-semibold text-primary">Growth</span>
                        </div>
                        <p className="text-xs sm:text-sm font-bold text-foreground truncate">{career.growth || 'High Growth'}</p>
                      </div>
                    </div>

                    <div className="p-2 sm:p-3 rounded-lg bg-primary/5 border border-primary/10">
                      <div className="flex items-center gap-1.5 sm:gap-2 mb-0.5 sm:mb-1">
                        <GraduationCap className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
                        <span className="text-[10px] sm:text-xs font-semibold text-primary">Education</span>
                      </div>
                      <p className="text-xs sm:text-sm text-foreground font-medium truncate">{career.education || "Bachelor's Degree Required"}</p>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full h-9 sm:h-10 text-xs sm:text-sm group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                      onClick={(e) => { e.stopPropagation(); handleCareerDetailClick(career) }}
                    >
                      <Target className="w-3.5 h-3.5 mr-1.5" />
                      Get Insights
                      <ArrowRight className="w-3.5 h-3.5 ml-1.5 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* AI Chat Tab Refined */}
          <TabsContent value="chat" className="space-y-4 sm:space-y-6">
            <Card className="border-card-border bg-gradient-to-br from-card to-card/50 overflow-hidden relative group">
              <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <CardHeader className="relative z-10 text-center py-8 sm:py-16 lg:py-20">
                <div className="w-14 h-14 sm:w-20 sm:h-20 bg-primary/10 rounded-2xl sm:rounded-3xl flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-glow">
                  <Bot className="w-7 h-7 sm:w-10 sm:h-10 text-primary" />
                </div>
                <CardTitle className="text-xl sm:text-3xl lg:text-5xl font-semibold tracking-tight">
                  Your Personal AI Counselor
                </CardTitle>
                <CardDescription className="text-sm sm:text-lg lg:text-xl text-foreground-muted max-w-2xl mx-auto mt-3 sm:mt-4 font-medium">
                  Get 1-on-1 career guidance. Ask about subjects, university paths, and job markets in East Africa.
                </CardDescription>
                <div className="mt-6 sm:mt-10">
                  <Button 
                    size="lg"
                    className="h-12 sm:h-14 lg:h-16 px-8 sm:px-10 lg:px-16 text-base sm:text-lg lg:text-xl bg-gradient-primary hover:scale-105 transition-all shadow-glow font-bold rounded-xl sm:rounded-2xl"
                    onClick={() => navigate('/student/chat')}
                  >
                    Open AI Chat
                    <Sparkles className="ml-2 sm:ml-3 w-4 h-4 sm:w-5 sm:h-5" />
                  </Button>
                </div>
              </CardHeader>
            </Card>
          </TabsContent>

          <TabsContent value="chat-exp" className="h-[700px]">
            <div className="h-full flex items-center justify-center">
              <Card className="max-w-md w-full bg-gradient-surface border-card-border text-center p-8">
                <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-primary/20">
                  <Sparkles className="w-8 h-8 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-bold mb-2">AI Career Counselor</h3>
                <p className="text-foreground-muted text-sm mb-6">
                  Get personalized career guidance based on your interests, subjects, and goals. Our AI counselor is ready to help you discover your path.
                </p>
                <Button
                  onClick={() => navigate('/student/chat')}
                  className="w-full bg-gradient-primary hover:opacity-90 text-primary-foreground shadow-glow h-12 text-base font-bold"
                >
                  <MessageSquare className="w-5 h-5 mr-2" />
                  Open AI Chat
                </Button>
              </Card>
            </div>
          </TabsContent>

          {/* Progress Tab */}
          <TabsContent value="progress" className="space-y-3 sm:space-y-6 w-full">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-6 w-full">
              {/* Free Courses Card */}
              <Card className="w-full bg-card border-card-border flex flex-col h-[400px] sm:h-[500px] lg:h-[600px]">
                <CardHeader className="flex-shrink-0 p-3 sm:p-5">
                  <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                    <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
                    Free Courses
                  </CardTitle>
                  <CardDescription className="text-[10px] sm:text-xs">AI-curated based on your interests</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 overflow-hidden pt-0 pb-3 sm:pb-6 px-3 sm:px-5">
                  <div className="overflow-y-auto max-h-[300px] sm:max-h-[400px] lg:max-h-[500px] pr-2">
                    <CourseRecommendations
                      careerInterests={profile?.career_interests || profile?.interests}
                      cbeSubjects={profile?.cbe_subjects || profile?.subjects}
                      strongSubjects={[]} // This will be populated from grades data
                      initialCourses={courseRecommendations}
                      initialLoading={isLoadingCourses}
                      onCoursesLoaded={(courses) => setCourseRecommendations(courses)}
                      limit={3}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Journey Actions Card */}
              <Card className="w-full bg-card border-card-border overflow-hidden h-[400px] sm:h-[500px] lg:h-[600px] flex flex-col">
                <CardHeader className="flex-shrink-0 p-3 sm:p-5">
                  <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                    <Target className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
                    Journey Actions
                  </CardTitle>
                  <CardDescription className="text-[10px] sm:text-xs">Take action to advance your career path</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto space-y-3 sm:space-y-4 custom-scrollbar px-3 sm:px-5 pb-3 sm:pb-5">
                  <div className="bg-primary/5 border border-primary/10 rounded-xl p-4 mb-4">
                    <h4 className="text-sm font-bold text-primary mb-2 flex items-center gap-2">
                      <UserCog className="w-4 h-4" /> Recommended Next Step
                    </h4>
                    <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
                      {aiInsights?.nextStep || 'Connect with a professional counselor to validate your AI career report and build your practical roadmap for university.'}
                    </p>

                    <Button
                      variant="outline"
                      className="w-full bg-background border-primary/20 hover:bg-primary/5 group"
                      onClick={() => {
                        navigate('/student/counselors')
                        trackButtonClick('Book Counselor Link', 'Journey Actions')
                      }}
                    >
                      Browse Specialized Counselors
                      <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </div>
                  <div className="space-y-3">
                    <div
                      className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/20 cursor-pointer hover:bg-blue-500/10 transition-colors"
                      onClick={() => {
                        setActiveTab('careers')
                        trackButtonClick('Jump to Careers', 'Journey Actions')
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <span className="text-sm font-medium text-foreground">View your top AI career matches</span>
                        </div>
                        <ArrowRight className="w-4 h-4 text-blue-500" />
                      </div>
                    </div>

                    <div
                      className="p-3 rounded-lg bg-purple-500/5 border border-purple-500/20 cursor-pointer hover:bg-purple-500/10 transition-colors"
                      onClick={() => {
                        setActiveTab('careers')
                        trackButtonClick('Explore Programs', 'Journey Actions')
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                          <span className="text-sm font-medium text-foreground">Explore university programs</span>
                        </div>
                        <ArrowRight className="w-4 h-4 text-purple-500" />
                      </div>
                    </div>
                    <div
                      className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20 cursor-pointer hover:bg-emerald-500/10 transition-colors"
                      onClick={() => {
                        setIsFieldDayModalOpen(true)
                        trackButtonClick('Request Field Day', 'Journey Actions')
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                          <span className="text-sm font-medium text-foreground">Request a Career Field Day</span>
                        </div>
                        <ArrowRight className="w-4 h-4 text-emerald-500" />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 mt-3 sm:mt-4">
                    <Button
                      className="w-full min-h-[44px]"
                      onClick={() => {
                        setActiveTab('chat')
                        trackButtonClick('Start Assessment', 'Journey Actions')
                      }}
                    >
                      Start Assessment <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full min-h-[44px]"
                      onClick={async () => {
                        const profileData = profile || ({} as any)
                        const html = ReportGenerator.generatePDFReport(
                          {
                            name: profileData.full_name,
                            grade: profileData.current_grade,
                            subjects: profileData.cbe_subjects || profileData.subjects,
                            interests: profileData.career_interests || profileData.interests,
                            careerGoals: profileData.career_goals,
                            location: profileData.location,
                          },
                          [],
                          []
                        )
                        await ReportGenerator.downloadPDF(html, 'CareerPathAI_Assessment.pdf')
                        trackButtonClick('Download PDF', 'Journey Actions')
                      }}
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Download PDF
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="w-full bg-card border-card-border">
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-purple-500" />
                  <CardTitle>Academic Insights</CardTitle>
                </div>
                {schoolInfo && (
                  <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 flex items-center gap-1">
                    <School className="w-3 h-3" />
                    Verified by {schoolInfo.name}
                  </Badge>
                )}
              </CardHeader>
              <CardContent>
                <GradesManager readOnly={true} onGradesUpdated={handleGradesUpdated} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Career Detail Modal */}
      {/* Modals and Overlays */}
      {/* PaymentWall Removed */}

      {selectedCareer && (
        <CareerDetailModal
          isOpen={isCareerModalOpen}
          onClose={() => {
            setIsCareerModalOpen(false)
            setSelectedCareer(null)
          }}
          career={selectedCareer as any}
        />
      )}

      {/* Grades Modal */}
      <GradesModal
        isOpen={isGradesModalOpen}
        onClose={() => setIsGradesModalOpen(false)}
      />

      <FieldDayRequestModal
        isOpen={isFieldDayModalOpen}
        onClose={() => setIsFieldDayModalOpen(false)}
      />

      <TrialActivationModal
        isOpen={isTrialModalOpen}
        onClose={() => setIsTrialModalOpen(false)}
        onActivate={async () => {
          await handleActivateTrial()
          setIsTrialModalOpen(false)
          setShowTrialBanner(false)
        }}
        isActivating={isActivatingTrial}
        expiresAt={subscriptionStatus?.expiresAt}
      />

      {/* Install Prompt Overlay */}
      <InstallPrompt />
    </div>
  )
}

export default StudentDashboard
