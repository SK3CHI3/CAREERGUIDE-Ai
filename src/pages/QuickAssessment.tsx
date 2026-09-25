import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Sparkles, ArrowRight, ArrowLeft, Brain, Target, User, MapPin, GraduationCap } from "lucide-react";
import BrandedLoader from "@/components/BrandedLoader";
import { aiCareerService } from "@/lib/ai-service";
import { ReportGenerator, type GuestProfile } from "@/lib/report-generator";
import { type QuickAssessmentBrief } from "@/lib/quick-assessment-report";
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

    const [currentStep, setCurrentStep] = useState(1);
    const [subStep, setSubStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Phase 1: Identity & Academics
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [grade, setGrade] = useState("");
    const [pathway, setPathway] = useState<'stem' | 'arts' | 'social' | 'techvoc' | null>(null);
    const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
    const [subjectPerformance, setSubjectPerformance] = useState<Record<string, 'struggling' | 'passing' | 'good' | 'excelling'>>({});
    const [schoolPathways, setSchoolPathways] = useState<string[]>([]);

    // Phase 2: Interests & Activities
    const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
    const [customInterest, setCustomInterest] = useState("");
    const [clubs, setClubs] = useState<string[]>([]);

    // Phase 3: Parent Expectations (Grades 7-9)
    const [parentExpectation, setParentExpectation] = useState("");
    const [parentAlignment, setParentAlignment] = useState<'same' | 'unsure' | 'different'>('unsure');

    // Phase 4: Your Vision
    const [futureVision, setFutureVision] = useState("");
    const [postSecondaryPlan, setPostSecondaryPlan] = useState("");
    const [budgetRange, setBudgetRange] = useState("");
    const [specificChallenges, setSpecificChallenges] = useState<string[]>([]);

    const [guestProfile, setGuestProfile] = useState<GuestProfile>({});
    const [directionBrief, setDirectionBrief] = useState<QuickAssessmentBrief | null>(null);

    // LOAD PERSISTENCE
    useEffect(() => {
        const saved = localStorage.getItem('career_assessment_state');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (Date.now() - parsed.timestamp < 7200000) {
                    if (parsed.name) setName(parsed.name);
                    if (parsed.email) setEmail(parsed.email);
                    if (parsed.grade) setGrade(parsed.grade);
                    if (parsed.pathway) setPathway(parsed.pathway);
                    if (parsed.selectedSubjects?.length) setSelectedSubjects(parsed.selectedSubjects);
                    if (parsed.subjectPerformance) setSubjectPerformance(parsed.subjectPerformance);
                    if (parsed.schoolPathways?.length) setSchoolPathways(parsed.schoolPathways);
                    if (parsed.selectedInterests?.length) setSelectedInterests(parsed.selectedInterests);
                    if (parsed.clubs?.length) setClubs(parsed.clubs);
                    if (parsed.parentExpectation) setParentExpectation(parsed.parentExpectation);
                    if (parsed.parentAlignment) setParentAlignment(parsed.parentAlignment);
                    if (parsed.futureVision) setFutureVision(parsed.futureVision);
                    if (parsed.postSecondaryPlan) setPostSecondaryPlan(parsed.postSecondaryPlan);
                    if (parsed.budgetRange) setBudgetRange(parsed.budgetRange);
                    if (parsed.specificChallenges?.length) setSpecificChallenges(parsed.specificChallenges);
                    if (parsed.currentStep) setCurrentStep(parsed.currentStep);
                    if (parsed.subStep) setSubStep(parsed.subStep);
                }
            } catch (e) {
                console.error("Failed to restore assessment state");
            }
        }
    }, []);

    // SAVE PERSISTENCE
    useEffect(() => {
        if (currentStep >= 1 && currentStep < 5) {
            localStorage.setItem('career_assessment_state', JSON.stringify({
                name, email, grade, pathway, selectedSubjects, subjectPerformance, schoolPathways,
                selectedInterests, clubs, parentExpectation, parentAlignment, futureVision,
                postSecondaryPlan, budgetRange, specificChallenges, currentStep, subStep, timestamp: Date.now()
            }));
        }
    }, [currentStep, subStep, name, email, grade, pathway, selectedSubjects, subjectPerformance, schoolPathways, selectedInterests, clubs, parentExpectation, parentAlignment, futureVision, postSecondaryPlan, budgetRange, specificChallenges]);

    const SUBJECT_DATA = {
        cbc_junior: ["Mathematics", "English", "Kiswahili", "Integrated Science", "Health Education", "Pre-Technical & Pre-Career Studies", "Social Studies", "Business Studies", "Agriculture & Nutrition", "Life Skills Education", "Creative Arts and Sports", "Religious Education (CRE/IRE/HRE)"],
        cbc_senior_stem: ["Mathematics", "English", "Kiswahili", "Physics", "Chemistry", "Biology", "Computer Science", "Further Mathematics", "Technical Drawing", "Agriculture & Nutrition"],
        cbc_senior_arts: ["English", "Kiswahili", "Mathematics", "Fine Art & Design", "Music", "Drama & Theatre", "Physical Education & Sports Science", "Media & Film Studies", "Fashion & Design"],
        cbc_senior_social: ["English", "Kiswahili", "Mathematics", "History & Citizenship", "Geography", "Business Studies & Economics", "Religious Education", "Law", "Sociology"],
        cbc_senior_techvoc: ["English", "Kiswahili", "Mathematics", "Building & Construction", "Electrical & Electronics", "Mechanical Engineering", "Agriculture", "Home Science", "Hairdressing & Beauty", "Plumbing & Carpentry", "ICT / Computer Studies"]
    };

    const GRADES = { cbc: ["Grade 7", "Grade 9", "Grade 11"] };

    const clubOptions = ["Science club", "Debate", "Drama/Theatre", "Sports team", "Music/Choir", "Art/Design", "Coding/Robotics", "Business club", "Community service", "Religious group"];
    const parentExpectationOptions = ["Doctor", "Engineer", "Lawyer", "Teacher", "Business owner", "Farmer/Agriculture", "Tech/IT", "Government worker", "Religious leader", "They don't have a preference"];
    const postSecondaryOptions = ["University", "College/TVET/Diploma", "Start working", "Not decided yet"];
    const budgetOptions = ["Government-sponsored (KUCCPS)", "Self-sponsored (parents paying)", "Scholarship/bursary", "Not sure yet", "Not relevant (going straight to work)"];
    const challengeOptions = ["Not sure which university/college to apply to", "Worried about KUCCPS points / cut-off marks", "My parents want something different from me", "I'm struggling academically", "I don't know what career options exist in my pathway", "Financial concerns"];

    const getAvailableSubjects = () => {
        if (!grade) return [];
        if (grade === 'Grade 11') {
            if (!pathway) return [];
            return SUBJECT_DATA[`cbc_senior_${pathway}` as keyof typeof SUBJECT_DATA];
        }
        return SUBJECT_DATA.cbc_junior;
    };

    const handleNext = () => {
        setError(null);
        if (currentStep === 1) {
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
                if (selectedSubjects.length === 0) return setError("Please select at least one subject");
                // Check if all selected subjects have performance ratings
                const missingPerformance = selectedSubjects.filter(s => !subjectPerformance[s]);
                if (missingPerformance.length > 0) return setError("Please rate your performance in all selected subjects");
                // Check school pathways for Grades 7-9
                if (grade !== 'Grade 11' && schoolPathways.length === 0) return setError("Please select which pathways your school offers");
            }
        }
        if (currentStep === 2) {
            if (selectedInterests.length === 0) return setError("Please select at least one interest");
        }
        if (currentStep === 3) {
            if (grade !== 'Grade 11') {
                // Grades 7-9: validate parent expectations
                if (!parentExpectation.trim()) return setError("Please share your parent/guardian's expectations");
            } else {
                // Grade 11: validate vision fields (shown at step 3 for Grade 11)
                if (!futureVision.trim()) return setError("Please describe your vision for the future");
                if (!postSecondaryPlan) return setError("Please select your post-secondary plan");
                if (specificChallenges.length === 0) return setError("Please select at least one challenge");
                // Grade 11: step 3 is the last step, call finishAssessment directly
                finishAssessment();
                return;
            }
        }
        if (currentStep === 4) {
            if (grade !== 'Grade 11') {
                // Grades 7-9: validate vision fields
                if (!futureVision.trim()) return setError("Please describe your vision for the future");
            }
            // Grade 11: no validation needed at step 4, just proceed to finish
        }
        if (currentStep < (grade === 'Grade 11' ? 4 : 5)) {
            setCurrentStep(currentStep + 1);
            setSubStep(1);
        } else {
            finishAssessment();
        }
    };

    const handleBack = () => {
        setError(null);
        if (currentStep === 1 && subStep > 1) {
            setSubStep(subStep - 1);
        } else if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    };

    const finishAssessment = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const profile: GuestProfile = {
                name, email, curriculum: 'cbc', grade, pathway: pathway || undefined,
                subjects: selectedSubjects, interests: selectedInterests,
                dreamJob: targetCareer || undefined
            };
            setGuestProfile(profile);

            // Load career fields from database
            console.log('Fetching career fields for grade:', grade);
            const careerFields = await dashboardService.getCareerFields(grade).catch((err) => {
                console.error('Failed to load career fields:', err);
                throw new Error('Failed to load career fields. Please try again.');
            });

            console.log('Career fields received:', {
                count: careerFields?.length,
                fields: careerFields?.slice(0, 5).map(f => ({ name: f.name, pathway: f.cbc_pathway }))
            });

            if (!careerFields || careerFields.length < 3) {
                console.error('Not enough career fields:', careerFields?.length);
                throw new Error(`Not enough career fields available (${careerFields?.length || 0} found). Please contact support.`);
            }

            const quickAssessment = {
                grade: profile.grade || '',
                pathway: profile.pathway,
                name, email,
                subjects: selectedSubjects,
                subjectPerformance,
                schoolPathways,
                interests: selectedInterests,
                clubs,
                parentExpectation: grade !== 'Grade 11' ? parentExpectation : '',
                parentAlignment: grade !== 'Grade 11' ? parentAlignment : 'unsure',
                futureVision,
                postSecondaryPlan: grade === 'Grade 11' ? postSecondaryPlan : undefined,
                budgetRange: grade === 'Grade 11' ? budgetRange : undefined,
                specificChallenges: grade === 'Grade 11' ? specificChallenges : undefined,
                targetCareer: targetCareer || undefined,
                availableCareerFields: careerFields,
            };

            const brief = await aiCareerService.generateQuickAssessmentBrief({ quickAssessment });

            console.log('Brief received from AI:', {
                hasBrief: !!brief,
                hasCareerFields: !!brief?.careerFields,
                careerFieldsLength: brief?.careerFields?.length,
                briefKeys: brief ? Object.keys(brief) : []
            });

            if (!brief || !brief.careerFields || brief.careerFields.length === 0) {
                console.error('Invalid brief returned:', brief);
                throw new Error('The AI returned an invalid result. Please try again.');
            }

            console.log('Setting direction brief and moving to step 5');
            setDirectionBrief(brief);
            localStorage.removeItem('career_assessment_state');
            // Small delay to ensure state updates are batched together
            await new Promise(resolve => setTimeout(resolve, 0));
            setCurrentStep(5);
        } catch (err: unknown) {
            console.error('Assessment generation failed:', err);
            setError((err as Error).message || 'Failed to generate assessment. Please try again.');
            setCurrentStep(4); // Go back to last step so they can retry
        } finally {
            setIsLoading(false);
        }
    };

    const downloadReport = async () => {
        if (!directionBrief) return;
        try {
            const html = ReportGenerator.generateQuickAssessmentPDFReport(guestProfile, directionBrief);
            await ReportGenerator.downloadPDF(html, `${guestProfile.name || 'CareerGuide'}-Direction-Brief.pdf`);
        } catch (err) {
            console.error(err);
            setError('Failed to download report. Please try again.');
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
                    <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent pb-1">CBC Pathway Assessment</h1>
                    <p className="text-base text-muted-foreground mt-2">Discover career fields that match your performance, interests, and CBC pathway.</p>
                </div>

                <div className="mb-6">
                    <div className="flex justify-center gap-1 md:gap-2 mb-2">
                        {Array.from({ length: grade === 'Grade 11' ? 4 : 5 }, (_, i) => i + 1).map(s => (
                            <div key={s} className={`h-1 md:h-2 flex-1 max-w-[60px] rounded-full transition-all ${currentStep >= s ? 'bg-primary shadow-[0_0_10px_rgba(var(--primary),0.5)]' : 'bg-muted'}`} />
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
                            {/* PHASE 1: Identity & Academics */}
                            {currentStep === 1 && (
                                <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                                    <div className="text-center">
                                        <h2 className="text-2xl md:text-3xl font-bold flex items-center justify-center gap-2"><User className="w-6 h-6 md:w-8 md:h-8 text-primary" /> Phase 1: Identity & Academics</h2>
                                    </div>

                                    <div className="space-y-5">
                                        {subStep === 1 && (
                                            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
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

                                        {subStep === 2 && (
                                            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                                <div className="space-y-4">
                                                    <Label className="text-base font-semibold">Current Grade / Level</Label>
                                                    <div className="grid grid-cols-3 gap-2">
                                                        {GRADES.cbc.map(g => (
                                                            <button key={g} type="button" onClick={() => { setGrade(g); setSelectedSubjects([]); setSubjectPerformance({}); if (g !== 'Grade 11') { setPathway(null); setSchoolPathways([]); } }}
                                                                className={`p-2 text-sm rounded-lg border-2 transition-all font-medium ${grade === g ? 'border-primary bg-primary/10 text-primary shadow-sm' : 'border-card-border hover:border-primary/50'}`}>{g}</button>
                                                        ))}
                                                    </div>
                                                </div>

                                                {grade === 'Grade 11' && (
                                                    <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                                                        <Label className="text-base font-bold text-primary">Senior Secondary Pathway</Label>
                                                        <div className="grid grid-cols-2 gap-2">
                                                            {([['stem', 'STEM'], ['arts', 'Arts & Sports'], ['social', 'Social Sciences'], ['techvoc', 'Technical & Vocational']] as const).map(([p, label]) => (
                                                                <button key={p} type="button" onClick={() => { setPathway(p); setSelectedSubjects([]); setSubjectPerformance({}); }}
                                                                    className={`p-3 rounded-xl border-2 transition-all font-bold text-xs tracking-wider ${pathway === p ? 'border-primary bg-primary text-primary-foreground' : 'border-card-border hover:border-primary/50 bg-card'}`}>{label}</button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {grade && grade !== 'Grade 11' && (
                                                    <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                                                        <Label className="text-base font-bold text-primary">Which pathways does your school offer?</Label>
                                                        <p className="text-sm text-muted-foreground">Select all that apply</p>
                                                        <div className="space-y-2">
                                                            {['STEM', 'Social Sciences', 'Arts & Sports Science'].map(p => (
                                                                <button key={p} type="button" onClick={() => setSchoolPathways(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p])}
                                                                    className={`w-full p-3 rounded-xl border-2 transition-all text-left ${schoolPathways.includes(p) ? 'border-primary bg-primary/10 text-primary' : 'border-card-border hover:border-primary/50 bg-card'}`}>{p}</button>
                                                            ))}
                                                            <button type="button" onClick={() => setSchoolPathways(['Not sure'])}
                                                                className={`w-full p-3 rounded-xl border-2 transition-all text-left ${schoolPathways.includes('Not sure') ? 'border-primary bg-primary/10 text-primary' : 'border-card-border hover:border-primary/50 bg-card'}`}>Not sure</button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {subStep === 3 && (
                                            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                                <Label className="text-base font-semibold mb-2 block">Select your subjects and rate your performance</Label>
                                                <div className="flex flex-wrap gap-2 mb-4">
                                                    {getAvailableSubjects().map(sub => (
                                                        <button key={sub} type="button" onClick={() => {
                                                            setSelectedSubjects(prev => {
                                                                const newSubjects = prev.includes(sub) ? prev.filter(x => x !== sub) : [...prev, sub];
                                                                if (!newSubjects.includes(sub)) {
                                                                    setSubjectPerformance(perf => { const { [sub]: _, ...rest } = perf; return rest; });
                                                                }
                                                                return newSubjects;
                                                            });
                                                        }} className={`px-3 py-2 text-sm rounded-lg border-2 transition-all ${selectedSubjects.includes(sub) ? 'border-primary bg-primary text-primary-foreground' : 'border-card-border bg-card hover:border-primary/50 text-foreground'}`}>{sub}</button>
                                                    ))}
                                                </div>

                                                {selectedSubjects.length > 0 && (
                                                    <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                                                        <Label className="text-sm font-semibold">Rate your performance in each subject:</Label>
                                                        {selectedSubjects.map(sub => (
                                                            <div key={sub} className="space-y-2">
                                                                <p className="text-sm font-medium">{sub}</p>
                                                                <div className="grid grid-cols-4 gap-2">
                                                                    {(['struggling', 'passing', 'good', 'excelling'] as const).map(level => (
                                                                        <button key={level} type="button" onClick={() => setSubjectPerformance(prev => ({ ...prev, [sub]: level }))}
                                                                            className={`p-2 text-xs rounded-lg border-2 transition-all capitalize ${subjectPerformance[sub] === level ? 'border-primary bg-primary/10 text-primary font-bold' : 'border-card-border hover:border-primary/50'}`}>{level}</button>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    <div className="pt-4 flex justify-between gap-4">
                                        {subStep > 1 && (
                                            <Button variant="outline" onClick={handleBack} className="h-12 md:h-14 px-6 md:px-8 border-2 font-bold"><ArrowLeft className="mr-2 w-5 h-5" /> Back</Button>
                                        )}
                                        <div className="flex-1" />
                                        <Button onClick={handleNext} className="h-12 md:h-14 px-8 text-base md:text-lg rounded-2xl bg-primary shadow-lg hover:translate-x-1 transition-transform">
                                            {subStep < 3 ? 'Continue' : 'Next Phase'} <ArrowRight className="ml-2 w-5 h-5" />
                                        </Button>
                                    </div>
                                </motion.div>
                            )}

                            {/* PHASE 2: Interests & Activities */}
                            {currentStep === 2 && (
                                <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                                    <div className="text-center">
                                        <h2 className="text-2xl md:text-3xl font-bold flex items-center justify-center gap-2"><Target className="w-8 h-8 text-primary" /> Phase 2: Interests & Activities</h2>
                                        <p className="text-muted-foreground mt-2">What do you enjoy doing?</p>
                                    </div>

                                    <div className="space-y-3 max-h-[60vh] overflow-y-auto p-2 custom-scrollbar">
                                        {INTEREST_CATEGORIES.map(cat => {
                                            const isExpanded = selectedInterests.some(i => cat.items.includes(i));
                                            return (
                                                <div key={cat.id} className="space-y-2">
                                                    <button type="button" onClick={() => {
                                                        const allSelected = cat.items.every(item => selectedInterests.includes(item));
                                                        if (allSelected) setSelectedInterests(prev => prev.filter(i => !cat.items.includes(i)));
                                                        else setSelectedInterests(prev => [...new Set([...prev, ...cat.items])]);
                                                    }} className={`w-full p-3 rounded-xl border-2 transition-all text-left font-semibold text-sm flex items-center justify-between ${isExpanded ? 'border-primary bg-primary/10 text-primary' : 'border-card-border hover:border-primary/50 bg-card/50'}`}>
                                                        <span>{cat.label}</span>
                                                        <span className="text-xs font-normal text-muted-foreground">{cat.items.filter(i => selectedInterests.includes(i)).length}/{cat.items.length}</span>
                                                    </button>
                                                    {isExpanded && (
                                                        <div className="flex flex-wrap gap-2 pl-2 animate-in fade-in slide-in-from-top-2 duration-200">
                                                            {cat.items.map(item => (
                                                                <button key={item} type="button" onClick={() => setSelectedInterests(prev => prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item])}
                                                                    className={`px-3 py-1.5 text-xs rounded-lg border-2 transition-all ${selectedInterests.includes(item) ? 'border-primary bg-primary text-primary-foreground' : 'border-card-border hover:border-primary/50 bg-background/50'}`}>{item}</button>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>

                                    <div className="space-y-2 pt-2">
                                        <Label className="text-sm font-semibold">Don't see yours? Add it here.</Label>
                                        <div className="flex gap-2">
                                            <Input value={customInterest} onChange={e => setCustomInterest(e.target.value)} placeholder="Type your interest..." className="flex-1 h-10 rounded-xl border-2"
                                                onKeyDown={e => { if (e.key === 'Enter' && customInterest.trim()) { setSelectedInterests(prev => [...prev, customInterest.trim()]); setCustomInterest(''); } }} />
                                            <Button type="button" onClick={() => { if (customInterest.trim()) { setSelectedInterests(prev => [...prev, customInterest.trim()]); setCustomInterest(''); } }} className="h-10 px-4 rounded-xl bg-primary">Add</Button>
                                        </div>
                                    </div>

                                    <div className="space-y-3 pt-4">
                                        <Label className="text-base font-semibold">What clubs or activities are you involved in?</Label>
                                        <div className="grid grid-cols-2 gap-2">
                                            {clubOptions.map(club => (
                                                <button key={club} type="button" onClick={() => setClubs(prev => prev.includes(club) ? prev.filter(x => x !== club) : [...prev, club])}
                                                    className={`p-3 rounded-xl border-2 transition-all text-sm ${clubs.includes(club) ? 'border-primary bg-primary/10 text-primary' : 'border-card-border hover:border-primary/50 bg-card'}`}>{club}</button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="pt-4 flex justify-between">
                                        <Button variant="outline" onClick={handleBack} className="h-12 md:h-14 px-6 md:px-8 border-2 font-bold"><ArrowLeft className="mr-2 w-5 h-5" /> Back</Button>
                                        <Button onClick={handleNext} className="h-12 md:h-14 px-6 md:px-8 bg-primary shadow-lg hover:translate-x-1 transition-transform">Continue <ArrowRight className="ml-2 w-5 h-5" /></Button>
                                    </div>
                                </motion.div>
                            )}

                            {/* PHASE 3: Parent Expectations (Grades 7-9 only) */}
                            {currentStep === 3 && grade !== 'Grade 11' && (
                                <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                                    <div className="text-center">
                                        <h2 className="text-2xl md:text-3xl font-bold flex items-center justify-center gap-2"><MapPin className="w-8 h-8 text-primary" /> Phase 3: Parent Expectations</h2>
                                        <p className="text-muted-foreground mt-2">What does your family hope for you?</p>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <Label className="text-base font-semibold">What career does your parent/guardian want for you?</Label>
                                            <div className="grid grid-cols-2 gap-2 mt-3">
                                                {parentExpectationOptions.map(opt => (
                                                    <button key={opt} type="button" onClick={() => setParentExpectation(opt)}
                                                        className={`p-3 rounded-xl border-2 transition-all text-sm ${parentExpectation === opt ? 'border-primary bg-primary/10 text-primary font-bold' : 'border-card-border hover:border-primary/50 bg-card'}`}>{opt}</button>
                                                ))}
                                            </div>
                                            <Input value={parentExpectation} onChange={e => setParentExpectation(e.target.value)} placeholder="Or type a different expectation..." className="mt-3 text-base p-4 border-2 bg-background/50" />
                                        </div>

                                        <div>
                                            <Label className="text-base font-semibold">How do you feel about that?</Label>
                                            <div className="grid grid-cols-3 gap-2 mt-3">
                                                {([['same', 'I want the same thing'], ['unsure', "I'm not sure"], ['different', 'I want something different']] as const).map(([val, label]) => (
                                                    <button key={val} type="button" onClick={() => setParentAlignment(val)}
                                                        className={`p-3 rounded-xl border-2 transition-all text-sm ${parentAlignment === val ? 'border-primary bg-primary/10 text-primary font-bold' : 'border-card-border hover:border-primary/50 bg-card'}`}>{label}</button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-4 flex justify-between">
                                        <Button variant="outline" onClick={handleBack} className="h-12 md:h-14 px-6 md:px-8 border-2 font-bold"><ArrowLeft className="mr-2 w-5 h-5" /> Back</Button>
                                        <Button onClick={handleNext} className="h-12 md:h-14 px-6 md:px-8 bg-primary shadow-lg hover:translate-x-1 transition-transform">Continue <ArrowRight className="ml-2 w-5 h-5" /></Button>
                                    </div>
                                </motion.div>
                            )}

                            {/* PHASE 4: Your Vision (or Phase 3 for Grade 11) */}
                            {currentStep === (grade === 'Grade 11' ? 3 : 4) && (
                                <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                                    <div className="text-center">
                                        <h2 className="text-2xl md:text-3xl font-bold flex items-center justify-center gap-2"><GraduationCap className="w-8 h-8 text-primary" /> Phase {grade === 'Grade 11' ? 3 : 4}: Your Vision</h2>
                                        <p className="text-muted-foreground mt-2">What kind of future do you imagine?</p>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <Label className="text-base font-semibold">Describe the life you want in 5-10 years</Label>
                                            <p className="text-sm text-muted-foreground mb-2">Where you live, what you do, what matters to you</p>
                                            <textarea value={futureVision} onChange={e => setFutureVision(e.target.value)} placeholder="e.g. I want to live in Nairobi, work in tech, and help solve problems that affect my community..." className="w-full h-32 p-4 border-2 rounded-xl bg-background/50 resize-none" />
                                        </div>

                                        {grade === 'Grade 11' && (
                                            <>
                                                <div>
                                                    <Label className="text-base font-semibold">What's your plan after Senior School?</Label>
                                                    <div className="grid grid-cols-2 gap-2 mt-3">
                                                        {postSecondaryOptions.map(opt => (
                                                            <button key={opt} type="button" onClick={() => setPostSecondaryPlan(opt)}
                                                                className={`p-3 rounded-xl border-2 transition-all text-sm ${postSecondaryPlan === opt ? 'border-primary bg-primary/10 text-primary font-bold' : 'border-card-border hover:border-primary/50 bg-card'}`}>{opt}</button>
                                                        ))}
                                                    </div>
                                                </div>

                                                {postSecondaryPlan !== 'Start working' && (
                                                    <div>
                                                        <Label className="text-base font-semibold">Budget range for further education</Label>
                                                        <div className="grid grid-cols-1 gap-2 mt-3">
                                                            {budgetOptions.map(opt => (
                                                                <button key={opt} type="button" onClick={() => setBudgetRange(opt)}
                                                                    className={`p-3 rounded-xl border-2 transition-all text-sm text-left ${budgetRange === opt ? 'border-primary bg-primary/10 text-primary font-bold' : 'border-card-border hover:border-primary/50 bg-card'}`}>{opt}</button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                <div>
                                                    <Label className="text-base font-semibold">What's your biggest challenge right now? (pick 1-2)</Label>
                                                    <div className="space-y-2 mt-3">
                                                        {challengeOptions.map(opt => (
                                                            <button key={opt} type="button" onClick={() => setSpecificChallenges(prev => prev.includes(opt) ? prev.filter(x => x !== opt) : prev.length < 2 ? [...prev, opt] : prev)}
                                                                className={`w-full p-3 rounded-xl border-2 transition-all text-sm text-left ${specificChallenges.includes(opt) ? 'border-primary bg-primary/10 text-primary' : 'border-card-border hover:border-primary/50 bg-card'}`}>{opt}</button>
                                                        ))}
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </div>

                                    <div className="pt-4 flex justify-between">
                                        <Button variant="outline" onClick={handleBack} className="h-12 md:h-14 px-6 md:px-8 border-2 font-bold"><ArrowLeft className="mr-2 w-5 h-5" /> Back</Button>
                                        <Button onClick={handleNext} className="h-12 md:h-14 px-6 md:px-8 bg-primary shadow-lg hover:translate-x-1 transition-transform">Finish <Sparkles className="ml-2 w-5 h-5" /></Button>
                                    </div>
                                </motion.div>
                            )}

                            {/* STEP 5: RESULTS */}
                            {currentStep === 5 && (
                                <motion.div key="step5" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="py-4 max-w-3xl mx-auto">
                                    {directionBrief ? (
                                        <QuickAssessmentDirectionBrief
                                            profile={guestProfile}
                                            brief={directionBrief}
                                            onDownload={downloadReport}
                                            onConsult={() => navigate('/student')}
                                        />
                                    ) : (
                                        <div className="space-y-4">
                                            <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-5 text-center">
                                                <p className="text-sm text-destructive font-semibold">Your result is not ready yet.</p>
                                                <p className="text-xs text-muted-foreground mt-2">Something went wrong while generating your brief.</p>
                                            </div>
                                            <div className="flex gap-3">
                                                <Button variant="outline" onClick={() => setCurrentStep(4)} className="flex-1 h-12 border-2 font-bold">
                                                    <ArrowLeft className="mr-2 w-4 h-4" /> Go Back
                                                </Button>
                                                <Button onClick={finishAssessment} className="flex-1 h-12 bg-primary font-bold">
                                                    Try Again
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </CardContent>
                </Card>
            </main>

            <Footer />

            {isLoading && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
                    <BrandedLoader showText text="Generating your CBC pathway brief..." />
                </div>
            )}
        </div>
    );
};

export default QuickAssessment;
