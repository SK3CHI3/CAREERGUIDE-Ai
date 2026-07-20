import React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Sparkles, CheckCircle, Calendar, Shield, Brain, BookOpen } from 'lucide-react'
import BrandedLoader from '@/components/BrandedLoader'

interface TrialActivationModalProps {
  isOpen: boolean
  onClose: () => void
  onActivate: () => void
  isActivating: boolean
  expiresAt?: string | null
}

const TrialActivationModal: React.FC<TrialActivationModalProps> = ({
  isOpen,
  onClose,
  onActivate,
  isActivating,
  expiresAt
}) => {
  const features = [
    { icon: Brain, label: 'AI Career Recommendations' },
    { icon: BookOpen, label: 'Personalized Course Guidance' },
    { icon: Shield, label: 'Academic Performance Tracking' },
    { icon: Calendar, label: 'Counselor Directory Access' },
  ]

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md sm:max-w-lg">
        <DialogHeader>
          <div className="mx-auto w-14 h-14 bg-gradient-primary rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-primary/20">
            <Sparkles className="w-7 h-7 text-primary-foreground" />
          </div>
          <DialogTitle className="text-center text-xl font-bold">Activate Your Free Trial</DialogTitle>
          <DialogDescription className="text-center">
            Get full access to CareerGuide AI for the current academic term. No payment required.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-primary/5 border border-primary/10 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-3">
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 font-bold">
                FREE
              </Badge>
              <span className="font-semibold text-sm">First Term Free Trial</span>
            </div>
            <p className="text-xs text-foreground-muted">
              {expiresAt
                ? `Valid until ${new Date(expiresAt).toLocaleDateString('en-KE', { day: 'numeric', month: 'long', year: 'numeric' })}`
                : 'Valid for the remainder of the current academic term'}
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">What's included:</p>
            <div className="grid grid-cols-1 gap-2">
              {features.map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-3 p-2 rounded-lg bg-muted/30">
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <Icon className="w-4 h-4 text-primary flex-shrink-0" />
                  <span className="text-sm text-foreground">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 pt-2">
          <Button
            onClick={onActivate}
            disabled={isActivating}
            className="w-full bg-gradient-primary hover:opacity-90 text-primary-foreground shadow-glow h-12 text-base font-bold"
          >
            {isActivating ? (
              <>
                <BrandedLoader size="xs" showText={false} className="mr-2 inline-flex" />
                Activating...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 mr-2" />
                Activate Free Trial
              </>
            )}
          </Button>
          <Button
            variant="ghost"
            onClick={onClose}
            className="text-muted-foreground"
          >
            Maybe later
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default TrialActivationModal
