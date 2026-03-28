'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Loader2 } from 'lucide-react'
import { api } from '@/lib/api'
import { useInvoiceSettings } from '@/lib/invoice-settings-context'
import { cn } from '@/lib/utils'
import { useTrackFeature } from '@/hooks/use-analytics'

interface AiGenerateButtonProps {
  type: 'email_subject' | 'email_body' | 'invoice_subject' | 'invoice_notes' | 'invoice_line_description' | 'acceptance_conditions' | 'free_text'
  context?: string
  language?: string
  onGenerated: (text: string) => void
  className?: string
  size?: 'sm' | 'md'
  label?: string
}

export function AiGenerateButton({
  type,
  context,
  language,
  onGenerated,
  className,
  size = 'sm',
  label,
}: AiGenerateButtonProps) {
  const { settings } = useInvoiceSettings()
  const [loading, setLoading] = useState(false)
  const trackFeature = useTrackFeature()

  if (!settings.aiEnabled) return null

  async function handleGenerate() {
    setLoading(true)
    try {
      const { data, error } = await api.post<{ text: string }>('/ai/generate-text', {
        type,
        context: context || undefined,
        language: language || 'fr',
      })

      if (data?.text && !error) {
        trackFeature('ai.generate', { type })
        onGenerated(data.text)
      }
    } catch {
      // Silently fail — user can retry
    }
    setLoading(false)
  }

  return (
    <button
      type="button"
      onClick={handleGenerate}
      disabled={loading}
      className={cn(
        'inline-flex items-center gap-1 rounded-md transition-all text-primary hover:bg-primary/10 disabled:opacity-50',
        size === 'sm' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-1 text-xs',
        className
      )}
      title="Générer avec l'IA"
    >
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.span
            key="loading"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
          >
            <Loader2 className={cn('animate-spin', size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5')} />
          </motion.span>
        ) : (
          <motion.span
            key="sparkle"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
          >
            <Sparkles className={cn(size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5')} />
          </motion.span>
        )}
      </AnimatePresence>
      {label && <span>{label}</span>}
    </button>
  )
}
