import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ExternalLink, Clock, Users, Star, Loader2, BookOpen, Award, Globe, RefreshCw } from 'lucide-react'
import { aiCacheService } from '@/lib/ai-cache-service'
import { useAuth } from '@/contexts/AuthContext'

export interface CourseRecommendation {

  title: string
  provider: string
  duration: string
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced'
  rating: number
  students: number
  description: string
  skills: string[]
  link: string
  free: boolean
  language: string
  certificate: boolean
  whyRecommended: string
}

interface CourseRecommendationsProps {
  careerInterests?: string[]
  cbeSubjects?: string[]
  strongSubjects?: string[]
  initialCourses?: CourseRecommendation[]
  initialLoading?: boolean
  onCoursesLoaded?: (courses: CourseRecommendation[]) => void
  limit?: number
}


const CourseRecommendations: React.FC<CourseRecommendationsProps> = ({
  careerInterests = [],
  cbeSubjects = [],
  strongSubjects = [],
  initialCourses = [],
  initialLoading = false,
  onCoursesLoaded,
  limit
}) => {
  const [courses, setCourses] = useState<CourseRecommendation[]>(initialCourses)
  const [isLoading, setIsLoading] = useState(initialLoading && initialCourses.length === 0)

  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  useEffect(() => {
    // If we already have courses from props, don't auto-load
    if (initialCourses && initialCourses.length > 0) {
      setCourses(initialCourses)
      setIsLoading(false)
      return
    }

    // First check for cached courses
    const loadCachedCourses = async () => {
      if (!user?.id) {
        setIsLoading(false)
        return
      }

      try {
        const cachedCourses = await aiCacheService.getCachedCourseRecommendations(user.id)
        if (cachedCourses && cachedCourses.length > 0) {
          console.log('✅ Using cached course recommendations')
          const typedCourses = cachedCourses as unknown as CourseRecommendation[];
          setCourses(typedCourses)
          setIsLoading(false)
          if (onCoursesLoaded) onCoursesLoaded(typedCourses)
          return
        }
      } catch (error) {
        console.warn('Failed to load cached courses:', error)
      }

      // Only generate new recommendations if no cache exists
      console.log('No cached courses found, generating new recommendations...')
      generateCourseRecommendations()
    }
    
    loadCachedCourses()
  }, [user?.id, initialCourses.length])

  const generateCourseRecommendations = async (forceRefresh = false) => {
    setIsLoading(true)
    setError(null)

    // Check cache first unless forcing refresh
    if (!forceRefresh && user?.id) {
      try {
        const cachedCourses = await aiCacheService.getCachedCourseRecommendations(user.id)
        if (cachedCourses && cachedCourses.length > 0) {
          console.log('✅ Using cached course recommendations')
          setCourses(cachedCourses as unknown as CourseRecommendation[])
          setIsLoading(false)
          return
        }

      } catch (error) {
        console.warn('Failed to load cached courses:', error)
      }
    }

    try {
      const prompt = `Generate 3 free online course recommendations for a Kenyan student based on their profile. Return a JSON array:

Student Profile:
- Career Interests: ${careerInterests.join(', ') || 'General learning'}
- CBE Subjects: ${cbeSubjects.join(', ') || 'Not specified'}
- Strong Subjects: ${strongSubjects.join(', ') || 'Not specified'}

Return exactly this format:
[
  {
    "title": "Course Title",
    "provider": "Platform Name (e.g., Coursera, edX, Khan Academy)",
    "duration": "X weeks/hours",
    "difficulty": "Beginner/Intermediate/Advanced",
    "rating": 4.5,
    "students": 10000,
    "description": "Brief description of what the course covers",
    "skills": ["Skill 1", "Skill 2", "Skill 3"],
    "link": "https://example.com/course",
    "free": true,
    "language": "English",
    "certificate": true,
    "whyRecommended": "Why this course is recommended for this student"
  }
]

Focus on:
- FREE courses only
- Courses relevant to Kenyan job market
- Skills that complement CBE curriculum
- Practical, hands-on learning
- Courses that can be completed in 2-8 weeks
- Popular platforms like Coursera, edX, Khan Academy, YouTube, Udemy (free courses)
- Skills that align with their career interests and strong subjects`

      const response = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_DEEPSEEK_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7,
          max_tokens: 1500,
          stream: true
        })
      })

      if (!response.ok) throw new Error('Failed to get course recommendations')

      // Handle streaming response
      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('Failed to get response reader')
      }

      const decoder = new TextDecoder()
      let aiResponse = ''

      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value)
          const lines = chunk.split('\n')

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6)
              if (data === '[DONE]') continue

              try {
                const parsed = JSON.parse(data)
                if (parsed.choices?.[0]?.delta?.content) {
                  aiResponse += parsed.choices[0].delta.content
                }
              } catch (e) {
                // Skip invalid JSON lines
                continue
              }
            }
          }
        }
      } finally {
        reader.releaseLock()
      }

      try {
        // Use greedy match to capture the full outer array (handles nested arrays like skills)
        const jsonMatch = aiResponse.match(/\[[\s\S]*\]/)
        if (!jsonMatch) {
          throw new Error('No JSON array found in response')
        }

        const parsed = JSON.parse(jsonMatch[0])
        if (!Array.isArray(parsed) || parsed.length === 0) {
          throw new Error('Invalid course data format - expected non-empty array')
        }

        setCourses(parsed)

        // Save to cache
        if (user?.id) {
          await aiCacheService.saveCourseRecommendations(user.id, parsed)
        }
        if (onCoursesLoaded) onCoursesLoaded(parsed)

      } catch (parseError) {
        console.error('Failed to parse course recommendations:', parseError)
        console.error('Raw AI response:', aiResponse)
        setError('Failed to parse course recommendations. Please try again.')
      }
    } catch (error) {
      console.error('Error generating course recommendations:', error)
      setError('Failed to load course recommendations. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      case 'Intermediate': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
      case 'Advanced': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground font-medium animate-pulse">Analyzing pathways for the best courses...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500 mb-4 text-sm font-medium">{error}</p>
        <Button onClick={() => generateCourseRecommendations()} variant="outline" size="sm" className="rounded-full">
          <RefreshCw className="w-4 h-4 mr-2" />
          Try Again
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto pr-1 space-y-3 max-h-[480px] custom-scrollbar">
        {courses.slice(0, 3).map((course, index) => (
          <div key={index} className="group relative bg-surface/30 border border-card-border/40 rounded-2xl p-4 transition-all duration-300 hover:border-primary/30 hover:shadow-md hover:bg-surface/50">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-bold text-base truncate text-foreground group-hover:text-primary transition-colors">{course.title}</h4>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed mb-2">{course.description}</p>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-[10px] py-0 h-4 bg-primary/5 text-primary border-none">
                    {course.provider}
                  </Badge>
                  <span className="text-[10px] text-primary/60 font-medium italic truncate">"{course.whyRecommended}"</span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2 shrink-0">
                {course.free && (
                  <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-none text-[10px] py-0 h-5 px-2">
                    FREE
                  </Badge>
                )}
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => window.open(course.link, '_blank')}
                  className="h-8 w-8 rounded-full hover:bg-primary hover:text-white transition-all shadow-sm"
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-card-border/30">
              <div className="flex items-center gap-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {course.duration}</span>
                <span className="flex items-center gap-1"><Star className="h-3 w-3 text-yellow-500" /> {course.rating}</span>
                {course.certificate && <span className="flex items-center gap-1 text-blue-500"><Award className="h-3 w-3" /> Cert</span>}
              </div>
              <Badge className={`${getDifficultyColor(course.difficulty)} border-none text-[9px] py-0 h-4 uppercase font-black`}>
                {course.difficulty}
              </Badge>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 flex items-center justify-between gap-4">
        <p className="text-[10px] text-muted-foreground font-medium italic">
          Showing top 3 recommendations based on your unique profile.
        </p>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => generateCourseRecommendations(true)}
          disabled={isLoading}
          className="text-[10px] font-bold uppercase tracking-widest hover:text-primary p-0 h-auto"
        >
          <RefreshCw className={`h-3 w-3 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>
    </div>
  )
}

export default CourseRecommendations
