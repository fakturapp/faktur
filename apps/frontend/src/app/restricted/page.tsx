'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ShieldAlert } from '@/components/ui/icons'
import { useAuth } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { IS_ADMIN_ONLY } from '@/lib/app-env'

export default function RestrictedPage() {
  const { user, loading, logout } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (loading) return
    if (!IS_ADMIN_ONLY || (user && user.isAdmin)) {
      router.replace('/dashboard')
    } else if (!user) {
      router.replace('/login')
    }
  }, [user, loading, router])

  if (loading || !user || user.isAdmin || !IS_ADMIN_ONLY) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Spinner size="lg" className="text-accent" />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-surface">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-600">
          <ShieldAlert className="h-7 w-7" />
        </div>
        <h1 className="mt-5 text-lg font-semibold text-foreground">Instance privée</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Cet environnement est réservé aux administrateurs. Votre compte est bien connecté,
          mais il n&apos;a pas accès à cette instance.
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Si vous pensez que c&apos;est une erreur, contactez un administrateur.
        </p>
        <Button variant="destructive" className="mt-6 w-full" onClick={() => logout()}>
          Se déconnecter
        </Button>
      </div>
    </div>
  )
}
