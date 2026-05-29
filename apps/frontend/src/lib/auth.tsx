'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { api } from '@/lib/api'
import { CryptoResetModal } from '@/components/modals/crypto-reset-modal'
import { VaultUnlockModal } from '@/components/modals/vault-unlock-modal'
import { RecoveryKeySetupModal } from '@/components/modals/recovery-key-setup-modal'

export interface TeamSummary {
  id: string
  name: string
  encryptionMode: 'private' | 'standard'
  encryptionModeConfirmedAt: string | null
  onboardingCompletedAt: string | null
}

interface User {
  id: string
  fullName: string | null
  email: string
  avatarUrl: string | null
  emailVerified: boolean
  twoFactorEnabled: boolean
  onboardingCompleted: boolean
  currentTeamId: string | null
  lastLoginAt: string | null
  createdAt: string
  cryptoResetNeeded: boolean
  canRecoverWithPassword: boolean
  hasRecoveryKey: boolean
  hasGoogleProvider: boolean
  hasPasskeys: boolean
  vaultLocked: boolean
  isAdmin: boolean
  currentTeamEncryptionMode?: 'private' | 'standard' | null
  teams?: TeamSummary[]
}

interface LogoutOptions {
  wipeAll?: boolean
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (token: string, user: User, vaultKey?: string) => void
  logout: (options?: LogoutOptions) => Promise<void>
  refreshUser: () => Promise<void>
}

const AUTH_LOCAL_KEYS = [
  'faktur_token',
  'faktur_vault_key',
  'faktur_source',
  'faktur_vault_locked',
  'faktur_last_login',
] as const

const ALWAYS_PRESERVE_KEYS = new Set<string>([
  'faktur_cookie_consent',
  'faktur_cookie_pos',
  'faktur_visitor_id',
  'faktur_seen_checkout_feature_v1',
  'faktur_theme',
  'faktur_locale',
])

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: () => {},
  logout: async () => {},
  refreshUser: async () => {},
})

export function useAuth() {
  return useContext(AuthContext)
}

const publicPaths = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
  '/2fa',
  '/invite',
  '/legal',
  '/oauth/google',
  '/oauth/error',
  '/share',
  '/checkout',
]

const SHORT_CHECKOUT_PATH = /^\/[a-zA-Z0-9_-]{16,}\/pay\/?$/

function consumeDesktopSessionHash(): void {
  if (typeof window === 'undefined') return
  const hash = window.location.hash
  if (!hash || !hash.includes('faktur_desktop_session=')) return

  try {
    const match = hash.match(/faktur_desktop_session=([^&]+)/)
    if (!match) return
    const payload = JSON.parse(atob(match[1].replace(/-/g, '+').replace(/_/g, '/')))
    if (payload.t) localStorage.setItem('faktur_token', payload.t)
    if (payload.v) localStorage.setItem('faktur_vault_key', payload.v)
    if (payload.s) localStorage.setItem('faktur_source', String(payload.s))
    if (payload.l) {
      localStorage.setItem('faktur_vault_locked', '1')
    } else {
      localStorage.removeItem('faktur_vault_locked')
    }
    if (payload.team && typeof payload.team === 'string') {
      localStorage.setItem('faktur_desktop_target_team', payload.team)
    } else {
      localStorage.removeItem('faktur_desktop_target_team')
    }
    const clean = window.location.pathname + window.location.search
    window.history.replaceState({}, '', clean)
  } catch (err) {
    console.error('[auth] failed to consume desktop session hash:', err)
  }
}

if (typeof window !== 'undefined') {
  consumeDesktopSessionHash()
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  const isPublicPath =
    publicPaths.some((p) => pathname.startsWith(p)) ||
    SHORT_CHECKOUT_PATH.test(pathname)

  const refreshUser = useCallback(async () => {
    consumeDesktopSessionHash()

    const token = localStorage.getItem('faktur_token')
    if (!token) {
      setUser(null)
      setLoading(false)
      return
    }

    const { data, error } = await api.get<{ user: User }>('/auth/me')
    if (error || !data?.user) {
      localStorage.removeItem('faktur_token')
      setUser(null)
      setLoading(false)
      return
    }

    const targetTeam = localStorage.getItem('faktur_desktop_target_team')
    if (targetTeam && targetTeam !== data.user.currentTeamId) {
      const { error: switchError } = await api.post('/team/switch', { teamId: targetTeam })
      localStorage.removeItem('faktur_desktop_target_team')
      if (!switchError) {
        const { data: refreshed } = await api.get<{ user: User }>('/auth/me')
        setUser(refreshed?.user ?? data.user)
        setLoading(false)
        return
      }
    } else if (targetTeam) {
      localStorage.removeItem('faktur_desktop_target_team')
    }

    setUser(data.user)
    setLoading(false)
  }, [])

  useEffect(() => {
    refreshUser()
  }, [refreshUser])

  const currentTeam = user?.teams?.find((t) => t.id === user.currentTeamId) ?? null
  const hasPendingRecoveryKey =
    typeof window !== 'undefined' &&
    !!user?.currentTeamId &&
    !!sessionStorage.getItem(`faktur_recovery_key_${user.currentTeamId}`)
  const needsOnboarding =
    !!user &&
    (!user.currentTeamId ||
      (currentTeam != null && !currentTeam.onboardingCompletedAt) ||
      hasPendingRecoveryKey)

  useEffect(() => {
    if (loading) return

    if (user && user.teams === undefined) return

    if (!user && !isPublicPath) {
      let target = '/login'
      if (typeof window !== 'undefined') {
        const current = window.location.pathname + window.location.search
        if (current && current !== '/' && !current.startsWith('/login')) {
          target = `/login?redirect=${encodeURIComponent(current)}`
        }
      }
      router.replace(target)
      return
    }

    if (user && isPublicPath) {
      if (
        pathname === '/login' ||
        pathname === '/register' ||
        pathname.startsWith('/verify-email') ||
        pathname.startsWith('/invite') ||
        pathname.startsWith('/legal') ||
        pathname.startsWith('/share') ||
        pathname.startsWith('/checkout') ||
        SHORT_CHECKOUT_PATH.test(pathname)
      ) {
        return
      }
      if (needsOnboarding) {
        router.replace('/onboarding')
      } else {
        router.replace('/dashboard')
      }
      return
    }

    if (user && !isPublicPath) {
      const isOnboarding = pathname.startsWith('/onboarding')
      const isAccountDeletion = pathname.startsWith('/dashboard/account/delete')
      if (needsOnboarding && !isOnboarding && !isAccountDeletion) {
        router.replace('/onboarding')
        return
      }
      if (!needsOnboarding && isOnboarding) {
        router.replace('/dashboard')
        return
      }
    }
  }, [user, loading, pathname, isPublicPath, router, needsOnboarding])

  function login(token: string, userData: User, vaultKey?: string) {
    localStorage.setItem('faktur_token', token)
    if (vaultKey) {
      localStorage.setItem('faktur_vault_key', vaultKey)
    }

    try {
      const source = (userData.fullName ?? userData.email).trim()
      const initial = (source[0] ?? '?').toUpperCase()
      localStorage.setItem(
        'faktur_last_login',
        JSON.stringify({
          email: userData.email,
          avatarUrl: userData.avatarUrl,
          initial,
          ts: Date.now(),
        })
      )
    } catch {}

    setUser(userData)
    void refreshUser()
  }

  async function logout(options: LogoutOptions = {}) {
    const wipeAll = options.wipeAll === true

    function clearLocalStorageState() {
      try {
        if (wipeAll) {
          const keys = Object.keys(localStorage)
          for (const key of keys) {
            if (ALWAYS_PRESERVE_KEYS.has(key)) continue
            localStorage.removeItem(key)
          }
          try {
            sessionStorage.clear()
          } catch {
          }
        } else {
          for (const key of AUTH_LOCAL_KEYS) {
            localStorage.removeItem(key)
          }
        }
      } catch {
      }
    }

    const desktopBridge =
      typeof window !== 'undefined' ? (window as any).fakturDesktop : null
    if (desktopBridge?.logout) {
      clearLocalStorageState()
      try {
        await desktopBridge.logout({ wipeAll })
      } catch {
      }
      return
    }

    await api.post('/auth/logout', {})
    clearLocalStorageState()
    setUser(null)
    router.replace('/login')
  }

  const [forceCryptoReset, setForceCryptoReset] = useState(false)

  async function handleCryptoRecovered() {
    setForceCryptoReset(false)
    await refreshUser()
  }

  async function handleCryptoWiped() {
    setForceCryptoReset(false)
    await refreshUser()
    router.replace('/onboarding/team')
  }

  async function handleCryptoRefresh() {
    await refreshUser()
    setForceCryptoReset(false)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
      {children}
      <CryptoResetModal
        open={!!user?.cryptoResetNeeded || forceCryptoReset}
        canRecoverWithPassword={!!user?.canRecoverWithPassword}
        hasRecoveryKey={!!user?.hasRecoveryKey}
        onRecovered={handleCryptoRecovered}
        onWiped={handleCryptoWiped}
        onLogout={() => logout()}
        onRefresh={handleCryptoRefresh}
      />
      <VaultUnlockModal
        forceOpen={
          !!user?.vaultLocked &&
          user?.currentTeamEncryptionMode === 'private' &&
          !user?.cryptoResetNeeded &&
          !forceCryptoReset
        }
        onStartRecovery={() => setForceCryptoReset(true)}
      />
      <RecoveryKeySetupModal
        open={
          !!user &&
          !user.hasRecoveryKey &&
          user.onboardingCompleted &&
          !user.cryptoResetNeeded &&
          !user.vaultLocked &&
          (user.currentTeamEncryptionMode ?? 'private') === 'private'
        }
      />
    </AuthContext.Provider>
  )
}
