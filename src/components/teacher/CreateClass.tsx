import React, { useState } from 'react'
import { classService } from '@/lib/class-service'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Plus, Loader2 } from 'lucide-react'

const GRADE_LEVELS = [
    'Grade 7', 'Grade 8', 'Grade 9',
    'Grade 10', 'Grade 11', 'Grade 12',
]
const CURRENT_YEAR = new Date().getFullYear()
const ACADEMIC_YEARS = [
    `${CURRENT_YEAR}`,
    `${CURRENT_YEAR - 1}`,
    `${CURRENT_YEAR + 1}`,
]

interface Props {
    teacherId: string
    onCreated: () => void
}

const CreateClass: React.FC<Props> = ({ teacherId, onCreated }) => {
    const [open, setOpen] = useState(false)
    const [name, setName] = useState('')
    const [gradeLevel, setGradeLevel] = useState('')
    const [academicYear, setAcademicYear] = useState(CURRENT_YEAR.toString())
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleCreate = async () => {
        if (!name.trim() || !gradeLevel) return
        setLoading(true)
        setError(null)
        try {
            await classService.createClass(teacherId, name.trim(), gradeLevel, academicYear)
            setOpen(false)
            setName('')
            setGradeLevel('')
            onCreated()
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create class')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-gradient-primary">
                    <Plus className="mr-2 w-4 h-4" /> Create Class
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Create a New Class</DialogTitle>
                    <DialogDescription>Set up a class to manage students and upload grades.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 pt-2">
                    <div className="space-y-2">
                        <Label htmlFor="class-name">Class Name *</Label>
                        <Input
                            id="class-name"
                            placeholder="e.g. 8A, Grade 9 Science, Form 3 East"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Grade Level *</Label>
                        <Select value={gradeLevel} onValueChange={setGradeLevel}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select grade" />
                            </SelectTrigger>
                            <SelectContent>
                                {GRADE_LEVELS.map((g) => (
                                    <SelectItem key={g} value={g}>{g}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Academic Year *</Label>
                        <Select value={academicYear} onValueChange={setAcademicYear}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {ACADEMIC_YEARS.map((y) => (
                                    <SelectItem key={y} value={y}>{y}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    {error && <p className="text-sm text-destructive">{error}</p>}
                    <div className="flex gap-3">
                        <Button variant="outline" className="flex-1" onClick={() => setOpen(false)}>Cancel</Button>
                        <Button
                            className="flex-1 bg-gradient-primary"
                            disabled={!name.trim() || !gradeLevel || loading}
                            onClick={handleCreate}
                        >
                            {loading ? <><Loader2 className="mr-2 w-4 h-4 animate-spin" /> Creating...</> : 'Create Class'}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}

export default CreateClass
