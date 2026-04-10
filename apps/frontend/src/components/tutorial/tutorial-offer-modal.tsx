'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Dialog, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useTutorial } from '@/lib/tutorial-context'
import { TUTORIAL_LEVELS } from '@/components/tutorial/tutorial-steps'
import { GraduationCap, ArrowRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export function TutorialOfferModal() {
  const { showOffer, startTutorial, dismissOffer } = useTutorial()

  return (
    <Dialog open={showOffer} onClose={() => {}} dismissible={false} className="max-w-md">
      <AnimatePresence>
        {showOffer && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }}>
            <div className="flex flex-col items-center text-center mb-5">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', bounce: 0.5, delay: 0.15 }}
                className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent shadow-lg shadow-accent/20"
              >
                <GraduationCap className="h-7 w-7 text-white" />
              </motion.div>
              <div className="flex items-center gap-2 justify-center">
                <DialogTitle className="text-lg">Bienvenue sur Faktur !</DialogTitle>
                <Badge variant="warning" className="text-[9px]">Beta</Badge>
              </div>
              <DialogDescription className="mt-1.5 max-w-xs">
                Découvrez toutes les fonctionnalités en 10 niveaux guidés.
              </DialogDescription>
            </div>

            {/* Level grid */}
            <div className="grid grid-cols-5 gap-1.5 mb-4">
              {TUTORIAL_LEVELS.map((lv, i) => {
                const Icon = lv.icon
                return (
                  <motion.div
                    key={lv.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + i * 0.03 }}
                    className="flex flex-col items-center gap-1 rounded-lg border border-border/40 bg-muted/20 p-1.5"
                  >
                    <div
                      className="flex h-7 w-7 items-center justify-center rounded-md"
                      style={{ backgroundColor: `${lv.color}15`, color: lv.color }}
                    >
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <span className="text-[8px] font-medium text-muted-foreground text-center leading-tight truncate w-full">
                      {lv.name}
                    </span>
                  </motion.div>
                )
              })}
            </div>

            <DialogFooter className="flex-col gap-2 sm:flex-col">
              <Button className="w-full h-10 gap-2 font-semibold" onClick={startTutorial}>
                Commencer <ArrowRight className="h-4 w-4" />
              </Button>
              <Button variant="ghost" className="w-full text-muted-foreground text-sm" onClick={dismissOffer}>
                Plus tard
              </Button>
            </DialogFooter>
          </motion.div>
        )}
      </AnimatePresence>
    </Dialog>
  )
}
