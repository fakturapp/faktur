'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { api } from '@/lib/api'

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
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (token: string, user: User) => void
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

const publicPaths = ['/login', '/register', '/forgot-password', '/reset-password', '/verify-email', '/2fa', '/invite']

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  const isPublicPath = publicPaths.some((p) => pathname.startsWith(p))

  const refreshUser = useCallback(async () => {
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
      router.replace('/login')
      return
    }

    if (user && isPublicPath) {
      // Let these pages handle their own "already logged in" state
      if (pathname === '/login' || pathname.startsWith('/verify-email') || pathname.startsWith('/invite')) {
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

  function login(token: string, userData: User) {
    localStorage.setItem('faktur_token', token)
    setUser(userData)
  }

  async function logout() {
    await api.post('/auth/logout', {})
    localStorage.removeItem('faktur_token')
    setUser(null)
    router.replace('/login')
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}
