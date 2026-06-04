'use client'

import { useState, useEffect } from 'react'
import { KeyRound } from '@/components/ui/icons'
import { Dialog, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { RecoveryKeyDisplay } from '@/components/shared/recovery-key-display'
import {
  CheckboxRoot,
  CheckboxControl,
  CheckboxIndicator,
  CheckboxContent,
} from '@/components/ui/checkbox'

interface RecoveryKeyModalProps {
  open: boolean
  recoveryKey: string
  onClose: () => void
  title?: string
  description?: string
  /** Kept for backward compatibility but no longer honored — the modal
   *  now stays open until the user ticks the ack checkbox. */
  minVisibleSeconds?: number
}

export function RecoveryKeyModal({
  open,
  recoveryKey,
  onClose,
  title = 'Nouvelle clef de secours',
  description = 'Une nouvelle clef de secours a été générée pour votre compte. Elle remplace la précédente pour toutes vos équipes actives.',
}: RecoveryKeyModalProps) {
  const [ackSaved, setAckSaved] = useState(false)

  useEffect(() => {
    if (!open) setAckSaved(false)
  }, [open])

  const canClose = ackSaved

  return (
    <Dialog
      open={open}
      onClose={() => {
        if (canClose) onClose()
      }}
      dismissible={canClose}
      className="max-w-xl"
    >
      <DialogHeader
        icon={<KeyRound className="h-5 w-5 text-accent" />}
        onClose={canClose ? onClose : undefined}
        showClose={canClose}
      >
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
      </DialogHeader>

      <div className="space-y-4">
        <RecoveryKeyDisplay recoveryKey={recoveryKey} />

        <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-[13px] text-amber-100/90">
          Conservez cette clef <strong>en dehors de Faktur</strong> (gestionnaire de mots de passe,
          coffre-fort, papier dans un endroit sûr…). Sans elle, et sans votre mot de passe, vos
          données seront définitivement perdues.
        </div>

        <CheckboxRoot
          isSelected={ackSaved}
          onChange={(checked) => setAckSaved(!!checked)}
          className="flex items-start gap-3 cursor-pointer rounded-lg border border-border bg-surface px-3 py-2.5"
        >
          <CheckboxControl className="mt-0.5">
            <CheckboxIndicator />
          </CheckboxControl>
          <CheckboxContent className="text-sm text-foreground leading-tight">
            Je confirme avoir téléchargé ma clef de secours et l’avoir stockée dans un lieu sûr.
          </CheckboxContent>
        </CheckboxRoot>
      </div>

      <DialogFooter>
        <Button
          type="button"
          onClick={() => {
            if (canClose) onClose()
          }}
          disabled={!canClose}
          className="w-full"
        >
          {canClose ? 'Continuer' : 'Cochez la case ci-dessus pour continuer'}
        </Button>
      </DialogFooter>
    </Dialog>
  )
}
