'use client'

import { motion } from 'framer-motion'
import { Terminal, Sparkles } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

export default function ExplorerPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 px-4 lg:px-6 py-6 max-w-5xl mx-auto w-full"
    >
      <div>
        <div className="flex items-center gap-2">
          <Terminal className="h-5 w-5 text-accent" />
          <h1 className="text-xl font-bold text-foreground">API Explorer</h1>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Testez les endpoints de l&apos;API Faktur depuis ce navigateur.
        </p>
      </div>

      <Card className="border-border/50">
        <CardContent className="p-8 text-center">
          <div className="mx-auto inline-flex size-12 items-center justify-center rounded-full bg-accent-soft">
            <Sparkles className="h-5 w-5 text-accent" />
          </div>
          <h2 className="mt-4 text-base font-semibold text-foreground">Bientôt disponible</h2>
          <p className="mt-2 max-w-md mx-auto text-sm text-muted-foreground">
            Le testeur Postman-lite arrive dans une prochaine mise à jour : sélectionne une clé,
            une route, des params, et observe la réponse en direct avec un bouton « Copier le
            curl ».
          </p>
        </CardContent>
      </Card>
    </motion.div>
  )
}
