'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { api } from '@/lib/api'
import { CryptoResetModal } from '@/components/modals/crypto-reset-modal'
import { VaultUnlockModal } from '@/components/modals/vault-unlock-modal'
import { RecoveryKeySetupModal } from '@/components/modals/recovery-key-setup-modal'

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
    } else {
      setUser(data.user)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    refreshUser()
  }, [refreshUser])

  useEffect(() => {
    if (loading) return

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
      // Let these pages handle their own "already logged in" state.
      // /register is included so it can honor its own ?redirect=
      // param (Faktur Desktop → /register?redirect=/oauth/authorize…).
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
      if (!user.onboardingCompleted) {
        router.replace('/onboarding/team')
      } else {
        router.replace('/dashboard')
      }
      return
    }

    if (user && !isPublicPath) {
      const isOnboarding = pathname.startsWith('/onboarding')
      if (!user.onboardingCompleted && !isOnboarding) {
        router.replace('/onboarding/team')
        return
      }
      if (user.onboardingCompleted && isOnboarding) {
        router.replace('/dashboard')
        return
      }
    }
  }, [user, loading, pathname, isPublicPath, router])

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
  }

  async function logout(options: LogoutOptions = {}) {
    const wipeAll = options.wipeAll === true

    // ---------- Selective vs full localStorage wipe ----------
    // Both modes ALWAYS preserve the keys in ALWAYS_PRESERVE_KEYS so
    // that the cookie consent banner and the "what's new" modal don't
    // pop up again after every reconnection.
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
            /* ignore */
          }
        } else {
          for (const key of AUTH_LOCAL_KEYS) {
            localStorage.removeItem(key)
          }
        }
      } catch {
        /* ignore */
      }
    }

    // ---------- Faktur Desktop path ----------
    // Delegate to the Electron main process so it can nuke OAuth
    // tokens (and optionally cookies/cache for the wipeAll case)
    // before swapping to the login window. Calling this FIRST
    // prevents the navigation guard in shell_window.js from triggering
    // a session_expired loop.
    const desktopBridge =
      typeof window !== 'undefined' ? (window as any).fakturDesktop : null
    if (desktopBridge?.logout) {
      clearLocalStorageState()
      try {
        await desktopBridge.logout({ wipeAll })
      } catch {
        /* ignore */
      }
      return
    }

    // ---------- Web path ----------
    await api.post('/auth/logout', {})
    clearLocalStorageState()
    setUser(null)
    router.replace('/login')
  }

  async function handleCryptoRecovered() {
    await refreshUser()
  }

  async function handleCryptoWiped() {
    await refreshUser()
    router.replace('/onboarding/team')
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
      {children}
      <CryptoResetModal
        open={!!user?.cryptoResetNeeded}
        canRecoverWithPassword={!!user?.canRecoverWithPassword}
        hasRecoveryKey={!!user?.hasRecoveryKey}
        onRecovered={handleCryptoRecovered}
        onWiped={handleCryptoWiped}
      />
      <VaultUnlockModal forceOpen={!!user?.vaultLocked && !user?.cryptoResetNeeded} />
      <RecoveryKeySetupModal
        open={
          !!user &&
          !user.hasRecoveryKey &&
          user.onboardingCompleted &&
          !user.cryptoResetNeeded &&
          !user.vaultLocked
        }
      />
    </AuthContext.Provider>
  )
}
