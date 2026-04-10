'use client'

import { Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'

const KNOWN_ERRORS: Record<string, string> = {
  invalid_request: 'Requête invalide — paramètres manquants ou mal formés.',
  invalid_client: 'Application inconnue ou credentials incorrects.',
  invalid_grant: "Le code d'autorisation est expiré, déjà utilisé ou invalide.",
  unauthorized_client: "Cette application n'a pas le droit de demander ce type d'autorisation.",
  unsupported_grant_type: "Ce type de grant n'est pas supporté.",
  invalid_scope: 'Les scopes demandés ne sont pas valides pour cette application.',
  access_denied: "Vous avez refusé l'accès à votre compte.",
  server_error: 'Erreur serveur.',
  temporarily_unavailable: 'Service temporairement indisponible.',
  state_mismatch: "Jeton 'state' incorrect.",
  timeout: "La fenêtre d'autorisation a expiré.",
}

function ErrorContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const errorCode = searchParams.get('error') ?? 'unknown'
  const errorDescription =
    searchParams.get('error_description') ??
    KNOWN_ERRORS[errorCode] ??
    'Une erreur inconnue est survenue.'

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="w-full max-w-sm"
      >
        <div className="rounded-xl bg-overlay shadow-surface p-6 text-center">
          <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
            <X className="h-6 w-6 text-destructive" />
          </div>
          <h1 className="text-base font-semibold text-foreground mb-1">
            Autorisation interrompue
          </h1>
          <p className="text-sm text-muted-foreground mb-4">{errorDescription}</p>
          <code className="inline-block text-[10px] font-mono px-2 py-1 rounded bg-muted text-muted-foreground mb-5">
            {errorCode}
          </code>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => router.push('/dashboard')}
            >
              Tableau de bord
            </Button>
            <Button
              size="sm"
              className="flex-1"
              onClick={() => {
                if (typeof window !== 'undefined') window.history.back()
              }}
            >
              Réessayer
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default function OauthErrorPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <X className="h-8 w-8 text-destructive animate-pulse" />
        </div>
      }
    >
      <ErrorContent />
    </Suspense>
  )
}
