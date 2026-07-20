import * as XLSX from 'xlsx'
import { supabase } from './supabase'
import { aiCacheService } from './ai-cache-service'

export interface ParsedGradeRow {
    student_upi: string
    student_name?: string
    subject_name: string
    term: string
    academic_year: string
    grade_value: number
    grade_letter?: string
    max_marks?: number
    exam_type?: string
    teacher_comment?: string
    // Internal after resolution
    student_user_id?: string | null
    error?: string
}

export interface UploadValidationResult {
    valid: ParsedGradeRow[]
    invalid: ParsedGradeRow[]
    summary: {
        total: number
        validCount: number
        invalidCount: number
        errors: string[]
    }
}

export interface UploadResult {
    created: number
    updated: number
    errors: string[]
    batchId: string
}

const COLUMN_ALIASES: Record<string, string> = {
    // student name
    student_name: 'student_name',
    name: 'student_name',
    full_name: 'student_name',
    'student name': 'student_name',
    'full name': 'student_name',
    // student upi
    student_upi: 'student_upi',
    upi: 'student_upi',
    upi_number: 'student_upi',
    nemis_upi: 'student_upi',
    'nemis upi': 'student_upi',
    // subject
    subject_name: 'subject_name',
    subject: 'subject_name',
    'subject name': 'subject_name',
    // term
    term: 'term',
    semester: 'term',
    'term/semester': 'term',
    // academic year
    academic_year: 'academic_year',
    year: 'academic_year',
    'academic year': 'academic_year',
    'school year': 'academic_year',
    // grade value
    grade_value: 'grade_value',
    grade: 'grade_value',
    score: 'grade_value',
    marks: 'grade_value',
    'grade value': 'grade_value',
    // optional
    grade_letter: 'grade_letter',
    'grade letter': 'grade_letter',
    letter: 'grade_letter',
    max_marks: 'max_marks',
    'max marks': 'max_marks',
    maximum: 'max_marks',
    exam_type: 'exam_type',
    'exam type': 'exam_type',
    type: 'exam_type',
    teacher_comment: 'teacher_comment',
    comment: 'teacher_comment',
    comments: 'teacher_comment',
}

const REQUIRED_COLUMNS = ['student_upi', 'subject_name', 'term', 'grade_value']
const CURRENT_YEAR = new Date().getFullYear().toString()

class GradeUploadService {
    // ─── File Parsing ─────────────────────────────────────────────────────

    async parseFile(file: File): Promise<ParsedGradeRow[]> {
        const ext = file.name.split('.').pop()?.toLowerCase()
        if (ext === 'csv') {
            return this.parseCSV(file)
        } else if (ext === 'xlsx' || ext === 'xls') {
            return this.parseExcel(file)
        } else {
            throw new Error('Unsupported file type. Please upload a CSV or Excel (.xlsx/.xls) file.')
        }
    }

    private async parseCSV(file: File): Promise<ParsedGradeRow[]> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = (e) => {
                try {
                    const text = e.target?.result as string
                    const workbook = XLSX.read(text, { type: 'string' })
                    const worksheet = workbook.Sheets[workbook.SheetNames[0]]
                    const rawRows = XLSX.utils.sheet_to_json(worksheet, { defval: '' }) as Record<string, unknown>[]
                    resolve(this.normalizeRows(rawRows))
                } catch (err) {
                    reject(new Error('Failed to parse CSV file. Please check the format.'))
                }
            }
            reader.onerror = () => reject(new Error('Failed to read file.'))
            reader.readAsText(file)
        })
    }

    private async parseExcel(file: File): Promise<ParsedGradeRow[]> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = (e) => {
                try {
                    const data = e.target?.result as ArrayBuffer
                    const workbook = XLSX.read(data, { type: 'array' })
                    const worksheet = workbook.Sheets[workbook.SheetNames[0]]
                    const rawRows = XLSX.utils.sheet_to_json(worksheet, { defval: '' }) as Record<string, unknown>[]
                    resolve(this.normalizeRows(rawRows))
                } catch (err) {
                    reject(new Error('Failed to parse Excel file. Please check the format.'))
                }
            }
            reader.onerror = () => reject(new Error('Failed to read file.'))
            reader.readAsArrayBuffer(file)
        })
    }

    private normalizeRows(rawRows: Record<string, unknown>[]): ParsedGradeRow[] {
        return rawRows.map((row, idx) => {
            const normalized: Record<string, unknown> = {}

            // Map column headers to our canonical names
            for (const [key, value] of Object.entries(row)) {
                const canonical = COLUMN_ALIASES[key.toLowerCase().trim()]
                if (canonical) {
                    normalized[canonical] = value
                }
            }

            const gradeVal = parseFloat(String(normalized.grade_value || ''))

            return {
                student_upi: String(normalized.student_upi || '').trim().toUpperCase(),
                student_name: normalized.student_name ? String(normalized.student_name).trim() : undefined,
                subject_name: String(normalized.subject_name || '').trim(),
                term: String(normalized.term || 'Term 1').trim(),
                academic_year: String(normalized.academic_year || CURRENT_YEAR).trim(),
                grade_value: isNaN(gradeVal) ? 0 : gradeVal,
                grade_letter: normalized.grade_letter ? String(normalized.grade_letter).trim() : undefined,
                max_marks: normalized.max_marks ? parseFloat(String(normalized.max_marks)) : 100,
                exam_type: normalized.exam_type ? String(normalized.exam_type).trim() : 'End Term',
                teacher_comment: normalized.teacher_comment ? String(normalized.teacher_comment).trim() : undefined,
            } as ParsedGradeRow
        })
    }

    // ─── Validation ───────────────────────────────────────────────────────

    async validateRows(
        rows: ParsedGradeRow[],
        classStudents: { user_id: string | null; upi_number: string | null }[]
    ): Promise<UploadValidationResult> {
        const studentMap = new Map(classStudents.filter(s => s.upi_number).map((s) => [s.upi_number!, s.user_id]))
        const errors: string[] = []
        const valid: ParsedGradeRow[] = []
        const invalid: ParsedGradeRow[] = []

        rows.forEach((row, idx) => {
            const rowErrors: string[] = []
            const rowNum = idx + 2 // +2 because row 1 is header

            if (!row.student_upi) {
                rowErrors.push(`Row ${rowNum}: Missing student UPI`)
            }
            if (!row.subject_name) {
                rowErrors.push(`Row ${rowNum}: Missing subject name`)
            }
            if (!row.term) {
                rowErrors.push(`Row ${rowNum}: Missing term`)
            }
            if (isNaN(row.grade_value) || row.grade_value < 0 || row.grade_value > 100) {
                rowErrors.push(`Row ${rowNum}: Grade value must be a number between 0 and 100`)
            }

            const userId = studentMap.get(row.student_upi)
            
            // Auto-enrollment replaces strict validation checks here.

            if (rowErrors.length > 0) {
                errors.push(...rowErrors)
                invalid.push({ ...row, error: rowErrors.join('; ') })
            } else {
                valid.push({ ...row, student_user_id: userId || null })
            }
        })

        return {
            valid,
            invalid,
            summary: {
                total: rows.length,
                validCount: valid.length,
                invalidCount: invalid.length,
                errors,
            },
        }
    }

    // ─── Upload ───────────────────────────────────────────────────────────

    async uploadGrades(
        validRows: ParsedGradeRow[],
        teacherId: string,
        classId: string
    ): Promise<UploadResult> {
        const batchId = crypto.randomUUID()
        const now = new Date().toISOString()
        const errors: string[] = []
        let created = 0
        let updated = 0

        // Auto-enroll missing students
        const { classService } = await import('./class-service')
        const unEnrolledRows = validRows.filter(r => !r.student_user_id)
        const newStudentMap = new Map<string, string | null>()
        
        for (const row of unEnrolledRows) {
            if (!newStudentMap.has(row.student_upi)) {
                try {
                    const newStudent = await classService.addStudentByUPI(classId, row.student_upi, row.student_name);
                    newStudentMap.set(row.student_upi, newStudent.user_id);
                } catch (e: any) {
                    // Ignore duplicate enrollment constraint errors just in case
                    console.error("Auto-enroll error for", row.student_upi, e.message)
                    newStudentMap.set(row.student_upi, null);
                }
            }
            // Update the row with the resolved user_id
            row.student_user_id = newStudentMap.get(row.student_upi) || null;
        }

        // Process in chunks of 50
        const chunks: ParsedGradeRow[][] = []
        for (let i = 0; i < validRows.length; i += 50) {
            chunks.push(validRows.slice(i, i + 50))
        }

        for (const chunk of chunks) {
            const recordsWithId = chunk.filter(r => r.student_user_id).map((row) => ({
                user_id: row.student_user_id!,
                student_upi: row.student_upi,
                subject_name: row.subject_name,
                term: row.term,
                academic_year: row.academic_year,
                grade_value: row.grade_value,
                grade_letter: this.computeGradeLetter(row.grade_value),
                max_marks: row.max_marks ?? 100,
                exam_type: row.exam_type ?? 'End Term',
                teacher_comment: row.teacher_comment ?? null,
                source: 'teacher_upload' as const,
                upload_batch_id: batchId,
                verified_at: now,
                verified_by: teacherId,
            }))

            const recordsWithoutId = chunk.filter(r => !r.student_user_id).map((row) => ({
                student_upi: row.student_upi,
                subject_name: row.subject_name,
                term: row.term,
                academic_year: row.academic_year,
                grade_value: row.grade_value,
                grade_letter: this.computeGradeLetter(row.grade_value),
                max_marks: row.max_marks ?? 100,
                exam_type: row.exam_type ?? 'End Term',
                teacher_comment: row.teacher_comment ?? null,
                source: 'teacher_upload' as const,
                upload_batch_id: batchId,
                verified_at: now,
                verified_by: teacherId,
            }))

            if (recordsWithId.length > 0) {
                const { data, error } = await supabase
                    .from('student_grades')
                    .upsert(recordsWithId, {
                        onConflict: 'user_id,subject_name,term,academic_year,exam_type',
                        ignoreDuplicates: false,
                    })
                    .select()
                if (error) {
                    console.error('Grade upload chunk error (with ID):', error)
                    errors.push(`Batch error (with ID): ${error.message}`)
                } else {
                    created += (data || []).length
                }
            }

            if (recordsWithoutId.length > 0) {
                const { data, error } = await supabase
                    .from('student_grades')
                    .insert(recordsWithoutId)
                    .select()
                if (error) {
                    console.error('Grade upload chunk error (without ID):', error)
                    errors.push(`Batch error (without ID): ${error.message}`)
                } else {
                    created += (data || []).length
                }
            }
        }

        // Invalidate cache for all students whose grades were updated
        const uniqueUserIds = new Set(validRows.map(r => r.student_user_id).filter(Boolean))
        uniqueUserIds.forEach(id => {
            if (id) aiCacheService.invalidateCache(id, classId, 'mentor')
        })

        return { created, updated, errors, batchId }
    }

    // ─── Single Grade CRUD ────────────────────────────────────────────────

    async saveSingleGrade(
        identifier: { user_id?: string | null; upi_number?: string | null },
        teacherId: string,
        gradeData: {
            subject_name: string
            term: string
            academic_year: string
            grade_value: number
            max_marks?: number
            exam_type?: string
            teacher_comment?: string
        }
    ): Promise<void> {
        const now = new Date().toISOString()

        const payload = {
            user_id: identifier.user_id || undefined,
            student_upi: identifier.upi_number || undefined,
            subject_name: gradeData.subject_name,
            term: gradeData.term,
            academic_year: gradeData.academic_year,
            grade_value: gradeData.grade_value,
            grade_letter: this.computeGradeLetter(gradeData.grade_value),
            max_marks: gradeData.max_marks ?? 100,
            exam_type: gradeData.exam_type ?? 'End Term',
            teacher_comment: gradeData.teacher_comment ?? null,
            source: 'teacher_edit',
            verified_at: now,
            verified_by: teacherId,
        }

        if (identifier.user_id) {
            const { error } = await supabase
                .from('student_grades')
                .upsert(payload, { onConflict: 'user_id,subject_name,term,academic_year,exam_type' })
            if (error) throw new Error(error.message)
            aiCacheService.invalidateCache(identifier.user_id, teacherId, 'mentor')
        } else {
            const { error } = await supabase.from('student_grades').insert(payload)
            if (error) throw new Error(error.message)
        }
    }

    async deleteSingleGrade(gradeId: string, studentUserId?: string): Promise<void> {
        const { error } = await supabase
            .from('student_grades')
            .delete()
            .eq('id', gradeId)

        if (error) throw new Error(error.message)
        if (studentUserId) {
            aiCacheService.invalidateCache(studentUserId, 'unknown', 'student')
        }
    }

    async getStudentGradesInClass(studentUserId: string): Promise<any[]> {
        const { data, error } = await supabase
            .from('student_grades')
            .select('*')
            .eq('user_id', studentUserId)
            .order('academic_year', { ascending: false })
            .order('term', { ascending: false })

        if (error) throw new Error(error.message)
        return data || []
    }

    // ─── Template Download ─────────────────────────────────────────────────

    generateTemplate(students: { upi_number: string | null; full_name: string | null }[]): void {
        const headers = [
            'student_name',
            'student_upi',
            'subject_name',
            'term',
            'academic_year',
            'grade_value',
            'grade_letter',
            'max_marks',
            'exam_type',
            'teacher_comment',
        ]

        const sampleRows = students.length > 0
            ? students.filter(s => s.upi_number).map((s) => [
                s.full_name || '',
                s.upi_number,
                'Mathematics',
                'Term 1',
                CURRENT_YEAR,
                '',
                '',
                '100',
                'End Term',
                '',
            ])
            : [
                ['John Doe', 'A1B2C3', 'Mathematics', 'Term 1', CURRENT_YEAR, '75', 'B', '100', 'End Term', 'Good progress'],
                ['Jane Smith', 'D4E5F6', 'English', 'Term 1', CURRENT_YEAR, '82', 'A', '100', 'End Term', ''],
            ]

        if (sampleRows.length === 0) {
            sampleRows.push(['John Doe', 'A1B2C3', 'Mathematics', 'Term 1', CURRENT_YEAR, '75', 'B', '100', 'End Term', 'Good progress'])
        }

        const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleRows])
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, 'Grades')
        XLSX.writeFile(wb, 'grade_upload_template.xlsx')
    }

    // ─── Helpers ──────────────────────────────────────────────────────────

    private computeGradeLetter(value: number): string {
        if (value >= 80) return 'A'
        if (value >= 65) return 'B'
        if (value >= 50) return 'C'
        if (value >= 35) return 'D'
        return 'E'
    }
}

export const gradeUploadService = new GradeUploadService()
