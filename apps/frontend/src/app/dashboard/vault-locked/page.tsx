'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field, FieldLabel } from '@/components/ui/field'
import { Spinner } from '@/components/ui/spinner'
import { Avatar } from '@/components/ui/avatar'
import { api, onVaultLocked } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import { isFakturDesktop } from '@/lib/is-desktop'
import { HiddenUsername } from '@/components/auth/hidden-username'
import { DashboardBackground } from '@/components/layout/dashboard-background'
import {
  Lock,
  Eye,
  EyeOff,
  KeyRound,
  ExternalLink,
  LogOut,
  ShieldAlert,
  ArrowLeft,
  Cloud,
  Check,
  ArrowRight,
} from 'lucide-react'

type UnlockMode = 'password' | 'recoveryKey'

interface TeamSummary {
  id: string
  name: string
  iconUrl: string | null
  encryptionMode?: 'private' | 'standard' | null
  isCurrent?: boolean
}

function formatRecoveryKeyInput(value: string): string {
  const raw = value.replace(/[^0-9a-fA-F]/g, '').toUpperCase().slice(0, 32)
  return raw.match(/.{1,4}/g)?.join('-') ?? ''
}

export default function VaultLockedPage() {
  const router = useRouter()
  const { user, logout, refreshUser } = useAuth()
  const [mode, setMode] = useState<UnlockMode>('password')
  const [password, setPassword] = useState('')
  const [recoveryKey, setRecoveryKey] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [switchingTeamId, setSwitchingTeamId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [isDesktop, setIsDesktop] = useState(false)
  const [teams, setTeams] = useState<TeamSummary[]>([])
  const [teamsLoaded, setTeamsLoaded] = useState(false)

  useEffect(() => {
    setIsDesktop(isFakturDesktop())
  }, [])

  useEffect(() => {
    api.get<{ teams: TeamSummary[] }>('/team/all').then(({ data }) => {
      if (data?.teams) setTeams(data.teams)
      setTeamsLoaded(true)
    })
  }, [])

  useEffect(() => {
    if (!user) return
    if (!user.vaultLocked || user.currentTeamEncryptionMode !== 'private') {
      router.replace('/dashboard')
    }
  }, [user, router])

  useEffect(() => {
    return onVaultLocked(() => {})
  }, [])

  async function handleUnlock(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const body =
      mode === 'password' ? { password } : { recoveryKey: recoveryKey.replace(/-/g, '').trim() }

    const { data, error: err } = await api.post<{
      vaultKey?: string
      requiresCryptoRecovery?: boolean
    }>('/auth/vault/unlock', body)
    setLoading(false)

    if (err && err !== 'VAULT_LOCKED') {
      return setError(err)
    }

    if (!err) {
      if (data?.vaultKey) {
        localStorage.setItem('faktur_vault_key', data.vaultKey)
      }
      if (data?.requiresCryptoRecovery) {
        router.push('/dashboard')
        return
      }
      window.location.href = '/dashboard'
    }
  }

  async function handleSwitchTeam(teamId: string) {
    setError('')
    setSwitchingTeamId(teamId)
    const { error: err } = await api.post('/team/switch', { teamId })
    if (err) {
      setSwitchingTeamId(null)
      return setError(err)
    }
    await refreshUser()
    window.location.href = '/dashboard'
  }

  function switchMode(newMode: UnlockMode) {
    setMode(newMode)
    setError('')
    setPassword('')
    setRecoveryKey('')
  }

  const isValid = mode === 'password' ? !!password : !!recoveryKey.trim()
  const currentTeamName = teams.find((t) => t.isCurrent)?.name
  const otherTeams = teams.filter((t) => !t.isCurrent)

  return (
    <div className="relative min-h-screen bg-background">
      <DashboardBackground />
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 h-14 flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            className="h-9 -ml-2 gap-1.5"
            onClick={async () => {
              await logout()
            }}
          >
            <ArrowLeft className="h-4 w-4" /> Se déconnecter
          </Button>
          <div className="ml-auto text-xs font-medium text-muted-foreground">
            Coffre-fort verrouillé
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-8 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="rounded-2xl border border-amber-500/30 bg-card shadow-surface p-6 space-y-5"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/20">
              <Lock className="h-6 w-6 text-amber-500" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Coffre-fort verrouillé</h1>
              <p className="text-sm text-muted-foreground">
                {currentTeamName
                  ? `Le coffre de l'équipe « ${currentTeamName} » est verrouillé.`
                  : 'Votre coffre-fort est verrouillé.'}
              </p>
            </div>
          </div>

          {isDesktop ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Pour déverrouiller depuis Faktur Desktop, déconnectez-vous et reconnectez-vous via le flow OAuth — votre mot de passe ne transite jamais par l&apos;application.
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button className="flex-1" onClick={async () => { await logout() }}>
                  <LogOut className="h-4 w-4 mr-2" /> Se déconnecter
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    const url = `${window.location.origin}/dashboard/account/security`
                    if (typeof window !== 'undefined' && (window as unknown as { fakturDesktop?: { openExternal?: (u: string) => void } }).fakturDesktop?.openExternal) {
                      ;(window as unknown as { fakturDesktop: { openExternal: (u: string) => void } }).fakturDesktop.openExternal(url)
                    } else {
                      window.open(url, '_blank')
                    }
                  }}
                >
                  <ExternalLink className="h-4 w-4 mr-2" /> Déverrouiller dans le navigateur
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex rounded-lg border border-border overflow-hidden">
                <button
                  type="button"
                  onClick={() => switchMode('password')}
                  className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium transition-colors ${
                    mode === 'password'
                      ? 'bg-primary/10 text-primary border-r border-border'
                      : 'text-muted-foreground hover:bg-muted/50 border-r border-border'
                  }`}
                >
                  <Lock className="h-3.5 w-3.5" /> Mot de passe
                </button>
                <button
                  type="button"
                  onClick={() => switchMode('recoveryKey')}
                  className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium transition-colors ${
                    mode === 'recoveryKey'
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-muted/50'
                  }`}
                >
                  <KeyRound className="h-3.5 w-3.5" /> Clef de secours
                </button>
              </div>

              <form onSubmit={handleUnlock} className="space-y-4">
                {error && (
                  <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-center text-sm text-destructive">
                    {error}
                  </div>
                )}

                {mode === 'password' ? (
                  <Field>
                    <FieldLabel htmlFor="vaultPassword">Mot de passe</FieldLabel>
                    <HiddenUsername />
                    <div className="relative">
                      <Input
                        id="vaultPassword"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete="current-password"
                        required
                        autoFocus
                        className="pr-10"
                        placeholder="Votre mot de passe de connexion"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </Field>
                ) : (
                  <Field>
                    <FieldLabel htmlFor="vaultRecoveryKey">Clef de secours</FieldLabel>
                    <Input
                      id="vaultRecoveryKey"
                      name="recovery-key"
                      type="text"
                      value={recoveryKey}
                      onChange={(e) => setRecoveryKey(formatRecoveryKeyInput(e.target.value))}
                      autoComplete="off"
                      autoCorrect="off"
                      autoCapitalize="off"
                      spellCheck={false}
                      maxLength={39}
                      required
                      autoFocus
                      className="font-mono text-sm tracking-wider"
                      placeholder="XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      La clef de secours envoyée par email lors de la création de votre équipe.
                    </p>
                  </Field>
                )}

                <Button type="submit" className="w-full" disabled={loading || !isValid}>
                  {loading ? <><Spinner /> Déverrouillage...</> : <>Déverrouiller <ArrowRight className="h-4 w-4 ml-2" /></>}
                </Button>
              </form>
            </>
          )}
        </motion.div>

        {teamsLoaded && otherTeams.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="rounded-2xl border border-border bg-card shadow-surface p-6 space-y-4"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <Cloud className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-foreground">Accéder à une autre équipe</h2>
                <p className="text-sm text-muted-foreground">
                  Vous pouvez basculer sur une équipe en Mode Standard ou déjà déverrouillée pendant que vous trouvez votre mot de passe.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              {otherTeams.map((team) => {
                const isStandard = team.encryptionMode === 'standard'
                const switching = switchingTeamId === team.id
                return (
                  <button
                    key={team.id}
                    type="button"
                    onClick={() => handleSwitchTeam(team.id)}
                    disabled={switching || !!switchingTeamId}
                    className="w-full flex items-center gap-3 rounded-xl border border-border bg-card hover:bg-surface-hover transition-colors p-3 disabled:opacity-60 text-left"
                  >
                    {team.iconUrl ? (
                      <Avatar src={team.iconUrl} fallback={team.name[0]} size="sm" />
                    ) : (
                      <div className="h-9 w-9 rounded-lg bg-surface-hover flex items-center justify-center text-sm font-semibold text-muted-foreground">
                        {team.name[0]}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{team.name}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        {isStandard ? (
                          <span className="text-[10px] font-medium text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded-full flex items-center gap-1">
                            <Check className="h-3 w-3" /> Mode Standard
                          </span>
                        ) : (
                          <span className="text-[10px] font-medium text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded-full flex items-center gap-1">
                            <Lock className="h-3 w-3" /> Mode Privé
                          </span>
                        )}
                      </div>
                    </div>
                    {switching ? <Spinner size="sm" /> : <ArrowRight className="h-4 w-4 text-muted-foreground" />}
                  </button>
                )
              })}
            </div>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl border border-border bg-card/50 p-5 flex items-start gap-3"
        >
          <ShieldAlert className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">Plus aucune solution ?</p>
            <p className="text-sm text-muted-foreground mt-1">
              Si vous avez perdu votre mot de passe et votre clef de secours, vous pouvez réinitialiser le chiffrement — cela supprimera toutes les données chiffrées de cette équipe.
            </p>
            <div className="mt-3 flex flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/dashboard/account/security')}
              >
                Page sécurité
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground"
                onClick={async () => {
                  await logout()
                }}
              >
                <LogOut className="h-3.5 w-3.5 mr-1.5" /> Se déconnecter
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
