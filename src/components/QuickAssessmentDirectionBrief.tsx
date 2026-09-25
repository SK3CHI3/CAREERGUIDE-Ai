import { BookOpen, Compass, Lightbulb, MapPinned, MessageCircle, Target, TrendingUp, ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import type { GuestProfile } from '@/lib/report-generator';
import type { QuickAssessmentBrief, CareerFieldPossibility } from '@/lib/quick-assessment-report';

interface QuickAssessmentDirectionBriefProps {
  profile: GuestProfile;
  brief: QuickAssessmentBrief;
  onDownload: () => void;
  onConsult: () => void;
}

const getActionHref = (action: string) => {
  if (action.toLowerCase().includes('counsellor') || action.toLowerCase().includes('counselor')) return '/counselors';
  if (action.toLowerCase().includes('subject')) return '/subject-guide';
  return '/careers';
};

const pathwayColors = {
  'STEM': 'bg-blue-100 text-blue-800 border-blue-200',
  'Social Sciences': 'bg-purple-100 text-purple-800 border-purple-200',
  'Arts & Sports Science': 'bg-green-100 text-green-800 border-green-200',
};

const CareerFieldCard = ({ field, index, isGrade11 }: { field: CareerFieldPossibility; index: number; isGrade11: boolean }) => (
  <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
    <div className="flex gap-3">
      <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg text-xs font-black ${index === 1 ? 'bg-emerald-50 text-emerald-700' : 'bg-primary/10 text-primary'}`}>0{index + 1}</span>
      <div className="min-w-0 flex-1">
        <p className={`text-[11px] font-bold uppercase tracking-wide ${index === 1 ? 'text-emerald-700' : 'text-primary'}`}>Career field to explore</p>
        <h4 className="mt-1 text-lg font-bold text-slate-900">{field.field}</h4>
        <div className="mt-2 flex flex-wrap gap-2">
          <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${pathwayColors[field.cbc_pathway]}`}>
            {field.cbc_pathway}
          </span>
          <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs font-medium text-slate-700">
            {field.cbc_track}
          </span>
        </div>
      </div>
    </div>

    <div className="mt-4 space-y-3 text-sm leading-6 text-slate-700">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Subjects to prioritise</p>
        <div className="mt-1 flex flex-wrap gap-1.5">
          {field.subjectsToPrioritise.map((subject, i) => (
            <span key={i} className="inline-flex items-center rounded-md bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
              {subject}
            </span>
          ))}
        </div>
      </div>
      <div>
        <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Why it appeared</p>
        <p>{field.whyItAppeared}</p>
      </div>
      <div>
        <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">What still needs testing</p>
        <p>{field.realityToTest}</p>
      </div>
    </div>

    {isGrade11 && field.trainingRoutes && (
      <div className="mt-4 rounded-xl bg-slate-50 p-3">
        <p className="text-[11px] font-bold uppercase tracking-wide text-slate-600 mb-2">Training routes</p>
        <div className="space-y-2">
          {field.trainingRoutes.map((route, i) => (
            <div key={i} className="text-sm">
              <p className="font-semibold text-slate-900">{route.route}: {route.programme}</p>
              <p className="text-xs text-slate-600">{route.requirements}</p>
              <p className="text-xs text-slate-600">{route.budgetNote}</p>
            </div>
          ))}
        </div>
      </div>
    )}

    {isGrade11 && field.nextAction && (
      <div className={`mt-4 rounded-xl p-3 ${index === 1 ? 'bg-emerald-50' : 'bg-primary/[0.06]'}`}>
        <div className="flex gap-2">
          <TrendingUp className={`mt-0.5 h-4 w-4 shrink-0 ${index === 1 ? 'text-emerald-700' : 'text-primary'}`} />
          <div>
            <p className={`text-sm font-bold ${index === 1 ? 'text-emerald-800' : 'text-primary'}`}>{field.nextAction.title}</p>
            <p className="mt-1 text-sm leading-5 text-slate-700">{field.nextAction.instruction}</p>
            <p className="mt-2 text-xs font-semibold text-slate-500">Deadline: {field.nextAction.deadline}</p>
          </div>
        </div>
      </div>
    )}

    {!isGrade11 && field.starterActivity && (
      <div className={`mt-4 rounded-xl p-3 ${index === 1 ? 'bg-emerald-50' : 'bg-primary/[0.06]'}`}>
        <div className="flex gap-2">
          <Lightbulb className={`mt-0.5 h-4 w-4 shrink-0 ${index === 1 ? 'text-emerald-700' : 'text-primary'}`} />
          <div>
            <p className={`text-sm font-bold ${index === 1 ? 'text-emerald-800' : 'text-primary'}`}>{field.starterActivity.title}</p>
            <p className="mt-1 text-sm leading-5 text-slate-700">{field.starterActivity.instruction}</p>
            <p className="mt-2 text-xs leading-5 text-slate-500"><strong>Notice:</strong> {field.starterActivity.reflectionPrompt}</p>
          </div>
        </div>
      </div>
    )}
  </article>
);

const TOTAL_PAGES = 3;

const QuickAssessmentDirectionBrief = ({ profile, brief, onDownload, onConsult }: QuickAssessmentDirectionBriefProps) => {
  const [page, setPage] = useState(0);
  const isGrade11 = profile.grade === 'Grade 11';

  const goNext = () => setPage(p => Math.min(p + 1, TOTAL_PAGES - 1));
  const goPrev = () => setPage(p => Math.max(p - 1, 0));

  return (
    <div className="space-y-4">
      {/* Page indicator */}
      <div className="flex items-center justify-center gap-2">
        {Array.from({ length: TOTAL_PAGES }).map((_, i) => (
          <button key={i} onClick={() => setPage(i)} className={`h-2 rounded-full transition-all ${i === page ? 'w-8 bg-primary' : 'w-2 bg-muted hover:bg-muted/80'}`} />
        ))}
      </div>

      <section className="relative rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="p-4 sm:p-6 md:p-8">

          {/* PAGE 1: Your Picture */}
          {page === 0 && (
            <div className="space-y-6">
              <header className="flex items-start justify-between gap-4 border-b border-slate-200 pb-5">
                <div>
                  <img src="/logos/CareerGuide_Logo.webp" alt="CareerGuide AI" className="h-7 w-auto object-contain object-left" />
                  <p className="mt-4 text-xs font-bold uppercase tracking-[0.14em] text-primary">Quick Assessment</p>
                  <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{profile.name || 'Your'}'s Direction Brief</h2>
                  <p className="mt-2 text-sm text-slate-600">A practical guide for the next stage - not a final verdict.</p>
                </div>
                <div className="hidden rounded-xl bg-primary/10 px-3 py-2 text-right text-xs font-semibold text-primary sm:block">
                  <div>{profile.grade}</div>
                  {profile.pathway && <div className="mt-1 text-primary/80">{profile.pathway} pathway</div>}
                </div>
              </header>

              <div className="rounded-2xl border border-primary/10 bg-primary/[0.06] p-4">
                <div className="flex items-start gap-3">
                  <Compass className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-primary">Your current picture</p>
                    <p className="mt-1 text-sm leading-6 text-slate-700">{brief.studentSummary}</p>
                  </div>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">Where you are now</p>
                  <p className="mt-2 text-sm leading-6 text-slate-700">{brief.gradeContext}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-600">Your focus now</p>
                  <p className="mt-2 text-sm leading-6 text-slate-700">{brief.gradeFocus}</p>
                </div>
              </div>

              {!isGrade11 && brief.parentNote && (
                <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-amber-700">Your family's expectations</p>
                  <p className="mt-2 text-sm leading-6 text-slate-700">{brief.parentNote}</p>
                </div>
              )}

              {isGrade11 && brief.visionNote && (
                <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-indigo-700">Your vision</p>
                  <p className="mt-2 text-sm leading-6 text-slate-700">{brief.visionNote}</p>
                </div>
              )}
            </div>
          )}

          {/* PAGE 2: Career Fields */}
          {page === 1 && (
            <div className="space-y-5">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                <div>
                  <h3 className="font-bold text-slate-900">Three career fields to {isGrade11 ? 'pursue' : 'explore'}</h3>
                  <p className="text-sm text-slate-500">{isGrade11 ? 'Compare training routes and take action.' : 'Test the work before you decide.'}</p>
                </div>
              </div>
              <div className="space-y-4">
                {brief.careerFields.map((field, index) => (
                  <CareerFieldCard key={`${field.field}-${index}`} field={field} index={index} isGrade11={isGrade11} />
                ))}
              </div>
            </div>
          )}

          {/* PAGE 3: Action Plan + Next Steps */}
          {page === 2 && (
            <div className="space-y-6">
              <div className="border-b border-slate-200 pb-4">
                <div className="flex items-center gap-2">
                  <MapPinned className="h-5 w-5 text-primary" />
                  <div>
                    <h3 className="font-bold text-slate-900">Your action plan</h3>
                    <p className="text-sm text-slate-500">One useful action at a time.</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {brief.plan.map((step, index) => (
                  <div key={`${step.title}-${index}`} className="flex gap-3 rounded-xl border border-slate-200 p-3">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-xs font-black text-primary">0{index + 1}</span>
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wide text-primary">{step.timeframe}</p>
                      <h4 className="mt-0.5 font-bold text-slate-900">{step.title}</h4>
                      <p className="mt-1 text-sm leading-5 text-slate-600">{step.action}</p>
                      <a href={getActionHref(step.careerGuideAction)} className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-primary underline-offset-4 hover:underline"><BookOpen className="h-3.5 w-3.5" /> {step.careerGuideAction}</a>
                    </div>
                  </div>
                ))}
              </div>

              <div className="rounded-2xl bg-slate-950 p-5 text-white">
                <div className="flex gap-3">
                  <MessageCircle className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300" />
                  <div>
                    <p className="font-bold">Take this into your next conversation.</p>
                    <p className="mt-1 text-sm leading-6 text-slate-300">Ask a teacher, parent, mentor, or CareerGuide counsellor: "What should I notice while I test these directions?"</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <Button onClick={onDownload} className="w-full h-14 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-lg text-base">
                  <Download className="mr-2 w-5 h-5" /> Download Direction Brief PDF
                </Button>
                <Button variant="outline" onClick={onConsult} className="w-full h-12 border-2 border-primary text-primary hover:bg-primary/5 font-bold">
                  Consult with Career Counselor
                </Button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Navigation buttons */}
      <div className="flex items-center justify-between gap-3 px-1">
        <Button variant="outline" onClick={goPrev} disabled={page === 0} className="h-11 px-5 border-2 font-semibold disabled:opacity-40">
          <ChevronLeft className="mr-1 h-4 w-4" /> Back
        </Button>
        <span className="text-xs font-medium text-muted-foreground">
          {page + 1} / {TOTAL_PAGES}
        </span>
        <Button onClick={goNext} disabled={page === TOTAL_PAGES - 1} className="h-11 px-5 bg-primary font-semibold disabled:opacity-40">
          Next <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default QuickAssessmentDirectionBrief;
