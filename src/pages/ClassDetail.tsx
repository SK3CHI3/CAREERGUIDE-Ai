import React, { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { classService, type ClassRecord, type StudentInClass } from '@/lib/class-service'
import { gradeUploadService } from '@/lib/grade-upload-service'
import GradeUpload from '@/components/mentor/GradeUpload'
import StudentInsightDialog from '@/components/mentor/StudentInsightDialog'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
    ArrowLeft, Users, Upload, UserPlus, Trash2,
    CheckCircle2, FileSpreadsheet, PencilLine,
    BookOpen, RefreshCw, AlertCircle, Sparkles, Search
} from 'lucide-react'
import BrandedLoader from '@/components/BrandedLoader'
import { useToast } from '@/hooks/use-toast'
import { ThemeToggle } from '@/components/ThemeToggle'

const TERMS = ['Term 1', 'Term 2', 'Term 3']
const EXAM_TYPES = ['End Term', 'Mid Term', 'CAT', 'Mock', 'KCPE/KCSE']
const CURRENT_YEAR = new Date().getFullYear().toString()

const ClassDetail: React.FC = () => {
    const { classId } = useParams<{ classId: string }>()
    const navigate = useNavigate()
    const { user } = useAuth()
    const { toast } = useToast()

    const [cls, setCls] = useState<ClassRecord | null>(null)
    const [students, setStudents] = useState<StudentInClass[]>([])
    const [grades, setGrades] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    // Parse initial tab from URL if present
    const searchParams = new URLSearchParams(window.location.search)
    const initialTab = searchParams.get('tab') || 'students'
    const [activeTab, setActiveTab] = useState(initialTab)

    const [studentSearch, setStudentSearch] = useState('')
    const [gradeSearch, setGradeSearch] = useState('')

    // Add student state
    const [addUpi, setAddUpi] = useState('')
    const [addName, setAddName] = useState('')
    const [addLoading, setAddLoading] = useState(false)
    const [addError, setAddError] = useState<string | null>(null)

    // Single grade entry state
    const [gradeDialogOpen, setGradeDialogOpen] = useState(false)
    const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null)
    const [selectedStudentUpi, setSelectedStudentUpi] = useState<string | null>(null)
    const [selectedStudentName, setSelectedStudentName] = useState('')
    const [gradeForm, setGradeForm] = useState({
        subject_name: '',
        term: 'Term 1',
        academic_year: CURRENT_YEAR,
        grade_value: '',
        max_marks: '100',
        exam_type: 'End Term',
        teacher_comment: '',
    })
    const [gradeLoading, setGradeLoading] = useState(false)
    const [editingGradeId, setEditingGradeId] = useState<string | null>(null)

    // AI Insight state
    const [insightDialogOpen, setInsightDialogOpen] = useState(false)
    const [insightStudentId, setInsightStudentId] = useState('')
    const [insightStudentName, setInsightStudentName] = useState('')

    const loadData = useCallback(async () => {
        if (!classId) return
        setLoading(true)
        try {
            const [classData, studentList, gradeList] = await Promise.allSettled([
                classService.getClassById(classId),
                classService.getClassStudents(classId),
                classService.getClassGrades(classId),
            ])
            if (classData.status === 'fulfilled') setCls(classData.value)
            if (studentList.status === 'fulfilled') setStudents(studentList.value)
            if (gradeList.status === 'fulfilled') setGrades(gradeList.value)
        } finally {
            setLoading(false)
        }
    }, [classId])

    useEffect(() => { loadData() }, [loadData])

    const initials = (name: string | null) =>
        name ? name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2) : '?'

    const handleAddStudent = async () => {
        if (!classId || !addUpi.trim()) return
        setAddLoading(true)
        setAddError(null)
        try {
            await classService.addStudentByUPI(classId, addUpi.trim(), addName.trim() || undefined)
            setAddUpi('')
            setAddName('')
            toast({ title: 'Student added', description: `${addUpi.toUpperCase()} enrolled in class.` })
            loadData()
        } catch (err) {
            setAddError(err instanceof Error ? err.message : 'Failed to add student')
        } finally {
            setAddLoading(false)
        }
    }

    const handleRemoveStudent = async (enrollmentId: string, name: string) => {
        if (!classId) return
        if (!window.confirm(`Remove ${name} from this class?`)) return
        try {
            await classService.removeStudent(enrollmentId)
            toast({ title: 'Student removed' })
            loadData()
        } catch (err) {
            toast({ title: 'Error', description: err instanceof Error ? err.message : 'Failed to remove', variant: 'destructive' })
        }
    }

    const openGradeDialog = (student: StudentInClass) => {
        setSelectedStudentId(student.user_id || null)
        setSelectedStudentUpi(student.upi_number || null)
        setSelectedStudentName(student.full_name ?? student.upi_number ?? student.email ?? 'Unknown')
        setGradeForm({ subject_name: '', term: 'Term 1', academic_year: CURRENT_YEAR, grade_value: '', max_marks: '100', exam_type: 'End Term', teacher_comment: '' })
        setEditingGradeId(null)
        setGradeDialogOpen(true)
    }

    const openInsightDialog = (student: StudentInClass) => {
        if (!student.user_id) {
            toast({ title: 'AI Insights not available', description: 'This student has not created an account yet. Insights are generated once they complete their profile.', variant: 'destructive' })
            return
        }
        setInsightStudentId(student.user_id)
        setInsightStudentName(student.full_name ?? student.upi_number ?? student.email ?? 'Unknown Student')
        setInsightDialogOpen(true)
    }

    const openEditGrade = (grade: any) => {
        setSelectedStudentId(grade.user_id || null)
        setSelectedStudentUpi(grade.student_upi || null)
        setSelectedStudentName(grade.profiles?.full_name ?? grade.student_upi ?? grade.profiles?.email ?? '')
        setGradeForm({
            subject_name: grade.subject_name,
            term: grade.term,
            academic_year: grade.academic_year,
            grade_value: String(grade.grade_value),
            max_marks: String(grade.max_marks ?? 100),
            exam_type: grade.exam_type ?? 'End Term',
            teacher_comment: grade.teacher_comment ?? '',
        })
        setEditingGradeId(grade.id)
        setGradeDialogOpen(true)
    }

    const handleSaveGrade = async () => {
        if (!user) return
        setGradeLoading(true)
        try {
            await gradeUploadService.saveSingleGrade(
                { user_id: selectedStudentId || null, upi_number: selectedStudentUpi || null },
                user.id,
                {
                subject_name: gradeForm.subject_name,
                term: gradeForm.term,
                academic_year: gradeForm.academic_year,
                grade_value: parseFloat(gradeForm.grade_value),
                max_marks: parseFloat(gradeForm.max_marks),
                exam_type: gradeForm.exam_type,
                teacher_comment: gradeForm.teacher_comment || undefined,
            })
            setGradeDialogOpen(false)
            toast({ title: editingGradeId ? 'Grade updated' : 'Grade saved' })
            loadData()
        } catch (err) {
            toast({ title: 'Error', description: err instanceof Error ? err.message : 'Failed to save grade', variant: 'destructive' })
        } finally {
            setGradeLoading(false)
        }
    }

    const handleDeleteGrade = async (gradeId: string) => {
        if (!window.confirm('Delete this grade permanently?')) return
        try {
            await gradeUploadService.deleteSingleGrade(gradeId)
            toast({ title: 'Grade deleted' })
            loadData()
        } catch (err) {
            toast({ title: 'Error', description: err instanceof Error ? err.message : 'Failed to delete', variant: 'destructive' })
        }
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
                <BrandedLoader size="lg" />
            </div>
        )
    }

    if (!cls) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--gradient-homepage)' }}>
                <div className="text-center">
                    <AlertCircle className="w-10 h-10 text-destructive mx-auto mb-3" />
                    <p className="text-foreground">Class not found.</p>
                    <Button variant="outline" className="mt-4" onClick={() => navigate('/mentor')}>Back to Dashboard</Button>
                </div>
            </div>
        )
    }

    const filteredStudents = students.filter(s =>
        (s.full_name || '').toLowerCase().includes(studentSearch.toLowerCase()) ||
        (s.upi_number || '').toLowerCase().includes(studentSearch.toLowerCase())
    )

    const filteredGrades = grades.filter(g =>
        (g.profiles?.full_name || '').toLowerCase().includes(gradeSearch.toLowerCase()) ||
        (g.student_upi || '').toLowerCase().includes(gradeSearch.toLowerCase()) ||
        (g.subject_name || '').toLowerCase().includes(gradeSearch.toLowerCase())
    )

    return (
        <div className="min-h-screen" style={{ background: 'var(--gradient-homepage)' }}>
            {/* Header */}
            <header className="border-b border-card-border bg-background/80 backdrop-blur-md sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center gap-4 h-16">
                        <Button variant="ghost" size="icon" onClick={() => navigate('/mentor')}>
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                        <div className="flex items-center gap-2">
                            <img
                                src="/logos/CareerGuide_Logo.webp"
                                alt="CareerGuide AI"
                                className="h-10 w-auto"
                            />
                        </div>
                        <span className="text-foreground-muted">·</span>
                        <div>
                            <span className="font-semibold text-foreground">{cls.name}</span>
                            <span className="text-foreground-muted text-sm ml-2">{cls.grade_level} · {cls.academic_year}</span>
                        </div>
                        <div className="ml-auto flex gap-2 items-center">
                            <ThemeToggle />
                            <Button variant="ghost" size="icon" onClick={loadData} title="Refresh">
                                <RefreshCw className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="mb-6">
                        <TabsTrigger value="students" className="flex items-center gap-2">
                            <Users className="w-4 h-4" /> Students ({students.length})
                        </TabsTrigger>
                        <TabsTrigger value="grades" className="flex items-center gap-2">
                            <BookOpen className="w-4 h-4" /> Grades ({grades.length})
                        </TabsTrigger>
                        <TabsTrigger value="upload" className="flex items-center gap-2">
                            <FileSpreadsheet className="w-4 h-4" /> Bulk Upload
                        </TabsTrigger>
                    </TabsList>

                    {/* ── STUDENTS TAB ── */}
                    <TabsContent value="students" className="space-y-4">
                        {/* Add student */}
                        <Card className="bg-gradient-surface border-card-border">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <UserPlus className="w-4 h-4 text-primary" /> Add Student
                                </CardTitle>
                                <CardDescription>Add a student to this class by their NEMIS UPI number</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-col sm:flex-row gap-3">
                                    <Input
                                        placeholder="Name (optional)"
                                        value={addName}
                                        onChange={(e) => setAddName(e.target.value)}
                                        className="sm:w-1/3"
                                    />
                                    <Input
                                        placeholder="UPI e.g. XXX8TXY1"
                                        value={addUpi}
                                        onChange={(e) => setAddUpi(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleAddStudent()}
                                        className="flex-1 uppercase"
                                    />
                                    <Button onClick={handleAddStudent} disabled={!addUpi.trim() || addLoading} className="bg-gradient-primary">
                                        {addLoading ? <BrandedLoader size="xs" showText={false} className="mr-0" /> : <UserPlus className="w-4 h-4" />}
                                    </Button>
                                </div>
                                {addError && <p className="text-sm text-destructive mt-2">{addError}</p>}
                            </CardContent>
                        </Card>

                        {/* Student roster */}
                        <Card className="bg-gradient-surface border-card-border">
                            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                <CardTitle className="flex items-center gap-2 text-base shrink-0">
                                    <Users className="w-4 h-4 text-primary" /> Student Roster
                                </CardTitle>
                                <div className="relative w-full sm:w-64">
                                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-foreground-muted" />
                                    <Input
                                        placeholder="Search by name or UPI..."
                                        className="pl-9 h-9 text-sm"
                                        value={studentSearch}
                                        onChange={(e) => setStudentSearch(e.target.value)}
                                    />
                                </div>
                            </CardHeader>
                            <CardContent>
                                {filteredStudents.length === 0 ? (
                                    <div className="text-center py-8">
                                        <Users className="w-10 h-10 text-foreground-muted mx-auto mb-3" />
                                        <p className="text-foreground-muted text-sm">No students found. Add students above or use bulk upload.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {filteredStudents.map((s) => (
                                            <div key={s.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-card-border">
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="w-8 h-8">
                                                        <AvatarFallback className="text-xs">{initials(s.full_name)}</AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <p className="text-sm font-medium text-foreground">{s.full_name ?? s.upi_number}</p>
                                                        <p className="text-xs text-foreground-muted">{s.upi_number}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Badge variant="outline" className="text-xs">{s.source}</Badge>
                                                    <Button
                                                        variant="default"
                                                        size="sm"
                                                        className="gap-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md disabled:opacity-50 disabled:shadow-none"
                                                        onClick={() => openInsightDialog(s)}
                                                        disabled={!s.user_id}
                                                    >
                                                        <Sparkles className="w-3.5 h-3.5" /> Insights
                                                    </Button>
                                                    <Button variant="ghost" size="sm" className="gap-1 text-foreground-muted" onClick={() => openGradeDialog(s)}>
                                                        <PencilLine className="w-3.5 h-3.5" /> Add Grade
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="w-8 h-8 text-destructive" onClick={() => handleRemoveStudent(s.id, s.full_name ?? s.upi_number ?? '')}>
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* ── GRADES TAB ── */}
                    <TabsContent value="grades">
                        <Card className="bg-gradient-surface border-card-border">
                            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                <div>
                                    <CardTitle className="flex items-center gap-2 text-base">
                                        <BookOpen className="w-4 h-4 text-primary" /> Grade Records
                                    </CardTitle>
                                    <CardDescription>All grades for students in this class</CardDescription>
                                </div>
                                <div className="relative w-full sm:w-64">
                                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-foreground-muted" />
                                    <Input
                                        placeholder="Search by student, subject..."
                                        className="pl-9 h-9 text-sm"
                                        value={gradeSearch}
                                        onChange={(e) => setGradeSearch(e.target.value)}
                                    />
                                </div>
                            </CardHeader>
                            <CardContent>
                                {filteredGrades.length === 0 ? (
                                    <div className="text-center py-8">
                                        <BookOpen className="w-10 h-10 text-foreground-muted mx-auto mb-3" />
                                        <p className="text-foreground-muted text-sm">No grades found. Use Bulk Upload to add grades.</p>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="border-b border-card-border text-left">
                                                    {['Student', 'Subject', 'Term', 'Year', 'Grade', 'Source', ''].map((h) => (
                                                        <th key={h} className="pb-3 pr-4 text-xs text-foreground-muted font-medium">{h}</th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {filteredGrades.map((g) => (
                                                    <tr key={g.id} className="border-b border-card-border/50 hover:bg-muted/20 transition-colors">
                                                        <td className="py-2.5 pr-4">
                                                            <p className="font-medium">
                                                                {(() => {
                                                                    const student = students.find(s => s.upi_number === g.student_upi || (g.user_id && s.user_id === g.user_id));
                                                                    return student?.full_name ?? g.profiles?.full_name ?? g.student_upi ?? g.student_phone ?? '—';
                                                                })()}
                                                            </p>
                                                            <p className="text-xs text-foreground-muted">{g.student_upi || g.student_phone || g.profiles?.phone}</p>
                                                        </td>
                                                        <td className="py-2.5 pr-4 text-foreground">{g.subject_name}</td>
                                                        <td className="py-2.5 pr-4 text-foreground">{g.term}</td>
                                                        <td className="py-2.5 pr-4 text-foreground">{g.academic_year}</td>
                                                        <td className="py-2.5 pr-4">
                                                            <span className="font-bold text-foreground">{g.grade_value}</span>
                                                            <span className="text-foreground-muted text-xs ml-1">/ {g.max_marks ?? 100}</span>
                                                        </td>
                                                        <td className="py-2.5 pr-4">
                                                            <Badge variant={g.source === 'teacher_upload' ? 'secondary' : 'outline'} className="text-xs">
                                                                {g.source}
                                                            </Badge>
                                                        </td>
                                                        <td className="py-2.5">
                                                            <div className="flex items-center gap-1">
                                                                <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => openEditGrade(g)}>
                                                                    <PencilLine className="w-3.5 h-3.5" />
                                                                </Button>
                                                                <Button variant="ghost" size="icon" className="w-7 h-7 text-destructive" onClick={() => handleDeleteGrade(g.id)}>
                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                </Button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* ── BULK UPLOAD TAB ── */}
                    <TabsContent value="upload">
                        <Card className="bg-gradient-surface border-card-border">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <FileSpreadsheet className="w-4 h-4 text-primary" /> Bulk Grade Upload
                                </CardTitle>
                                <CardDescription>Upload a CSV or Excel file to add grades for all students at once</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {user && (
                                    <GradeUpload
                                        classId={cls.id}
                                        teacherId={user.id}
                                        students={students}
                                        onUploaded={() => { loadData(); setActiveTab('grades') }}
                                    />
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </main>

            {/* Single grade entry/edit dialog */}
            <Dialog open={gradeDialogOpen} onOpenChange={setGradeDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>{editingGradeId ? 'Edit Grade' : 'Add Grade'}</DialogTitle>
                        <DialogDescription>
                            {editingGradeId ? 'Update' : 'Enter'} grade for <strong>{selectedStudentName}</strong>
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 pt-2">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Subject *</Label>
                                <Input
                                    placeholder="e.g. Mathematics"
                                    value={gradeForm.subject_name}
                                    onChange={(e) => setGradeForm((f) => ({ ...f, subject_name: e.target.value }))}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Exam Type</Label>
                                <Select value={gradeForm.exam_type} onValueChange={(v) => setGradeForm((f) => ({ ...f, exam_type: v }))}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {EXAM_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Term *</Label>
                                <Select value={gradeForm.term} onValueChange={(v) => setGradeForm((f) => ({ ...f, term: v }))}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {TERMS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Academic Year *</Label>
                                <Input
                                    value={gradeForm.academic_year}
                                    onChange={(e) => setGradeForm((f) => ({ ...f, academic_year: e.target.value }))}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Grade (score) *</Label>
                                <Input
                                    type="number" min="0" max="100"
                                    placeholder="e.g. 78"
                                    value={gradeForm.grade_value}
                                    onChange={(e) => setGradeForm((f) => ({ ...f, grade_value: e.target.value }))}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Max Marks</Label>
                                <Input
                                    type="number" min="1"
                                    value={gradeForm.max_marks}
                                    onChange={(e) => setGradeForm((f) => ({ ...f, max_marks: e.target.value }))}
                                />
                            </div>
                            <div className="col-span-2 space-y-2">
                                <Label>Mentor Comment (optional)</Label>
                                <Textarea
                                    placeholder="e.g. Great improvement this term"
                                    value={gradeForm.teacher_comment}
                                    onChange={(e) => setGradeForm((f) => ({ ...f, teacher_comment: e.target.value }))}
                                    rows={2}
                                />
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <Button variant="outline" className="flex-1" onClick={() => setGradeDialogOpen(false)}>Cancel</Button>
                            <Button
                                className="flex-1 bg-gradient-primary"
                                disabled={!gradeForm.subject_name || !gradeForm.grade_value || gradeLoading}
                                onClick={handleSaveGrade}
                            >
                                {gradeLoading ? <BrandedLoader size="xs" showText={false} className="mr-0" /> : editingGradeId ? 'Update Grade' : 'Save Grade'}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <StudentInsightDialog
                isOpen={insightDialogOpen}
                onClose={() => setInsightDialogOpen(false)}
                studentId={insightStudentId}
                studentName={insightStudentName}
            />
        </div>
    )
}

export default ClassDetail
