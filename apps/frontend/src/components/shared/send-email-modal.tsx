'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { useToast } from '@/components/ui/toast'
import { useEmail } from '@/lib/email-context'
import { api } from '@/lib/api'
import { Send, Paperclip, ChevronDown } from 'lucide-react'

interface SendEmailModalProps {
  open: boolean
  onClose: () => void
  documentType: 'invoice' | 'quote'
  documentId: string
  documentNumber: string
  clientEmail: string | null
  clientName: string | null
  total: number
  onSent?: () => void
}

export function SendEmailModal({
  open,
  onClose,
  documentType,
  documentId,
  documentNumber,
  clientEmail,
  clientName,
  total,
  onSent,
}: SendEmailModalProps) {
  const { toast } = useToast()
  const { accounts, defaultAccount } = useEmail()
  const [selectedAccountId, setSelectedAccountId] = useState('')
  const [to, setTo] = useState('')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)

  const docLabel = documentType === 'invoice' ? 'facture' : 'devis'
  const docLabelCap = documentType === 'invoice' ? 'Facture' : 'Devis'
  const formattedTotal = Number(total).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })

  useEffect(() => {
    if (open) {
      setSelectedAccountId(defaultAccount?.id || '')
      setTo(clientEmail || '')
      setSubject(`${docLabelCap} ${documentNumber}`)
      setBody(
        `Bonjour${clientName ? ` ${clientName}` : ''},\n\nVeuillez trouver ci-joint la ${docLabel} ${documentNumber} d'un montant de ${formattedTotal}.\n\nCordialement`
      )
      setSending(false)
    }
  }, [open, defaultAccount, clientEmail, clientName, documentNumber, docLabel, docLabelCap, formattedTotal])

  async function handleSend() {
    if (!selectedAccountId) {
      toast('Sélectionnez un compte email', 'error')
      return
    }
    if (!to) {
      toast('Saisissez un destinataire', 'error')
      return
    }

    setSending(true)
    const { error } = await api.post('/email/send', {
      documentType,
      documentId,
      emailAccountId: selectedAccountId,
      to,
      subject,
      body,
    })
    setSending(false)

    if (error) {
      toast(error, 'error')
      return
    }

    toast('Email envoyé avec succès', 'success')
    onSent?.()
    onClose()
  }

  return (
    <Dialog open={open} onClose={onClose} className="max-w-lg">
      <DialogTitle className="flex items-center gap-2">
        <Send className="h-4 w-4 text-primary" />
        Envoyer par email
      </DialogTitle>

      <div className="mt-4 space-y-3">
        {/* From account */}
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1.5">
            De
          </label>
          <div className="relative">
            <select
              value={selectedAccountId}
              onChange={(e) => setSelectedAccountId(e.target.value)}
              className="w-full appearance-none rounded-lg border border-border bg-muted/30 px-3 py-2.5 pr-8 text-sm text-foreground outline-none focus:border-primary/50 transition-colors"
            >
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.email}{acc.isDefault ? ' (par défaut)' : ''}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          </div>
        </div>

        {/* To */}
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1.5">
            Destinataire
          </label>
          <input
            type="email"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            placeholder="email@client.com"
            className="w-full rounded-lg border border-border bg-muted/30 px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-primary/50 transition-colors"
          />
        </div>

        {/* Subject */}
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1.5">
            Objet
          </label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full rounded-lg border border-border bg-muted/30 px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary/50 transition-colors"
          />
        </div>

        {/* Body */}
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1.5">
            Message
          </label>
          <textarea
            rows={5}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="w-full rounded-lg border border-border bg-muted/30 px-3 py-2.5 text-sm text-foreground outline-none resize-none focus:border-primary/50 transition-colors"
          />
        </div>

        {/* Attachment badge */}
        <div className="flex items-center gap-2">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary">
            <Paperclip className="h-3 w-3" />
            {documentNumber}.pdf
          </div>
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" size="sm" onClick={onClose} disabled={sending}>
          Annuler
        </Button>
        <Button size="sm" onClick={handleSend} disabled={sending} className="gap-2">
          {sending ? <Spinner className="h-3.5 w-3.5" /> : <Send className="h-3.5 w-3.5" />}
          Envoyer
        </Button>
      </DialogFooter>
    </Dialog>
  )
}
