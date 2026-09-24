import { useState, useRef, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Sparkles, Download, ArrowRight, ArrowLeft, CheckCircle, Brain, Target, User, Heart, ShieldAlert, Rocket } from "lucide-react";
import BrandedLoader from "@/components/BrandedLoader";
import { aiCareerService } from "@/lib/ai-service";
import { ReportGenerator, type GuestProfile } from "@/lib/report-generator";
import { createFallbackQuickAssessmentBrief, type QuickAssessmentBrief } from "@/lib/quick-assessment-report";
import { dashboardService } from "@/lib/dashboard-service";
import QuickAssessmentDirectionBrief from "@/components/QuickAssessmentDirectionBrief";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import BackgroundGradient from "@/components/BackgroundGradient";
import { INTEREST_CATEGORIES } from "@/data/interest-categories";

const QuickAssessment = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const targetCareer = searchParams.get('career');
    const isCareerFitMode = !!targetCareer;

    const reportSectionRef = useRef<HTMLDivElement>(null);
    const [currentStep, setCurrentStep] = useState(1);
    const [subStep, setSubStep] = useState(1); // For Phase 1 sub-steps
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Phase 1: Academics
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [curriculum] = useState<'cbc'>('cbc');
    const [grade, setGrade] = useState("");
    const [pathway, setPathway] = useState<'stem' | 'arts' | 'social' | 'techvoc' | null>(null);
    const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);

    // Phase 2: Interests
    const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
    const [customInterest, setCustomInterest] = useState("");

    // Phase 3: Values & Work Style
    const [selectedValues, setSelectedValues] = useState<string[]>([]);
    const [workStyle, setWorkStyle] = useState("");

    // Phase 4: working preferences (three practical questions, not a personality test)
    const [mbtiEnergy, setMbtiEnergy] = useState("");
    const [mbtiDecisions, setMbtiDecisions] = useState("");
    const [mbtiStructure, setMbtiStructure] = useState("");

    // Phase 5: Reality
    const [barrier, setBarrier] = useState("");
    const [experience, setExperience] = useState("");

    // Phase 6: Readiness
    const [readiness, setReadiness] = useState("");
    const [guestProfile, setGuestProfile] = useState<GuestProfile>({});
    const [directionBrief, setDirectionBrief] = useState<QuickAssessmentBrief | null>(null);

    // LOAD PERSISTENCE - Restore all form fields if user refreshed mid-assessment
    useEffect(() => {
        const saved = localStorage.getItem('career_assessment_state');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                // Only restore if it's less than 2 hours old
                if (Date.now() - parsed.timestamp < 7200000) {
                    if (parsed.name) setName(parsed.name);
                    if (parsed.email) setEmail(parsed.email);
                    if (parsed.grade) setGrade(parsed.grade);
                    if (parsed.pathway) setPathway(parsed.pathway);
                    if (parsed.selectedSubjects?.length) setSelectedSubjects(parsed.selectedSubjects);
                    if (parsed.selectedInterests?.length) setSelectedInterests(parsed.selectedInterests);
                    if (parsed.selectedValues?.length) setSelectedValues(parsed.selectedValues);
                    if (parsed.workStyle) setWorkStyle(parsed.workStyle);
                    if (parsed.mbtiEnergy) setMbtiEnergy(parsed.mbtiEnergy);
                    if (parsed.mbtiDecisions) setMbtiDecisions(parsed.mbtiDecisions);
                    if (parsed.mbtiStructure) setMbtiStructure(parsed.mbtiStructure);
                    if (parsed.barrier) setBarrier(parsed.barrier);
                    if (parsed.experience) setExperience(parsed.experience);
                    if (parsed.readiness) setReadiness(parsed.readiness);
                    if (parsed.currentStep) setCurrentStep(parsed.currentStep);
                    if (parsed.subStep) setSubStep(parsed.subStep);
                }
            } catch (e) {
                console.error("Failed to restore assessment state");
            }
        }
    }, []);

    // SAVE PERSISTENCE - Save all form fields during steps 1-6
    useEffect(() => {
        if (currentStep >= 1 && currentStep < 7) {
            localStorage.setItem('career_assessment_state', JSON.stringify({
                name, email, grade, pathway, selectedSubjects, selectedInterests,
                selectedValues, workStyle, mbtiEnergy, mbtiDecisions, mbtiStructure,
                barrier, experience, readiness, currentStep, subStep, timestamp: Date.now()
            }));
        }
    }, [currentStep, subStep, name, email, grade, pathway, selectedSubjects, selectedInterests, selectedValues, workStyle, mbtiEnergy, mbtiDecisions, mbtiStructure, barrier, experience, readiness]);

    const SUBJECT_DATA = {
        cbc_junior: ["Mathematics", "English", "Kiswahili", "Integrated Science", "Health Education", "Pre-Technical & Pre-Career Studies", "Social Studies", "Business Studies", "Agriculture & Nutrition", "Life Skills Education", "Creative Arts and Sports", "Religious Education (CRE/IRE/HRE)"],
        cbc_senior_stem: ["Mathematics", "English", "Kiswahili", "Physics", "Chemistry", "Biology", "Computer Science", "Further Mathematics", "Technical Drawing", "Agriculture & Nutrition"],
        cbc_senior_arts: ["English", "Kiswahili", "Mathematics", "Fine Art & Design", "Music", "Drama & Theatre", "Physical Education & Sports Science", "Media & Film Studies", "Fashion & Design"],
        cbc_senior_social: ["English", "Kiswahili", "Mathematics", "History & Citizenship", "Geography", "Business Studies & Economics", "Religious Education", "Law", "Sociology"],
        cbc_senior_techvoc: ["English", "Kiswahili", "Mathematics", "Building & Construction", "Electrical & Electronics", "Mechanical Engineering", "Agriculture", "Home Science", "Hairdressing & Beauty", "Plumbing & Carpentry", "ICT / Computer Studies"]
    };

    const GRADES = {
        cbc: ["Grade 7", "Grade 9", "Grade 11"]
    };

    const valueOptions = ["Financial success and prosperity", "Making a meaningful impact on society", "Work-life balance and personal time", "Leadership and influence", "Creativity and innovation", "Job security and stability"];
    const workStyleOptions = ["Independent and autonomous", "Collaborative team environment", "Fast-paced and dynamic", "Structured and systematic", "Creative and flexible", "Research and analysis focused"];

    const barrierOptions = ["Financial constraints", "Unclear about my interests and strengths", "Fear of making the wrong choice", "Lack of mentorship or guidance", "Academic performance concerns", "No significant barriers at the moment"];
    const experienceOptions = ["School clubs, student leadership, or competitions", "Volunteering or community service", "Personal projects, creative work, or independent research", "Part-time job or internship", "None yet"];
    const readinessOptions = ["Ready to take action now", "Exploring my options carefully", "Need help understanding my path forward"];
    const getAvailableSubjects = () => {
        if (!grade) return [];

        // Grade 11 students need to select a pathway
        if (grade === 'Grade 11') {
            if (!pathway) return [];
            return SUBJECT_DATA[`cbc_senior_${pathway}` as keyof typeof SUBJECT_DATA];
        }

        // Grade 7 and 9 are Junior Secondary
        return SUBJECT_DATA.cbc_junior;
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
                if (!grade) return setError("Please select your current grade");
                if (grade === 'Grade 11' && !pathway) return setError("Please select your Senior Secondary pathway");
                setSubStep(3);
                return;
            }
            if (subStep === 3) {
                if (selectedSubjects.length === 0) return setError("Please select at least one subject area");
                setCurrentStep(2);
                return;
            }
        }
        
        if (currentStep === 2 && selectedInterests.length === 0) return setError("Please select at least one interest");
        if (currentStep === 3) {
            if (selectedValues.length < 2) return setError("Please select two core values");
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
            setSubStep(prev => prev - 1);
            return;
        }
        setCurrentStep(prev => prev - 1);
    };

    const [reportHtml, setReportHtml] = useState<string | null>(null);
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

    const finishAssessment = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const preferences = {
                focus: mbtiEnergy,
                decisions: mbtiDecisions,
                structure: mbtiStructure,
            };

            const profile: GuestProfile = {
                name,
                curriculum: 'cbc',
                grade,
                pathway: pathway || undefined,
                subjects: selectedSubjects,
                interests: selectedInterests,
                values: selectedValues,
                workStyle,
                workPreferences: Object.values(preferences),
                barriers: barrier,
                experience,
                readiness,
                dreamJob: targetCareer || undefined,
                careerGoals: "Seeking career alignment via Diagnostic Assessment."
            };
            setGuestProfile(profile);

            // The catalogue is the source of truth for the career names in this report.
            // A temporary catalogue failure still produces an honest local fallback brief.
            const catalogue = await dashboardService.getCareerPaths(undefined, 160).catch((catalogueError) => {
                console.warn('Could not load career catalogue for quick assessment:', catalogueError);
                return [];
            });

            const quickAssessment = {
                grade: profile.grade || '',
                pathway: profile.pathway,
                subjects: selectedSubjects,
                interests: selectedInterests,
                values: selectedValues,
                workStyle,
                preferences,
                barrier,
                experience,
                readiness,
                targetCareer: targetCareer || undefined,
                availableCareers: catalogue.map(({ id, title, category, description }) => ({ id, title, category, description })),
            };

            const payload = {
                name: profile.name,
                curriculum: 'Kenyan CBC',
                currentGrade: profile.grade,
                pathway: profile.pathway,
                subjects: profile.subjects,
                interests: profile.interests,
                constraints: [barrier],
                dreamJob: targetCareer || undefined,
                quickAssessment,
                availableCareers: quickAssessment.availableCareers,
            };

            let brief: QuickAssessmentBrief;
            try {
                brief = await aiCareerService.generateQuickAssessmentBrief(payload);
            } catch (aiError) {
                console.warn('Quick assessment AI brief failed; using the structured local fallback:', aiError);
                brief = createFallbackQuickAssessmentBrief(quickAssessment);
            }

            setDirectionBrief(brief);
            const html = ReportGenerator.generateQuickAssessmentPDFReport(profile, brief);
            setReportHtml(html);
            localStorage.removeItem('career_assessment_state');
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
            setIsGeneratingPdf(true);
            console.log("Starting PDF download process...");
            await ReportGenerator.downloadPDF(reportHtml, `${guestProfile.name || 'CareerGuide'}-Diagnostic-Report.pdf`);
            console.log("PDF download triggered successfully.");
        } catch (err) {
            console.error("PDF download failed:", err);
            setError("Failed to generate PDF. Please try again or contact support.");
        } finally {
            setIsGeneratingPdf(false);
        }
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
                    <p className="text-base text-muted-foreground mt-2">A practical direction brief built from your subjects, interests, values, work preferences, and real challenges.</p>
                </div>

                <div className="mb-6">
                    <div className="flex justify-center gap-1 md:gap-2 mb-2">
                        {[1, 2, 3, 4, 5, 6, 7].map(s => (
                            <div key={s} className={`h-1 md:h-2 flex-1 max-w-[30px] md:max-w-[60px] rounded-full transition-all ${currentStep >= s ? 'bg-primary shadow-[0_0_10px_rgba(var(--primary),0.5)]' : 'bg-muted'}`} />
                        ))}
                    </div>
                    {currentStep === 1 && (
                        <div className="flex justify-center gap-1 mt-1 md:hidden">
                            {[1, 2, 3].map(s => (
                                <div key={s} className={`h-0.5 w-4 rounded-full transition-all ${subStep >= s ? 'bg-primary/60' : 'bg-muted'}`} />
                            ))}
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
                                                    <Label className="text-base font-semibold">Current Grade / Level</Label>
                                                    <div className="grid grid-cols-3 gap-2">
                                                        {GRADES.cbc.map(g => (
                                                            <button
                                                                key={g}
                                                                type="button"
                                                                onClick={() => { setGrade(g); setSelectedSubjects([]); if (g !== 'Grade 11') setPathway(null); }}
                                                                className={`p-2 text-sm rounded-lg border-2 transition-all font-medium flex items-center justify-center ${
                                                                    grade === g
                                                                        ? 'border-primary bg-primary/10 text-primary shadow-sm'
                                                                        : 'border-card-border hover:border-primary/50'
                                                                }`}>
                                                                {g}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>

                                                {grade === 'Grade 11' && (
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

                                        {/* Sub-step 1.3: Subjects */}
                                        {subStep === 3 && (
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
                                        <p className="text-muted-foreground mt-2">Tap a category to pick specific interests, or add your own.</p>
                                    </div>

                                    <div className="space-y-3 max-h-[60vh] overflow-y-auto p-2 custom-scrollbar">
                                        {INTEREST_CATEGORIES.map(cat => {
                                            const isExpanded = selectedInterests.some(i => cat.items.includes(i));
                                            return (
                                                <div key={cat.id} className="space-y-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const allSelected = cat.items.every(item => selectedInterests.includes(item));
                                                            if (allSelected) {
                                                                setSelectedInterests(prev => prev.filter(i => !cat.items.includes(i)));
                                                            } else {
                                                                setSelectedInterests(prev => [...new Set([...prev, ...cat.items])]);
                                                            }
                                                        }}
                                                        className={`w-full p-3 rounded-xl border-2 transition-all text-left font-semibold text-sm flex items-center justify-between ${isExpanded ? 'border-primary bg-primary/10 text-primary' : 'border-card-border hover:border-primary/50 bg-card/50'}`}
                                                    >
                                                        <span>{cat.label}</span>
                                                        <span className="text-xs font-normal text-muted-foreground">
                                                            {cat.items.filter(i => selectedInterests.includes(i)).length}/{cat.items.length}
                                                        </span>
                                                    </button>
                                                    {isExpanded && (
                                                        <div className="flex flex-wrap gap-2 pl-2 animate-in fade-in slide-in-from-top-2 duration-200">
                                                            {cat.items.map(item => (
                                                                <button
                                                                    key={item}
                                                                    type="button"
                                                                    onClick={() => setSelectedInterests(prev => prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item])}
                                                                    className={`px-3 py-1.5 text-xs rounded-lg border-2 transition-all ${selectedInterests.includes(item) ? 'border-primary bg-primary text-primary-foreground' : 'border-card-border hover:border-primary/50 bg-background/50'}`}
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
                                                        setSelectedInterests(prev => [...prev, customInterest.trim()]);
                                                        setCustomInterest('');
                                                    }
                                                }}
                                            />
                                            <Button
                                                type="button"
                                                onClick={() => {
                                                    if (customInterest.trim()) {
                                                        setSelectedInterests(prev => [...prev, customInterest.trim()]);
                                                        setCustomInterest('');
                                                    }
                                                }}
                                                className="h-10 px-4 rounded-xl bg-primary"
                                            >
                                                Add
                                            </Button>
                                        </div>
                                        {selectedInterests.length > 0 && (
                                            <div className="flex flex-wrap gap-2 pt-2">
                                                {selectedInterests.map(i => (
                                                    <span key={i} className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-md bg-primary/10 text-primary border border-primary/20">
                                                        {i}
                                                        <button type="button" onClick={() => setSelectedInterests(prev => prev.filter(x => x !== i))} className="hover:text-destructive">
                                                            ×
                                                        </button>
                                                    </span>
                                                ))}
                                            </div>
                                        )}
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

                            {/* STEP 4: WORKING PREFERENCES */}
                            {currentStep === 4 && (
                                <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                                    <div className="text-center">
                                        <h2 className="text-2xl md:text-3xl font-bold flex items-center justify-center gap-2"><Brain className="w-8 h-8 text-primary" /> Phase 4: Working Preferences</h2>
                                        <p className="text-muted-foreground mt-2">These help us shape useful activities. They are not a personality test.</p>
                                    </div>

                                    <div className="space-y-6">
                                        <div>
                                            <Label className="text-base font-semibold block mb-2">1. Do you focus better...</Label>
                                            <div className="grid grid-cols-2 gap-2">
                                                <button type="button" onClick={() => setMbtiEnergy('Active groups')} className={`p-4 rounded-xl border-2 font-medium ${mbtiEnergy === 'Active groups' ? 'border-primary tracking-wide bg-primary/10 text-primary' : 'border-card-border hover:border-primary/50 bg-background/50'}`}>In active groups</button>
                                                <button type="button" onClick={() => setMbtiEnergy('Independent work')} className={`p-4 rounded-xl border-2 font-medium ${mbtiEnergy === 'Independent work' ? 'border-primary tracking-wide bg-primary/10 text-primary' : 'border-card-border hover:border-primary/50 bg-background/50'}`}>Working alone</button>
                                            </div>
                                        </div>

                                        <div>
                                            <Label className="text-base font-semibold block mb-2">2. Do you make decisions using...</Label>
                                            <div className="grid grid-cols-2 gap-2">
                                                <button type="button" onClick={() => setMbtiDecisions('Logic and data')} className={`p-4 rounded-xl border-2 font-medium ${mbtiDecisions === 'Logic and data' ? 'border-primary tracking-wide bg-primary/10 text-primary' : 'border-card-border hover:border-primary/50 bg-background/50'}`}>Logic and data</button>
                                                <button type="button" onClick={() => setMbtiDecisions('People and values')} className={`p-4 rounded-xl border-2 font-medium ${mbtiDecisions === 'People and values' ? 'border-primary tracking-wide bg-primary/10 text-primary' : 'border-card-border hover:border-primary/50 bg-background/50'}`}>People and values</button>
                                            </div>
                                        </div>

                                        <div>
                                            <Label className="text-base font-semibold block mb-2">3. Do you prefer...</Label>
                                            <div className="grid grid-cols-2 gap-2">
                                                <button type="button" onClick={() => setMbtiStructure('A clear schedule')} className={`p-4 rounded-xl border-2 font-medium ${mbtiStructure === 'A clear schedule' ? 'border-primary tracking-wide bg-primary/10 text-primary' : 'border-card-border hover:border-primary/50 bg-background/50'}`}>A clear schedule</button>
                                                <button type="button" onClick={() => setMbtiStructure('Flexibility')} className={`p-4 rounded-xl border-2 font-medium ${mbtiStructure === 'Flexibility' ? 'border-primary tracking-wide bg-primary/10 text-primary' : 'border-card-border hover:border-primary/50 bg-background/50'}`}>Flexibility</button>
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

                            {/* STEP 7: RESULTS */}
                            {currentStep === 7 && (
                                <div ref={reportSectionRef}>
                                <motion.div key="step7" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 py-4 max-w-3xl mx-auto">
                                    <div className="text-center space-y-2">
                                        <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center mx-auto">
                                            <CheckCircle className="w-6 h-6 text-green-500" />
                                        </div>
                                        <h2 className="text-xl md:text-2xl font-black tracking-tight">Your Direction Brief is ready</h2>
                                        <p className="text-sm text-muted-foreground">Three real careers to test, with practical next steps for {grade || 'your current grade'}.</p>
                                    </div>

                                    {directionBrief ? (
                                        <QuickAssessmentDirectionBrief profile={guestProfile} brief={directionBrief} />
                                    ) : (
                                        <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-5 text-center text-sm text-destructive">Your result is not ready yet. Please try generating the brief again.</div>
                                    )}

                                    <div className="space-y-3">
                                        <Button onClick={downloadReport} disabled={isGeneratingPdf || !reportHtml} className="w-full h-14 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-lg text-base disabled:opacity-70">
                                            {isGeneratingPdf ? <><BrandedLoader size="xs" showText={false} className="mr-2 inline-flex" /> Preparing your PDF...</> : <><Download className="mr-2 w-5 h-5" /> Download Direction Brief PDF</>}
                                        </Button>
                                        <Button variant="outline" onClick={() => navigate('/student')} className="w-full h-12 border-2 border-primary text-primary hover:bg-primary/5 font-bold">
                                            Consult with Career Counselor
                                        </Button>
                                    </div>
                                </motion.div>
                                </div>
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
