import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  ArrowRight,
  TrendingUp,
  DollarSign,
  GraduationCap,
  Target,
  Check,
  X as XIcon
} from 'lucide-react'
import { CareerPath } from '@/lib/dashboard-service'

interface CareerDetailModalProps {
  isOpen: boolean
  onClose: () => void
  career: CareerPath
  showAssessAction?: boolean
}

const CareerDetailModal: React.FC<CareerDetailModalProps> = ({ isOpen, onClose, career, showAssessAction = true }) => {
  const navigate = useNavigate()
  if (!isOpen || !career) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="career-detail-modal max-w-2xl w-[95vw] sm:w-full p-0 overflow-hidden rounded-xl shadow-2xl max-h-[90vh] flex flex-col">
        <div className="career-detail-scroll p-4 sm:p-5 md:p-8 lg:p-10 space-y-4 sm:space-y-6 overflow-y-auto flex-1">
          
          {/* Header Section */}
          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-center justify-between">
              <Badge variant="outline" className="career-category text-[10px] uppercase tracking-widest">
                {career.category}
              </Badge>
              <div className="career-demand flex items-center gap-3 sm:gap-4 text-[10px] sm:text-xs font-medium">
                <span className="flex items-center gap-1">
                  <TrendingUp className="h-3 w-3 text-emerald-400" />
                  <span className="hidden xs:inline">{career.demand_level} Demand</span>
                  <span className="xs:hidden">{career.demand_level}</span>
                </span>
              </div>
            </div>
            
            <div className="space-y-1 sm:space-y-2">
              <h1 className="career-detail-title text-2xl sm:text-3xl font-bold tracking-tight">
                {career.title}
              </h1>
              <p className="career-detail-subtitle text-base sm:text-lg font-medium leading-relaxed">
                {career.one_liner || "Professional career pathway within Kenya's evolving industry."}
              </p>
            </div>
          </div>

          <div className="career-detail-rule h-px" />

          {/* Role Overview */}
          <section className="space-y-4">
            <h3 className="career-detail-section-label text-sm font-bold uppercase tracking-widest">Overview</h3>
            <p className="career-detail-copy leading-relaxed">
              {career.description}
            </p>
          </section>

          {/* Market Reality */}
          <section className="space-y-3 sm:space-y-4">
            <h3 className="career-detail-section-label text-sm font-bold uppercase tracking-widest">Market reality</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div className="space-y-1">
                <span className="text-xs text-slate-500 font-medium">Salary Range</span>
                <p className="text-white font-bold flex items-center gap-2">
                   <DollarSign className="h-4 w-4 text-emerald-400" />
                   {career.salary_range}
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-slate-500 font-medium">Growth Potential</span>
                <p className="text-white font-bold flex items-center gap-2">
                   <TrendingUp className="h-4 w-4 text-blue-400" />
                   {career.growth_percentage}
                </p>
              </div>
            </div>
          </section>

          {/* Academic Path */}
          <section className="space-y-4">
            <h3 className="career-detail-section-label text-sm font-bold uppercase tracking-widest">Education & path</h3>
            <div className="space-y-4">
              <p className="career-detail-copy">
                {career.education_requirements}
              </p>
              <div className="flex flex-wrap gap-2">
                {career.skills_required.map((skill, i) => (
                  <span key={i} className="career-skill-chip text-xs px-2 py-1 rounded">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </section>

          {/* Pros & Cons */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 pt-4">
            <section className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-widest text-emerald-400/80">Key Benefits</h3>
              <ul className="space-y-2">
                {(career.pros || ['High career stability', 'Direct societal impact', 'Competitive starting packages']).map((pro, i) => (
                  <li key={i} className="text-sm text-slate-400 flex items-start gap-2">
                    <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                    {pro}
                  </li>
                ))}
              </ul>
            </section>
            <section className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-widest text-rose-400/80">Main Challenges</h3>
              <ul className="space-y-2">
                {(career.cons || ['High academic entry bar', 'Non-standard working hours', 'Continuous certification']).map((con, i) => (
                  <li key={i} className="text-sm text-slate-400 flex items-start gap-2">
                    <XIcon className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
                    {con}
                  </li>
                ))}
              </ul>
            </section>
          </div>

          {/* Where to Study */}
          <section className="space-y-4 pt-4">
             <div className="career-detail-section-label flex items-center gap-2 text-sm font-bold uppercase tracking-widest">
              <GraduationCap className="h-4 w-4" />
              Institutions in Kenya
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-2">
              {(career.universities || ['University of Nairobi', 'Strathmore University', 'Kenyatta University', 'JKUAT']).map((uni, i) => (
                <span key={i} className="text-sm text-slate-300 font-medium flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary/40" />
                  {uni}
                </span>
              ))}
            </div>
          </section>

          {/* Related Roles */}
          {career.related_roles && career.related_roles.length > 0 && (
            <section className="space-y-4 pt-4">
              <h3 className="career-detail-section-label text-sm font-bold uppercase tracking-widest">This leads to roles like</h3>
              <div className="flex flex-wrap gap-2">
                {career.related_roles.map((role, i) => (
                  <span key={i} className="text-xs bg-blue-500/10 text-blue-400 px-3 py-1.5 rounded-lg border border-blue-500/20">
                    {role}
                  </span>
                ))}
              </div>
            </section>
          )}
        </div>

        <div className="career-detail-footer p-4 sm:p-5 md:p-6">
          <div className={`grid gap-3 w-full ${showAssessAction ? 'grid-cols-2' : 'grid-cols-1'}`}>
            <Button
              onClick={onClose}
              variant="outline"
              className="career-close-button w-full rounded-lg font-bold"
            >
              Close
            </Button>
            {showAssessAction && <Button
              onClick={() => { onClose(); navigate(`/quick-assessment?career=${encodeURIComponent(career.title)}`) }}
              className="career-assess-button w-full rounded-lg font-bold"
            >
              Assess My Fit
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default CareerDetailModal
