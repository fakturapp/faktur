'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { api } from '@/lib/api'
import { Mail, CheckCircle2, XCircle, Clock } from 'lucide-react'

interface EmailLogEntry {
  id: string
  documentType: 'invoice' | 'quote'
  documentId: string
  documentNumber: string
  fromEmail: string
  toEmail: string
  subject: string
  status: 'draft' | 'sent' | 'error'
  errorMessage: string | null
  emailType: 'send' | 'reminder'
  createdAt: string
}

interface EmailHistoryModalProps {
  open: boolean
  onClose: () => void
  documentType: 'invoice' | 'quote' | 'credit_note'
  documentId: string
  documentNumber?: string
}

const statusConfig = {
  sent: { label: 'Envoyé', icon: CheckCircle2, className: 'text-emerald-500 bg-emerald-500/10' },
  error: { label: 'Erreur', icon: XCircle, className: 'text-red-500 bg-red-500/10' },
  draft: { label: 'Brouillon', icon: Clock, className: 'text-amber-500 bg-amber-500/10' },
} as const

function formatDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
    + ' à ' + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

export function EmailHistoryModal({ open, onClose, documentType, documentId, documentNumber }: EmailHistoryModalProps) {
  const [loading, setLoading] = useState(true)
  const [logs, setLogs] = useState<EmailLogEntry[]>([])

  useEffect(() => {
    if (!open) return
    setLoading(true)
    api.get<{ emailLogs: EmailLogEntry[] }>(`/email/logs?documentType=${documentType}&documentId=${documentId}`)
      .then(({ data }) => {
        setLogs(data?.emailLogs || [])
        setLoading(false)
      })
  }, [open, documentType, documentId])

  const docLabel = documentType === 'invoice' ? 'la facture' : 'le devis'

  return (
    <Dialog open={open} onClose={onClose} className="max-w-md">
      <DialogTitle className="flex items-center gap-2">
        <Mail className="h-4 w-4 text-primary" />
        Historique des emails
      </DialogTitle>
      <p className="text-xs text-muted-foreground mt-1">
        Emails envoyés pour {docLabel} {documentNumber}
      </p>

      <div className="mt-4 max-h-[400px] overflow-auto -mx-1 px-1">
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Spinner size="lg" />
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-10">
            <Mail className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Aucun email envoyé</p>
          </div>
        ) : (
          <div className="space-y-2">
            {logs.map((log) => {
              const cfg = statusConfig[log.status]
              const Icon = cfg.icon
              return (
                <div key={log.id} className="rounded-lg border border-border bg-muted/20 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground truncate">{log.subject}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {log.fromEmail} → {log.toEmail}
                      </p>
                    </div>
                    <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium shrink-0 ${cfg.className}`}>
                      <Icon className="h-3 w-3" />
                      {cfg.label}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[11px] text-muted-foreground">{formatDate(log.createdAt)}</span>
                    {log.emailType === 'reminder' && (
                      <span className="text-[11px] font-medium text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded">Relance</span>
                    )}
                  </div>
                  {log.status === 'error' && log.errorMessage && (
                    <p className="text-xs text-red-400 mt-1.5 bg-red-500/5 rounded px-2 py-1">{log.errorMessage}</p>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      <DialogFooter>
        <Button size="sm" onClick={onClose}>Fermer</Button>
      </DialogFooter>
    </Dialog>
  )
}
