'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, TrendingUp, DollarSign, Target, BarChart3, Activity, Plus, Check, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

export type ChartKey = 'revenue' | 'collected' | 'micro' | 'treasury_variation' | 'treasury_balance'

interface AddChartSidebarProps {
  open: boolean
  onClose: () => void
  onAddChart: (key: ChartKey) => void
  activeCharts: ChartKey[]
}

const predefinedCharts: { key: ChartKey; label: string; description: string; icon: React.ElementType; available: boolean }[] = [
  { key: 'revenue', label: "Chiffre d'affaires HT", description: 'Evolution du CA hors taxes', icon: TrendingUp, available: true },
  { key: 'collected', label: "Chiffre d'affaires encaisse", description: 'Total des paiements recus', icon: DollarSign, available: true },
  { key: 'micro', label: 'Seuils de ma micro', description: 'Suivi des plafonds', icon: Target, available: true },
  { key: 'treasury_balance', label: 'Variation et solde de tresorerie', description: 'Entrees et sorties', icon: BarChart3, available: false },
  { key: 'treasury_variation', label: 'Variation de la tresorerie', description: 'Evolution dans le temps', icon: Activity, available: false },
]

export function AddChartSidebar({ open, onClose, onAddChart, activeCharts }: AddChartSidebarProps) {
  const [loadingKey, setLoadingKey] = useState<ChartKey | null>(null)

  async function handleAdd(key: ChartKey) {
    if (activeCharts.includes(key) || loadingKey) return
    setLoadingKey(key)
    await new Promise((r) => setTimeout(r, 600))
    onAddChart(key)
    setLoadingKey(null)
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-background/40 backdrop-blur-sm"
            onClick={onClose}
          />

          {}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="fixed top-2 right-2 bottom-2 z-50 w-[380px] max-w-[90vw] bg-card border border-border shadow-2xl flex flex-col rounded-2xl overflow-hidden"
          >
            {}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h3 className="text-lg font-bold text-foreground">Nouveau graphique</h3>
              <button
                onClick={onClose}
                className="h-7 w-7 rounded-full bg-card shadow flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors border border-border"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="flex-1 overflow-auto p-5 space-y-6">
              {}
              <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-semibold text-foreground">Graphique personnalise</h4>
                  <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-semibold uppercase tracking-wide">Bientôt</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Creez un graphique sur mesure en choisissant les donnees et le type de visualisation.
                </p>
                <Button variant="outline" size="sm" className="w-full gap-2" disabled>
                  <Plus className="h-3.5 w-3.5" />
                  Creer
                </Button>
              </div>

              {}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-foreground">Graphiques predefinis</h4>
                <div className="space-y-2">
                  {predefinedCharts.map((chart) => {
                    const Icon = chart.icon
                    const isActive = activeCharts.includes(chart.key)
                    const isLoading = loadingKey === chart.key
                    const isUnavailable = !chart.available

                    return (
                      <button
                        key={chart.key}
                        onClick={() => chart.available && handleAdd(chart.key)}
                        disabled={isActive || isLoading || isUnavailable}
                        className={`w-full flex items-center gap-3 rounded-xl border p-3.5 text-left transition-all group ${
                          isActive
                            ? 'border-primary/30 bg-primary/5 cursor-default'
                            : isUnavailable
                              ? 'border-border bg-card opacity-60 cursor-default'
                              : 'border-border bg-card hover:bg-muted/50 hover:border-primary/20 cursor-pointer'
                        }`}
                      >
                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-colors ${
                          isActive ? 'bg-primary/15 text-primary' : 'bg-primary/10 text-primary group-hover:bg-primary/15'
                        }`}>
                          {isLoading ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                          ) : isActive ? (
                            <Check className="h-5 w-5" />
                          ) : (
                            <Icon className="h-5 w-5" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-foreground">{chart.label}</p>
                            {isUnavailable && (
                              <span className="px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground text-[9px] font-semibold uppercase tracking-wide">Bientôt</span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground truncate">{chart.description}</p>
                        </div>
                        {isActive && (
                          <span className="text-[10px] font-semibold text-primary">Actif</span>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
