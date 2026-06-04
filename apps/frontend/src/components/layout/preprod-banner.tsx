'use client'

import { useState } from 'react'
import { AlertTriangle, Database } from '@/components/ui/icons'
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { IS_PREPROD } from '@/lib/app-env'

export function PreprodBanner() {
  const [open, setOpen] = useState(false)

  if (!IS_PREPROD) return null

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Environnement de préproduction — en savoir plus"
        className="fixed inset-x-0 bottom-0 z-[9998] flex items-center justify-center gap-2 border-t border-amber-600/40 bg-amber-500 px-4 py-1.5 text-[12px] font-semibold text-amber-950 shadow-[0_-4px_16px_rgba(0,0,0,0.15)] transition-colors hover:bg-amber-400"
      >
        <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
        <span className="tracking-wide uppercase">
          Environnement de préproduction, cliquez pour en savoir plus
        </span>
        <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
      </button>

      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogHeader
          onClose={() => setOpen(false)}
          icon={<Database className="h-5 w-5 text-amber-600" />}
        >
          <DialogTitle>Vous êtes sur la préproduction</DialogTitle>
          <DialogDescription>Environnement de test relié à la vraie base de données</DialogDescription>
        </DialogHeader>

        <div className="space-y-3 text-sm text-foreground">
          <p>
            Ce site est un environnement de <strong>préproduction</strong>. Il n&apos;est pas
            isolé&nbsp;: il est connecté à la <strong>vraie base de données de production</strong>.
          </p>
          <p>
            Tout ce que vous faites ici — créer, modifier ou supprimer des données — peut
            <strong> affecter le site réel</strong> et entraîner une
            <strong> perte définitive de données</strong> pour de vrais utilisateurs.
          </p>
          <div className="rounded-lg border border-amber-600/30 bg-amber-500/10 p-3 text-[13px] text-amber-900 dark:text-amber-200">
            Ne l&apos;utilisez pas comme une application normale. Réservez vos actions aux tests
            strictement nécessaires, en sachant qu&apos;elles sont irréversibles.
          </div>
        </div>

        <DialogFooter>
          <Button onClick={() => setOpen(false)}>J&apos;ai compris</Button>
        </DialogFooter>
      </Dialog>
    </>
  )
}
