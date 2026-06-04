'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { X } from '@/components/ui/icons'
import { TEMPLATES } from '@/lib/invoice-templates'
import { TemplateThumbnail } from '@/components/shared/template-thumbnail'

interface TemplateModalProps {
  open: boolean
  onClose: () => void
  accentColor: string
  currentTemplate: string
  onSelect: (id: string) => void
}

export function TemplateModal({ open, onClose, accentColor, currentTemplate, onSelect }: TemplateModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', bounce: 0.15, duration: 0.4 }}
            className="relative z-10 w-full max-w-3xl rounded-2xl border border-border bg-card shadow-2xl overflow-hidden"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Choisir un modèle</h2>
                <p className="text-sm text-muted-foreground mt-0.5">9 modèles de mise en page pour vos documents</p>
              </div>
              <button onClick={onClose} className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-6 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-5 gap-4">
                {TEMPLATES.map((tpl) => (
                  <TemplateThumbnail key={tpl.id} tpl={tpl} accentColor={accentColor} selected={currentTemplate === tpl.id} size="lg"
                    onClick={() => { onSelect(tpl.id); onClose() }} />
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
