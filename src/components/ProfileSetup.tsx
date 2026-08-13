import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Loader2, CheckCircle, User, BookOpen, Target, Sparkles, Brain, Briefcase, Heart, Lightbulb, Compass, ChevronRight, ChevronLeft, Shield, Globe, Coins } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { dashboardService, CbeSubject, CareerInterest } from '@/lib/dashboard-service'
import { RIASEC_ACTIVITIES, RIASEC_LABELS, CAREER_VALUES, CONTEXTUAL_CONSTRAINTS } from '@/data/riasec-assessment'
import { INTEREST_CATEGORIES } from '@/data/interest-categories'

const profileSchema = z.object({
  curriculum: z.enum(['cbc', 'igcse']),
  schoolLevel: z.enum(['primary', 'secondary', 'tertiary']),
  currentGrade: z.string().optional(),
  subjects: z.array(z.string()).min(3, 'Please select at least 3 subjects'),
  interests: z.array(z.string()).min(1, 'Please select at least one pathway or exploration path'),
  careerGoals: z.string().optional(),
})

type ProfileFormData = z.infer<typeof profileSchema>

// Updated CBC/CBE Learning Areas (2025-2026) with Grade-Level Mapping
const cbeSubjects = [
  // Core (Both Junior & Senior)
  { name: 'Mathematics', levels: ['secondary', 'tertiary'] },
  { name: 'English', levels: ['secondary', 'tertiary'] },
  { name: 'Kiswahili', levels: ['secondary', 'tertiary'] },
  { name: 'Business Studies', levels: ['secondary', 'tertiary'] },
  
  // Junior Secondary Only (Grade 7-9)
  { name: 'Integrated Science', levels: ['secondary'] },
  { name: 'Health Education', levels: ['secondary'] },
  { name: 'Pre-Technical & Pre-Career Studies', levels: ['secondary'] },
  { name: 'Social Studies', levels: ['secondary'] },
  { name: 'Agriculture & Nutrition', levels: ['secondary', 'tertiary'] },
  { name: 'Life Skills Education', levels: ['secondary'] },
  { name: 'Creative Arts and Sports', levels: ['secondary'] },
  { name: 'Christian Religious Education (CRE)', levels: ['secondary'] },
  { name: 'Islamic Religious Education (IRE)', levels: ['secondary'] },
  { name: 'Hindu Religious Education (HRE)', levels: ['secondary'] },

  // Senior Secondary Specialized (Grade 10-12)
  { name: 'Physics', levels: ['tertiary'] },
  { name: 'Chemistry', levels: ['tertiary'] },
  { name: 'Biology', levels: ['tertiary'] },
  { name: 'Computer Science / ICT', levels: ['tertiary'] },
  { name: 'Further Mathematics', levels: ['tertiary'] },
  { name: 'Technical Drawing', levels: ['tertiary'] },
  { name: 'Fine Art & Design', levels: ['tertiary'] },
  { name: 'Music', levels: ['tertiary'] },
  { name: 'Drama & Theatre', levels: ['tertiary'] },
  { name: 'Physical Education & Sports Science', levels: ['tertiary'] },
  { name: 'Media & Film Studies', levels: ['tertiary'] },
  { name: 'Fashion & Design', levels: ['tertiary'] },
  { name: 'Economics', levels: ['tertiary'] },
  { name: 'Geography', levels: ['tertiary'] },
  { name: 'History & Citizenship', levels: ['tertiary'] },
  { name: 'Law', levels: ['tertiary'] },
  { name: 'Sociology', levels: ['tertiary'] },

  // Technical & Vocational Pathway (Grade 10-12)
  { name: 'Building & Construction', levels: ['tertiary'] },
  { name: 'Electrical & Electronics', levels: ['tertiary'] },
  { name: 'Mechanical Engineering', levels: ['tertiary'] },
  { name: 'Home Science', levels: ['secondary', 'tertiary'] },
  { name: 'Hairdressing & Beauty', levels: ['tertiary'] },
  { name: 'Plumbing & Carpentry', levels: ['tertiary'] },
  
  // Languages (Usually Senior or JS Electives)
  { name: 'French', levels: ['secondary', 'tertiary'] },
  { name: 'German', levels: ['secondary', 'tertiary'] },
  { name: 'Arabic', levels: ['secondary', 'tertiary'] },
  { name: 'Mandarin', levels: ['secondary', 'tertiary'] }
]

// Career Interests aligned with Kenya's Vision 2030 and CBE pathways
const careerInterests = [
  // STEM & Technology
  'Technology & Programming', 'Engineering & Construction', 'Digital Innovation',
  'Data Science & Analytics', 'Robotics & AI', 'Renewable Energy',

  // Healthcare & Life Sciences
  'Healthcare & Medicine', 'Biotechnology', 'Public Health', 'Veterinary Sciences',

  // Business & Economics
  'Business & Entrepreneurship', 'Finance & Banking', 'Economics & Trade',
  'Supply Chain & Logistics', 'Marketing & Sales',

  // Creative & Arts
  'Visual Arts & Design', 'Music & Performing Arts', 'Film & Media Production',
  'Fashion & Textile Design', 'Architecture & Interior Design',

  // Agriculture & Environment
  'Agriculture & Food Security', 'Environmental Conservation', 'Climate Change Solutions',
  'Sustainable Development', 'Marine & Fisheries',

  // Social Sciences & Humanities
  'Education & Teaching', 'Law & Justice', 'Social Work & Community Service',
  'Psychology & Counselling', 'International Relations',

  // Other Key Sectors
  'Tourism & Hospitality', 'Sports & Recreation', 'Aviation & Transport',
  'Manufacturing & Industry', 'Research & Development'
]

interface ProfileSetupProps {
  onComplete: (isPaymentComplete: boolean) => void
}

export const ProfileSetup: React.FC<ProfileSetupProps> = ({ onComplete }) => {
  const { user, refreshProfile } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([])
  const [selectedInterests, setSelectedInterests] = useState<string[]>([])
  const [selectedActivities, setSelectedActivities] = useState<string[]>([])
  const [selectedValues, setSelectedValues] = useState<string[]>([])
  const [selectedInterestItems, setSelectedInterestItems] = useState<string[]>([])
  const [customInterest, setCustomInterest] = useState('')
  const [currentStep, setCurrentStep] = useState(1)
  const [dynamicSubjects, setDynamicSubjects] = useState<CbeSubject[]>([])
  const [dynamicInterests, setDynamicInterests] = useState<CareerInterest[]>([])
  const [isLoadingData, setIsLoadingData] = useState(true)

  const {
    register,
    handleSubmit,
    setValue,
    watch
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      curriculum: 'cbc',
      schoolLevel: 'secondary',
      subjects: [],
      interests: []
    }
  })

  const curriculumType = watch('curriculum')
  const schoolLevel = watch('schoolLevel')

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoadingData(true)
        const [s, i] = await Promise.all([
          dashboardService.getCbeSubjects(),
          dashboardService.getCareerInterests()
        ])
        setDynamicSubjects(s)
        setDynamicInterests(i)
      } catch (e) {
        setDynamicSubjects(cbeSubjects.map(n => ({ 
          id: n.name, 
          subject_name: n.name, 
          subject_code: '', 
          category: 'Core', 
          description: '', 
          is_active: true, 
          levels: n.levels,
          created_at: '' 
        })))
        setDynamicInterests(careerInterests.map(n => ({ id: n, interest_name: n, category: 'General', description: '', related_subjects: [], is_active: true, created_at: '' })))
      } finally {
        setIsLoadingData(false)
      }
    }
    loadData()
  }, [])

  const calculateRiasec = () => {
    const scores = { realistic: 0, investigative: 0, artistic: 0, social: 0, enterprising: 0, conventional: 0 }

    // Map interest categories to RIASEC types
    const riasecMapping: Record<string, string[]> = {
      'sports': ['realistic'],
      'arts': ['artistic'],
      'technology': ['investigative', 'realistic'],
      'science': ['investigative'],
      'community': ['social', 'enterprising'],
      'business': ['enterprising', 'conventional'],
      'media': ['artistic', 'social']
    }

    // Calculate scores based on selected interest items
    selectedInterestItems.forEach(item => {
      // Find which category this item belongs to
      const category = INTEREST_CATEGORIES.find(cat => cat.items.includes(item))
      if (category && riasecMapping[category.id]) {
        riasecMapping[category.id].forEach(type => {
          scores[type as keyof typeof scores]++
        })
      }
    })

    // Also factor in pathway selection
    if (selectedInterests.includes('stem')) {
      scores.investigative += 2
      scores.realistic += 1
    }
    if (selectedInterests.includes('social_sciences')) {
      scores.social += 2
      scores.artistic += 1
    }
    if (selectedInterests.includes('arts_sports')) {
      scores.artistic += 2
      scores.realistic += 1
    }

    const sortedTypes = Object.entries(scores).sort((a, b) => b[1] - a[1]).filter(s => s[1] > 0).map(s => RIASEC_LABELS[s[0].charAt(0).toUpperCase()])
    return { scores, personalityTypes: sortedTypes }
  }

  const handleFinalSubmit = async () => {
    // Manually trigger zod validation if needed, but since we control nextStep, 
    // we already know basic fields are mostly valid. We'll do a final check.
    if (!user) return
    setIsLoading(true)
    setError(null)
    try {
      const data = watch()
      const { scores, personalityTypes } = calculateRiasec()
      const profileData = {
        email: user.email,
        curriculum: data.curriculum,
        school_level: data.schoolLevel,
        current_grade: data.currentGrade || null,
        cbe_subjects: selectedSubjects,
        career_interests: [...selectedInterests, ...selectedInterestItems],
        career_goals: data.careerGoals || null,
        assessment_results: {
          riasec_scores: scores,
          personality_type: personalityTypes,
          interests: [...selectedInterests, ...selectedInterestItems],
          subjects: selectedSubjects,
          values: selectedValues,
          customAspiration: data.careerGoals || null,
          constraints: [],
        },
        updated_at: new Date().toISOString()
      }

      const { error } = await supabase.from('profiles').upsert({ id: user.id, ...profileData } as any)
      if (error) throw error

      await refreshProfile()
      const { data: p } = await supabase.from('profiles').select('payment_status').eq('id', user.id).single()
      onComplete(p?.payment_status === 'completed')
    } catch (e: any) {
      console.error('Submission error:', e)
      setError(e.message)
    } finally {
      setIsLoading(false)
    }
  }

  const nextStep = () => {
    if (currentStep === 1 && !curriculumType) {
      setError('Please select your curriculum')
      return
    }
    if (currentStep === 2 && !schoolLevel) {
      setError('Please select your education level')
      return
    }
    if (currentStep === 3 && selectedSubjects.length < 3) {
      setError('Please select at least 3 subjects')
      return
    }
    if (currentStep === 4 && selectedInterests.length < 1 && !watch('careerGoals')) {
      setError('Please pick a path or tell us about your dream')
      return
    }
    if (currentStep === 5 && selectedInterestItems.length < 1) {
      setError('Please select at least one interest')
      return
    }
    setError(null)
    setCurrentStep(s => s + 1)
  }

  if (isLoadingData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
        <p className="text-foreground-muted animate-pulse">Initializing your guidance experience...</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-8 min-h-[600px] flex flex-col justify-center">
      <div className="mb-12 text-center">
        <div className="flex justify-center gap-2 mb-4">
          {[1, 2, 3, 4, 5, 6].map(s => (
            <div key={s} className={`h-1.5 w-8 sm:w-10 rounded-full transition-all ${currentStep >= s ? 'bg-primary shadow-[0_0_10px_rgba(var(--primary),0.5)]' : 'bg-muted'}`} />
          ))}
        </div>
        <p className="text-sm font-bold text-primary uppercase tracking-widest">Phase {currentStep} of 6</p>
      </div>

      <div className="space-y-8">
        {error && <Alert variant="destructive" className="border-destructive/50 bg-destructive/5"><AlertDescription>{error}</AlertDescription></Alert>}
        {console.log('Current Step:', currentStep)}
        <div className="space-y-8">
          {currentStep === 1 && (
            <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="text-center space-y-4">
                <h2 className="text-5xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent pb-2">Start Your Journey</h2>
                <p className="text-xl text-foreground-muted">Which Curriculum are you currently taking?</p>
              </div>
              <div className="space-y-6">
                <div className="grid gap-4">
                  {[
                    { v: 'cbc', l: 'Competency-Based Curriculum (CBC)', d: 'The Kenyan national curriculum (Primary, JS, SS)' },
                    { v: 'igcse', l: 'British Curriculum (IGCSE / A-Levels)', d: 'Cambridge or Edexcel international system' }
                  ].map(curr => (
                    <button
                      key={curr.v} type="button"
                      onClick={() => {
                        setValue('curriculum', curr.v as any);
                        setValue('subjects', []); // Reset subjects when curriculum changes
                        setSelectedSubjects([]);
                      }}
                      className={`p-6 sm:p-8 rounded-[2.5rem] border-2 text-left transition-all ${curriculumType === curr.v ? 'border-primary bg-primary/5 ring-2 ring-primary/20' : 'border-card-border hover:border-primary/50'}`}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-xl sm:text-2xl font-bold">{curr.l}</p>
                          <p className="text-base text-foreground-muted">{curr.d}</p>
                        </div>
                        {curriculumType === curr.v && <CheckCircle className="w-8 h-8 text-primary" />}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="text-center space-y-4">
                <h2 className="text-5xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent pb-2">Your Level</h2>
                <p className="text-xl text-foreground-muted">What is your current education level?</p>
              </div>
              <div className="space-y-6">
                <div className="grid gap-4">
                  {(curriculumType === 'cbc' ? [
                    { v: 'primary', l: 'Primary School', d: 'Grade 1-6' },
                    { v: 'secondary', l: 'Junior Secondary', d: 'Grade 7-9' },
                    { v: 'tertiary', l: 'Senior Secondary / Tertiary', d: 'Grade 10-12+' }
                  ] : [
                    { v: 'primary', l: 'Key Stage 1-2', d: 'Years 1-6' },
                    { v: 'secondary', l: 'Key Stage 3-4 (IGCSE)', d: 'Years 7-11' },
                    { v: 'tertiary', l: 'A-Levels', d: 'Years 12-13' }
                  ]).map(level => (
                    <button
                      key={level.v} type="button"
                      onClick={() => setValue('schoolLevel', level.v as any)}
                      className={`p-6 sm:p-8 rounded-[2.5rem] border-2 text-left transition-all ${schoolLevel === level.v ? 'border-primary bg-primary/5 ring-2 ring-primary/20' : 'border-card-border hover:border-primary/50'}`}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-xl sm:text-2xl font-bold">{level.l}</p>
                          <p className="text-base text-foreground-muted">{level.d}</p>
                        </div>
                        {schoolLevel === level.v && <CheckCircle className="w-8 h-8 text-primary" />}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="text-center space-y-3">
                <h2 className="text-4xl font-extrabold tracking-tight">Learning Areas</h2>
                <p className="text-lg text-foreground-muted">Pick 3 or more subjects you find exciting.</p>
              </div>
              <div className="grid grid-cols-2 gap-3 max-h-[450px] overflow-y-auto p-2 custom-scrollbar pr-4">
                {dynamicSubjects
                  .filter(s => {
                    // Quick curriculum-based filter hack using naming conventions
                    // A proper DB setup would rely on s.category === curriculumType
                    if (curriculumType === 'cbc') {
                      // Level-aware filtering: Only show subjects mapped to the user's current level
                      if (!s.levels || s.levels.length === 0) return true;
                      return s.levels.includes(schoolLevel);
                    } else {
                      return ['IGCSE', 'A-Level', 'British', 'General'].includes(s.category || 'General') || !s.subject_name.includes('Integrated');
                    }
                  })
                  .map(s => (
                  <button
                    key={s.id} type="button"
                    onClick={() => {
                      const upd = selectedSubjects.includes(s.subject_name) ? selectedSubjects.filter(i => i !== s.subject_name) : [...selectedSubjects, s.subject_name]
                      setSelectedSubjects(upd); setValue('subjects', upd)
                    }}
                    className={`p-5 rounded-2xl border-2 transition-all text-sm font-bold ${selectedSubjects.includes(s.subject_name) ? 'border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-[0.98]' : 'border-card-border hover:border-primary/30'}`}
                  >
                    {s.subject_name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="text-center space-y-4">
                <h2 className="text-5xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent pb-2">Future Aspirations</h2>
                <p className="text-xl text-foreground-muted italic">"Your future is as bright as your curiosity."</p>
                <p className="text-lg font-medium">Which career path sparks your interest?</p>
              </div>

              <div className="grid gap-4">
                {[
                  {
                    id: 'stem',
                    name: 'Science, Tech, Engineering & Math (STEM)',
                    desc: 'For explorers of how things work, coding, and scientific discovery.',
                    icon: <Brain className="w-8 h-8" />
                  },
                  {
                    id: 'social_sciences',
                    name: 'Social Sciences & Humanities',
                    desc: 'For those interested in people, history, law, and social change.',
                    icon: <Globe className="w-8 h-8" />
                  },
                  {
                    id: 'arts_sports',
                    name: 'Arts & Sports Science',
                    desc: 'For creative souls, designers, performers, and athletes.',
                    icon: <Sparkles className="w-8 h-8" />
                  },
                  {
                    id: 'exploring',
                    name: 'I\'m Still Exploring / Mixed Path',
                    desc: 'You have multiple interests and aren\'t ready to pick just one!',
                    icon: <Compass className="w-8 h-8" />
                  }
                ].map((interest) => (
                  <button
                    key={interest.id} type="button"
                    onClick={() => {
                      const newInterests = selectedInterests.includes(interest.id) ? selectedInterests.filter(i => i !== interest.id) : [...selectedInterests, interest.id]
                      setSelectedInterests(newInterests)
                      setValue('interests', newInterests as any)
                    }}
                    className={`p-6 sm:p-8 rounded-[2.5rem] border-2 text-left transition-all flex items-start gap-6 ${selectedInterests.includes(interest.id) ? 'border-primary bg-primary/5 ring-2 ring-primary/20' : 'border-card-border hover:border-primary/50'}`}
                  >
                    <div className={`p-4 rounded-2xl flex-shrink-0 ${selectedInterests.includes(interest.id) ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'bg-muted text-foreground-muted'}`}>
                      {interest.icon}
                    </div>
                    <div className="space-y-1">
                      <p className="text-xl sm:text-2xl font-bold">{interest.name}</p>
                      <p className="text-base text-foreground-muted leading-relaxed">{interest.desc}</p>
                    </div>
                  </button>
                ))}
              </div>

              <div className="pt-8 border-t border-card-border/50">
                <div className="space-y-4 max-w-2xl mx-auto">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="w-5 h-5 text-primary" />
                    <Label className="text-lg font-bold">Write Your Own (Optional)</Label>
                  </div>
                  <Textarea
                    {...register('careerGoals')}
                    placeholder="Tell us more about your specific dream career or passions..."
                    className="min-h-[140px] text-lg rounded-[2rem] border-2 p-6 focus-visible:ring-primary bg-muted/20"
                  />
                  <p className="text-sm text-foreground-muted text-center px-4">
                    Don't worry if you don't have it all figured out yet. This helps us personalize your guidance.
                  </p>
                </div>
              </div>
            </div>
          )}

          {currentStep === 5 && (
            <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="text-center space-y-4">
                <h2 className="text-5xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent pb-2">Your Interests</h2>
                <p className="text-xl text-foreground-muted">Tap a category to pick specific interests, or add your own.</p>
              </div>

              <div className="space-y-3">
                {INTEREST_CATEGORIES.map(cat => {
                  const isExpanded = selectedInterestItems.some(i => cat.items.includes(i));
                  return (
                    <div key={cat.id} className="space-y-2">
                      <button
                        type="button"
                        onClick={() => {
                          const allSelected = cat.items.every(item => selectedInterestItems.includes(item));
                          if (allSelected) {
                            setSelectedInterestItems(prev => prev.filter(i => !cat.items.includes(i)));
                          } else {
                            setSelectedInterestItems(prev => [...new Set([...prev, ...cat.items])]);
                          }
                        }}
                        className={`w-full p-4 rounded-2xl border-2 transition-all text-left font-semibold text-sm flex items-center justify-between ${isExpanded ? 'border-primary bg-primary/10 text-primary' : 'border-card-border hover:border-primary/50 bg-card/50'}`}
                      >
                        <span>{cat.label}</span>
                        <span className="text-xs font-normal text-muted-foreground">
                          {cat.items.filter(i => selectedInterestItems.includes(i)).length}/{cat.items.length}
                        </span>
                      </button>
                      {isExpanded && (
                        <div className="flex flex-wrap gap-2 pl-2 animate-in fade-in slide-in-from-top-2 duration-200">
                          {cat.items.map(item => (
                            <button
                              key={item}
                              type="button"
                              onClick={() => setSelectedInterestItems(prev => prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item])}
                              className={`px-3 py-1.5 text-xs rounded-lg border-2 transition-all ${selectedInterestItems.includes(item) ? 'border-primary bg-primary text-primary-foreground' : 'border-card-border hover:border-primary/50 bg-background/50'}`}
                            >
                              {item}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Custom Interest Input */}
              <div className="space-y-2 pt-2">
                <Label className="text-sm font-semibold">Don't see yours? Add it here.</Label>
                <div className="flex gap-2">
                  <Input
                    value={customInterest}
                    onChange={e => setCustomInterest(e.target.value)}
                    placeholder="Type your interest..."
                    className="flex-1 h-10 rounded-xl border-2"
                    onKeyDown={e => {
                      if (e.key === 'Enter' && customInterest.trim()) {
                        setSelectedInterestItems(prev => [...prev, customInterest.trim()]);
                        setCustomInterest('');
                      }
                    }}
                  />
                  <Button
                    type="button"
                    onClick={() => {
                      if (customInterest.trim()) {
                        setSelectedInterestItems(prev => [...prev, customInterest.trim()]);
                        setCustomInterest('');
                      }
                    }}
                    className="h-10 px-4 rounded-xl bg-primary"
                  >
                    Add
                  </Button>
                </div>
                {selectedInterestItems.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {selectedInterestItems.map(i => (
                      <span key={i} className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-md bg-primary/10 text-primary border border-primary/20">
                        {i}
                        <button type="button" onClick={() => setSelectedInterestItems(prev => prev.filter(x => x !== i))} className="hover:text-destructive">
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {currentStep === 6 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="text-center space-y-3">
                <h2 className="text-4xl font-extrabold tracking-tight">Your Values</h2>
                <p className="text-lg text-foreground-muted">What matters most in your future job?</p>
              </div>
              <div className="grid gap-4">
                {CAREER_VALUES.slice(0, 6).map(v => (
                  <button
                    key={v.id} type="button"
                    onClick={() => setSelectedValues(p => p.includes(v.id) ? p.filter(x => x !== v.id) : [...p, v.id])}
                    className={`p-6 rounded-3xl border-2 transition-all flex items-center gap-5 ${selectedValues.includes(v.id) ? 'border-pink-500 bg-pink-500/5 ring-1 ring-pink-500' : 'border-card-border hover:border-pink-300'}`}
                  >
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${selectedValues.includes(v.id) ? 'bg-pink-500 text-white rotate-6' : 'bg-muted text-foreground-muted'}`}>
                      <Heart className="w-7 h-7" />
                    </div>
                    <div className="text-left flex-1">
                      <p className="text-lg font-bold">{v.text}</p>
                      <p className="text-sm text-foreground-muted">{v.description}</p>
                    </div>
                    {selectedValues.includes(v.id) && <CheckCircle className="w-6 h-6 text-pink-500" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-4 pt-8">
            {currentStep > 1 && (
              <Button type="button" variant="outline" onClick={() => setCurrentStep(s => s - 1)} className="h-16 px-10 text-lg rounded-3xl border-2 hover:bg-muted font-bold">
                <ChevronLeft className="mr-2 w-5 h-5" /> Back
              </Button>
            )}
            {currentStep < 6 ? (
              <Button type="button" onClick={nextStep} className="flex-1 h-16 text-xl rounded-3xl bg-primary text-primary-foreground shadow-2xl shadow-primary/30 font-bold">
                Continue <ChevronRight className="ml-2 w-5 h-5" />
              </Button>
            ) : (
              <Button type="button" onClick={handleFinalSubmit} disabled={isLoading} className="flex-1 h-16 text-xl rounded-3xl bg-gradient-to-r from-primary via-blue-600 to-indigo-600 text-white shadow-2xl shadow-primary/40 font-bold border-none hover:opacity-90">
                {isLoading ? <><Loader2 className="mr-3 w-6 h-6 animate-spin text-white" /> Crafting Your Future...</> : <><Sparkles className="mr-3 w-6 h-6" /> Complete My Profile</>}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
