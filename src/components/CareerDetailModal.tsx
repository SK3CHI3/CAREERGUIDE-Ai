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
}

const CareerDetailModal: React.FC<CareerDetailModalProps> = ({ isOpen, onClose, career }) => {
  const navigate = useNavigate()
  if (!isOpen || !career) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl w-[95vw] sm:w-full p-0 overflow-hidden bg-[#0a0a0c] border-white/10 rounded-xl shadow-2xl">
        <div className="p-5 sm:p-8 md:p-10 space-y-6 sm:space-y-8 max-h-[85vh] overflow-y-auto custom-scrollbar">
          
          {/* Header Section */}
          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-center justify-between">
              <Badge variant="outline" className="text-[10px] uppercase tracking-widest text-primary border-primary/20 bg-primary/5">
                {career.category}
              </Badge>
              <div className="flex items-center gap-3 sm:gap-4 text-[10px] sm:text-xs text-slate-500 font-medium">
                <span className="flex items-center gap-1">
                  <TrendingUp className="h-3 w-3 text-emerald-400" />
                  <span className="hidden xs:inline">{career.demand_level} Demand</span>
                  <span className="xs:hidden">{career.demand_level}</span>
                </span>
              </div>
            </div>
            
            <div className="space-y-1 sm:space-y-2">
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                {career.title}
              </h1>
              <p className="text-base sm:text-lg text-slate-400 font-medium leading-relaxed">
                {career.one_liner || "Professional career pathway within Kenya's evolving industry."}
              </p>
            </div>
          </div>

          <div className="h-px bg-white/5" />

          {/* Role Overview */}
          <section className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500">Overview</h3>
            <p className="text-slate-300 leading-relaxed">
              {career.description}
            </p>
          </section>

          {/* Market Reality */}
          <section className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500">Market Reality</h3>
            <div className="grid grid-cols-2 gap-6">
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
            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500">Education & Path</h3>
            <div className="space-y-4">
              <p className="text-slate-300">
                {career.education_requirements}
              </p>
              <div className="flex flex-wrap gap-2">
                {career.skills_required.map((skill, i) => (
                  <span key={i} className="text-xs bg-white/5 text-slate-400 px-2 py-1 rounded border border-white/5">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </section>

          {/* Pros & Cons */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
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
             <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-slate-500">
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
        </div>

        {/* Minimalist Footer */}
        <div className="p-5 sm:p-6 bg-white/[0.02] border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[10px] sm:text-xs text-slate-500 font-medium text-center sm:text-left">
            Compare this path with your personalized assessment results.
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            <Button 
              variant="ghost" 
              onClick={onClose} 
              className="w-full sm:w-auto text-slate-400 hover:text-white hover:bg-white/5 rounded-lg font-bold order-2 sm:order-1"
            >
              Close
            </Button>
            <Button 
              onClick={() => { onClose(); navigate(`/quick-assessment?career=${encodeURIComponent(career.title)}`) }}
              className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground px-8 rounded-lg font-bold shadow-lg shadow-primary/10 order-1 sm:order-2"
            >
              Assess My Fit
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default CareerDetailModal
