import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts'
import { useLocation, useNavigate } from 'react-router-dom'
import { RIASEC_LABELS } from '@/data/riasec-assessment'
import { kuccpsService } from '@/lib/kuccps-service'


import {
  User,
  BookOpen,
  Target,
  TrendingUp,
  Settings,
  Bot,
  BarChart3,
  Calendar,
  MessageSquare,
  Award,
  ChevronRight,
  Star,
  Loader2,
  GraduationCap,
  School,
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
  CheckCircle,
  CreditCard,
  RefreshCw,
  UserCog,
  Search,
  Palette,
  Heart,
  Megaphone,
  ClipboardCheck,
  Hammer
} from 'lucide-react'
import { StudentAppHeader } from '@/components/StudentAppHeader'
import { FieldDayRequestModal } from '@/components/FieldDayRequestModal'
import { subscriptionService } from '@/lib/subscription-service'
import PaymentWall from '@/components/PaymentWall'
import { ReportGenerator } from '@/lib/report-generator'
import { ProfileSetup } from '@/components/ProfileSetup'
import GradesManager from '@/components/GradesManager'
import CourseRecommendations, { type CourseRecommendation } from '@/components/CourseRecommendations'

import { CounselorDirectory } from '@/components/CounselorDirectory'
import InstallPrompt from '@/components/InstallPrompt'
import BrandedLoader from '@/components/BrandedLoader'

import { supabase } from '@/lib/supabase'
import { aiCareerService } from '@/lib/ai-service'
import { aiCacheService } from '@/lib/ai-cache-service'
import { dashboardService, UserStat, UserActivity, CareerRecommendation, CareerPath } from '@/lib/dashboard-service'
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

interface WeeklyActivity {
  title: string
  detail: string
}



const StudentDashboard = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, profile } = useAuth()
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    const requestedTab = (location.state as { activeTab?: string } | null)?.activeTab
    if (requestedTab && ['overview', 'careers', 'chat', 'progress', 'profile'].includes(requestedTab)) {
      setActiveTab(requestedTab)
    }
  }, [location.state])

  const [careerData, setCareerData] = useState<CareerDataItem[]>([])
  const [careerCatalog, setCareerCatalog] = useState<CareerPath[]>([])
  const [careerSearch, setCareerSearch] = useState('')
  const [careerFilter, setCareerFilter] = useState('All')
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false)
  const [dynamicStats, setDynamicStats] = useState<UserStat[]>([])
  const [isLoadingStats, setIsLoadingStats] = useState(true)
  const [selectedCareer, setSelectedCareer] = useState<CareerDataItem | null>(null)
  const [isCareerModalOpen, setIsCareerModalOpen] = useState(false)
  const [isSelectedCareerRecommended, setIsSelectedCareerRecommended] = useState(false)
  const [isFieldDayModalOpen, setIsFieldDayModalOpen] = useState(false)
  const [subscriptionStatus, setSubscriptionStatus] = useState<any>(null)
  const [schoolInfo, setSchoolInfo] = useState<{ name: string; status: string } | null>(null)
  const [courseRecommendations, setCourseRecommendations] = useState<CourseRecommendation[]>([])

  const [isLoadingCourses, setIsLoadingCourses] = useState(false)
  const [aiInsights, setAiInsights] = useState<{ weeklyTip?: string; nextStep?: string; motivation?: string; weeklyActivities?: WeeklyActivity[] } | null>(null)
  const [matchedUniversities, setMatchedUniversities] = useState<string[]>([])



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

  useEffect(() => {
    dashboardService.getCareerPaths().then(setCareerCatalog).catch(() => setCareerCatalog([]))
  }, [])

  // Reload careers when profile changes (after initial load)
  const [initialLoadComplete, setInitialLoadComplete] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  const MAX_RETRIES = 3

  useEffect(() => {
    if (user && profile && initialLoadComplete) {
      loadCareerRecommendations(profile)
    }
    if (user && profile && !initialLoadComplete) {
      setInitialLoadComplete(true)
    }
  }, [profile])

  // Load matched universities based on student's subjects
  useEffect(() => {
    const loadMatchedUniversities = async () => {
      if (!profile?.subjects || profile.subjects.length === 0) return;

      try {
        const clusters = await kuccpsService.getAllClusters();
        const matches = kuccpsService.matchSubjectsWithClusters(profile.subjects, {}, clusters);
        
        // Get universities from qualified clusters (top 3)
        const qualifiedClusters = matches.filter(m => m.isQualified);
        const universities = new Set<string>();
        
        qualifiedClusters.slice(0, 3).forEach(match => {
          match.cluster.universities.forEach(uni => universities.add(uni));
        });
        
        // If no qualified clusters, show universities from partial matches
        if (universities.size === 0) {
          matches.slice(0, 3).forEach(match => {
            match.cluster.universities.forEach(uni => universities.add(uni));
          });
        }
        
        setMatchedUniversities(Array.from(universities).slice(0, 6));
      } catch (error) {
        console.error('Error loading matched universities:', error);
      }
    };

    loadMatchedUniversities();
  }, [profile?.subjects])

  // Auto-retry when no career data exists
  useEffect(() => {
    if (user && profile && initialLoadComplete && !isLoadingRecommendations && careerData.length === 0 && retryCount < MAX_RETRIES) {
      const timer = setTimeout(() => {
        console.log(`Auto-retrying career recommendations (attempt ${retryCount + 1}/${MAX_RETRIES})`)
        setRetryCount(prev => prev + 1)
        loadCareerRecommendations(profile)
      }, 2000) // Wait 2 seconds before retrying

      return () => clearTimeout(timer)
    }
  }, [careerData, isLoadingRecommendations, retryCount, initialLoadComplete])

  const checkAccessStatus = async () => {
    if (!profile) return;

    try {
        const status = await subscriptionService.checkSubscriptionStatus(profile);
        setSubscriptionStatus(status);
    } catch (err) {
        console.error('Error checking access status:', err);
    }
  }

  // Keep this as a value until after all hooks below have run. Returning here
  // made the hook order change when subscription state arrived asynchronously.
  const isPaymentLocked = !isLoadingStats && subscriptionStatus && !subscriptionStatus.isActive && !subscriptionStatus.isTrialEligible

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
      } catch {
        localStorage.removeItem(CACHE_KEY)
      }
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
      // The onboarding assessment supplies this field. Do not count fields
      // that the current student flow never asks the learner to complete.
      'assessment_results'
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

    // Recommendations are deliberately renewed every calendar week.
    const weekNumber = Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000));
    const INSIGHTS_KEY = `ai_insights_${user.id}_${weekNumber}`;
    const cached = sessionStorage.getItem(INSIGHTS_KEY);
    if (cached) {
      try {
        setAiInsights(JSON.parse(cached));
        return;
      } catch {
        sessionStorage.removeItem(INSIGHTS_KEY)
      }
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
        `Based on this student profile, provide three short, practical activities for this student's current week in JSON format:
        {
          "weeklyTip": "One actionable tip for this week",
          "nextStep": "Most important next step in their career journey",
          "motivation": "Encouraging message based on their progress",
          "weeklyActivities": [
            { "title": "3-6 word action title", "detail": "One short sentence explaining why it matters this week" },
            { "title": "3-6 word action title", "detail": "One short sentence explaining why it matters this week" },
            { "title": "3-6 word action title", "detail": "One short sentence explaining why it matters this week" }
          ]
        }`,
        [],
        userContext
      );

      try {
        // Extract JSON object from response (handles markdown, extra text, etc.)
        const jsonMatch = insights.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsedInsights = JSON.parse(jsonMatch[0]);
          setAiInsights(parsedInsights);
          sessionStorage.setItem(INSIGHTS_KEY, JSON.stringify(parsedInsights));
        } else {
          console.log('No JSON object found in AI insights response');
        }
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

        // Convert cached data to chart format (handles both normalized and legacy formats)
        const top3 = cachedRecommendations.slice(0, 3).map((rec, index) => ({
          name: rec.career_name || rec.title || rec.name || 'Unknown Career',
          value: rec.match_percentage || rec.matchPercentage || rec.value || 0,
          color: index === 0 ? '#3b82f6' : index === 1 ? '#10b981' : '#f59e0b',
          description: rec.description || "Exciting career opportunity aligned with your interests and skills.",
          salaryRange: rec.salary_range || rec.salaryRange || 'KES 40K - 100K',
          growth: rec.growth || 'Moderate Growth',
          education: rec.education || "Bachelor's Degree or Diploma Required",
          actionabilityScore: rec.actionability_score || rec.actionabilityScore || 85
        }));

        setCareerData(top3);
        console.log('✅ Cached career recommendations loaded:', top3);
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

  const handleCareerDetailClick = async (career: CareerDataItem, isRecommended = false) => {
    const fallbackCareer = {
      title: career.name,
      description: career.description,
      salary_range: career.salaryRange,
      growth_percentage: career.growth,
      skills_required: [],
      category: 'Recommended',
      demand_level: 'High'
    } as any

    // Open immediately. The fuller catalogue record can arrive afterwards,
    // so an unavailable or slow lookup never makes a student tap feel broken.
    setSelectedCareer(fallbackCareer)
    setIsSelectedCareerRecommended(isRecommended)
    setIsCareerModalOpen(true)
    trackButtonClick('View Career Details', 'Career Card')

    try {
      const allPaths = await dashboardService.getCareerPaths();
      const fullPath = allPaths.find(p => p.title.toLowerCase() === career.name.toLowerCase());
      if (fullPath) {
        setSelectedCareer(fullPath as any);
      }
    } catch (err) {
      console.error('Failed to load full career details:', err);
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

  const recommendedAction = useMemo(() => {
    const hasSubjects = Boolean((profile?.cbe_subjects || profile?.subjects || []).length)
    if (!hasSubjects) {
      return { title: 'Map your subject pathway', detail: 'Add your subjects to see KUCCPS routes, programmes, and careers that fit.', cta: 'Explore subject guide', action: 'subjects' }
    }
    if (!careerData[0]) {
      return { title: 'Explore your career matches', detail: 'Your recommendations are being prepared from your profile, subjects, and interests.', cta: 'View career matches', action: 'careers' }
    }

    const actionCycle = [
      { title: `Explore ${careerData[0].name}`, detail: `See why this is your current top recommendation with a ${careerData[0].value}% fit rate.`, cta: 'View recommendation', action: 'career' },
      { title: 'Check your subject route', detail: 'Compare your subjects against KUCCPS pathways before choosing your next academic move.', cta: 'Open subject guide', action: 'subjects' },
      { title: 'Explore your recommended short courses', detail: 'Build practical skills with free, short courses selected around your interests and strengths.', cta: 'View short courses', action: 'courses' },
      { title: 'Turn your matches into a plan', detail: 'Use Career Support to ask the questions that help you make your next decision.', cta: 'Talk to Career Support', action: 'counseling' }
    ]
    return actionCycle[Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000)) % actionCycle.length]
  }, [careerData, profile])

  const additionalCareers = useMemo(() => {
    const recommendedNames = new Set(careerData.slice(0, 3).map(career => career.name.toLowerCase()))
    const search = careerSearch.trim().toLowerCase()
    const categoryMatches = (career: CareerPath) => {
      if (careerFilter === 'All') return true
      const searchable = `${career.category || ''} ${career.title || ''} ${career.description || ''}`.toLowerCase()
      const terms: Record<string, string[]> = {
        STEM: ['stem', 'engineering', 'technology', 'technical', 'science'],
        Business: ['business', 'finance', 'marketing', 'entrepreneur'],
        Health: ['health', 'medical', 'nursing', 'pharmacy', 'clinical'],
        Creative: ['creative', 'arts', 'design', 'media', 'film']
      }
      return (terms[careerFilter] || [careerFilter.toLowerCase()]).some(term => searchable.includes(term))
    }
    return careerCatalog.filter(career => {
      const searchable = `${career.title} ${career.category || ''} ${career.one_liner || ''} ${career.description || ''}`.toLowerCase()
      return !recommendedNames.has(career.title.toLowerCase()) && categoryMatches(career) && (!search || searchable.includes(search))
    }).slice(0, 24)
  }, [careerCatalog, careerData, careerFilter, careerSearch])
  const isCareerLibraryFiltering = Boolean(careerSearch.trim()) || careerFilter !== 'All'

  const handleRecommendedAction = () => {
    if (recommendedAction.action === 'career') return careerData[0] ? handleCareerDetailClick(careerData[0]) : setActiveTab('careers')
    if (recommendedAction.action === 'subjects') return navigate('/subject-guide')
    if (recommendedAction.action === 'courses') return navigate('/student/courses')
    if (recommendedAction.action === 'counseling') return navigate('/student/counseling')
    return setActiveTab('careers')
  }

  const weeklyActivities = aiInsights?.weeklyActivities?.length
    ? aiInsights.weeklyActivities.slice(0, 3)
    : [
        { title: 'Review your top match', detail: 'Open your leading career recommendation and note one requirement to work toward.' },
        { title: 'Explore a short course', detail: 'Choose one practical skill you can start building alongside school.' },
        { title: 'Check your subject route', detail: 'Use the KUCCPS guide to understand the options your subjects unlock.' }
      ]

  const careerReadiness = Number.parseInt(String(dynamicStats.find(stat => stat.stat_type === 'profile_completeness')?.stat_value || '0')) || 0
  const careerReadinessLabel = careerReadiness >= 100 ? 'Profile complete' : careerReadiness >= 70 ? 'Good progress' : 'Build your profile'

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

  if (isPaymentLocked) {
    return <PaymentWall onPaymentSuccess={checkAccessStatus} />
  }


  return (
    <div className="student-shell min-h-screen safe-area-bottom">
      <StudentAppHeader />

      {/* Main Content */}
      <main className="mx-auto w-full max-w-7xl px-4 pb-28 pt-5 sm:px-6 sm:py-8">
        {/* Tabs Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6">
          <TabsList className="sr-only">
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
          <TabsContent value="overview" className="student-overview space-y-5 sm:space-y-7">
            <section className="student-recommended-action">
              <div className="student-action-label">Recommended next step</div>
              <h1>{recommendedAction.title}</h1>
              <p>{recommendedAction.detail}</p>
              <Button className="student-action-button w-full" onClick={handleRecommendedAction}>
                {recommendedAction.cta} <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </section>

            <section className="grid grid-cols-2 gap-3">
              <article className="student-snapshot-card">
                <p>Career readiness</p>
                <strong>{dynamicStats.find(stat => stat.stat_type === 'profile_completeness')?.stat_value || '—'}</strong>
                <span className="text-emerald-600">{careerReadinessLabel}</span>
                <div className="student-progress-track"><span className="bg-blue-600" style={{ width: `${Math.min(careerReadiness, 100)}%` }} /></div>
              </article>
              <button type="button" className="student-snapshot-card student-top-career-card" onClick={() => careerData[0] ? handleCareerDetailClick(careerData[0]) : setActiveTab('careers')}>
                <p>Top career recommendation</p>
                <strong className="student-top-career-name">{careerData[0]?.name || 'Personalised careers'}</strong>
                <span className="text-emerald-600">{careerData[0] ? `${careerData[0].value}% fit rate · View details` : 'Explore your matches'}</span>
              </button>
            </section>

            <section className="student-weekly-activities" aria-labelledby="weekly-activities-title">
              <div className="student-section-heading">
                <div><p>This week</p><h2 id="weekly-activities-title">Three useful actions</h2></div>
                <span>Refreshed weekly</span>
              </div>
              <div className="student-weekly-activity-list">
                {weeklyActivities.map((activity, index) => (
                  <article key={`${activity.title}-${index}`}>
                    <span>{String(index + 1).padStart(2, '0')}</span>
                    <div><h3>{activity.title}</h3><p>{activity.detail}</p></div>
                  </article>
                ))}
              </div>
            </section>

            <section className="student-priorities-card student-career-toolkit">
              <div className="student-toolkit-heading"><div><p>Your career toolkit</p><h2>Useful next moves</h2></div><span>Keep building</span></div>
              <div className="student-toolkit-actions">
                <button type="button" onClick={() => navigate('/student/courses')}>
                  <span className="student-toolkit-mark">01</span>
                  <span><b>Recommended short courses</b><small>Build a skill alongside school.</small></span>
                  <ChevronRight className="h-4 w-4" />
                </button>
                <button type="button" onClick={() => navigate('/subject-guide')}>
                  <span className="student-toolkit-mark">02</span>
                  <span><b>Subject guide</b><small>See the pathways your subjects unlock.</small></span>
                  <ChevronRight className="h-4 w-4" />
                </button>
                <button type="button" onClick={() => navigate('/student/grades')}>
                  <span className="student-toolkit-mark">03</span>
                  <span><b>Update your grades</b><small>Keep your recommendations accurate.</small></span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </section>

            {/* Quick Stats - 2x2 Grid on Mobile */}
            <div className="student-stats-grid grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 w-full">
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
              <Card className="student-legacy-overview bg-primary/5 border border-primary/20 shadow-sm overflow-hidden relative">
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
            <div className="student-legacy-overview grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-6 w-full">
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
                  ) : careerData.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-center">
                      <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                        {retryCount > 0 && retryCount < MAX_RETRIES ? (
                          <Loader2 className="w-8 h-8 text-primary animate-spin" />
                        ) : (
                          <Briefcase className="w-8 h-8 text-muted-foreground" />
                        )}
                      </div>
                      <h3 className="text-lg font-semibold mb-2">
                        {retryCount > 0 && retryCount < MAX_RETRIES
                          ? 'Retrying...'
                          : 'No Career Recommendations Yet'}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-4 max-w-md">
                        {retryCount > 0 && retryCount < MAX_RETRIES
                          ? `Attempting to load your recommendations (attempt ${retryCount}/${MAX_RETRIES})...`
                          : 'Complete your profile and assessment to get personalized career recommendations based on your interests and strengths.'}
                      </p>
                      <Button
                        onClick={() => {
                          setRetryCount(0)
                          handleRefreshRecommendations()
                        }}
                        variant="outline"
                        className="gap-2"
                      >
                        <RefreshCw className="w-4 h-4" />
                        Generate Recommendations
                      </Button>
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

            {/* Universities Matched to Your Subjects */}
            {matchedUniversities.length > 0 && (
              <Card className="student-legacy-overview bg-gradient-to-br from-blue-500/5 to-cyan-500/5 border border-blue-500/20 shadow-sm">
                <CardHeader className="pb-3 p-3 sm:p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="w-9 h-9 sm:w-10 sm:h-10 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                        <GraduationCap className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
                      </div>
                      <div>
                        <CardTitle className="text-sm sm:text-base">Universities Matched to You</CardTitle>
                        <CardDescription className="text-[10px] sm:text-xs">Based on your selected subjects</CardDescription>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs"
                      onClick={() => navigate('/subject-guide')}
                    >
                      View All
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-3 pt-0 sm:p-5 sm:pt-0">
                  <div className="flex flex-wrap gap-2">
                    {matchedUniversities.map((uni, i) => (
                      <Badge
                        key={i}
                        variant="outline"
                        className="text-xs sm:text-sm py-1 px-2 sm:px-3 bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30"
                      >
                        {uni}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground mt-3">
                    These universities offer programmes that align with your CBC subject combination.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Careers Tab */}
          <TabsContent value="careers" className="student-explore space-y-5">
            <header>
              <h1>Discover careers</h1>
              <label className="student-search"><Search className="h-4 w-4" /><input value={careerSearch} onChange={(event) => setCareerSearch(event.target.value)} placeholder="Search roles or industries..." aria-label="Search careers" /></label>
              <div className="student-filter-row" aria-label="Filter careers">{['All', 'STEM', 'Business', 'Health', 'Creative'].map((filter) => <button type="button" key={filter} className={careerFilter === filter ? 'is-selected' : ''} onClick={() => setCareerFilter(filter)}>{filter}</button>)}</div>
            </header>
            {!isCareerLibraryFiltering && careerData.length > 0 && <section className="student-match-section">
              <div className="student-match-heading"><div><p>Matched for you</p><h2>Your top 3 career matches</h2></div><span>Based on your profile</span></div>
              <div className="student-career-list">
              {careerData.slice(0, 3).map((career, index) => (
                <button type="button" key={`figma-${index}`} onClick={() => handleCareerDetailClick(career, true)}>
                  <div><h2>{career.name}</h2><p>{career.description || 'Explore the subjects, courses, and career opportunities that fit this path.'}</p><small>Est. monthly salary: <b>{career.salaryRange || 'KSh 60K – 200K'}</b></small></div>
                  <span>{career.value}% Fit</span>
                </button>
              ))}
              </div>
            </section>}
            {careerData.length === 0 && <Button className="student-primary-button" onClick={handleRefreshRecommendations}>Generate career matches</Button>}
            {additionalCareers.length > 0 && <section className="student-catalogue-section">
              <div className="student-match-heading"><div><p>{isCareerLibraryFiltering ? 'Search results' : 'Career library'}</p><h2>{careerSearch.trim() ? `Results for “${careerSearch.trim()}”` : 'Other careers from our database'}</h2></div><span>{additionalCareers.length} results</span></div>
              <div className="student-career-list student-catalogue-list">
                {additionalCareers.map((career) => (
                  <button type="button" key={career.id} onClick={() => handleCareerDetailClick({ name: career.title, value: 0, color: '#94a3b8', description: career.description, salaryRange: career.salary_range, growth: career.growth_percentage, education: career.education_requirements })}>
                    <div><h2>{career.title}</h2><p>{career.one_liner || career.description}</p><small>{career.category} · <b>{career.demand_level} demand</b></small></div>
                    <ChevronRight className="h-4 w-4 text-slate-400" />
                  </button>
                ))}
              </div>
            </section>}
            {careerCatalog.length > 0 && additionalCareers.length === 0 && <p className="student-career-empty">No database careers match that search yet.</p>}
            <div className="student-legacy-careers">
            {careerData.length === 0 ? (
              <Card className="border-card-border">
                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-6">
                    {retryCount > 0 && retryCount < MAX_RETRIES ? (
                      <Loader2 className="w-10 h-10 text-primary animate-spin" />
                    ) : (
                      <Briefcase className="w-10 h-10 text-muted-foreground" />
                    )}
                  </div>
                  <h3 className="text-xl font-semibold mb-3">
                    {retryCount > 0 && retryCount < MAX_RETRIES
                      ? 'Retrying...'
                      : 'No Career Recommendations Yet'}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-6 max-w-md">
                    {retryCount > 0 && retryCount < MAX_RETRIES
                      ? `Attempting to load your recommendations (attempt ${retryCount}/${MAX_RETRIES})...`
                      : 'Complete your profile and assessment to get personalized career recommendations based on your interests, strengths, and the Kenyan job market.'}
                  </p>
                  <Button
                    onClick={() => {
                      setRetryCount(0)
                      handleRefreshRecommendations()
                    }}
                    className="gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Generate Recommendations
                  </Button>
                </CardContent>
              </Card>
            ) : (
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
            )}
            </div>
          </TabsContent>

          {/* AI Chat Tab Refined */}
          <TabsContent value="chat" className="student-chat-view space-y-5">
            <header><p>Career adviser</p><h1>Let’s plan your next move.</h1><span>Ask about courses, subjects, career paths, or opportunities in Kenya.</span></header>
            <div className="student-chat-message is-assistant"><Bot className="h-4 w-4" /><p>Hi! I’m your career adviser. What would you like to explore today?</p></div>
            <div className="student-chat-prompts"><button onClick={() => navigate('/student/chat')}>What careers fit my subjects?</button><button onClick={() => navigate('/student/chat')}>Help me choose a course</button><button onClick={() => navigate('/student/chat')}>Show my next steps</button></div>
            <Button className="student-primary-button w-full" onClick={() => navigate('/student/chat')}>Open career adviser <ArrowRight className="ml-2 h-4 w-4" /></Button>
            <div className="student-legacy-chat">
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
            </div>
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
          <TabsContent value="progress" className="student-plan-view space-y-5 w-full">
            <header><p>Your plan</p><h1>Career plan timeline</h1><span>Simple milestones that turn your interests into a practical next step.</span></header>
            <section className="student-timeline">
              <button type="button" onClick={() => navigate('/quick-assessment')}><span className="timeline-dot is-active" /><div><b>Know your strengths</b><p>Try the guided career diagnostic for a deeper view of your preferences.</p></div><ArrowRight className="h-4 w-4" /></button>
              <button type="button" onClick={() => setActiveTab('careers')}><span className="timeline-dot" /><div><b>Explore career matches</b><p>Compare careers that fit your profile.</p></div><ArrowRight className="h-4 w-4" /></button>
              <button type="button" onClick={() => navigate('/subject-guide')}><span className="timeline-dot" /><div><b>Check subject pathways</b><p>See the courses and KUCCPS options ahead.</p></div><ArrowRight className="h-4 w-4" /></button>
              <button type="button" onClick={() => navigate('/student/counseling')}><span className="timeline-dot" /><div><b>Speak with a counsellor</b><p>Turn your findings into a confident plan.</p></div><ArrowRight className="h-4 w-4" /></button>
            </section>
            <div className="student-legacy-plan">
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
            </div>
          </TabsContent>

          <TabsContent value="profile" className="student-profile-view space-y-5">
            <header><Avatar className="h-16 w-16 border-2 border-blue-100"><AvatarImage src={profile?.avatar_url || ''} /><AvatarFallback className="bg-blue-50 text-lg text-blue-700">{getInitials(profile?.full_name)}</AvatarFallback></Avatar><h1>{profile?.full_name || 'Your profile'}</h1><span>Keep your details and academic profile current for better matches.</span></header>
            <section className="student-profile-list">
              <button type="button" onClick={() => navigate('/student/grades')}><GraduationCap className="h-5 w-5" /><div><b>Academic profile</b><p>View and update your grades.</p></div><ChevronRight className="h-4 w-4" /></button>
              <button type="button" onClick={() => navigate('/student/billing')}><CreditCard className="h-5 w-5" /><div><b>Plan & billing</b><p>{subscriptionStatus?.type === 'trial' ? `Trial active · Ends ${new Date(subscriptionStatus.expiresAt).toLocaleDateString('en-KE', { month: 'short', day: 'numeric' })}` : subscriptionStatus?.isTrialEligible ? 'Review your free term access.' : 'Review your access plan.'}</p></div><ChevronRight className="h-4 w-4" /></button>
            </section>
          </TabsContent>
        </Tabs>

        <nav className="student-bottom-nav" aria-label="Student navigation">
          <button type="button" className={activeTab === 'overview' ? 'is-active' : ''} onClick={() => setActiveTab('overview')}><Award className="h-5 w-5" /><span>Home</span></button>
          <button type="button" className={activeTab === 'careers' ? 'is-active' : ''} onClick={() => setActiveTab('careers')}><Search className="h-5 w-5" /><span>Explore</span></button>
          <button type="button" className={activeTab === 'progress' ? 'is-active' : ''} onClick={() => setActiveTab('progress')}><BookOpen className="h-5 w-5" /><span>Plan</span></button>
          <button type="button" className={activeTab === 'chat' ? 'is-active' : ''} onClick={() => setActiveTab('chat')}><MessageSquare className="h-5 w-5" /><span>Chat</span></button>
          <button type="button" className={activeTab === 'profile' ? 'is-active' : ''} onClick={() => setActiveTab('profile')}><User className="h-5 w-5" /><span>Profile</span></button>
        </nav>
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
            setIsSelectedCareerRecommended(false)
          }}
          career={selectedCareer as any}
          showAssessAction={!isSelectedCareerRecommended}
        />
      )}


      <FieldDayRequestModal
        isOpen={isFieldDayModalOpen}
        onClose={() => setIsFieldDayModalOpen(false)}
      />

      {/* Install Prompt Overlay */}
      <InstallPrompt />
    </div>
  )
}

export default StudentDashboard
