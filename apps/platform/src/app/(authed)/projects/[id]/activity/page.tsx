'use client'

import { motion } from 'framer-motion'
import { Activity, Sparkles } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

export default function ActivityPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 px-4 lg:px-6 py-6 max-w-5xl mx-auto w-full"
    >
      <div>
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-accent" />
          <h1 className="text-xl font-bold text-foreground">Activité</h1>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Historique des actions effectuées sur ce projet et ses clés.
        </p>
      </div>

      <Card className="border-border/50">
        <CardContent className="p-8 text-center">
          <div className="mx-auto inline-flex size-12 items-center justify-center rounded-full bg-accent-soft">
            <Sparkles className="h-5 w-5 text-accent" />
          </div>
          <h2 className="mt-4 text-base font-semibold text-foreground">Bientôt disponible</h2>
          <p className="mt-2 max-w-md mx-auto text-sm text-muted-foreground">
            L&apos;audit log listera qui a créé, roté ou révoqué quelle clé, quand, et depuis
            quelle IP. Utile pour les revues de sécurité périodiques.
          </p>
        </CardContent>
      </Card>
    </motion.div>
  )
}
