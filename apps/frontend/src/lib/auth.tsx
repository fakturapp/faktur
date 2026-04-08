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
  hasRecoveryKey: boolean
  hasGoogleProvider: boolean
  hasPasskeys: boolean
  vaultLocked: boolean
  isAdmin: boolean
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (token: string, user: User, vaultKey?: string) => void
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

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

// Short-form checkout URL served by the dedicated checkout subdomain, e.g.
// https://checkout.example.com/<token>/pay — the middleware rewrites these
// internally to /checkout/<token>/pay but usePathname() returns the browser
// URL, so we must recognise the short form as public here as well.
const SHORT_CHECKOUT_PATH = /^\/[a-zA-Z0-9_-]{16,}\/pay\/?$/

/**
 * Faktur Desktop drops a session payload in the URL hash fragment on
 * boot: `#faktur_desktop_session=<base64url-json>`. We consume it
 * synchronously BEFORE the refreshUser() fetch so AuthProvider sees
 * the token on its first pass and never tries to redirect to /login.
 */
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
    // Wipe the fragment from the URL so nothing gets logged or shared.
    const clean = window.location.pathname + window.location.search
    window.history.replaceState({}, '', clean)
  } catch (err) {
    console.error('[auth] failed to consume desktop session hash:', err)
  }
}

// Eager consume on module load so it runs before the React tree
// mounts. This is safe because it only touches localStorage.
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
    // Defensive re-consume in case this hook runs before the
    // module-level call (hot reload, edge cases).
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
      // Preserve the current URL (pathname + query) as a ?redirect=
      // param so the login page can bounce us back after auth. Only
      // relative paths go through so an attacker can't smuggle in an
      // off-site redirect via a crafted link.
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
      // Let these pages handle their own "already logged in" state
      if (
        pathname === '/login' ||
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
    setUser(userData)
  }

  async function logout() {
    // Faktur Desktop: delegate to the Electron main process so it can
    // nuke OAuth tokens + clear every session partition (cookies,
    // localStorage, cache, indexedDB, service workers) before swapping
    // to the login window. Calling this FIRST prevents the navigation
    // guard in shell_window.js from triggering a session_expired loop.
    const desktopBridge =
      typeof window !== 'undefined' ? (window as any).fakturDesktop : null
    if (desktopBridge?.logout) {
      try {
        await desktopBridge.logout()
      } catch {
        /* ignore — still proceed with best-effort web logout */
      }
      return
    }

    await api.post('/auth/logout', {})
    localStorage.removeItem('faktur_token')
    localStorage.removeItem('faktur_vault_key')
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
