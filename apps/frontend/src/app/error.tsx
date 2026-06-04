'use client'

import { AlertTriangle } from '@/components/ui/icons'

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="text-center max-w-md mx-auto">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10 mx-auto mb-5">
          <AlertTriangle className="h-8 w-8 text-destructive" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">Une erreur est survenue</h1>
        <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
          Quelque chose s&apos;est mal passe. Veuillez reessayer.
        </p>
        <div className="flex gap-3 justify-center mt-8">
          <a
            href="/dashboard"
            className="inline-flex items-center justify-center rounded-xl border border-border bg-card px-5 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors"
          >
            Retour au dashboard
          </a>
          <button
            onClick={reset}
            className="inline-flex items-center justify-center rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Reessayer
          </button>
        </div>
      </div>
    </div>
  )
}
