'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { useToast } from '@/components/ui/toast'
import { api } from '@/lib/api'
import { Info, Check } from 'lucide-react'

interface FirstDocumentBannerProps {
  documentType: 'quote' | 'invoice'
  currentNumber: string
  onNumberChange: (n: string) => void
}

const DISMISSED_KEY = 'faktur_first_doc_dismissed'

function isDismissed(type: string): boolean {
  try {
    const raw = localStorage.getItem(DISMISSED_KEY)
    if (!raw) return false
    const map = JSON.parse(raw)
    return !!map[type]
  } catch {
    return false
  }
}

function setDismissed(type: string) {
  try {
    const raw = localStorage.getItem(DISMISSED_KEY)
    const map = raw ? JSON.parse(raw) : {}
    map[type] = true
    localStorage.setItem(DISMISSED_KEY, JSON.stringify(map))
  } catch {}
}

export function FirstDocumentBanner({ documentType, currentNumber, onNumberChange }: FirstDocumentBannerProps) {
  const { toast } = useToast()
  const [visible, setVisible] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editValue, setEditValue] = useState(currentNumber)

  const isQuote = documentType === 'quote'
  const endpoint = isQuote ? '/quotes' : '/invoices'
  const label = isQuote ? 'devis' : 'facture'

  useEffect(() => {
    if (isDismissed(documentType)) {
      setLoading(false)
      return
    }

    api.get<{ count: number }>(`${endpoint}/document-count`).then(({ data }) => {
      if (data && data.count === 0) {
        const numericPart = parseInt(currentNumber.replace(/\D/g, ''), 10)
        if (isNaN(numericPart) || numericPart <= 1) {
          setVisible(true)
        }
      }
      setLoading(false)
    }).catch(() => {
      setLoading(false)
    })
  }, [endpoint, documentType])

  useEffect(() => {
    setEditValue(currentNumber)
  }, [currentNumber])

  async function handleSave() {
    if (!editValue.trim()) return
    setSaving(true)
    const { error } = await api.post(`${endpoint}/set-next-number`, { nextNumber: editValue.trim() })
    setSaving(false)
    if (error) {
      toast(error, 'error')
      return
    }
    onNumberChange(editValue.trim())
    toast(`Numéro de ${label} mis à jour`, 'success')
    setDismissed(documentType)
    setVisible(false)
  }

  function handleDismiss() {
    setDismissed(documentType)
    setVisible(false)
  }

  if (loading || !visible) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="rounded-xl border border-orange-500/30 bg-orange-500/10 p-4 mb-4"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-orange-500/20">
          <Info className="h-4 w-4 text-orange-500" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground">
            Ceci est {isQuote ? 'votre premier devis' : 'votre première facture'}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Vous pouvez personnaliser le numéro de départ avant de commencer.
          </p>
          <div className="flex items-center gap-2 mt-3">
            <Input
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="max-w-[200px] h-8 text-sm"
              placeholder={isQuote ? 'DEV-001' : 'FAC-001'}
            />
            <Button size="sm" onClick={handleSave} disabled={saving || !editValue.trim()}>
              {saving ? <Spinner className="h-3.5 w-3.5" /> : <Check className="h-3.5 w-3.5 mr-1" />}
              Valider
            </Button>
            <button
              onClick={handleDismiss}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors ml-1"
            >
              Ignorer
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
