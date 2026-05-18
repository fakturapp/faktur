'use client'

import { useEffect, useState } from 'react'
import {
  OAUTH_AUTHORIZE_URL,
  OAUTH_CLIENT_ID,
  OAUTH_REDIRECT_URI,
  OAUTH_SCOPES,
  STORAGE_KEYS,
  DASHBOARD_URL,
} from '@/lib/oauth-config'
import { computeChallenge, generateState, generateVerifier } from '@/lib/pkce'
import { getStoredAccessToken } from '@/lib/oauth-storage'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import {
  Field,
  FieldDescription,
  FieldGroup,
} from '@/components/ui/field'
import { ArrowRight } from 'lucide-react'
import DotField from '@/components/effects/DotField'
import { FakturLogoMark } from '@/components/brand/faktur-logo'

type AuthPhase = 'idle' | 'auto_redirect' | 'starting'

export default function LoginPage() {
  const [phase, setPhase] = useState<AuthPhase>('idle')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    if (params.get('error')) {
      setError(params.get('error_description') || params.get('error'))
    }
    if (getStoredAccessToken()) {
      setPhase('auto_redirect')
      const next = params.get('next')
      const target = next && next.startsWith('/') ? next : '/dashboard'
      const timer = setTimeout(() => window.location.replace(target), 600)
      return () => clearTimeout(timer)
    }
  }, [])

  async function startOAuth() {
    setPhase('starting')
    setError(null)
    try {
      const verifier = generateVerifier(64)
      const challenge = await computeChallenge(verifier)
      const state = generateState()

      sessionStorage.setItem(STORAGE_KEYS.pkceVerifier, verifier)
      sessionStorage.setItem(STORAGE_KEYS.oauthState, state)

      const params = new URLSearchParams(window.location.search)
      const next = params.get('next')
      if (next && next.startsWith('/')) {
        sessionStorage.setItem('faktur_platform_next', next)
      } else {
        sessionStorage.removeItem('faktur_platform_next')
      }

      const url = new URL(OAUTH_AUTHORIZE_URL)
      url.searchParams.set('client_id', OAUTH_CLIENT_ID)
      url.searchParams.set('redirect_uri', OAUTH_REDIRECT_URI)
      url.searchParams.set('response_type', 'code')
      url.searchParams.set('scope', OAUTH_SCOPES)
      url.searchParams.set('state', state)
      url.searchParams.set('code_challenge', challenge)
      url.searchParams.set('code_challenge_method', 'S256')

      window.location.assign(url.toString())
    } catch (err) {
      setPhase('idle')
      setError(err instanceof Error ? err.message : 'Erreur inattendue')
    }
  }

  return (
    <div className="relative isolate flex min-h-[100svh] items-center justify-center overflow-hidden bg-background px-4 py-10">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <DotField
          dotRadius={1.5}
          dotSpacing={14}
          bulgeStrength={67}
          glowRadius={160}
          sparkle={false}
          waveAmplitude={0}
          cursorRadius={500}
          cursorForce={0.1}
          bulgeOnly
          gradientFrom="#A855F7"
          gradientTo="#B497CF"
          glowColor="#120F17"
        />
      </div>

      <div className="relative w-full max-w-md">
        <div className="flex flex-col gap-6">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              if (phase === 'idle') startOAuth()
            }}
            className="rounded-2xl border border-border/60 bg-overlay/90 p-8 shadow-overlay backdrop-blur-md"
          >
            <FieldGroup>
              <div className="flex flex-col items-center gap-3 text-center">
                <FakturLogoMark size={56} />
                <h1 className="text-xl font-bold tracking-tight text-foreground">
                  Bienvenue sur Faktur Platform
                </h1>
                <FieldDescription>
                  Pas encore de compte&nbsp;?{' '}
                  <a href={`${DASHBOARD_URL}/register`}>Créer un compte Faktur</a>
                </FieldDescription>
              </div>

              {error && (
                <div className="rounded-xl border border-danger/30 bg-danger/5 px-3 py-2 text-xs text-danger">
                  {error}
                </div>
              )}

              {phase === 'auto_redirect' ? (
                <Field>
                  <Button type="button" disabled fullWidth>
                    <Spinner />
                    Connexion en attente…
                  </Button>
                  <FieldDescription className="text-center">
                    Vous êtes déjà connecté, redirection vers le dashboard…
                  </FieldDescription>
                </Field>
              ) : (
                <Field>
                  <Button type="submit" disabled={phase === 'starting'} fullWidth>
                    {phase === 'starting' ? (
                      <>
                        <Spinner />
                        Redirection…
                      </>
                    ) : (
                      <>
                        Se connecter avec Faktur
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </Field>
              )}
            </FieldGroup>
          </form>

          <FieldDescription className="px-6 text-center">
            En continuant, vous acceptez les{' '}
            <a href={`${DASHBOARD_URL}/legal/terms`}>Conditions d&apos;utilisation</a> et la{' '}
            <a href={`${DASHBOARD_URL}/legal/privacy`}>Politique de confidentialité</a> de Faktur.
          </FieldDescription>
        </div>
      </div>
    </div>
  )
}

