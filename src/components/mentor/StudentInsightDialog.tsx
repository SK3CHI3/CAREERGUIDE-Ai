import React, { useState, useEffect } from 'react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Loader2, Bot, Sparkles, ClipboardCopy, CheckCircle2 } from 'lucide-react'
import { aiCareerService, type UserContext } from '@/lib/ai-service'
import { dashboardService } from '@/lib/dashboard-service'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'
import type { UserProfile } from '@/types/database'

interface StudentInsightDialogProps {
    isOpen: boolean
    onClose: () => void
    studentId: string
    studentName: string
}

const StudentInsightDialog: React.FC<StudentInsightDialogProps> = ({
    isOpen,
    onClose,
    studentId,
    studentName
}) => {
    const [loading, setLoading] = useState(false)
    const [insight, setInsight] = useState<string | null>(null)
    const { toast } = useToast()
    const [copied, setCopied] = useState(false)

    useEffect(() => {
        if (isOpen && studentId && !insight) {
            generateInsight()
        }
    }, [isOpen, studentId])

    const generateInsight = async () => {
        setLoading(true)
        try {
            // 1. Fetch student profile
            const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', studentId)
                .single()

            if (profileError) throw profileError

            // Cast to UserProfile to match internal types
            const profile = profileData as unknown as UserProfile

            // 2. Calculate academic performance
            const academicPerformance = await dashboardService.calculateAcademicPerformance(studentId)

            // 3. Generate insight using AI service
            const result = await aiCareerService.generateTeacherInsights({
                name: profile.full_name || profile.name,
                schoolLevel: profile.school_level,
                currentGrade: profile.current_grade,
                subjects: profile.subjects,
                interests: profile.interests,
                assessmentResults: profile.assessment_results,
                academicPerformance: {
                    overallAverage: academicPerformance.overallAverage,
                    strongSubjects: academicPerformance.strongSubjects,
                    weakSubjects: academicPerformance.weakSubjects,
                    performanceTrend: academicPerformance.performanceTrend
                }
            })

            setInsight(result)
        } catch (error) {
            console.error('Error generating mentor insight:', error)
            toast({
                title: 'Error',
                description: 'Failed to generate AI insights. Please ensure the student has completed their profile.',
                variant: 'destructive'
            })
        } finally {
            setLoading(false)
        }
    }

    const handleCopy = () => {
        if (!insight) return
        navigator.clipboard.writeText(insight)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
        toast({
            title: 'Copied to clipboard',
            description: 'Mentorship tactics copied for your notes.'
        })
    }

    // Process insight text for basic formatting (sections)
    const renderInsight = () => {
        if (!insight) return null

        const sections = insight.split(/\n(?=[1-4]\. )/)

        return (
            <div className="space-y-6 text-foreground">
                {sections.map((section, idx) => {
                    const lines = section.split('\n')
                    const title = lines[0]
                    const body = lines.slice(1).join('\n')

                    return (
                        <div key={idx} className="bg-muted/30 rounded-xl p-4 border border-card-border/50">
                            <h4 className="text-xs font-bold text-primary uppercase tracking-widest mb-3 flex items-center gap-2">
                                <Sparkles className="w-3 h-3" />
                                {title}
                            </h4>
                            <div className="text-sm leading-relaxed whitespace-pre-wrap">
                                {body}
                            </div>
                        </div>
                    )
                })}
            </div>
        )
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col p-0 overflow-hidden bg-gradient-surface">
                <DialogHeader className="p-6 pb-2">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-gradient-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
                            <Bot className="w-6 h-6 text-primary-foreground" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl">Mentor Insight Report</DialogTitle>
                            <DialogDescription>AI-generated guidance strategies for {studentName}</DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <ScrollArea className="flex-1 px-6 py-2">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                            <p className="text-foreground-muted text-sm animate-pulse">
                                Analyzing triangulation data...
                            </p>
                        </div>
                    ) : insight ? (
                        <div className="pb-8">
                            {renderInsight()}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                            <p className="text-foreground-muted">No insights available yet.</p>
                        </div>
                    )}
                </ScrollArea>

                <div className="p-4 border-t border-card-border bg-muted/20 flex gap-3">
                    <Button variant="outline" className="flex-1" onClick={onClose}>
                        Close
                    </Button>
                    {insight && (
                        <Button
                            className="flex-1 bg-gradient-primary"
                            onClick={handleCopy}
                        >
                            {copied ? (
                                <CheckCircle2 className="w-4 h-4 mr-2" />
                            ) : (
                                <ClipboardCopy className="w-4 h-4 mr-2" />
                            )}
                            {copied ? 'Copied!' : 'Copy for Mentorship'}
                        </Button>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}

export default StudentInsightDialog
