import { useState, useRef, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Sparkles, Download, ArrowRight, ArrowLeft, CheckCircle, Brain, Target, User, Heart, Compass, ShieldAlert, Rocket, Lock, Zap, GraduationCap } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import BrandedLoader from "@/components/BrandedLoader";
import ReportPaywall from "@/components/ReportPaywall";
import { aiCareerService } from "@/lib/ai-service";
import { ReportGenerator, type GuestProfile, type CareerRecommendation } from "@/lib/report-generator";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import BackgroundGradient from "@/components/BackgroundGradient";
import { RIASEC_ACTIVITIES, RIASEC_LABELS } from "@/data/riasec-assessment";

const QuickAssessment = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const targetCareer = searchParams.get('career');
    const isCareerFitMode = !!targetCareer;

    const paywallRef = useRef<any>(null);
    const [currentStep, setCurrentStep] = useState(1);
    const [subStep, setSubStep] = useState(1); // For Phase 1 sub-steps
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showReport, setShowReport] = useState(false);

    // Phase 1: Academics
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [curriculum, setCurriculum] = useState<'cbc' | 'igcse' | 'legacy' | null>(null);
    const [grade, setGrade] = useState("");
    const [pathway, setPathway] = useState<'stem' | 'arts' | 'social' | 'techvoc' | null>(null);
    const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
    const [subjectGrades, setSubjectGrades] = useState<Record<string, string>>({
        'Mathematics': '',
        'English': '',
        'Kiswahili': ''
    });

    // Phase 2: RIASEC
    const [selectedActivities, setSelectedActivities] = useState<string[]>([]);

    // Phase 3: Values & Work Style
    const [selectedValues, setSelectedValues] = useState<string[]>([]);
    const [workStyle, setWorkStyle] = useState("");

    // Phase 4: MBTI
    const [mbtiEnergy, setMbtiEnergy] = useState("");
    const [mbtiDecisions, setMbtiDecisions] = useState("");
    const [mbtiStructure, setMbtiStructure] = useState("");

    // Phase 5: Reality
    const [barrier, setBarrier] = useState("");
    const [experience, setExperience] = useState("");

    // Phase 6: Readiness
    const [readiness, setReadiness] = useState("");
    const [finalRecommendations, setFinalRecommendations] = useState<CareerRecommendation[]>([]);
    const [guestProfile, setGuestProfile] = useState<GuestProfile>({});

    // LOAD PERSISTENCE
    useEffect(() => {
        const saved = localStorage.getItem('career_assessment_state');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                // Only restore if it's less than 2 hours old
                if (Date.now() - parsed.timestamp < 7200000) {
                    // Simplified restoration for critical fields
                    if (parsed.name) setName(parsed.name);
                    if (parsed.email) setEmail(parsed.email);
                    if (parsed.curriculum) setCurriculum(parsed.curriculum);
                    if (parsed.grade) setGrade(parsed.grade);
                    if (parsed.subjectGrades) setSubjectGrades(parsed.subjectGrades);
                    if (parsed.step) setCurrentStep(parsed.step);
                }
            } catch (e) {
                console.error("Failed to restore assessment state");
            }
        }
    }, []);

    // SAVE PERSISTENCE
    useEffect(() => {
        if (currentStep > 1 && currentStep < 7) {
            localStorage.setItem('career_assessment_state', JSON.stringify({
                name, email, curriculum, grade, subjectGrades, step: currentStep, timestamp: Date.now()
            }));
        }
    }, [currentStep, name, email, curriculum, grade, subjectGrades]);

    const SUBJECT_DATA = {
        cbc_junior: ["Mathematics", "English", "Kiswahili", "Integrated Science", "Health Education", "Pre-Technical & Pre-Career Studies", "Social Studies", "Business Studies", "Agriculture & Nutrition", "Life Skills Education", "Creative Arts and Sports", "Religious Education (CRE/IRE/HRE)"],
        cbc_senior_stem: ["Mathematics", "English", "Kiswahili", "Physics", "Chemistry", "Biology", "Computer Science", "Further Mathematics", "Technical Drawing", "Agriculture & Nutrition"],
        cbc_senior_arts: ["English", "Kiswahili", "Mathematics", "Fine Art & Design", "Music", "Drama & Theatre", "Physical Education & Sports Science", "Media & Film Studies", "Fashion & Design"],
        cbc_senior_social: ["English", "Kiswahili", "Mathematics", "History & Citizenship", "Geography", "Business Studies & Economics", "Religious Education", "Law", "Sociology"],
        cbc_senior_techvoc: ["English", "Kiswahili", "Mathematics", "Building & Construction", "Electrical & Electronics", "Mechanical Engineering", "Agriculture", "Home Science", "Hairdressing & Beauty", "Plumbing & Carpentry", "ICT / Computer Studies"],
        igcse: ["English First Language", "Mathematics (Extended)", "Biology", "Chemistry", "Physics", "ICT", "Business Studies", "Economics", "History", "Geography", "Art & Design", "Sociology"],
        alevel: ["Mathematics", "Physics", "Chemistry", "Biology", "Computer Science", "Economics", "Business", "History", "Geography", "Psychology", "Law", "English Literature"],
        legacy: ["Mathematics", "English", "Kiswahili", "Biology", "Physics", "Chemistry", "History & Government", "Geography", "Christian Religious Ed (CRE)", "Islamic Religious Ed (IRE)", "Hindu Religious Ed (HRE)", "Home Science", "Business Studies", "Agriculture", "Computer Studies", "Music", "Art & Design", "French", "German", "Arabic", "Aviation", "Building Construction", "Power Mechanics", "Woodwork", "Metalwork", "Drawing & Design", "Electricity"]
    };

    const GRADES = {
        cbc: ["Grade 7", "Grade 8", "Grade 9", "Grade 10 (Senior)", "Grade 11 (Senior)", "Grade 12 (Senior)"],
        igcse: ["Year 10 (IGCSE)", "Year 11 (IGCSE)", "Year 12 (A-Level)", "Year 13 (A-Level)"],
        legacy: ["Form 1", "Form 2", "Form 3", "Form 4", "Form 4 Leaver", "University Year 1", "University Year 2", "University Year 3", "University Year 4"]
    };

    const valueOptions = ["High Income / Wealth", "Helping Others / Impact", "Work-Life Balance", "Leadership / Power", "Creativity / Innovation", "Stability / Security"];
    const workStyleOptions = ["Solo / Independent", "Collaborative Team", "Remote / Tech-Focused", "Outdoors / Active", "Corporate Office", "Hands-on / Fieldwork"];

    const barrierOptions = ["Financial Constraints", "Unsure of my interests", "Fear of failure", "Lack of mentorship/guidance", "Poor academic grades currently", "No barriers right now"];
    const experienceOptions = ["School Clubs / Leader", "Volunteering / Community Service", "Hobby / Personal Projects", "Part-time Job / Internship", "None yet"];
    const readinessOptions = ["Ready to apply now!", "Exploring my options", "Completely stuck / Need help"];
    const getAvailableSubjects = () => {
        if (!curriculum || !grade) return [];
        
        if (curriculum === 'cbc') {
            if (grade.includes('Senior')) {
                if (!pathway) return [];
                return SUBJECT_DATA[`cbc_senior_${pathway}` as keyof typeof SUBJECT_DATA];
            }
            return SUBJECT_DATA.cbc_junior;
        }
        
        if (curriculum === 'igcse') {
            if (grade.includes('A-Level')) return SUBJECT_DATA.alevel;
            return SUBJECT_DATA.igcse;
        }

        if (curriculum === 'legacy') return SUBJECT_DATA.legacy;
        
        return [];
    };

    const handleNext = () => {
        setError(null);
        if (currentStep === 1) {
            // Mobile sub-stepping logic
            if (subStep === 1) {
                if (!name.trim()) return setError("Please enter your name");
                setSubStep(2);
                return;
            }
            if (subStep === 2) {
                if (!curriculum) return setError("Please select your curriculum");
                if (!grade) return setError("Please select your current grade/year");
                if (curriculum === 'cbc' && grade.includes('Senior') && !pathway) return setError("Please select your Senior Secondary pathway");
                
                // If Form 4 Leaver, go to scorecard sub-step
                if (grade === "Form 4 Leaver") {
                    setSubStep(3); // 3 is now Manual Grade Entry
                } else {
                    setSubStep(4); // 4 is now Subjects
                }
                return;
            }
            if (subStep === 3) {
                // Manual Grade validation
                if (grade === "Form 4 Leaver") {
                    const selectedGrades = Object.entries(subjectGrades).filter(([_, g]) => g !== '');
                    if (selectedGrades.length < 7) return setError("Please select grades for at least 7 subjects to calculate an accurate Mean Grade (Official KUCCPS Standard).");
                    
                    // Automatically derive strong subjects (B and above)
                    const strongSubjects = selectedGrades
                        .filter(([_, g]) => ['A', 'A-', 'B+', 'B'].includes(g))
                        .map(([s, _]) => s);
                    
                    // If no B's, take top 3 subjects
                    if (strongSubjects.length === 0) {
                        const gradePoints: Record<string, number> = {
                            'A': 12, 'A-': 11, 'B+': 10, 'B': 9, 'B-': 8, 'C+': 7, 'C': 6, 'C-': 5, 'D+': 4, 'D': 3, 'D-': 2, 'E': 1
                        };
                        const sortedSubjects = selectedGrades
                            .sort((a, b) => (gradePoints[b[1]] || 0) - (gradePoints[a[1]] || 0))
                            .slice(0, 3)
                            .map(([s, _]) => s);
                        setSelectedSubjects(sortedSubjects);
                    } else {
                        setSelectedSubjects(strongSubjects);
                    }
                    
                    // Skip Phase 1.4 (Subjects selection) and go to Step 2 (RIASEC)
                    setCurrentStep(2);
                    return;
                }
                setSubStep(4);
                return;
            }
            if (subStep === 4) {
                if (selectedSubjects.length === 0) return setError("Please select at least one subject area");
                setCurrentStep(2);
                return;
            }
        }
        
        if (currentStep === 2 && selectedActivities.length === 0) return setError("Please select at least one activity");
        if (currentStep === 3) {
            if (selectedValues.length === 0) return setError("Please select your core values");
            if (!workStyle) return setError("Please select your preferred work style");
        }
        if (currentStep === 4) {
            if (!mbtiEnergy || !mbtiDecisions || !mbtiStructure) return setError("Please answer all personality questions");
        }
        if (currentStep === 5) {
            if (!barrier || !experience) return setError("Please answer the reality check questions");
        }
        if (currentStep === 6 && !readiness) return setError("Please select your action readiness");

        setCurrentStep(prev => prev + 1);
    };

    const handleBack = () => {
        setError(null);
        if (currentStep === 1 && subStep > 1) {
            // Special routing for skip sub-step 3 (upload) if not Form 4 Leaver
            if (subStep === 4 && grade !== "Form 4 Leaver") {
                setSubStep(2);
            } else {
                setSubStep(prev => prev - 1);
            }
            return;
        }
        // If coming back from Phase 2 to Form 4 Leaver, go to subStep 3
        if (currentStep === 2 && grade === "Form 4 Leaver") {
            setCurrentStep(1);
            setSubStep(3);
            return;
        }
        setCurrentStep(prev => prev - 1);
    };

    const calculateRiasec = () => {
        const scores = { realistic: 0, investigative: 0, artistic: 0, social: 0, enterprising: 0, conventional: 0 };
        selectedActivities.forEach(id => {
            const activity = RIASEC_ACTIVITIES.find(a => a.id === id);
            if (activity) {
                const key = activity.code === 'R' ? 'realistic' :
                    activity.code === 'I' ? 'investigative' :
                        activity.code === 'A' ? 'artistic' :
                            activity.code === 'S' ? 'social' :
                                activity.code === 'E' ? 'enterprising' : 'conventional';
                scores[key]++;
            }
        });
        const sortedTypes = Object.entries(scores)
            .sort((a, b) => b[1] - a[1])
            .filter(s => s[1] > 0)
            .map(s => RIASEC_LABELS[s[0].charAt(0).toUpperCase() as keyof typeof RIASEC_LABELS]);
        return { scores, personalityTypes: sortedTypes };
    };

    const [isPaid, setIsPaid] = useState(isCareerFitMode);
    const [reportHtml, setReportHtml] = useState<string | null>(null);

    const finishAssessment = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const { personalityTypes, scores } = calculateRiasec();
            const topPersonality = personalityTypes[0] || 'Balanced';
            const mbtiCode = `${mbtiEnergy === 'Introvert' ? 'I' : 'E'}N${mbtiDecisions === 'Thinker' ? 'T' : 'F'}${mbtiStructure === 'Judging' ? 'J' : 'P'}`;

            const selectedGrades = Object.entries(subjectGrades).filter(([_, g]) => g !== '');
            const hasLegacyGrades = grade === "Form 4 Leaver" && selectedGrades.length >= 7;

            let kcseGrade = undefined;
            let totalPointsVal = undefined;

            if (hasLegacyGrades) {
                const gradePoints: Record<string, number> = {
                    'A': 12, 'A-': 11, 'B+': 10, 'B': 9, 'B-': 8, 'C+': 7, 'C': 6, 'C-': 5, 'D+': 4, 'D': 3, 'D-': 2, 'E': 1
                };
                const calculatedTotalPoints = selectedGrades.reduce((sum, [_, g]) => sum + (gradePoints[g] || 0), 0);
                totalPointsVal = calculatedTotalPoints;
                const meanPoints = calculatedTotalPoints / selectedGrades.length;
                
                const getGradeFromPoints = (points: number) => {
                    if (points >= 11.5) return 'A';
                    if (points >= 10.5) return 'A-';
                    if (points >= 9.5) return 'B+';
                    if (points >= 8.5) return 'B';
                    if (points >= 7.5) return 'B-';
                    if (points >= 6.5) return 'C+';
                    if (points >= 5.5) return 'C';
                    if (points >= 4.5) return 'C-';
                    if (points >= 3.5) return 'D+';
                    if (points >= 2.5) return 'D';
                    if (points >= 1.5) return 'D-';
                    return 'E';
                };
                kcseGrade = getGradeFromPoints(meanPoints);
            }

            const profile: GuestProfile = {
                name,
                curriculum: curriculum || undefined,
                grade,
                pathway: pathway || undefined,
                subjects: selectedSubjects,
                interests: [`RIASEC Type: ${personalityTypes.join(', ')}`],
                values: selectedValues,
                workStyle,
                mbti: mbtiCode,
                barriers: barrier,
                experience,
                readiness,
                dreamJob: targetCareer || undefined,
                careerGoals: "Seeking career alignment via Diagnostic Assessment.",
                kcseGrade,
                kcsePoints: hasLegacyGrades ? totalPointsVal : undefined,
                subjectGrades: hasLegacyGrades ? Object.fromEntries(selectedGrades) : undefined
            };
            setGuestProfile(profile);

            // Generate customized recommendations
            const payload = {
                name: profile.name,
                curriculum: profile.curriculum === 'cbc' ? 'Kenyan CBC' : profile.curriculum === 'igcse' ? 'British IGCSE/A-Level' : 'Kenyan Legacy (8-4-4)',
                currentGrade: profile.grade,
                pathway: profile.pathway,
                subjects: profile.subjects,
                interests: profile.interests,
                values: profile.values,
                workStyle: profile.workStyle,
                mbti: profile.mbti,
                limitations: profile.barriers,
                kcseGrade: profile.kcseGrade,
                subjectGrades: profile.subjectGrades,
                dreamJob: targetCareer || undefined
            };

            const recommendations = await aiCareerService.generateCareerRecommendations(payload);
            setFinalRecommendations(recommendations);

            const summaryPrompt = `Generate a 3-paragraph executive summary detailing exactly why the recommended career paths fit the student.
                Student Context:
                - Name: ${name}
                - System: ${payload.curriculum}
                - Grade: ${grade}
                ${pathway ? `- Pathway: ${pathway.toUpperCase()}` : ''}
                - Personality: RIASEC (${topPersonality}), MBTI (${mbtiCode})
                - Values: ${selectedValues.join(', ')}
                - Barrier: ${barrier}
                ${targetCareer ? `- Target Career Fit Request: ${targetCareer}` : ''}

                Emphasize how they can use their academic system (${payload.curriculum}) to overcome their barrier. Use professional, encouraging tone. DO NOT ask any questions. Use markdown formatting.`;

            const summaryString = await aiCareerService.sendMessage(
                summaryPrompt,
                [],
                { ...payload, assessmentResults: { riasec_scores: scores, personality_type: personalityTypes } }
            );

            const updatedProfile = {
                ...profile,
                aiSummary: summaryString
            };
            
            setGuestProfile(updatedProfile);

            // Pre-generate the report HTML for the preview
            const html = ReportGenerator.generatePDFReport(updatedProfile, [], recommendations);
            setReportHtml(html);

            setShowReport(true);
            setCurrentStep(7);
        } catch (err: unknown) {
            console.error(err);
            setError((err as Error).message || 'Failed to generate assessment. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const downloadReport = async () => {
        if (!reportHtml) {
            console.error("No report HTML available for download.");
            setError("Report content is not ready yet. Please wait a moment and try again.");
            return;
        }
        
        try {
            console.log("Starting PDF download process...");
            await ReportGenerator.downloadPDF(reportHtml, `${guestProfile.name || 'CareerGuide'}-Diagnostic-Report.pdf`);
            console.log("PDF download triggered successfully.");
        } catch (err) {
            console.error("PDF download failed:", err);
            setError("Failed to generate PDF. Please try again or contact support.");
        }
    };

    const handlePaymentSuccess = () => {
        setIsPaid(true);
        downloadReport(); // Automatically trigger download on success
    };

    return (
        <div className="min-h-screen text-foreground relative overflow-x-hidden md:pt-20">
            <BackgroundGradient />
            <div className="hidden md:block">
                <Navigation />
            </div>

            <main className="max-w-4xl mx-auto px-4 py-4 md:py-8 relative z-10 min-h-[100dvh] flex flex-col">
                <div className="text-center mb-6 hidden md:block">
                    <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent pb-1">Professional Counselor Assessment</h1>
                    <p className="text-base text-muted-foreground mt-2">Comprehensive 10-point analysis covering Values, MBTI Personality, Works Styles, and Real Challenges.</p>
                </div>

                <div className="mb-6">
                    <div className="flex justify-center gap-1 md:gap-2 mb-2">
                        {[1, 2, 3, 4, 5, 6, 7].map(s => (
                            <div key={s} className={`h-1 md:h-2 flex-1 max-w-[30px] md:max-w-[60px] rounded-full transition-all ${currentStep >= s ? 'bg-primary shadow-[0_0_10px_rgba(var(--primary),0.5)]' : 'bg-muted'}`} />
                        ))}
                    </div>
                    {currentStep === 1 && (
                        <div className="flex justify-center gap-1 mt-1 md:hidden">
                            {[1, 2, 3, 4].map(s => {
                                // Skip showing dot 3 if not Form 4 Leaver
                                if (s === 3 && grade !== "Form 4 Leaver") return null;
                                return (
                                    <div key={s} className={`h-0.5 w-4 rounded-full transition-all ${subStep >= s ? 'bg-primary/60' : 'bg-muted'}`} />
                                );
                            })}
                        </div>
                    )}
                </div>

                {error && (
                    <Alert variant="destructive" className="mb-6 border-destructive/50 bg-destructive/5">
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                <Card className="bg-gradient-surface border-card-border shadow-elevated overflow-hidden">
                    <CardContent className="p-5 md:p-10">
                        <AnimatePresence mode="wait">

                            {/* STEP 1: FOUNDATION */}
                            {currentStep === 1 && (
                                <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6 flex-1 flex flex-col">
                                    <div className="text-center">
                                        <h2 className="text-2xl md:text-3xl font-bold flex items-center justify-center gap-2"><User className="w-6 h-6 md:w-8 md:h-8 text-primary" /> Phase 1: Academics</h2>
                                    </div>

                                    <div className="space-y-5 flex-1">
                                        {/* Sub-step 1.1: Identity */}
                                        {subStep === 1 && (
                                            <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                                                <div>
                                                    <Label className="text-base font-semibold">Your Full Name</Label>
                                                    <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. John Kamau" className="text-base p-5 border-2 bg-background/50 focus:ring-primary" />
                                                </div>

                                                <div>
                                                    <Label className="text-base font-semibold">Email Address (For Report Receipt)</Label>
                                                    <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="e.g. john@example.com" className="text-base p-5 border-2 bg-background/50 focus:ring-primary" />
                                                </div>
                                            </div>
                                        )}

                                        {/* Sub-step 1.2: System & Level */}
                                        {subStep === 2 && (
                                            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                                <div className="space-y-4">
                                                    <Label className="text-base font-semibold">Curriculum</Label>
                                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                                        <button type="button" onClick={() => { setCurriculum('cbc'); setGrade(""); setSelectedSubjects([]); setPathway(null); }} className={`p-3 rounded-xl border-2 transition-all font-bold text-left px-5 ${curriculum === 'cbc' ? 'border-primary bg-primary/10 text-primary' : 'border-card-border hover:border-primary/50'}`}>Kenyan CBC (New)</button>
                                                        <button type="button" onClick={() => { setCurriculum('igcse'); setGrade(""); setSelectedSubjects([]); setPathway(null); }} className={`p-3 rounded-xl border-2 transition-all font-bold text-left px-5 ${curriculum === 'igcse' ? 'border-primary bg-primary/10 text-primary' : 'border-card-border hover:border-primary/50'}`}>British IGCSE / A-Level</button>
                                                        <button type="button" onClick={() => { setCurriculum('legacy'); setGrade(""); setSelectedSubjects([]); setPathway(null); }} className={`p-3 rounded-xl border-2 transition-all font-bold text-left px-5 ${curriculum === 'legacy' ? 'border-primary bg-primary/10 text-primary' : 'border-card-border hover:border-primary/50'}`}>8-4-4 Legacy / University</button>
                                                    </div>
                                                </div>
                                                
                                                {curriculum && (
                                                    <div className="space-y-4">
                                                        <Label className="text-base font-semibold">Current Grade / Level</Label>
                                                        <div className="grid grid-cols-2 gap-2">
                                                            {GRADES[curriculum].map(g => {
                                                                const isForm4Leaver = g === "Form 4 Leaver";
                                                                return (
                                                                    <button 
                                                                        key={g} 
                                                                        type="button" 
                                                                        onClick={() => { setGrade(g); setSelectedSubjects([]); }} 
                                                                        className={`p-2 text-sm rounded-lg border-2 transition-all font-medium flex items-center justify-center gap-2 ${
                                                                            grade === g 
                                                                                ? 'border-primary bg-primary/10 text-primary shadow-sm' 
                                                                                : isForm4Leaver 
                                                                                    ? 'border-primary/40 bg-primary/5 hover:border-primary text-primary/80' 
                                                                                    : 'border-card-border hover:border-primary/50'
                                                                        } ${isForm4Leaver ? 'col-span-2 py-3' : ''}`}>
                                                                        {isForm4Leaver && <Sparkles className="w-4 h-4 text-primary animate-pulse" />}
                                                                        {g}
                                                                        {isForm4Leaver && <span className="text-[10px] bg-primary text-white px-1.5 py-0.5 rounded-full ml-1">V25 ELIGIBLE</span>}
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                )}

                                                {curriculum === 'cbc' && grade.includes('Senior') && (
                                                    <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                                                        <Label className="text-base font-bold text-primary">Senior Secondary Pathway</Label>
                                                        <div className="grid grid-cols-2 gap-2">
                                                            {([['stem', 'STEM'], ['arts', 'Arts & Sports'], ['social', 'Social Sciences'], ['techvoc', 'Technical & Vocational']] as const).map(([p, label]) => (
                                                                <button key={p} type="button" onClick={() => { setPathway(p); setSelectedSubjects([]); }} className={`p-3 rounded-xl border-2 transition-all font-bold text-xs tracking-wider ${pathway === p ? 'border-primary bg-primary text-primary-foreground' : 'border-card-border hover:border-primary/50 bg-card'}`}>
                                                                    {label}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Sub-step 1.3: Manual Academic Scorecard (Conditional) */}
                                        {subStep === 3 && grade === "Form 4 Leaver" && (
                                            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                                <div className="text-center space-y-2">
                                                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2 text-primary">
                                                        <GraduationCap className="w-8 h-8" />
                                                    </div>
                                                    <Label className="text-xl font-bold block text-primary">Academic Scorecard</Label>
                                                    <p className="text-sm text-muted-foreground px-4">Enter your KCSE grades to help the AI map your technical eligibility.</p>
                                                </div>

                                                <div className="bg-card/50 border border-card-border rounded-3xl p-6 shadow-sm">
                                                    <ScrollArea className="h-[300px] pr-4">
                                                        <div className="space-y-4">
                                                            <div className="space-y-3">
                                                                <Label className="text-[10px] uppercase tracking-wider font-bold text-primary">Core Subjects (Mandatory)</Label>
                                                                {['Mathematics', 'English', 'Kiswahili'].map(subject => (
                                                                    <div key={subject} className="flex items-center justify-between gap-4 p-2 rounded-xl bg-background/40">
                                                                        <span className="text-sm font-semibold">{subject}</span>
                                                                        <Select value={subjectGrades[subject]} onValueChange={(v) => setSubjectGrades(p => ({ ...p, [subject]: v }))}>
                                                                            <SelectTrigger className="w-24 h-9 bg-background"><SelectValue placeholder="-" /></SelectTrigger>
                                                                            <SelectContent>
                                                                                {['A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'D-', 'E'].map(g => (
                                                                                    <SelectItem key={g} value={g}>{g}</SelectItem>
                                                                                ))}
                                                                            </SelectContent>
                                                                        </Select>
                                                                    </div>
                                                                ))}
                                                            </div>

                                                            <div className="space-y-3 pt-2">
                                                                <Label className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Elective Subjects (Select At Least 4 More)</Label>
                                                                {['Biology', 'Chemistry', 'Physics', 'History & Government', 'Geography', 'Christian Religious Ed (CRE)', 'Islamic Religious Ed (IRE)', 'Hindu Religious Ed (HRE)', 'Home Science', 'Business Studies', 'Agriculture', 'Computer Studies', 'Music', 'Art & Design', 'French', 'German', 'Arabic', 'Aviation', 'Building Construction', 'Power Mechanics', 'Woodwork', 'Metalwork', 'Drawing & Design', 'Electricity'].map(subject => (
                                                                    <div key={subject} className="flex items-center justify-between gap-4 p-2 rounded-xl bg-background/40">
                                                                        <span className="text-sm">{subject}</span>
                                                                        <Select value={subjectGrades[subject] || ''} onValueChange={(v) => setSubjectGrades(p => ({ ...p, [subject]: v === 'none' ? '' : v }))}>
                                                                            <SelectTrigger className="w-24 h-9 bg-background"><SelectValue placeholder="-" /></SelectTrigger>
                                                                            <SelectContent>
                                                                                <SelectItem value="none">None</SelectItem>
                                                                                {['A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'D-', 'E'].map(g => (
                                                                                    <SelectItem key={g} value={g}>{g}</SelectItem>
                                                                                ))}
                                                                            </SelectContent>
                                                                        </Select>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </ScrollArea>
                                                </div>

                                                {Object.entries(subjectGrades).filter(([_, g]) => g !== '').length >= 7 && (
                                                    <div className="text-center p-3 bg-green-500/10 border border-green-500/20 rounded-2xl animate-in fade-in slide-in-from-top-2">
                                                        <p className="text-xs font-bold text-green-600 flex items-center justify-center gap-1">
                                                            <CheckCircle className="w-3 h-3" /> 7/7 Subjects Reached. Official KUCCPS Standard Met.
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Sub-step 1.4: Subjects */}
                                        {subStep === 4 && (
                                            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                                <Label className="text-base font-semibold mb-2 block">Strongest Subjects</Label>
                                                <div className="flex flex-wrap gap-2">
                                                    {getAvailableSubjects().map(sub => (
                                                        <button key={sub} type="button" onClick={() => setSelectedSubjects(p => p.includes(sub) ? p.filter(x => x !== sub) : [...p, sub])}
                                                            className={`px-3 py-2 text-sm rounded-lg border-2 transition-all ${selectedSubjects.includes(sub) ? 'border-primary bg-primary text-primary-foreground' : 'border-card-border bg-card hover:border-primary/50 text-foreground'}`}>
                                                            {sub}
                                                        </button>
                                                    ))}
                                                </div>
                                                {selectedSubjects.length === 0 && (
                                                    <p className="text-xs text-muted-foreground">Select at least one subject area you excel at.</p>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    <div className="pt-4 flex justify-between gap-4">
                                        {subStep > 1 && (
                                            <Button variant="outline" onClick={handleBack} className="h-12 md:h-14 px-6 md:px-8 border-2 font-bold">
                                                <ArrowLeft className="mr-2 w-5 h-5" /> Back
                                            </Button>
                                        )}
                                        <div className="flex-1" />
                                        <Button onClick={handleNext} className="h-12 md:h-14 px-8 text-base md:text-lg rounded-2xl bg-primary shadow-lg hover:translate-x-1 transition-transform">
                                            {subStep < 4 ? 'Continue' : 'Next Phase'} <ArrowRight className="ml-2 w-5 h-5" />
                                        </Button>
                                    </div>
                                </motion.div>
                            )}

                            {/* STEP 2: RIASEC */}
                            {currentStep === 2 && (
                                <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                                    <div className="text-center">
                                        <h2 className="text-2xl md:text-3xl font-bold flex items-center justify-center gap-2"><Target className="w-8 h-8 text-primary" /> Phase 2: Interests</h2>
                                        <p className="text-muted-foreground mt-2">Pick 3-5 activities that sound genuinely fun to you.</p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[50vh] overflow-y-auto p-2 custom-scrollbar">
                                        {RIASEC_ACTIVITIES.slice(0, 16).map(a => (
                                            <button key={a.id} type="button" onClick={() => setSelectedActivities(p => p.includes(a.id) ? p.filter(x => x !== a.id) : [...p, a.id])}
                                                className={`p-4 rounded-xl border-2 transition-all text-left flex items-start gap-4 ${selectedActivities.includes(a.id) ? 'border-primary bg-primary/10 ring-1 ring-primary' : 'border-card-border hover:border-primary/20 bg-card/50'}`}>
                                                <div className={`mt-0.5 w-5 h-5 shrink-0 rounded border-2 flex items-center justify-center ${selectedActivities.includes(a.id) ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground/30'}`}>
                                                    {selectedActivities.includes(a.id) && <CheckCircle className="w-3 h-3" />}
                                                </div>
                                                <p className="text-[15px] font-medium leading-tight text-foreground">{a.text}</p>
                                            </button>
                                        ))}
                                    </div>

                                    <div className="pt-4 flex justify-between">
                                        <Button variant="outline" onClick={handleBack} className="h-12 md:h-14 px-6 md:px-8 border-2 font-bold mb-4 sm:mb-0"><ArrowLeft className="mr-2 w-5 h-5" /> Back</Button>
                                        <Button onClick={handleNext} className="h-12 md:h-14 px-6 md:px-8 bg-primary shadow-lg hover:translate-x-1 transition-transform">Continue <ArrowRight className="ml-2 w-5 h-5" /></Button>
                                    </div>
                                </motion.div>
                            )}

                            {/* STEP 3: VALUES & WORK STYLE */}
                            {currentStep === 3 && (
                                <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                                    <div className="text-center">
                                        <h2 className="text-2xl md:text-3xl font-bold flex items-center justify-center gap-2"><Heart className="w-8 h-8 text-primary" /> Phase 3: Values & Work</h2>
                                    </div>

                                    <div className="space-y-6">
                                        <div>
                                            <Label className="text-base font-semibold block mb-2">What matters MOST to you in a career? (Pick 2)</Label>
                                            <div className="grid grid-cols-2 gap-2">
                                                {valueOptions.map(val => (
                                                    <button key={val} type="button" onClick={() => setSelectedValues(p => p.includes(val) ? p.filter(x => x !== val) : p.length < 2 ? [...p, val] : p)}
                                                        className={`p-3 rounded-xl border-2 transition-all font-medium text-sm md:text-base ${selectedValues.includes(val) ? 'border-primary bg-primary text-primary-foreground' : 'border-card-border hover:border-primary/50 bg-card/50 text-foreground'}`}>
                                                        {val}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div>
                                            <Label className="text-base font-semibold block mb-2">How do you prefer to work?</Label>
                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                                {workStyleOptions.map(ws => (
                                                    <button key={ws} type="button" onClick={() => setWorkStyle(ws)}
                                                        className={`p-3 rounded-xl border-2 transition-all font-medium text-sm md:text-base ${workStyle === ws ? 'border-primary bg-primary text-primary-foreground' : 'border-card-border hover:border-primary/50 bg-card/50 text-foreground'}`}>
                                                        {ws}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-4 flex justify-between">
                                        <Button variant="outline" onClick={handleBack} className="h-12 md:h-14 px-6 md:px-8 border-2 font-bold mb-4 sm:mb-0"><ArrowLeft className="mr-2 w-5 h-5" /> Back</Button>
                                        <Button onClick={handleNext} className="h-12 md:h-14 px-6 md:px-8 bg-primary shadow-lg hover:translate-x-1 transition-transform">Continue <ArrowRight className="ml-2 w-5 h-5" /></Button>
                                    </div>
                                </motion.div>
                            )}

                            {/* STEP 4: MBTI PERSONALITY */}
                            {currentStep === 4 && (
                                <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                                    <div className="text-center">
                                        <h2 className="text-2xl md:text-3xl font-bold flex items-center justify-center gap-2"><Brain className="w-8 h-8 text-primary" /> Phase 4: Personality</h2>
                                        <p className="text-muted-foreground mt-2">MBTI-inspired psychological framing.</p>
                                    </div>

                                    <div className="space-y-6">
                                        <div>
                                            <Label className="text-base font-semibold block mb-2">1. Do you focus better...</Label>
                                            <div className="grid grid-cols-2 gap-2">
                                                <button type="button" onClick={() => setMbtiEnergy('Extrovert')} className={`p-4 rounded-xl border-2 font-medium ${mbtiEnergy === 'Extrovert' ? 'border-primary tracking-wide bg-primary/10 text-primary' : 'border-card-border hover:border-primary/50 bg-background/50'}`}>In active groups (Extrovert)</button>
                                                <button type="button" onClick={() => setMbtiEnergy('Introvert')} className={`p-4 rounded-xl border-2 font-medium ${mbtiEnergy === 'Introvert' ? 'border-primary tracking-wide bg-primary/10 text-primary' : 'border-card-border hover:border-primary/50 bg-background/50'}`}>Working alone (Introvert)</button>
                                            </div>
                                        </div>

                                        <div>
                                            <Label className="text-base font-semibold block mb-2">2. Do you make decisions using...</Label>
                                            <div className="grid grid-cols-2 gap-2">
                                                <button type="button" onClick={() => setMbtiDecisions('Thinker')} className={`p-4 rounded-xl border-2 font-medium ${mbtiDecisions === 'Thinker' ? 'border-primary tracking-wide bg-primary/10 text-primary' : 'border-card-border hover:border-primary/50 bg-background/50'}`}>Strict Logic/Data (Thinker)</button>
                                                <button type="button" onClick={() => setMbtiDecisions('Feeler')} className={`p-4 rounded-xl border-2 font-medium ${mbtiDecisions === 'Feeler' ? 'border-primary tracking-wide bg-primary/10 text-primary' : 'border-card-border hover:border-primary/50 bg-background/50'}`}>Feelings/People (Feeler)</button>
                                            </div>
                                        </div>

                                        <div>
                                            <Label className="text-base font-semibold block mb-2">3. Do you prefer...</Label>
                                            <div className="grid grid-cols-2 gap-2">
                                                <button type="button" onClick={() => setMbtiStructure('Judging')} className={`p-4 rounded-xl border-2 font-medium ${mbtiStructure === 'Judging' ? 'border-primary tracking-wide bg-primary/10 text-primary' : 'border-card-border hover:border-primary/50 bg-background/50'}`}>A strict schedule (Judging)</button>
                                                <button type="button" onClick={() => setMbtiStructure('Perceiving')} className={`p-4 rounded-xl border-2 font-medium ${mbtiStructure === 'Perceiving' ? 'border-primary tracking-wide bg-primary/10 text-primary' : 'border-card-border hover:border-primary/50 bg-background/50'}`}>Flexibility (Perceiving)</button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-4 flex justify-between">
                                        <Button variant="outline" onClick={handleBack} className="h-12 md:h-14 px-6 md:px-8 border-2 font-bold mb-4 sm:mb-0"><ArrowLeft className="mr-2 w-5 h-5" /> Back</Button>
                                        <Button onClick={handleNext} className="h-12 md:h-14 px-6 md:px-8 bg-primary shadow-lg hover:translate-x-1 transition-transform">Continue <ArrowRight className="ml-2 w-5 h-5" /></Button>
                                    </div>
                                </motion.div>
                            )}

                            {/* STEP 5: REALITY CHECK */}
                            {currentStep === 5 && (
                                <motion.div key="step5" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                                    <div className="text-center">
                                        <h2 className="text-2xl md:text-3xl font-bold flex items-center justify-center gap-2"><ShieldAlert className="w-8 h-8 text-primary" /> Phase 5: Reality Check</h2>
                                    </div>

                                    <div className="space-y-6">
                                        <div>
                                            <Label className="text-base font-semibold block mb-2">What is your biggest obstacle right now?</Label>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                {barrierOptions.map(opt => (
                                                    <button key={opt} type="button" onClick={() => setBarrier(opt)}
                                                        className={`p-4 rounded-xl border-2 transition-all font-medium text-sm md:text-[15px] text-left ${barrier === opt ? 'border-primary bg-primary/10 ring-1 ring-primary text-primary' : 'border-card-border hover:border-primary/50 bg-background/50'}`}>
                                                        {opt}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div>
                                            <Label className="text-base font-semibold block mb-2">Do you have practical experience?</Label>
                                            <div className="flex flex-wrap gap-2">
                                                {experienceOptions.map(opt => (
                                                    <button key={opt} type="button" onClick={() => setExperience(opt)}
                                                        className={`px-4 py-3 rounded-xl border-2 transition-all font-medium text-sm ${experience === opt ? 'border-primary bg-primary text-white' : 'border-card-border hover:border-primary/50 bg-background/50'}`}>
                                                        {opt}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-4 flex justify-between">
                                        <Button variant="outline" onClick={handleBack} className="h-12 md:h-14 px-6 md:px-8 border-2 font-bold mb-4 sm:mb-0"><ArrowLeft className="mr-2 w-5 h-5" /> Back</Button>
                                        <Button onClick={handleNext} className="h-12 md:h-14 px-6 md:px-8 bg-primary shadow-lg hover:translate-x-1 transition-transform">Continue <ArrowRight className="ml-2 w-5 h-5" /></Button>
                                    </div>
                                </motion.div>
                            )}

                            {/* STEP 6: READINESS */}
                            {currentStep === 6 && (
                                <motion.div key="step6" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                                    <div className="text-center">
                                        <h2 className="text-2xl md:text-3xl font-bold flex items-center justify-center gap-2"><Rocket className="w-8 h-8 text-primary" /> Phase 6: Action</h2>
                                        <p className="text-muted-foreground mt-2">How ready are you to start planning?</p>
                                    </div>

                                    <div className="flex flex-col gap-3 max-w-md mx-auto">
                                        {readinessOptions.map(opt => (
                                            <button key={opt} type="button" onClick={() => setReadiness(opt)}
                                                className={`p-5 rounded-2xl border-2 transition-all text-left font-bold text-lg ${readiness === opt ? 'border-primary bg-primary text-white scale-105 shadow-xl' : 'border-card-border hover:border-primary/50 bg-background/50'}`}>
                                                {opt}
                                            </button>
                                        ))}
                                    </div>

                                    <div className="pt-8 flex flex-col md:flex-row justify-between gap-4">
                                        <Button variant="outline" onClick={handleBack} className="h-14 px-8 border-2 font-bold order-2 md:order-1 disabled:opacity-50" disabled={isLoading}><ArrowLeft className="mr-2 w-5 h-5" /> Back</Button>
                                        <Button onClick={finishAssessment} disabled={isLoading || !readiness} className="h-14 px-10 text-lg rounded-2xl bg-gradient-to-r from-primary to-blue-600 text-white shadow-xl hover:shadow-primary/20 order-1 md:order-2">
                                            {isLoading ? <><BrandedLoader size="xs" showText={false} className="mr-2 inline-flex" /> Finalizing...</> : <><Sparkles className="mr-2 w-5 h-5" /> Reveal Diagnostic</>}
                                        </Button>
                                    </div>
                                </motion.div>
                            )}

                            {/* STEP 7: RESULTS (PREVIEW & PAYWALL) */}
                            {/* STEP 7: RESULTS (PREVIEW & PAYWALL) */}
                            {currentStep === 7 && (
                                <motion.div key="step7" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6 py-4 max-w-2xl mx-auto">
                                    <div className="text-center space-y-2">
                                        <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-1">
                                            <CheckCircle className="w-6 h-6 text-green-500" />
                                        </div>
                                        <h2 className="text-xl md:text-2xl font-black tracking-tight">Diagnostic Analysis Complete</h2>
                                        <p className="text-xs text-muted-foreground px-4">Your personalized career roadmap and alignment profile are ready.</p>
                                    </div>

                                    <div className="flex flex-col gap-6">
                                        {/* PREVIEW PANEL - CLICKABLE */}
                                        <div className="relative group w-full">
                                            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2 flex items-center gap-2 px-1">
                                                <Compass className="w-3 h-3" /> Report Preview (Tap to Unlock)
                                            </div>
                                            <button 
                                                onClick={() => !isPaid && paywallRef.current?.handlePayment()}
                                                disabled={isPaid}
                                                className={`relative w-full rounded-xl border-2 border-card-border overflow-hidden bg-white aspect-[3/4] transition-all text-left ${!isPaid ? 'max-h-[260px] cursor-pointer hover:border-primary/50' : 'max-h-none'}`}
                                            >
                                                {/* Actual Content Rendering */}
                                                <div 
                                                    className="p-4 origin-top scale-[0.55] sm:scale-[0.8] w-[182%] sm:w-[125%] pointer-events-none"
                                                    dangerouslySetInnerHTML={{ __html: reportHtml || '' }}
                                                />
                                                
                                                {/* Glassmorphism Blur Overlay */}
                                                {!isPaid && (
                                                    <div className="absolute inset-0 z-20 flex flex-col justify-end">
                                                        <div className="h-full w-full backdrop-blur-[3.5px] bg-gradient-to-t from-background/90 via-background/40 to-transparent flex items-center justify-center p-6 text-center">
                                                            <div className="bg-white/95 dark:bg-card/95 p-4 rounded-2xl shadow-2xl border border-primary/10 max-w-[190px] transform group-hover:scale-[1.02] transition-all duration-300">
                                                                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2">
                                                                    <Lock className="w-5 h-5 text-primary" />
                                                                </div>
                                                                <p className="text-[12px] font-black tracking-tight">Unlock Analysis</p>
                                                                <p className="text-[9px] text-muted-foreground leading-tight mt-1">Tap here to unlock your full diagnostic report</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </button>
                                            
                                            {isPaid && (
                                                <div className="mt-4 flex justify-center">
                                                    <Button onClick={downloadReport} className="w-full h-14 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-lg">
                                                        <Download className="mr-2 w-5 h-5" /> Download Full PDF Report
                                                    </Button>
                                                </div>
                                            )}
                                        </div>

                                        {/* PAYWALL PANEL */}
                                        <div className="w-full">
                                            {!isPaid ? (
                                                <ReportPaywall 
                                                    ref={paywallRef}
                                                    onPaymentSuccess={handlePaymentSuccess} 
                                                    studentName={name}
                                                    email={email}
                                                />
                                            ) : (
                                                <div className="bg-green-500/5 border-2 border-green-500/20 rounded-2xl p-6 text-center space-y-4">
                                                    <div className="w-14 h-14 bg-green-500/10 rounded-full flex items-center justify-center mx-auto">
                                                        <Zap className="w-7 h-7 text-green-500" />
                                                    </div>
                                                    <h3 className="text-xl font-bold text-green-600">Report Unlocked!</h3>
                                                    <p className="text-sm text-muted-foreground">Your comprehensive diagnostic is ready for download.</p>
                                                    <Button onClick={() => navigate('/student')} className="w-full h-12 rounded-xl border-2 border-primary text-primary hover:bg-primary/5 font-bold">
                                                        Consult with Career Counselor
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </CardContent>
                </Card>
            </main>
            <div className="hidden md:block">
                <Footer />
            </div>
        </div>
    );
};

export default QuickAssessment;
