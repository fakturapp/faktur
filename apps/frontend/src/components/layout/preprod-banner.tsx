'use client'

import { useState, useEffect } from 'react'
import { AlertTriangle, Database } from 'lucide-react'
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { IS_PREPROD } from '@/lib/app-env'

const BANNER_HEIGHT_PX = 34

export function PreprodBanner() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!IS_PREPROD) return
    const root = document.documentElement
    const body = document.body
    const prevVar = root.style.getPropertyValue('--preprod-banner-height')
    const prevPad = body.style.paddingBottom
    root.style.setProperty('--preprod-banner-height', `${BANNER_HEIGHT_PX}px`)
    body.style.paddingBottom = `${BANNER_HEIGHT_PX}px`
    return () => {
      root.style.setProperty('--preprod-banner-height', prevVar)
      body.style.paddingBottom = prevPad
    }
  }, [])

  if (!IS_PREPROD) return null

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Environnement de préproduction"
        style={{ height: BANNER_HEIGHT_PX }}
        className="fixed inset-x-0 bottom-0 z-[9998] flex items-center justify-center gap-2 border-t border-amber-600/50 bg-amber-500 text-[11px] font-bold uppercase tracking-[0.25em] text-amber-950 shadow-[0_-4px_16px_rgba(0,0,0,0.18)] transition-colors hover:bg-amber-400"
      >
        <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
        Préprod
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
            Ce site est connecté à la <strong>vraie base de données de production</strong>.
          </p>
          <p>
            Toute action ici — créer, modifier ou supprimer — peut
            <strong> affecter le site réel</strong> et entraîner une
            <strong> perte définitive de données</strong>.
          </p>
          <div className="rounded-lg border border-amber-600/30 bg-amber-500/10 p-3 text-[13px] text-amber-900 dark:text-amber-200">
            Ne l&apos;utilisez pas comme une application normale.
          </div>
        </div>

        <DialogFooter>
          <Button onClick={() => setOpen(false)}>J&apos;ai compris</Button>
        </DialogFooter>
      </Dialog>
    </>
  )
}
