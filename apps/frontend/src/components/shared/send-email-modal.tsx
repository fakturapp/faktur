'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Dialog, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { useToast } from '@/components/ui/toast'
import { useEmail } from '@/lib/email-context'
import { api } from '@/lib/api'
import { Send, Paperclip, ChevronDown, Plus, X, Trash2, CheckCircle2 } from 'lucide-react'

interface Attachment {
  id: string
  file: File
  name: string
  size: number
}

interface SendEmailModalProps {
  open: boolean
  onClose: () => void
  documentType: 'invoice' | 'quote' | 'credit_note'
  documentId: string
  documentNumber: string
  clientEmail: string | null
  clientName: string | null
  total: number
  emailType?: 'send' | 'reminder'
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
  emailType = 'send',
  onSent,
}: SendEmailModalProps) {
  const { toast } = useToast()
  const { accounts, defaultAccount } = useEmail()
  const [selectedAccountId, setSelectedAccountId] = useState('')
  const [to, setTo] = useState('')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const [isDirty, setIsDirty] = useState(false)
  const [attachments, setAttachments] = useState<Attachment[]>([])

  // Confirmation states
  const [showSendConfirm, setShowSendConfirm] = useState(false)
  const [showCloseConfirm, setShowCloseConfirm] = useState(false)
  const [showAttachmentModal, setShowAttachmentModal] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const initialValues = useRef({ to: '', subject: '', body: '' })

  const docLabelCap = documentType === 'invoice' ? 'Facture' : documentType === 'credit_note' ? 'Avoir' : 'Devis'
  const formattedTotal = Number(total).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })

  useEffect(() => {
    if (!open) return

    const templateType = documentType === 'invoice' ? 'invoice_send' : documentType === 'credit_note' ? 'credit_note_send' : 'quote_send'

    async function init() {
      // Try to load custom template
      let tplSubject = `${docLabelCap} ${documentNumber}`
      let tplBody = `Bonjour${clientName ? ` ${clientName}` : ''},\n\nVeuillez trouver ci-joint ${documentType === 'quote' ? 'le' : documentType === 'credit_note' ? "l'avoir" : 'la'} ${docLabelCap.toLowerCase()} ${documentNumber} d'un montant de ${formattedTotal}.\n\nCordialement`

      const { data } = await api.get<{ templates: Record<string, { subject: string; body: string }> }>('/email/templates')
      if (data?.templates?.[templateType]) {
        const tpl = data.templates[templateType]
        tplSubject = tpl.subject
          .replace(/\{type\}/g, docLabelCap)
          .replace(/\{numero\}/g, documentNumber)
          .replace(/\{montant\}/g, formattedTotal)
          .replace(/\{client_name\}/g, clientName ? ` ${clientName}` : '')
        tplBody = tpl.body
          .replace(/\{type\}/g, docLabelCap)
          .replace(/\{type_lower\}/g, docLabelCap.toLowerCase())
          .replace(/\{numero\}/g, documentNumber)
          .replace(/\{montant\}/g, formattedTotal)
          .replace(/\{client_name\}/g, clientName ? ` ${clientName}` : '')
      }

      setSelectedAccountId(defaultAccount?.id || '')
      setTo(clientEmail || '')
      setSubject(tplSubject)
      setBody(tplBody)
      setSending(false)
      setIsDirty(false)
      setAttachments([])
      setShowSendConfirm(false)
      setShowCloseConfirm(false)
      setShowAttachmentModal(null)

      initialValues.current = { to: clientEmail || '', subject: tplSubject, body: tplBody }
    }

    init()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, documentType, documentNumber])

  // Track dirty state
  const checkDirty = useCallback(() => {
    const { to: initTo, subject: initSubject, body: initBody } = initialValues.current
    setIsDirty(to !== initTo || subject !== initSubject || body !== initBody || attachments.length > 0)
  }, [to, subject, body, attachments.length])

  useEffect(() => { checkDirty() }, [checkDirty])

  // Close handler — intercept if dirty
  function handleRequestClose() {
    if (showSendConfirm) return // Don't close while confirming send
    if (isDirty && !sending) {
      setShowCloseConfirm(true)
    } else {
      onClose()
    }
  }

  // Send flow
  function handleSendClick() {
    if (!selectedAccountId) {
      toast('Sélectionnez un compte email', 'error')
      return
    }
    if (!to) {
      toast('Saisissez un destinataire', 'error')
      return
    }
    setShowSendConfirm(true)
  }

  async function handleConfirmSend() {
    setShowSendConfirm(false)
    setSending(true)

    const formData = new FormData()
    formData.append('documentType', documentType)
    formData.append('documentId', documentId)
    formData.append('emailAccountId', selectedAccountId)
    formData.append('to', to)
    formData.append('subject', subject)
    formData.append('body', body)
    formData.append('emailType', emailType)
    for (const att of attachments) {
      formData.append('attachments', att.file)
    }

    const { error } = await api.upload('/email/send', formData)
    setSending(false)

    if (error) {
      toast(error, 'error')
      return
    }

    toast('Email envoyé avec succès', 'success')
    onSent?.()
    onClose()
  }

  // Attachment handlers
  function handleAddAttachment() {
    fileInputRef.current?.click()
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files?.length) return

    const newAttachments: Attachment[] = Array.from(files).map((file) => ({
      id: Math.random().toString(36).slice(2),
      file,
      name: file.name,
      size: file.size,
    }))
    setAttachments((prev) => [...prev, ...newAttachments])

    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function handleRemoveAttachment(id: string) {
    setAttachments((prev) => prev.filter((a) => a.id !== id))
    setShowAttachmentModal(null)
  }

  function formatFileSize(bytes: number) {
    if (bytes < 1024) return `${bytes} o`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`
    return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`
  }

  return (
    <>
      {/* Main email compose dialog */}
      <Dialog open={open} onClose={handleRequestClose} dismissible={false} className="max-w-lg">
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
                disabled={showSendConfirm || sending}
                className="w-full appearance-none rounded-lg border border-border bg-muted/30 px-3 py-2.5 pr-8 text-sm text-foreground outline-none focus:border-primary/50 transition-colors disabled:opacity-50"
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
              disabled={showSendConfirm || sending}
              placeholder="email@client.com"
              className="w-full rounded-lg border border-border bg-muted/30 px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-primary/50 transition-colors disabled:opacity-50"
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
              disabled={showSendConfirm || sending}
              className="w-full rounded-lg border border-border bg-muted/30 px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary/50 transition-colors disabled:opacity-50"
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
              disabled={showSendConfirm || sending}
              className="w-full rounded-lg border border-border bg-muted/30 px-3 py-2.5 text-sm text-foreground outline-none resize-none focus:border-primary/50 transition-colors disabled:opacity-50"
            />
          </div>

          {/* Attachments */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Auto-attached PDF */}
            <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary">
              <Paperclip className="h-3 w-3" />
              {documentNumber}.pdf
            </div>

            {/* User-added attachments */}
            {attachments.map((att) => (
              <div
                key={att.id}
                className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-xs font-medium text-foreground cursor-pointer hover:bg-muted/80 transition-colors"
                onClick={() => setShowAttachmentModal(att.id)}
              >
                <Paperclip className="h-3 w-3 text-muted-foreground" />
                {att.name}
                <span className="text-muted-foreground">({formatFileSize(att.size)})</span>
              </div>
            ))}

            {/* Add attachment button */}
            <button
              onClick={handleAddAttachment}
              disabled={showSendConfirm || sending}
              className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors disabled:opacity-40 disabled:cursor-default"
            >
              <Plus className="h-3 w-3" />
              Pièce jointe
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
        </div>

        {/* Inline send confirmation OR normal footer */}
        <AnimatePresence mode="wait">
          {showSendConfirm ? (
            <motion.div
              key="confirm"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.2 }}
              className="mt-4 -mx-6 -mb-6 px-6 py-4 border-t border-primary/20 bg-primary/5 rounded-b-2xl"
            >
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                <p className="text-sm text-foreground">
                  Envoyer cet email à <strong>{to}</strong> ?
                </p>
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="outline" size="sm" onClick={() => setShowSendConfirm(false)}>
                  Annuler
                </Button>
                <Button size="sm" onClick={handleConfirmSend} className="gap-2">
                  <Send className="h-3.5 w-3.5" />
                  Confirmer l&apos;envoi
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="footer"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <DialogFooter>
                <Button variant="outline" size="sm" onClick={handleRequestClose} disabled={sending}>
                  Annuler
                </Button>
                <Button size="sm" onClick={handleSendClick} disabled={sending} className="gap-2">
                  {sending ? <Spinner className="h-3.5 w-3.5" /> : <Send className="h-3.5 w-3.5" />}
                  Envoyer
                </Button>
              </DialogFooter>
            </motion.div>
          )}
        </AnimatePresence>
      </Dialog>

      {/* Unsaved changes confirmation dialog */}
      <Dialog open={showCloseConfirm} onClose={() => setShowCloseConfirm(false)} dismissible={false} className="max-w-sm">
        <DialogTitle>Modifications non enregistrées</DialogTitle>
        <DialogDescription>
          Vous avez modifié le contenu de l&apos;email. Que souhaitez-vous faire ?
        </DialogDescription>
        <DialogFooter>
          <Button variant="ghost" size="sm" onClick={() => { setShowCloseConfirm(false); onClose() }}>
            Ignorer et fermer
          </Button>
          <Button size="sm" onClick={() => setShowCloseConfirm(false)}>
            Continuer l&apos;édition
          </Button>
        </DialogFooter>
      </Dialog>

      {/* Attachment detail modal */}
      {showAttachmentModal && (
        <Dialog open={true} onClose={() => setShowAttachmentModal(null)} dismissible={false} className="max-w-xs">
          {(() => {
            const att = attachments.find((a) => a.id === showAttachmentModal)
            if (!att) return null
            return (
              <>
                <DialogTitle className="flex items-center gap-2">
                  <Paperclip className="h-4 w-4 text-muted-foreground" />
                  Pièce jointe
                </DialogTitle>
                <div className="mt-3 space-y-3">
                  <div className="rounded-lg border border-border bg-muted/30 p-3">
                    <p className="text-sm font-medium text-foreground truncate">{att.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{formatFileSize(att.size)}</p>
                  </div>
                  <button
                    onClick={() => handleRemoveAttachment(att.id)}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Supprimer cette pièce jointe
                  </button>
                </div>
                <DialogFooter>
                  <Button size="sm" onClick={() => setShowAttachmentModal(null)}>
                    Fermer
                  </Button>
                </DialogFooter>
              </>
            )
          })()}
        </Dialog>
      )}
    </>
  )
}
