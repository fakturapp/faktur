'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, RefreshCw, Loader2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { api } from '@/lib/api'
import { useInvoiceSettings } from '@/lib/invoice-settings-context'

export function AiDashboardSummary() {
  const { settings, loading: settingsLoading } = useInvoiceSettings()
  const [summary, setSummary] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [hasLoaded, setHasLoaded] = useState(false)

  async function fetchSummary() {
    setLoading(true)
    const { data, code } = await api.get<{ summary: string }>('/ai/dashboard-summary')
    if (code === 'QUOTA_EXCEEDED') {
      setSummary('Quota atteint. Passez a AI Pro pour plus de requetes.')
    } else if (data?.summary) {
      setSummary(data.summary)
    }
    setLoading(false)
    setHasLoaded(true)
  }

  useEffect(() => {
    if (!settingsLoading && settings.aiEnabled && !hasLoaded) {
      fetchSummary()
    }
  }, [settingsLoading, settings.aiEnabled, hasLoaded])

  if (settingsLoading || !settings.aiEnabled) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <Card className="overflow-hidden border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-primary mb-1">Résumé IA</p>
                <AnimatePresence mode="wait">
                  {loading ? (
                    <motion.div
                      key="loading"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center gap-2 text-xs text-muted-foreground"
                    >
                      <Loader2 className="h-3 w-3 animate-spin" />
                      <span>Analyse en cours...</span>
                    </motion.div>
                  ) : summary ? (
                    <motion.p
                      key="summary"
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-sm text-foreground leading-relaxed"
                    >
                      {summary}
                    </motion.p>
                  ) : (
                    <motion.p
                      key="empty"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-xs text-muted-foreground"
                    >
                      Impossible de générer le résumé pour le moment.
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>
            </div>
            <button
              type="button"
              onClick={fetchSummary}
              disabled={loading}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-50"
              title="Rafraîchir le résumé"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
