'use client'

import { useState } from 'react'
import { Dialog, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Dropdown, DropdownItem } from '@/components/ui/dropdown'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ChevronDown } from '@/components/ui/icons'

interface MarkPaidInfoModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: { paymentDate?: string; paymentMethod?: string; notes?: string }) => void
  onSkip: () => void
}

export function MarkPaidInfoModal({ open, onClose, onSubmit, onSkip }: MarkPaidInfoModalProps) {
  const [paymentDate, setPaymentDate] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('')
  const [notes, setNotes] = useState('')

  const paymentMethodLabel =
    paymentMethod === 'bank_transfer'
      ? 'Virement bancaire'
      : paymentMethod === 'cash'
        ? 'Espèces'
        : paymentMethod === 'custom'
          ? 'Autre'
          : 'Non spécifié'

  function handleSubmit() {
    onSubmit({
      paymentDate: paymentDate || undefined,
      paymentMethod: paymentMethod || undefined,
      notes: notes || undefined,
    })
    handleReset()
  }

  function handleSkip() {
    onSkip()
    handleReset()
  }

  function handleReset() {
    setPaymentDate('')
    setPaymentMethod('')
    setNotes('')
  }

  return (
    <Dialog open={open} onClose={onClose} className="max-w-md">
      <DialogTitle>Informations de paiement</DialogTitle>
      <DialogDescription>
        Ajoutez des informations sur le paiement reçu (optionnel).
      </DialogDescription>

      <div className="mt-4 space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            Date de paiement
          </label>
          <Input
            type="date"
            value={paymentDate}
            onChange={(e) => setPaymentDate(e.target.value)}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            Méthode de paiement
          </label>
          <div className="relative">
            <Dropdown
              trigger={
                <button className="flex h-10 w-full items-center justify-between gap-2 rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none transition-colors focus:border-primary/50">
                  <span>{paymentMethodLabel}</span>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </button>
              }
              align="left"
              className="min-w-[200px]"
            >
              <DropdownItem selected={paymentMethod === ''} onClick={() => setPaymentMethod('')}>
                Non spécifié
              </DropdownItem>
              <DropdownItem selected={paymentMethod === 'bank_transfer'} onClick={() => setPaymentMethod('bank_transfer')}>
                Virement bancaire
              </DropdownItem>
              <DropdownItem selected={paymentMethod === 'cash'} onClick={() => setPaymentMethod('cash')}>
                Espèces
              </DropdownItem>
              <DropdownItem selected={paymentMethod === 'custom'} onClick={() => setPaymentMethod('custom')}>
                Autre
              </DropdownItem>
            </Dropdown>
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">Notes</label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Informations complémentaires..."
            className="w-full resize-none rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/50 focus:border-primary/50"
          />
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" size="sm" onClick={handleSkip}>
          Non merci
        </Button>
        <Button size="sm" onClick={handleSubmit}>
          Enregistrer
        </Button>
      </DialogFooter>
    </Dialog>
  )
}
