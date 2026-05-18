'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { Pencil } from 'lucide-react'
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Field, FieldLabel, FieldDescription } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'

interface EditableFieldProps {
  label: string
  value: string | null
  placeholder?: string
  description?: ReactNode
  disabled?: boolean
  disabledHint?: string
  modalTitle?: string
  modalDescription?: ReactNode
  required?: boolean
  
  onSave: (next: string) => Promise<boolean | void>
  type?: 'text' | 'textarea'
}

export function EditableField({
  label,
  value,
  placeholder,
  description,
  disabled,
  disabledHint,
  modalTitle,
  modalDescription,
  required,
  onSave,
  type = 'text',
}: EditableFieldProps) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setDraft(value ?? '')
    }
  }, [open, value])

  function close() {
    if (saving) return
    setOpen(false)
  }

  async function handleSave() {
    if (required && !draft.trim()) return
    setSaving(true)
    const ok = await onSave(draft.trim())
    setSaving(false)
    if (ok !== false) setOpen(false)
  }

  const display = (value ?? '').trim()

  return (
    <Field>
      <FieldLabel>{label}</FieldLabel>
      <div className="group flex items-center gap-2 rounded-lg border border-border/50 bg-surface px-3 py-2.5">
        <span
          className={
            'min-w-0 flex-1 truncate text-sm ' +
            (display ? 'text-foreground' : 'text-muted-foreground italic')
          }
        >
          {display || placeholder || 'Non renseigné'}
        </span>
        <button
          type="button"
          onClick={() => setOpen(true)}
          disabled={disabled}
          aria-label={`Modifier ${label.toLowerCase()}`}
          className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-surface-hover hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
      </div>
      {disabled && disabledHint ? (
        <FieldDescription>{disabledHint}</FieldDescription>
      ) : description ? (
        <FieldDescription>{description}</FieldDescription>
      ) : null}

      <Dialog open={open} onClose={close} className="max-w-md">
        <DialogHeader onClose={close}>
          <DialogTitle>{modalTitle ?? `Modifier ${label.toLowerCase()}`}</DialogTitle>
          {modalDescription && (
            <DialogDescription>{modalDescription}</DialogDescription>
          )}
        </DialogHeader>
        <div className="mt-2">
          <Field>
            <FieldLabel htmlFor="editable-field-input">{label}</FieldLabel>
            {type === 'textarea' ? (
              <textarea
                id="editable-field-input"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={placeholder}
                rows={3}
                className="w-full resize-y rounded-lg border border-border/50 bg-field px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                autoFocus
                disabled={saving}
              />
            ) : (
              <Input
                id="editable-field-input"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={placeholder}
                autoFocus
                disabled={saving}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSave()
                }}
              />
            )}
          </Field>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={close} disabled={saving}>
            Annuler
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || (required && !draft.trim()) || draft === (value ?? '')}
          >
            {saving ? (
              <>
                <Spinner />
                Enregistrement...
              </>
            ) : (
              'Enregistrer'
            )}
          </Button>
        </DialogFooter>
      </Dialog>
    </Field>
  )
}
