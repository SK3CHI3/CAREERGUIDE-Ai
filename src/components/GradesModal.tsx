import React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import GradesManager from './GradesManager'

interface GradesModalProps {
  isOpen: boolean
  onClose: () => void
}

const GradesModal: React.FC<GradesModalProps> = ({ isOpen, onClose }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="academic-modal max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="academic-modal-header">
          <p>Academic profile</p>
          <DialogTitle className="text-2xl font-bold">Your academic performance</DialogTitle>
          <span>Keep your results current to make your recommendations more useful.</span>
        </DialogHeader>
        <div className="mt-4">
          <GradesManager readOnly={true} />
        </div>
        <div className="academic-modal-footer flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default GradesModal
