'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { AlertTriangle, ArrowLeft, RotateCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

/**
 * Generic OAuth error landing — used when the consent screen bails
 * before it can redirect, or when a third-party callback forwards
 * an error back to us because it couldn't reach its own loopback
 * listener in time.
 *
 * Reads `error` and `error_description` from the query string and
 * presents them in a readable card. Deliberately lightweight — no
 * auth guard, no data fetching — so it can surface the message even
 * when the session is broken.
 */

const KNOWN_ERRORS: Record<string, string> = {
  invalid_request: 'Requête invalide — paramètres manquants ou mal formés.',
  invalid_client: 'Application inconnue ou credentials incorrects.',
  invalid_grant: "Le code d'autorisation est expiré, déjà utilisé ou invalide.",
  unauthorized_client: 'Cette application n\'a pas le droit de demander ce type d\'autorisation.',
  unsupported_grant_type: 'Ce type de grant n\'est pas supporté par Faktur.',
  invalid_scope: 'Les scopes demandés ne sont pas valides pour cette application.',
  access_denied: 'Vous avez refusé l\'accès à votre compte.',
  server_error: 'Erreur serveur pendant le traitement de la requête.',
  temporarily_unavailable: 'Le service OAuth est temporairement indisponible.',
  state_mismatch: "Jeton 'state' incorrect — possible tentative de CSRF.",
  timeout: 'La fenêtre d\'autorisation a expiré. Réessayez.',
}

function ErrorContent() {
  const searchParams = useSearchParams()
  const errorCode = searchParams.get('error') ?? 'unknown'
  const errorDescription =
    searchParams.get('error_description') ?? KNOWN_ERRORS[errorCode] ?? 'Une erreur inconnue est survenue.'

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-destructive/5">
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 280, damping: 24 }}
        className="w-full max-w-md"
      >
        {/* Faktur logo */}
        <div className="flex flex-col items-center mb-6">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg shadow-primary/20 mb-3">
            <span className="text-primary-foreground font-bold text-xl font-lexend">F</span>
          </div>
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.15em]">
            Faktur
          </p>
        </div>

        <div className="rounded-2xl border border-destructive/20 bg-card shadow-xl overflow-hidden">
          {/* Hero */}
          <div className="px-6 pt-6 pb-5 text-center border-b border-border">
            <div className="h-14 w-14 mx-auto rounded-2xl bg-destructive/10 flex items-center justify-center mb-4">
              <AlertTriangle className="h-7 w-7 text-destructive" />
            </div>
            <h1 className="text-lg font-bold text-foreground mb-1">
              Autorisation interrompue
            </h1>
            <p className="text-sm text-muted-foreground">
              L&apos;autorisation OAuth n&apos;a pas pu aboutir.
            </p>
          </div>

          {/* Details */}
          <div className="px-6 py-5 space-y-3">
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.15em] mb-1.5">
                Code d&apos;erreur
              </p>
              <code className="inline-block rounded-md bg-muted px-2 py-1 text-[11px] font-mono text-foreground border border-border">
                {errorCode}
              </code>
            </div>

            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.15em] mb-1.5">
                Description
              </p>
              <p className="text-[13px] text-foreground leading-relaxed">{errorDescription}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="px-6 py-4 bg-muted/20 border-t border-border flex gap-3">
            <Button variant="outline" className="flex-1" asChild>
              <Link href="/dashboard">
                <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
                Tableau de bord
              </Link>
            </Button>
            <Button
              className="flex-1"
              onClick={() => {
                if (typeof window !== 'undefined') window.history.back()
              }}
            >
              <RotateCw className="h-3.5 w-3.5 mr-1.5" />
              Réessayer
            </Button>
          </div>
        </div>

        <p className="mt-5 text-center text-[10px] text-muted-foreground">
          Si l&apos;erreur persiste, contactez le support ou{' '}
          <Link href="/dashboard/account/oauth" className="text-primary hover:underline">
            gérez vos applications connectées
          </Link>
          .
        </p>
      </motion.div>
    </div>
  )
}

export default function OauthErrorPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <AlertTriangle className="h-8 w-8 text-destructive animate-pulse" />
        </div>
      }
    >
      <ErrorContent />
    </Suspense>
  )
}
