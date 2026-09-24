import { BookOpen, CheckCircle2, Compass, Lightbulb, MapPinned, MessageCircle, Target } from 'lucide-react';
import type { GuestProfile } from '@/lib/report-generator';
import type { QuickAssessmentBrief } from '@/lib/quick-assessment-report';

interface QuickAssessmentDirectionBriefProps {
  profile: GuestProfile;
  brief: QuickAssessmentBrief;
}

const getActionHref = (action: string) => {
  if (action.toLowerCase().includes('counsellor')) return '/counselors';
  if (action.toLowerCase().includes('subject')) return '/subject-guide';
  return '/careers';
};

const QuickAssessmentDirectionBrief = ({ profile, brief }: QuickAssessmentDirectionBriefProps) => (
  <section className="relative rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
    <div className="space-y-7 p-4 sm:p-6 md:p-8">
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

      <div>
        <div className="mb-4 flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          <div>
            <h3 className="font-bold text-slate-900">Three careers to explore</h3>
            <p className="text-sm text-slate-500">Test the work before you decide.</p>
          </div>
        </div>
        <div className="space-y-4">
          {brief.careers.map((career, index) => (
            <article key={`${career.career}-${index}`} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex gap-3">
                <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg text-xs font-black ${index === 1 ? 'bg-emerald-50 text-emerald-700' : 'bg-primary/10 text-primary'}`}>0{index + 1}</span>
                <div className="min-w-0">
                  <p className={`text-[11px] font-bold uppercase tracking-wide ${index === 1 ? 'text-emerald-700' : 'text-primary'}`}>Career to explore</p>
                  <h4 className="mt-1 text-lg font-bold text-slate-900">{career.career}</h4>
                </div>
              </div>
              <div className="mt-4 space-y-3 text-sm leading-6 text-slate-700">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Why it appeared</p>
                  <p>{career.whyItAppeared}</p>
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">What still needs testing</p>
                  <p>{career.realityToTest}</p>
                </div>
              </div>
              <div className={`mt-4 rounded-xl p-3 ${index === 1 ? 'bg-emerald-50' : 'bg-primary/[0.06]'}`}>
                <div className="flex gap-2">
                  <Lightbulb className={`mt-0.5 h-4 w-4 shrink-0 ${index === 1 ? 'text-emerald-700' : 'text-primary'}`} />
                  <div>
                    <p className={`text-sm font-bold ${index === 1 ? 'text-emerald-800' : 'text-primary'}`}>{career.starterActivityTitle}</p>
                    <p className="mt-1 text-sm leading-5 text-slate-700">{career.starterActivity}</p>
                    <p className="mt-2 text-xs leading-5 text-slate-500"><strong>Notice:</strong> {career.reflectionPrompt}</p>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>

      <div className="border-t border-slate-200 pt-6">
        <div className="mb-4 flex items-center gap-2">
          <MapPinned className="h-5 w-5 text-primary" />
          <div>
            <h3 className="font-bold text-slate-900">Your starting plan</h3>
            <p className="text-sm text-slate-500">One useful action at a time.</p>
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
      </div>

      <div className="rounded-2xl bg-slate-950 p-5 text-white">
        <div className="flex gap-3">
          <MessageCircle className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300" />
          <div>
            <p className="font-bold">Take this into your next conversation.</p>
            <p className="mt-1 text-sm leading-6 text-slate-300">Ask a teacher, parent, mentor, or CareerGuide counsellor: “What should I notice while I test these directions?”</p>
          </div>
        </div>
      </div>
    </div>

    {locked && (
      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-t from-white/95 via-white/50 to-transparent p-5">
        <div className="max-w-xs text-center">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-primary/10"><CheckCircle2 className="h-6 w-6 text-primary" /></div>
          <p className="mt-3 text-sm font-bold text-slate-900">Your full direction brief is ready</p>
          <p className="mt-1 text-xs leading-5 text-slate-600">Unlock it to see the three careers, activities, plan, and downloadable report.</p>
        </div>
      </div>
    )}
  </section>
);

export default QuickAssessmentDirectionBrief;
