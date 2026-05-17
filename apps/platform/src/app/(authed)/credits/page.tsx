'use client'

import { motion } from 'framer-motion'
import { CreditCard, Sparkles, Wallet, Zap } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

export default function CreditsPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 px-4 lg:px-6 py-4 md:py-6"
    >
      <div className="flex items-center gap-2">
        <CreditCard className="h-5 w-5 text-accent" />
        <h1 className="text-xl font-bold text-foreground">Crédits</h1>
      </div>
      <p className="text-sm text-muted-foreground">
        Suivez vos crédits API, top-ups et limites d&apos;usage.
      </p>

      <Card className="border-border/50">
        <CardContent className="p-8 text-center">
          <div className="mx-auto inline-flex size-12 items-center justify-center rounded-full bg-accent-soft">
            <Sparkles className="h-5 w-5 text-accent" />
          </div>
          <h2 className="mt-4 text-base font-semibold text-foreground">
            Bientôt disponible
          </h2>
          <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
            La facturation à l&apos;usage des appels API et l&apos;achat de crédits arriveront
            dans une prochaine mise à jour. En attendant, toutes les clés sont gratuites et
            utilisent les quotas par défaut.
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-border/50">
          <CardContent className="p-5">
            <div className="flex items-center gap-2">
              <Wallet className="h-4 w-4 text-muted-foreground" />
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                Solde
              </p>
            </div>
            <p className="mt-3 text-2xl font-bold tracking-tight text-foreground">—</p>
            <p className="mt-1 text-xs text-muted-foreground">crédits disponibles</p>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardContent className="p-5">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-muted-foreground" />
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                Ce mois-ci
              </p>
            </div>
            <p className="mt-3 text-2xl font-bold tracking-tight text-foreground">—</p>
            <p className="mt-1 text-xs text-muted-foreground">crédits consommés</p>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardContent className="p-5">
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-muted-foreground" />
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                Plan
              </p>
            </div>
            <p className="mt-3 text-2xl font-bold tracking-tight text-foreground">Free</p>
            <p className="mt-1 text-xs text-muted-foreground">quotas par défaut</p>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  )
}
