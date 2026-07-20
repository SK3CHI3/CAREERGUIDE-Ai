import React, { useEffect, useState, useCallback, useRef } from 'react'
import { gradeUploadService, type ParsedGradeRow, type UploadValidationResult } from '@/lib/grade-upload-service'
import { type StudentInClass } from '@/lib/class-service'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
    Upload, FileSpreadsheet, CheckCircle2, XCircle, AlertTriangle,
    Loader2, Download, ChevronRight, RotateCcw
} from 'lucide-react'

interface Props {
    classId: string
    teacherId: string
    students: StudentInClass[]
    onUploaded: () => void
}

type WizardStep = 'select' | 'preview' | 'confirm' | 'done'

const GradeUpload: React.FC<Props> = ({ classId, teacherId, students, onUploaded }) => {
    const inputRef = useRef<HTMLInputElement>(null)
    const [step, setStep] = useState<WizardStep>('select')
    const [file, setFile] = useState<File | null>(null)
    const [parsing, setParsing] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [parseError, setParseError] = useState<string | null>(null)
    const [validation, setValidation] = useState<UploadValidationResult | null>(null)
    const [uploadResult, setUploadResult] = useState<{ created: number; errors: string[] } | null>(null)

    const handleFileSelect = async (f: File) => {
        setFile(f)
        setParseError(null)
        setParsing(true)
        try {
            const rows = await gradeUploadService.parseFile(f)
            const result = await gradeUploadService.validateRows(rows, students)
            setValidation(result)
            setStep('preview')
        } catch (err) {
            setParseError(err instanceof Error ? err.message : 'Failed to parse file')
        } finally {
            setParsing(false)
        }
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        const dropped = e.dataTransfer.files[0]
        if (dropped) handleFileSelect(dropped)
    }

    const handleUpload = async () => {
        if (!validation || validation.valid.length === 0) return
        setUploading(true)
        try {
            const result = await gradeUploadService.uploadGrades(validation.valid, teacherId, classId)
            setUploadResult({ created: result.created, errors: result.errors })
            setStep('done')
            onUploaded()
        } catch (err) {
            setUploadResult({ created: 0, errors: [err instanceof Error ? err.message : 'Upload failed'] })
            setStep('done')
        } finally {
            setUploading(false)
        }
    }

    const reset = () => {
        setStep('select')
        setFile(null)
        setValidation(null)
        setParseError(null)
        setUploadResult(null)
    }

    const downloadTemplate = () => {
        gradeUploadService.generateTemplate(students.map((s) => ({ upi_number: s.upi_number, full_name: s.full_name })))
    }

    return (
        <div className="space-y-4">
            {/* Step indicator */}
            <div className="flex items-center gap-2 text-xs text-foreground-muted">
                {(['select', 'preview', 'confirm', 'done'] as WizardStep[]).map((s, i) => (
                    <React.Fragment key={s}>
                        <span className={`font-medium capitalize ${step === s ? 'text-primary' : ''}`}>{s}</span>
                        {i < 3 && <ChevronRight className="w-3 h-3" />}
                    </React.Fragment>
                ))}
            </div>

            {/* STEP 1: Select file */}
            {step === 'select' && (
                <div className="space-y-4">
                    <div
                        className="border-2 border-dashed border-card-border rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
                        onDrop={handleDrop}
                        onDragOver={(e) => e.preventDefault()}
                        onClick={() => inputRef.current?.click()}
                    >
                        {parsing ? (
                            <div className="space-y-2">
                                <Loader2 className="w-10 h-10 text-primary mx-auto animate-spin" />
                                <p className="text-sm text-foreground-muted">Parsing file...</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <FileSpreadsheet className="w-10 h-10 text-foreground-muted mx-auto" />
                                <div>
                                    <p className="font-medium text-foreground">Drop your file here or click to browse</p>
                                    <p className="text-sm text-foreground-muted mt-1">Supports CSV and Excel (.xlsx, .xls)</p>
                                </div>
                                <Button size="sm" variant="outline">
                                    <Upload className="mr-2 w-4 h-4" /> Choose File
                                </Button>
                            </div>
                        )}
                        <input
                            ref={inputRef}
                            type="file"
                            accept=".csv,.xlsx,.xls"
                            className="hidden"
                            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileSelect(f) }}
                        />
                    </div>

                    {parseError && (
                        <div className="flex items-start gap-2 p-3 bg-destructive/10 rounded-lg text-destructive text-sm">
                            <XCircle className="w-4 h-4 mt-0.5 shrink-0" />{parseError}
                        </div>
                    )}

                    <div className="flex justify-between items-center pt-1">
                        <Button variant="ghost" size="sm" onClick={downloadTemplate} className="text-xs gap-1">
                            <Download className="w-3.5 h-3.5" /> Download Template
                        </Button>
                        <p className="text-xs text-foreground-muted">
                            Required columns: student_upi, subject_name, term, grade_value. Optional: student_name
                        </p>
                    </div>
                </div>
            )}

            {/* STEP 2: Preview */}
            {step === 'preview' && validation && (
                <div className="space-y-4">
                    {/* Summary badges */}
                    <div className="flex gap-3 flex-wrap">
                        <Badge variant="secondary">{validation.summary.total} rows total</Badge>
                        <Badge className="bg-green-500/10 text-green-700 border-green-200">
                            <CheckCircle2 className="mr-1 w-3 h-3" /> {validation.summary.validCount} valid
                        </Badge>
                        {validation.summary.invalidCount > 0 && (
                            <Badge className="bg-destructive/10 text-destructive border-destructive/20">
                                <XCircle className="mr-1 w-3 h-3" /> {validation.summary.invalidCount} errors
                            </Badge>
                        )}
                    </div>

                    {/* Error list */}
                    {validation.summary.errors.length > 0 && (
                        <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-3 space-y-1 max-h-36 overflow-y-auto">
                            <p className="text-xs font-semibold text-destructive flex items-center gap-1">
                                <AlertTriangle className="w-3.5 h-3.5" /> Errors to fix:
                            </p>
                            {validation.summary.errors.map((e, i) => (
                                <p key={i} className="text-xs text-destructive">{e}</p>
                            ))}
                        </div>
                    )}

                    {/* Valid rows preview table */}
                    {validation.valid.length > 0 && (
                        <div className="overflow-x-auto max-h-60 border border-card-border rounded-lg">
                            <table className="w-full text-xs">
                                <thead className="bg-muted/50 sticky top-0">
                                    <tr>
                                        {['Email', 'Subject', 'Term', 'Year', 'Grade'].map((h) => (
                                            <th key={h} className="text-left px-3 py-2 text-foreground-muted font-medium">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {validation.valid.slice(0, 50).map((row, i) => (
                                        <tr key={i} className="border-t border-card-border">
                                            <td className="px-3 py-2 text-foreground">{row.student_upi}</td>
                                            <td className="px-3 py-2 text-foreground">{row.subject_name}</td>
                                            <td className="px-3 py-2 text-foreground">{row.term}</td>
                                            <td className="px-3 py-2 text-foreground">{row.academic_year}</td>
                                            <td className="px-3 py-2 font-bold text-foreground">{row.grade_value}</td>
                                        </tr>
                                    ))}
                                    {validation.valid.length > 50 && (
                                        <tr><td colSpan={5} className="px-3 py-2 text-foreground-muted text-center">…and {validation.valid.length - 50} more</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}

                    <div className="flex gap-3">
                        <Button variant="outline" className="flex-1" onClick={reset}>
                            <RotateCcw className="mr-2 w-4 h-4" /> Choose Different File
                        </Button>
                        <Button
                            className="flex-1 bg-gradient-primary"
                            disabled={validation.valid.length === 0}
                            onClick={() => setStep('confirm')}
                        >
                            Continue ({validation.valid.length} rows) <ChevronRight className="ml-1 w-4 h-4" />
                        </Button>
                    </div>
                </div>
            )}

            {/* STEP 3: Confirm */}
            {step === 'confirm' && validation && (
                <div className="space-y-4">
                    <div className="rounded-xl bg-muted/40 border border-card-border p-4 space-y-3 text-sm">
                        <div className="flex justify-between">
                            <span className="text-foreground-muted">File</span>
                            <span className="font-medium">{file?.name}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-foreground-muted">Rows to upload</span>
                            <span className="font-bold text-green-600">{validation.valid.length}</span>
                        </div>
                        {validation.summary.invalidCount > 0 && (
                            <div className="flex justify-between">
                                <span className="text-foreground-muted">Rows skipped (errors)</span>
                                <span className="font-medium text-destructive">{validation.summary.invalidCount}</span>
                            </div>
                        )}
                        <div className="flex justify-between">
                            <span className="text-foreground-muted">Source tag</span>
                            <Badge variant="secondary" className="font-mono text-xs">teacher_upload</Badge>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <Button variant="outline" className="flex-1" onClick={() => setStep('preview')}>Back</Button>
                        <Button
                            className="flex-1 bg-gradient-primary"
                            onClick={handleUpload}
                            disabled={uploading}
                        >
                            {uploading
                                ? <><Loader2 className="mr-2 w-4 h-4 animate-spin" /> Uploading...</>
                                : <><Upload className="mr-2 w-4 h-4" /> Upload Grades</>}
                        </Button>
                    </div>
                </div>
            )}

            {/* STEP 4: Done */}
            {step === 'done' && uploadResult && (
                <div className="text-center space-y-4 py-4">
                    {uploadResult.errors.length === 0 ? (
                        <div className="w-14 h-14 bg-green-500/10 rounded-2xl flex items-center justify-center mx-auto">
                            <CheckCircle2 className="w-7 h-7 text-green-500" />
                        </div>
                    ) : (
                        <div className="w-14 h-14 bg-amber-500/10 rounded-2xl flex items-center justify-center mx-auto">
                            <AlertTriangle className="w-7 h-7 text-amber-500" />
                        </div>
                    )}
                    <div>
                        <p className="font-bold text-foreground text-lg">{uploadResult.created} grades uploaded</p>
                        {uploadResult.errors.length > 0 && (
                            <p className="text-sm text-destructive mt-1">{uploadResult.errors.join(', ')}</p>
                        )}
                    </div>
                    <Button className="w-full" onClick={reset}>Upload Another File</Button>
                </div>
            )}
        </div>
    )
}

export default GradeUpload
