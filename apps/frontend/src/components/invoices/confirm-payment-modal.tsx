'use client'

import { useState } from 'react'
import { Dialog, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { useToast } from '@/components/ui/toast'
import { api } from '@/lib/api'
import { AlertTriangle, CheckCircle } from 'lucide-react'
import { CheckboxRoot, CheckboxControl, CheckboxIndicator, CheckboxContent } from '@/components/ui/checkbox'

interface ConfirmPaymentModalProps {
  open: boolean
  onClose: () => void
  invoiceId: string
  invoiceNumber: string
  onConfirmed: () => void
}

export function ConfirmPaymentModal({
  open,
  onClose,
  invoiceId,
  invoiceNumber,
  onConfirmed,
}: ConfirmPaymentModalProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [notifyClient, setNotifyClient] = useState(true)
  const [paymentDate, setPaymentDate] = useState('')
  const [notes, setNotes] = useState('')

  async function handleConfirm() {
    setLoading(true)
    const { error } = await api.post(`/invoices/${invoiceId}/payment-link/confirm`, {
      notifyClient,
      paymentDate: paymentDate || undefined,
      notes: notes || undefined,
    })
    setLoading(false)

    if (error) {
      toast(error, 'error')
      return
    }

    toast('Paiement confirmé', 'success')
    onConfirmed()
    onClose()
  }

  return (
    <Dialog open={open} onClose={onClose} dismissible={false} className="max-w-md">
      <DialogTitle>Confirmer le paiement</DialogTitle>
      <DialogDescription>
        Confirmez que vous avez bien reçu le paiement pour la facture {invoiceNumber}.
      </DialogDescription>

      <div className="mt-4 space-y-4">
        {/* Warning */}
        <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-3">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-400 leading-relaxed">
              Cette action est irréversible. Le lien de paiement sera désactivé et supprimé.
            </p>
          </div>
        </div>

        {/* Payment date */}
        <div>
          <label className="text-sm font-medium text-foreground mb-1.5 block">
            Date de réception du virement (optionnel)
          </label>
          <Input
            type="date"
            value={paymentDate}
            onChange={(e) => setPaymentDate(e.target.value)}
          />
        </div>

        {/* Notes */}
        <div>
          <label className="text-sm font-medium text-foreground mb-1.5 block">
            Notes (optionnel)
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Informations complémentaires..."
            className="w-full rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none resize-none focus:border-primary/50 transition-colors"
          />
        </div>

        {/* Notify client */}
        <CheckboxRoot 
          isSelected={notifyClient} 
          onChange={setNotifyClient} 
          className="flex items-center gap-3"
        >
          <CheckboxControl>
            <CheckboxIndicator />
          </CheckboxControl>
          <CheckboxContent className="text-sm text-foreground">
            Avertir le client que le paiement est confirmé
          </CheckboxContent>
        </CheckboxRoot>
      </div>

      <DialogFooter>
        <Button variant="outline" size="sm" onClick={onClose}>
          Annuler
        </Button>
        <Button size="sm" disabled={loading} onClick={handleConfirm}>
          {loading ? (
            <Spinner className="h-4 w-4" />
          ) : (
            <CheckCircle className="h-3.5 w-3.5 mr-1" />
          )}
          Confirmer le paiement
        </Button>
      </DialogFooter>
    </Dialog>
  )
}
