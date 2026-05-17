'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { api, onUnauthorized } from '@/lib/api'
import { OAUTH_REVOKE_URL } from '@/lib/oauth-config'
import {
  clearTokens,
  getCurrentTeamId,
  getStoredAccessToken,
  setCurrentTeamId as persistCurrentTeamId,
} from '@/lib/oauth-storage'

export interface PlatformTeam {
  id: string
  name: string
  iconUrl: string | null
  role: 'super_admin' | 'admin' | 'member' | 'viewer'
  encryptionMode: 'private' | 'standard'
}

export interface PlatformUser {
  id: string
  email: string
  fullName: string | null
  avatarUrl: string | null
  currentTeamId: string | null
  currentTeamEncryptionMode: 'private' | 'standard'
}

interface AuthContextValue {
  user: PlatformUser | null
  teams: PlatformTeam[]
  currentTeam: PlatformTeam | null
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
  selectTeam: (teamId: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

interface MeResponse {
  user: {
    id: string
    email: string
    fullName: string | null
    avatarUrl: string | null
    currentTeamId: string | null
    currentTeamEncryptionMode?: 'private' | 'standard'
  }
}

interface TeamsResponse {
  teams: Array<{
    id: string
    name: string
    iconUrl: string | null
    role: PlatformTeam['role']
    encryptionMode: 'private' | 'standard'
  }>
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PlatformUser | null>(null)
  const [teams, setTeams] = useState<PlatformTeam[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchMe = useCallback(async () => {
    const token = getStoredAccessToken()
    if (!token) {
      setUser(null)
      setTeams([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    const meRes = await api.get<MeResponse>('/auth/me')
    if (meRes.error || !meRes.data?.user) {
      setUser(null)
      setTeams([])
      setLoading(false)
      if (meRes.error && meRes.errorCode !== 'invalid_token') {
        setError(meRes.error)
      }
      return
    }

    const teamsRes = await api.get<TeamsResponse>('/team/all')
    const teamsList = teamsRes.data?.teams ?? []
    setTeams(teamsList)

    const persistedTeamId = getCurrentTeamId()
    const effectiveTeamId =
      teamsList.find((t) => t.id === persistedTeamId)?.id ??
      meRes.data.user.currentTeamId ??
      teamsList[0]?.id ??
      null

    if (effectiveTeamId) persistCurrentTeamId(effectiveTeamId)
    const activeTeam = teamsList.find((t) => t.id === effectiveTeamId) ?? null

    setUser({
      id: meRes.data.user.id,
      email: meRes.data.user.email,
      fullName: meRes.data.user.fullName,
      avatarUrl: meRes.data.user.avatarUrl,
      currentTeamId: effectiveTeamId,
      currentTeamEncryptionMode:
        activeTeam?.encryptionMode ??
        meRes.data.user.currentTeamEncryptionMode ??
        'standard',
    })
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchMe()
  }, [fetchMe])

  useEffect(() => {
    const off = onUnauthorized(() => {
      setUser(null)
      setTeams([])
    })
    return () => off()
  }, [])

  const selectTeam = useCallback(
    async (teamId: string) => {
      persistCurrentTeamId(teamId)
      const teamsRes = await api.post<{ team: PlatformTeam }>('/team/switch', { teamId })
      if (teamsRes.error) {
        setError(teamsRes.error)
        return
      }
      await fetchMe()
    },
    [fetchMe]
  )

  const signOut = useCallback(async () => {
    const token = getStoredAccessToken()
    if (token) {
      try {
        await fetch(OAUTH_REVOKE_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({ token }).toString(),
        })
      } catch {
        /* ignore network failure on logout */
      }
    }
    clearTokens()
    setUser(null)
    setTeams([])
    if (typeof window !== 'undefined') {
      window.location.href = '/login'
    }
  }, [])

  const currentTeam = useMemo(
    () => teams.find((t) => t.id === user?.currentTeamId) ?? null,
    [teams, user?.currentTeamId]
  )

  const value: AuthContextValue = {
    user,
    teams,
    currentTeam,
    loading,
    error,
    refresh: fetchMe,
    selectTeam,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used inside <AuthProvider>')
  }
  return ctx
}
