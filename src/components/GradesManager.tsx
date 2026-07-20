import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Plus,
  Edit,
  Trash2,
  BookOpen,
  TrendingUp,
  Award,
  Calendar,
  GraduationCap,
  Target,
  BarChart3
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { dashboardService, CbeSubject } from '@/lib/dashboard-service'

const gradeSchema = z.object({
  subject_name: z.string().min(1, 'Subject is required'),
  subject_code: z.string().optional(),
  term: z.string().min(1, 'Term is required'),
  academic_year: z.string().min(1, 'Academic year is required'),
  grade_value: z.number().min(0).max(100, 'Grade must be between 0 and 100'),
  max_marks: z.number().min(1).max(1000, 'Max marks must be between 1 and 1000'),
  exam_type: z.string().min(1, 'Exam type is required'),
  teacher_comment: z.string().optional()
})

type GradeFormData = z.infer<typeof gradeSchema>

interface StudentGrade {
  id: string
  user_id: string
  subject_name: string
  subject_code?: string
  term: string
  academic_year: string
  grade_value: number
  grade_letter?: string
  max_marks: number
  exam_type: string
  teacher_comment?: string
  created_at: string
  updated_at: string
}

interface GradeCategory {
  id: string
  category_name: string
  grade_scale: Record<string, number[]>
  description: string
  is_active: boolean
}

interface AcademicTerm {
  id: string
  term_name: string
  term_order: number
  start_date?: string
  end_date?: string
  is_active: boolean
}

interface GradesManagerProps {
  onGradesUpdated?: () => void
  readOnly?: boolean
}

const GradesManager = ({ onGradesUpdated, readOnly = false }: GradesManagerProps) => {
  const { user } = useAuth()
  const [grades, setGrades] = useState<StudentGrade[]>([])
  const [subjects, setSubjects] = useState<CbeSubject[]>([])
  const [gradeCategories, setGradeCategories] = useState<GradeCategory[]>([])
  const [academicTerms, setAcademicTerms] = useState<AcademicTerm[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [editingGrade, setEditingGrade] = useState<StudentGrade | null>(null)

  const form = useForm<GradeFormData>({
    resolver: zodResolver(gradeSchema),
    defaultValues: {
      subject_name: '',
      subject_code: '',
      term: '',
      academic_year: new Date().getFullYear().toString(),
      grade_value: 0,
      max_marks: 100,
      exam_type: 'Final',
      teacher_comment: ''
    }
  })

  // Load data on component mount
  useEffect(() => {
    if (user) {
      loadGradesData()
    }
  }, [user])

  const loadGradesData = async () => {
    try {
      setIsLoading(true)
      const [gradesData, subjectsData, categoriesData, termsData] = await Promise.all([
        loadGrades(),
        dashboardService.getCbeSubjects(),
        loadGradeCategories(),
        loadAcademicTerms()
      ])

      setGrades(gradesData)
      setSubjects(subjectsData)
      setGradeCategories(categoriesData)
      setAcademicTerms(termsData)
    } catch (error) {
      console.error('Failed to load grades data:', error)
      setError('Failed to load grades data')
    } finally {
      setIsLoading(false)
    }
  }

  const loadGrades = async (): Promise<StudentGrade[]> => {
    if (!user) return []

    const { data, error } = await supabase
      .from('student_grades')
      .select('*')
      .eq('user_id', user.id)
      .order('academic_year', { ascending: false })
      .order('term', { ascending: false })
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  const loadGradeCategories = async (): Promise<GradeCategory[]> => {
    const { data, error } = await supabase
      .from('grade_categories')
      .select('*')
      .eq('is_active', true)
      .order('category_name')

    if (error) throw error
    return data || []
  }

  const loadAcademicTerms = async (): Promise<AcademicTerm[]> => {
    const { data, error } = await supabase
      .from('academic_terms')
      .select('*')
      .eq('is_active', true)
      .order('term_order')

    if (error) throw error
    return data || []
  }

  const calculateGradeLetter = (gradeValue: number, maxMarks: number = 100): string => {
    const percentage = (gradeValue / maxMarks) * 100

    if (percentage >= 80) return 'A'
    if (percentage >= 75) return 'B+'
    if (percentage >= 70) return 'B'
    if (percentage >= 65) return 'B-'
    if (percentage >= 60) return 'C+'
    if (percentage >= 55) return 'C'
    if (percentage >= 50) return 'C-'
    if (percentage >= 45) return 'D+'
    if (percentage >= 40) return 'D'
    if (percentage >= 35) return 'D-'
    return 'E'
  }

  const onSubmit = async (data: GradeFormData) => {
    if (!user) return

    try {
      setIsSubmitting(true)
      setError(null)
      setSuccess(null)

      const gradeLetter = calculateGradeLetter(data.grade_value, data.max_marks)
      const gradeData = {
        ...data,
        user_id: user.id,
        grade_letter: gradeLetter
      }

      if (editingGrade) {
        // Update existing grade
        const { error } = await supabase
          .from('student_grades')
          .update(gradeData)
          .eq('id', editingGrade.id)

        if (error) throw error
        setSuccess('Grade updated successfully!')
      } else {
        // Insert new grade
        const { error } = await supabase
          .from('student_grades')
          .insert(gradeData)

        if (error) throw error
        setSuccess('Grade added successfully!')
      }

      // Reload grades
      await loadGradesData()

      // Notify parent component that grades were updated
      if (onGradesUpdated) {
        onGradesUpdated()
      }

      // Reset form
      form.reset()
      setEditingGrade(null)

    } catch (error: unknown) {
      console.error('Failed to save grade:', error)
      setError(error instanceof Error ? error.message : 'Failed to save grade')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = (grade: StudentGrade) => {
    setEditingGrade(grade)
    form.reset({
      subject_name: grade.subject_name,
      subject_code: grade.subject_code || '',
      term: grade.term,
      academic_year: grade.academic_year,
      grade_value: grade.grade_value,
      max_marks: grade.max_marks,
      exam_type: grade.exam_type,
      teacher_comment: grade.teacher_comment || ''
    })
  }

  const handleDelete = async (gradeId: string) => {
    if (!confirm('Are you sure you want to delete this grade?')) return

    try {
      const { error } = await supabase
        .from('student_grades')
        .delete()
        .eq('id', gradeId)

      if (error) throw error

      setSuccess('Grade deleted successfully!')
      await loadGradesData()
    } catch (error: unknown) {
      console.error('Failed to delete grade:', error)
      setError(error instanceof Error ? error.message : 'Failed to delete grade')
    }
  }

  const getGradeColor = (gradeLetter: string) => {
    switch (gradeLetter) {
      case 'A': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      case 'B+': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
      case 'B': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
      case 'B-': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
      case 'C+': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
      case 'C': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
      case 'C-': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
      case 'D+': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
      case 'D': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
      case 'D-': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
      case 'E': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
    }
  }

  const calculateAverage = (term?: string, academicYear?: string) => {
    let filteredGrades = grades
    if (term) filteredGrades = filteredGrades.filter(g => g.term === term)
    if (academicYear) filteredGrades = filteredGrades.filter(g => g.academic_year === academicYear)

    if (filteredGrades.length === 0) return 0

    const total = filteredGrades.reduce((sum, grade) => sum + grade.grade_value, 0)
    return (total / filteredGrades.length).toFixed(1)
  }

  const getCurrentAcademicYear = () => {
    const currentYear = new Date().getFullYear()
    const currentMonth = new Date().getMonth()

    // If we're in the first half of the year, show previous year
    if (currentMonth < 6) {
      return (currentYear - 1).toString()
    }
    return currentYear.toString()
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, index) => (
            <Card key={index} className="p-6">
              <div className="space-y-4">
                <div className="h-6 bg-muted rounded animate-pulse"></div>
                <div className="h-8 bg-muted rounded animate-pulse"></div>
                <div className="h-4 bg-muted rounded animate-pulse w-2/3"></div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground-muted">Total Grades</p>
              <p className="text-2xl font-bold">{grades.length}</p>
            </div>
            <BookOpen className="w-8 h-8 text-blue-500" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground-muted">Current Average</p>
              <p className="text-2xl font-bold">{calculateAverage(undefined, getCurrentAcademicYear())}%</p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-500" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground-muted">Subjects Tracked</p>
              <p className="text-2xl font-bold">{new Set(grades.map(g => g.subject_name)).size}</p>
            </div>
            <GraduationCap className="w-8 h-8 text-purple-500" />
          </div>
        </Card>
      </div>

      {/* Alerts */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {success && (
        <Alert>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Main Content */}
      <Tabs defaultValue={readOnly ? "view" : "add"} className="space-y-6">
        <TabsList>
          {!readOnly && <TabsTrigger value="add">Add Grade</TabsTrigger>}
          <TabsTrigger value="view">View Grades</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Add Grade Tab */}
        <TabsContent value="add" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="w-5 h-5" />
                {editingGrade ? 'Edit Grade' : 'Add New Grade'}
              </CardTitle>
              <CardDescription>
                Record your academic performance for better career recommendations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="subject_name">Subject *</Label>
                    <Select
                      value={form.watch('subject_name')}
                      onValueChange={(value) => {
                        form.setValue('subject_name', value)
                        const subject = subjects.find(s => s.subject_name === value)
                        if (subject?.subject_code) {
                          form.setValue('subject_code', subject.subject_code)
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select subject" />
                      </SelectTrigger>
                      <SelectContent>
                        {subjects.map((subject) => (
                          <SelectItem key={subject.id} value={subject.subject_name}>
                            {subject.subject_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {form.formState.errors.subject_name && (
                      <p className="text-sm text-destructive">{form.formState.errors.subject_name.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subject_code">Subject Code</Label>
                    <Input
                      {...form.register('subject_code')}
                      placeholder="e.g., MATH, ENG"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="term">Term *</Label>
                    <Select
                      value={form.watch('term')}
                      onValueChange={(value) => form.setValue('term', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select term" />
                      </SelectTrigger>
                      <SelectContent>
                        {academicTerms.map((term) => (
                          <SelectItem key={term.id} value={term.term_name}>
                            {term.term_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {form.formState.errors.term && (
                      <p className="text-sm text-destructive">{form.formState.errors.term.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="academic_year">Academic Year *</Label>
                    <Input
                      {...form.register('academic_year')}
                      placeholder="e.g., 2024"
                      type="number"
                    />
                    {form.formState.errors.academic_year && (
                      <p className="text-sm text-destructive">{form.formState.errors.academic_year.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="grade_value">Grade/Marks *</Label>
                    <Input
                      {...form.register('grade_value', { valueAsNumber: true })}
                      placeholder="e.g., 85"
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                    />
                    {form.formState.errors.grade_value && (
                      <p className="text-sm text-destructive">{form.formState.errors.grade_value.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="max_marks">Maximum Marks</Label>
                    <Input
                      {...form.register('max_marks', { valueAsNumber: true })}
                      placeholder="e.g., 100"
                      type="number"
                      step="0.01"
                      min="1"
                      max="1000"
                    />
                    {form.formState.errors.max_marks && (
                      <p className="text-sm text-destructive">{form.formState.errors.max_marks.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="exam_type">Exam Type *</Label>
                    <Select
                      value={form.watch('exam_type')}
                      onValueChange={(value) => form.setValue('exam_type', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select exam type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Final">Final Exam</SelectItem>
                        <SelectItem value="Midterm">Midterm</SelectItem>
                        <SelectItem value="Assignment">Assignment</SelectItem>
                        <SelectItem value="Project">Project</SelectItem>
                        <SelectItem value="Quiz">Quiz</SelectItem>
                        <SelectItem value="Test">Test</SelectItem>
                      </SelectContent>
                    </Select>
                    {form.formState.errors.exam_type && (
                      <p className="text-sm text-destructive">{form.formState.errors.exam_type.message}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="teacher_comment">Mentor Comment (Optional)</Label>
                  <Textarea
                    {...form.register('teacher_comment')}
                    placeholder="Any additional comments from your mentor..."
                    rows={3}
                  />
                </div>

                <div className="flex gap-4">
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Saving...' : editingGrade ? 'Update Grade' : 'Add Grade'}
                  </Button>
                  {editingGrade && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setEditingGrade(null)
                        form.reset()
                      }}
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* View Grades Tab */}
        <TabsContent value="view" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                Your Academic Record
              </CardTitle>
              <CardDescription>
                View and manage all your recorded grades
              </CardDescription>
            </CardHeader>
            <CardContent>
              {grades.length === 0 ? (
                <div className="text-center py-8">
                  <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No grades recorded yet</p>
                  <p className="text-sm text-muted-foreground">Add your first grade to get started</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {Object.entries(
                    grades.reduce((acc, grade) => {
                      const key = `${grade.academic_year}-${grade.term}`
                      if (!acc[key]) acc[key] = []
                      acc[key].push(grade)
                      return acc
                    }, {} as Record<string, StudentGrade[]>)
                  ).map(([period, periodGrades]) => (
                    <div key={period} className="space-y-2">
                      <h3 className="text-lg font-semibold">{period.replace('-', ' ')}</h3>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Subject</TableHead>
                            <TableHead>Grade</TableHead>
                            <TableHead>Letter</TableHead>
                            <TableHead>Exam Type</TableHead>
                            <TableHead>Comment</TableHead>
                            {!readOnly && <TableHead>Actions</TableHead>}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {periodGrades.map((grade) => (
                            <TableRow key={grade.id}>
                              <TableCell>
                                <div>
                                  <p className="font-medium">{grade.subject_name}</p>
                                  {grade.subject_code && (
                                    <p className="text-sm text-muted-foreground">{grade.subject_code}</p>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div>
                                  <p className="font-medium">{grade.grade_value}</p>
                                  <p className="text-sm text-muted-foreground">/ {grade.max_marks}</p>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge className={getGradeColor(grade.grade_letter || '')}>
                                  {grade.grade_letter}
                                </Badge>
                              </TableCell>
                              <TableCell>{grade.exam_type}</TableCell>
                              <TableCell>
                                {grade.teacher_comment ? (
                                  <p className="text-sm max-w-xs truncate">{grade.teacher_comment}</p>
                                ) : (
                                  <span className="text-muted-foreground">-</span>
                                )}
                              </TableCell>
                              {!readOnly && (
                                <TableCell>
                                  <div className="flex gap-2">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleEdit(grade)}
                                    >
                                      <Edit className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleDelete(grade.id)}
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </TableCell>
                              )}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Performance by Term
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {academicTerms.map((term) => {
                    const termGrades = grades.filter(g => g.term === term.term_name)
                    const average = calculateAverage(term.term_name)
                    return (
                      <div key={term.id} className="flex items-center justify-between">
                        <span className="font-medium">{term.term_name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-2xl font-bold">{average}%</span>
                          <Badge variant="outline">{termGrades.length} grades</Badge>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Subject Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(
                    grades.reduce((acc, grade) => {
                      if (!acc[grade.subject_name]) acc[grade.subject_name] = []
                      acc[grade.subject_name].push(grade)
                      return acc
                    }, {} as Record<string, StudentGrade[]>)
                  ).map(([subject, subjectGrades]) => {
                    const average = (subjectGrades.reduce((sum, grade) => sum + grade.grade_value, 0) / subjectGrades.length).toFixed(1)
                    return (
                      <div key={subject} className="flex items-center justify-between">
                        <span className="font-medium">{subject}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-2xl font-bold">{average}%</span>
                          <Badge variant="outline">{subjectGrades.length} grades</Badge>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default GradesManager
