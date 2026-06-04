'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Cloud, Lock, AlertTriangle, ChevronDown } from '@/components/ui/icons'
import { cn } from '@/lib/utils'
import { Dialog, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  CheckboxRoot,
  CheckboxControl,
  CheckboxIndicator,
  CheckboxContent,
} from '@/components/ui/checkbox'

export type EncryptionMode = 'private' | 'standard'

export interface EncryptionAcks {
  dataLoss: boolean
  notResponsible: boolean
}

interface Props {
  value: EncryptionMode
  onChange: (mode: EncryptionMode) => void
  acks: EncryptionAcks
  onAcksChange: (acks: EncryptionAcks) => void
}

const MODES: Record<EncryptionMode, { label: string; description: string; icon: typeof Cloud }> = {
  standard: {
    label: 'Mode Standard',
    description:
      'Vos données sont chiffrées sur nos serveurs. Aucun mot de passe supplémentaire, aucun verrouillage. Les administrateurs Faktur peuvent techniquement accéder à vos données.',
    icon: Cloud,
  },
  private: {
    label: 'Mode Privé',
    description:
      'Chiffrement de bout en bout avec votre mot de passe. Seuls vous (et votre clef de secours) pouvez déchiffrer vos données. Si vous perdez les deux, c’est perdu.',
    icon: Lock,
  },
}

export function EncryptionModeChooser({ value, onChange, acks, onAcksChange }: Props) {
  const [open, setOpen] = useState(false)
  const [warnOpen, setWarnOpen] = useState(false)
  const [pendingAcks, setPendingAcks] = useState<EncryptionAcks>(acks)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const popupRef = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState({ top: 0, left: 0, width: 320 })

  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      const target = e.target as Node
      if (
        triggerRef.current && !triggerRef.current.contains(target) &&
        popupRef.current && !popupRef.current.contains(target)
      ) {
        setOpen(false)
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [open])

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return
    const rect = triggerRef.current.getBoundingClientRect()
    setPos({ top: rect.bottom + 4, left: rect.left, width: Math.max(320, rect.width) })
  }, [open])

  function selectMode(mode: EncryptionMode) {
    setOpen(false)
    if (mode === 'private') {
      setPendingAcks(acks)
      setWarnOpen(true)
    } else {
      onChange('standard')
      onAcksChange({ dataLoss: false, notResponsible: false })
    }
  }

  function confirmPrivate() {
    if (!pendingAcks.dataLoss || !pendingAcks.notResponsible) return
    onAcksChange(pendingAcks)
    onChange('private')
    setWarnOpen(false)
  }

  function cancelPrivate() {
    setWarnOpen(false)
  }

  const Selected = MODES[value]
  const SelectedIcon = Selected.icon

  const popup = (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={popupRef}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.15, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="fixed z-[9999] rounded-xl bg-overlay shadow-overlay overflow-hidden border border-border/10"
          style={{ top: pos.top, left: pos.left, width: pos.width }}
        >
          <div className="p-1.5">
            {(['standard', 'private'] as const).map((mode) => {
              const m = MODES[mode]
              const Icon = m.icon
              const isSelected = value === mode
              return (
                <button
                  key={mode}
                  type="button"
                  onClick={() => selectMode(mode)}
                  className={cn(
                    'flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition-colors',
                    isSelected
                      ? 'bg-foreground/[0.06] text-foreground'
                      : 'text-foreground/90 hover:bg-foreground/[0.06] hover:text-foreground'
                  )}
                >
                  <span
                    className={cn(
                      'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                      isSelected ? 'bg-primary/15 text-primary' : 'bg-surface-hover text-muted-foreground'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm font-medium">{m.label}</span>
                    <span className="mt-0.5 block text-xs text-muted-foreground leading-relaxed">
                      {m.description}
                    </span>
                  </span>
                </button>
              )
            })}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )

  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        Chiffrement de l&apos;équipe
      </label>

      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="input w-full flex items-center gap-3 text-left"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-hover text-muted-foreground">
          <SelectedIcon className="h-4 w-4" />
        </span>
        <span className="flex-1 min-w-0">
          <span className="block text-sm font-medium text-foreground truncate">
            {Selected.label}
          </span>
          <span className="block text-xs text-muted-foreground truncate">
            {Selected.description.split('.')[0]}.
          </span>
        </span>
        <ChevronDown
          className={cn('h-4 w-4 shrink-0 text-muted-foreground transition-transform', open && 'rotate-180')}
        />
      </button>

      {typeof document !== 'undefined' && createPortal(popup, document.body)}

      <Dialog open={warnOpen} onClose={cancelPrivate}>
        <DialogHeader
          onClose={cancelPrivate}
          icon={<AlertTriangle className="h-5 w-5 text-amber-400" />}
        >
          <DialogTitle>Activer le Mode Privé</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            Vos données seront chiffrées de bout en bout. Pour les déchiffrer, vous aurez besoin :
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>de votre mot de passe Faktur,</li>
            <li>ou de votre clef de secours (à conserver précieusement, hors du site).</li>
          </ul>

          <div className="space-y-3 rounded-lg border border-amber-400/20 bg-amber-400/5 p-3">
            <CheckboxRoot
              isSelected={pendingAcks.dataLoss}
              onChange={(checked) => setPendingAcks((p) => ({ ...p, dataLoss: !!checked }))}
              className="flex items-start gap-3 cursor-pointer"
            >
              <CheckboxControl className="mt-0.5">
                <CheckboxIndicator />
              </CheckboxControl>
              <CheckboxContent className="text-sm text-foreground leading-tight">
                Je comprends que si je perds mon mot de passe ET ma clef de secours, mes données
                seront définitivement perdues.
              </CheckboxContent>
            </CheckboxRoot>

            <CheckboxRoot
              isSelected={pendingAcks.notResponsible}
              onChange={(checked) =>
                setPendingAcks((p) => ({ ...p, notResponsible: !!checked }))
              }
              className="flex items-start gap-3 cursor-pointer"
            >
              <CheckboxControl className="mt-0.5">
                <CheckboxIndicator />
              </CheckboxControl>
              <CheckboxContent className="text-sm text-foreground leading-tight">
                Je comprends que Faktur ne peut être tenu responsable d&apos;une perte de données
                causée par un déploiement ou une mise à jour défectueuse.
              </CheckboxContent>
            </CheckboxRoot>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={cancelPrivate}>
            Annuler
          </Button>
          <Button
            type="button"
            onClick={confirmPrivate}
            disabled={!pendingAcks.dataLoss || !pendingAcks.notResponsible}
          >
            Activer le Mode Privé
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  )
}
