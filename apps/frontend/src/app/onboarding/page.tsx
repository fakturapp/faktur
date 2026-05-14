'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { Skeleton } from '@/components/ui/skeleton'
import { Spinner } from '@/components/ui/spinner'

export default function OnboardingRootPage() {
  const router = useRouter()
  const { user, loading } = useAuth()

  useEffect(() => {
    if (loading || !user) return

    if (
      user.currentTeamId &&
      sessionStorage.getItem(`faktur_recovery_key_${user.currentTeamId}`)
    ) {
      router.replace('/onboarding/recovery-key')
      return
    }

    const target = resolveNextStep(user)
    router.replace(target)
  }, [user, loading, router])

  return (
    <div className="w-full max-w-md mx-auto space-y-6 py-12">
      <div className="flex flex-col items-center gap-4">
        <Spinner size="lg" className="text-accent" />
        <p className="text-sm text-muted-foreground">Reprise de votre installation…</p>
      </div>

      <div className="space-y-4 rounded-2xl bg-overlay/40 p-6 shadow-overlay">
        <Skeleton className="h-6 w-3/4 rounded" />
        <Skeleton className="h-4 w-1/2 rounded" />
        <Skeleton className="h-11 w-full rounded-xl" />
        <Skeleton className="h-11 w-full rounded-xl" />
      </div>
    </div>
  )
}

interface UserShape {
  currentTeamId: string | null
  hasRecoveryKey: boolean
  currentTeamEncryptionMode?: 'private' | 'standard' | null
  teams?: { id: string; onboardingCompletedAt: string | null }[]
}

function resolveNextStep(user: UserShape): string {
  if (!user.currentTeamId) return '/onboarding/team'

  const isPrivate = (user.currentTeamEncryptionMode ?? 'private') === 'private'
  if (isPrivate && !user.hasRecoveryKey) return '/onboarding/recovery-key'

  const currentTeam = user.teams?.find((t) => t.id === user.currentTeamId) ?? null
  if (currentTeam && currentTeam.onboardingCompletedAt) return '/dashboard'

  return '/onboarding/company'
}
