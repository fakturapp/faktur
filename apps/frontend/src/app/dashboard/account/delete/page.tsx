'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { OtpInput } from '@/components/ui/otp-input'
import { HiddenUsername } from '@/components/auth/hidden-username'
import { Button } from '@/components/ui/button'
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { FormSelect } from '@/components/ui/dropdown'
import { Separator } from '@/components/ui/separator'
import { useAuth } from '@/lib/auth'
import { useToast } from '@/components/ui/toast'
import { api } from '@/lib/api'
import { Spinner } from '@/components/ui/spinner'
import {
  AlertTriangle, ArrowLeft, ArrowRight, Check, Users, UserCheck,
  KeyRound, Mail, Lock, Trash2, Shield, Crown, LogOut, Eye, EyeOff,
} from 'lucide-react'

const steps = [
  { label: 'Avertissement', icon: AlertTriangle },
  { label: 'Équipes', icon: Users },
  { label: 'Nom', icon: UserCheck },
  { label: 'Email', icon: Mail },
  { label: 'Mot de passe', icon: Lock },
  { label: 'Confirmation', icon: Trash2 },
]

interface TeamMemberInfo {
  userId: string
  displayName: string
  email: string
  role: string
}

interface TeamInfo {
  id: string
  name: string
  role: string
  memberCount: number
  members: TeamMemberInfo[]
}

export default function DeleteAccountPage() {
  const router = useRouter()
  const { user, logout } = useAuth()
  const { toast } = useToast()

  const [currentStep, setCurrentStep] = useState(0)
  const [direction, setDirection] = useState(1)
  const [deletionToken, setDeletionToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const [teams, setTeams] = useState<TeamInfo[]>([])
  const [teamsLoaded, setTeamsLoaded] = useState(false)
  const [deleteTeamDialog, setDeleteTeamDialog] = useState<TeamInfo | null>(null)
  const [deleteTeamPassword, setDeleteTeamPassword] = useState('')
  const [showDeleteTeamPassword, setShowDeleteTeamPassword] = useState(false)
  const [transferDialog, setTransferDialog] = useState<TeamInfo | null>(null)
  const [transferTarget, setTransferTarget] = useState('')
  const [leaveConfirm, setLeaveConfirm] = useState<TeamInfo | null>(null)
  const [redirectingTeam, setRedirectingTeam] = useState<{ team: TeamInfo; action: 'delete-team' | 'transfer' | 'leave' } | null>(null)

  const [nameInput, setNameInput] = useState('')

  const [codeSent, setCodeSent] = useState(false)
  const [codeInput, setCodeInput] = useState('')
  const [cooldown, setCooldown] = useState(0)
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const [passwordInput, setPasswordInput] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const [confirmText, setConfirmText] = useState('')

  function headers() {
    return deletionToken ? { 'x-deletion-token': deletionToken } : {}
  }

  function startCooldown() {
    setCooldown(60)
    if (cooldownRef.current) clearInterval(cooldownRef.current)
    cooldownRef.current = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          if (cooldownRef.current) clearInterval(cooldownRef.current)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  useEffect(() => {
    return () => {
      if (cooldownRef.current) clearInterval(cooldownRef.current)
    }
  }, [])

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('faktur_account_delete_flash')
      if (!raw) return
      sessionStorage.removeItem('faktur_account_delete_flash')
      const flash = JSON.parse(raw) as { kind: 'success' | 'cancel'; action: 'delete-team' | 'transfer' | 'leave' | null }
      if (flash.kind === 'success') {
        const msg = flash.action === 'delete-team' ? 'Équipe supprimée'
          : flash.action === 'transfer' ? 'Équipe transférée'
          : flash.action === 'leave' ? 'Vous avez quitté l\'équipe'
          : 'Action effectuée'
        toast(msg, 'success')
      } else {
        toast('Action annulée, vous pouvez réessayer', 'info')
      }
    } catch {}
  }, [toast])

  function goNext() {
    setDirection(1)
    setCurrentStep((s) => s + 1)
  }

  async function handleStart() {
    setLoading(true)
    const { data, error } = await api.post<{ token: string }>('/account/delete/start', {})
    setLoading(false)
    if (error) return toast(error, 'error')
    if (data?.token) {
      setDeletionToken(data.token)
      goNext()
      loadTeams(data.token)
    }
  }

  async function loadTeams(token?: string) {
    const hdrs = token ? { 'x-deletion-token': token } : headers()
    const { data } = await api.get<{ teams: TeamInfo[] }>('/account/delete/teams', {
      headers: hdrs as Record<string, string>,
    })
    if (data?.teams) {
      setTeams(data.teams)
      setTeamsLoaded(true)
    }
  }

  async function handleDeleteTeam() {
    if (!deleteTeamDialog) return
    setLoading(true)
    const { error } = await api.post('/account/delete/resolve-team', {
      teamId: deleteTeamDialog.id,
      action: 'delete',
      password: deleteTeamPassword,
    }, { headers: headers() as Record<string, string> })
    setLoading(false)
    if (error) return toast(error, 'error')
    setTeams((prev) => prev.filter((t) => t.id !== deleteTeamDialog.id))
    setDeleteTeamDialog(null)
    setDeleteTeamPassword('')
    toast('Équipe supprimée', 'success')
  }

  function openTransferDialog(team: TeamInfo) {
    setTransferDialog(team)
    setTransferTarget('')
  }

  async function handleTransferTeam() {
    if (!transferDialog || !transferTarget) return
    setLoading(true)
    const { error } = await api.post('/account/delete/resolve-team', {
      teamId: transferDialog.id,
      action: 'transfer',
      transferToUserId: transferTarget,
    }, { headers: headers() as Record<string, string> })
    setLoading(false)
    if (error) return toast(error, 'error')
    setTeams((prev) => prev.filter((t) => t.id !== transferDialog.id))
    setTransferDialog(null)
    toast('Propriété transférée et équipe quittée', 'success')
  }

  async function handleLeaveTeam(team: TeamInfo) {
    setLoading(true)
    const { error } = await api.post('/account/delete/resolve-team', {
      teamId: team.id,
      action: 'leave',
    }, { headers: headers() as Record<string, string> })
    setLoading(false)
    if (error) return toast(error, 'error')
    setTeams((prev) => prev.filter((t) => t.id !== team.id))
    toast("Vous avez quitté l'équipe", 'success')
  }

  function handleTeamsNext() {
    if (teams.length > 0) return
    goNext()
  }

  async function startTeamRedirect(team: TeamInfo, action: 'delete-team' | 'transfer' | 'leave') {
    setRedirectingTeam({ team, action })
    try {
      const { error } = await api.post('/team/switch', { teamId: team.id })
      if (error) {
        setRedirectingTeam(null)
        return toast(error, 'error')
      }
    } catch {
      setRedirectingTeam(null)
      return toast('Impossible de basculer sur cette équipe', 'error')
    }
    const params = new URLSearchParams({ action, from: 'account-delete' })
    router.push(`/dashboard/settings/members?${params.toString()}`)
  }

  async function handleVerifyName(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const { error } = await api.post('/account/delete/verify-name', {
      fullName: nameInput,
    }, { headers: headers() as Record<string, string> })
    setLoading(false)
    if (error) return toast(error, 'error')
    goNext()
  }

  async function handleSendCode() {
    setLoading(true)
    const { error } = await api.post('/account/delete/send-code', {}, {
      headers: headers() as Record<string, string>,
    })
    setLoading(false)
    if (error) return toast(error, 'error')
    setCodeSent(true)
    startCooldown()
    toast('Code envoyé', 'success')
  }

  async function handleVerifyCode(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const { error } = await api.post('/account/delete/verify-code', {
      code: codeInput.trim(),
    }, { headers: headers() as Record<string, string> })
    setLoading(false)
    if (error) return toast(error, 'error')
    goNext()
  }

  async function handleVerifyPassword(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const { error } = await api.post('/account/delete/verify-password', {
      password: passwordInput,
    }, { headers: headers() as Record<string, string> })
    setLoading(false)
    if (error) return toast(error, 'error')
    goNext()
  }

  async function handleFinalDelete() {
    setLoading(true)
    const { error } = await api.delete('/account/delete/confirm', {
      confirmText,
    }, { headers: headers() as Record<string, string> })
    setLoading(false)
    if (error) return toast(error, 'error')
    toast('Compte supprimé', 'success')
    await logout()
  }

  const slideVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? 20 : -20, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -20 : 20, opacity: 0 }),
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 h-14 flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            className="h-9 -ml-2 gap-1.5"
            onClick={() => router.push('/dashboard/account')}
          >
            <ArrowLeft className="h-4 w-4" /> Retour
          </Button>
          <div className="ml-auto text-xs font-medium text-muted-foreground">
            Suppression du compte
          </div>
        </div>
      </div>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto space-y-6 px-4 sm:px-6 py-8"
      >
        {}
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-destructive/10">
            <Trash2 className="h-6 w-6 text-destructive" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-destructive">Supprimer mon compte</h1>
            <p className="text-sm text-muted-foreground">Cette action est définitive et irréversible.</p>
          </div>
        </div>

      {}
      <div className="rounded-xl bg-overlay shadow-surface p-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-muted-foreground">
            Étape {currentStep + 1} sur {steps.length}
          </p>
          <p className="text-xs font-medium text-destructive">
            {steps[currentStep].label}
          </p>
        </div>
        <div className="flex gap-1 mt-2.5">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                i < currentStep ? 'bg-destructive' : i === currentStep ? 'bg-destructive/60' : 'bg-muted'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Step content */}
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={currentStep}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.2 }}
        >
          {/* Step 1: Warning */}
          {currentStep === 0 && (
            <Card className="border-destructive/30">
              <CardContent className="p-6 space-y-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-destructive/10">
                    <AlertTriangle className="h-6 w-6 text-destructive" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-foreground">Attention</h2>
                    <p className="text-sm text-muted-foreground">Veuillez lire attentivement avant de continuer.</p>
                  </div>
                </div>

                <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 space-y-3">
                  <p className="text-sm font-medium text-destructive">La suppression de votre compte entraînera :</p>
                  <ul className="text-sm text-muted-foreground space-y-2">
                    <li className="flex items-start gap-2">
                      <Trash2 className="h-4 w-4 mt-0.5 text-destructive shrink-0" />
                      La perte définitive de toutes vos factures, devis, avoirs et données.
                    </li>
                    <li className="flex items-start gap-2">
                      <Users className="h-4 w-4 mt-0.5 text-destructive shrink-0" />
                      La suppression de vos équipes ou votre retrait de celles-ci.
                    </li>
                    <li className="flex items-start gap-2">
                      <KeyRound className="h-4 w-4 mt-0.5 text-destructive shrink-0" />
                      La destruction de vos clés de chiffrement et données cryptées.
                    </li>
                    <li className="flex items-start gap-2">
                      <Shield className="h-4 w-4 mt-0.5 text-destructive shrink-0" />
                      La révocation de toutes vos sessions et tokens d&apos;accès.
                    </li>
                  </ul>
                </div>

                <Separator />

                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    className="border-destructive/30 text-destructive hover:bg-destructive/10"
                    onClick={handleStart}
                    disabled={loading}
                  >
                    {loading ? <><Spinner /> Chargement...</> : "J'ai compris, continuer"}
                    {!loading && <ArrowRight className="h-4 w-4 ml-2" />}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Teams */}
          {currentStep === 1 && (
            <Card>
              <CardContent className="p-6 space-y-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent-soft">
                    <Users className="h-6 w-6 text-accent" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-foreground">Résoudre les équipes</h2>
                    <p className="text-sm text-muted-foreground">
                      {teams.length > 0
                        ? 'Vous devez quitter ou supprimer toutes vos équipes avant de continuer.'
                        : 'Aucune équipe restante. Vous pouvez continuer.'}
                    </p>
                  </div>
                </div>

                {!teamsLoaded && (
                  <div className="flex items-center justify-center gap-2 py-8">
                    <Spinner size="sm" className="text-primary" />
                    <span className="text-sm text-muted-foreground">Chargement...</span>
                  </div>
                )}

                {teamsLoaded && teams.length === 0 && (
                  <div className="rounded-lg bg-surface-secondary p-6 text-center">
                    <Check className="h-8 w-8 text-green-500 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Toutes les équipes ont été résolues.</p>
                  </div>
                )}

                {teams.map((team) => (
                  <div
                    key={team.id}
                    className="flex items-center justify-between rounded-xl border border-border p-4 gap-3"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-foreground truncate">{team.name}</p>
                        {team.role === 'super_admin' && (
                          <span className="flex items-center gap-1 text-[10px] font-medium text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded-full">
                            <Crown className="h-3 w-3" /> Propriétaire
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{team.memberCount} membre{team.memberCount > 1 ? 's' : ''}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {team.role === 'super_admin' ? (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-destructive/30 text-destructive hover:bg-destructive/10"
                            onClick={() => startTeamRedirect(team, 'delete-team')}
                            disabled={loading || !!redirectingTeam}
                          >
                            <Trash2 className="h-3.5 w-3.5 mr-1" /> Supprimer
                          </Button>
                          {team.memberCount > 1 && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => startTeamRedirect(team, 'transfer')}
                              disabled={loading || !!redirectingTeam}
                            >
                              <UserCheck className="h-3.5 w-3.5 mr-1" /> Transférer & Quitter
                            </Button>
                          )}
                        </>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => startTeamRedirect(team, 'leave')}
                          disabled={loading || !!redirectingTeam}
                        >
                          <LogOut className="h-3.5 w-3.5 mr-1" /> Quitter
                        </Button>
                      )}
                    </div>
                  </div>
                ))}

                <Separator />

                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    className="border-destructive/30 text-destructive hover:bg-destructive/10"
                    onClick={handleTeamsNext}
                    disabled={teams.length > 0}
                  >
                    Continuer <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Verify name */}
          {currentStep === 2 && (
            <Card>
              <CardContent className="p-6 space-y-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent-soft">
                    <UserCheck className="h-6 w-6 text-accent" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-foreground">Confirmez votre identité</h2>
                    <p className="text-sm text-muted-foreground">
                      Tapez votre nom complet <strong className="text-foreground">{user?.fullName}</strong> pour confirmer.
                    </p>
                  </div>
                </div>

                <form onSubmit={handleVerifyName} className="space-y-4">
                  <Input
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    placeholder={user?.fullName || 'Votre nom complet'}
                    autoFocus
                  />
                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      variant="outline"
                      className="border-destructive/30 text-destructive hover:bg-destructive/10"
                      disabled={loading || nameInput !== user?.fullName}
                    >
                      {loading ? <><Spinner /> Vérification...</> : <>Continuer <ArrowRight className="h-4 w-4 ml-2" /></>}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Step 4: Email code */}
          {currentStep === 3 && (
            <Card>
              <CardContent className="p-6 space-y-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent-soft">
                    <Mail className="h-6 w-6 text-accent" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-foreground">Vérification par email</h2>
                    <p className="text-sm text-muted-foreground">
                      Un code de vérification sera envoyé à <strong className="text-foreground">{user?.email}</strong>.
                    </p>
                  </div>
                </div>

                {!codeSent ? (
                  <div className="flex justify-end">
                    <Button
                      variant="outline"
                      className="border-destructive/30 text-destructive hover:bg-destructive/10"
                      onClick={handleSendCode}
                      disabled={loading}
                    >
                      {loading ? <><Spinner /> Envoi...</> : <>Envoyer le code <Mail className="h-4 w-4 ml-2" /></>}
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleVerifyCode} className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Un code à 6 chiffres a été envoyé. Il est valide pendant 5 minutes.
                    </p>
                    <div className="flex justify-center py-1">
                      <OtpInput
                        value={codeInput}
                        onChange={setCodeInput}
                        autoFocus
                        ariaLabel="Code de vérification email"
                      />
                    </div>
                    <div className="flex justify-center">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleSendCode}
                        disabled={loading || cooldown > 0}
                      >
                        {cooldown > 0 ? `Renvoyer (${cooldown}s)` : 'Renvoyer le code'}
                      </Button>
                    </div>
                    <div className="flex justify-end">
                      <Button
                        type="submit"
                        variant="outline"
                        className="border-destructive/30 text-destructive hover:bg-destructive/10"
                        disabled={loading || codeInput.length !== 6}
                      >
                        {loading ? <><Spinner /> Vérification...</> : <>Vérifier <ArrowRight className="h-4 w-4 ml-2" /></>}
                      </Button>
                    </div>
                  </form>
                )}
              </CardContent>
            </Card>
          )}

          {/* Step 5: Password */}
          {currentStep === 4 && (
            <Card>
              <CardContent className="p-6 space-y-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent-soft">
                    <Lock className="h-6 w-6 text-accent" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-foreground">Mot de passe</h2>
                    <p className="text-sm text-muted-foreground">Entrez votre mot de passe pour continuer.</p>
                  </div>
                </div>

                <form onSubmit={handleVerifyPassword} className="space-y-4">
                  <HiddenUsername />
                  <div className="relative">
                    <Input
                      id="delete-account-password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Votre mot de passe"
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      autoComplete="current-password"
                      className="pr-10"
                      autoFocus
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
                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      variant="outline"
                      className="border-destructive/30 text-destructive hover:bg-destructive/10"
                      disabled={loading || !passwordInput}
                    >
                      {loading ? <><Spinner /> Vérification...</> : <>Continuer <ArrowRight className="h-4 w-4 ml-2" /></>}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Step 6: Final confirmation */}
          {currentStep === 5 && (
            <Card className="border-destructive/30">
              <CardContent className="p-6 space-y-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-destructive/10">
                    <Trash2 className="h-6 w-6 text-destructive" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-destructive">Confirmation finale</h2>
                    <p className="text-sm text-muted-foreground">
                      Tapez <strong className="text-destructive">supprimer</strong> pour confirmer la suppression définitive.
                    </p>
                  </div>
                </div>

                <Input
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder='Tapez "supprimer"'
                  className="border-destructive/30 focus-visible:ring-destructive"
                  autoFocus
                />

                <div className="flex justify-end">
                  <Button
                    variant="destructive"
                    onClick={handleFinalDelete}
                    disabled={loading || confirmText.toLowerCase() !== 'supprimer'}
                    className="min-w-[200px]"
                  >
                    {loading ? (
                      <><Spinner /> Suppression en cours...</>
                    ) : (
                      <><Trash2 className="h-4 w-4 mr-2" /> Supprimer définitivement</>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Delete team dialog */}
      <Dialog open={!!deleteTeamDialog} onClose={() => setDeleteTeamDialog(null)}>
        <DialogHeader showClose={false} icon={<Trash2 className="h-5 w-5 text-danger" />}>
          <DialogTitle>Supprimer l&apos;équipe « {deleteTeamDialog?.name} »</DialogTitle>
          <DialogDescription>
            Toutes les données de cette équipe seront perdues. Entrez votre mot de passe pour confirmer.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4 relative">
          <HiddenUsername />
          <Input
            id="delete-team-password"
            name="password"
            type={showDeleteTeamPassword ? 'text' : 'password'}
            placeholder="Votre mot de passe"
            value={deleteTeamPassword}
            onChange={(e) => setDeleteTeamPassword(e.target.value)}
            autoComplete="current-password"
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => setShowDeleteTeamPassword(!showDeleteTeamPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            tabIndex={-1}
          >
            {showDeleteTeamPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setDeleteTeamDialog(null)} disabled={loading}>
            Annuler
          </Button>
          <Button
            variant="destructive"
            onClick={handleDeleteTeam}
            disabled={loading || !deleteTeamPassword}
          >
            {loading ? <><Spinner /> Suppression...</> : 'Supprimer'}
          </Button>
        </DialogFooter>
      </Dialog>

      {/* Leave team confirmation dialog */}
      <Dialog open={!!leaveConfirm} onClose={() => setLeaveConfirm(null)} className="max-w-sm">
        <DialogHeader showClose={false} icon={<LogOut className="h-5 w-5 text-danger" />}>
          <DialogTitle>Quitter « {leaveConfirm?.name} » ?</DialogTitle>
          <DialogDescription>
            Vous perdrez l&apos;accès à toutes les données de cette équipe. Cette action est irréversible.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setLeaveConfirm(null)} disabled={loading}>
            Annuler
          </Button>
          <Button
            variant="destructive"
            onClick={async () => {
              if (!leaveConfirm) return
              await handleLeaveTeam(leaveConfirm)
              setLeaveConfirm(null)
            }}
            disabled={loading}
          >
            {loading ? <><Spinner /> En cours...</> : <><LogOut className="h-3.5 w-3.5 mr-1" /> Quitter</>}
          </Button>
        </DialogFooter>
      </Dialog>

      {/* Transfer ownership dialog */}
      <Dialog open={!!transferDialog} onClose={() => setTransferDialog(null)}>
        <DialogHeader onClose={() => setTransferDialog(null)} icon={<UserCheck className="h-5 w-5 text-accent" />}>
          <DialogTitle>Transférer « {transferDialog?.name} »</DialogTitle>
          <DialogDescription>
            Choisissez un membre qui deviendra le nouveau propriétaire de cette équipe.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4">
          {transferDialog && transferDialog.members.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              Aucun autre membre disponible.
            </p>
          ) : (
            <FormSelect
              value={transferTarget}
              onChange={setTransferTarget}
              placeholder="Sélectionner un membre"
              options={[
                { value: '', label: 'Sélectionner un membre' },
                ...(transferDialog?.members.map((m) => ({
                  value: m.userId,
                  label: m.displayName || m.email,
                })) || []),
              ]}
            />
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setTransferDialog(null)} disabled={loading}>
            Annuler
          </Button>
          <Button
            onClick={handleTransferTeam}
            disabled={loading || !transferTarget}
          >
            {loading ? <><Spinner /> Transfert...</> : 'Transférer & Quitter'}
          </Button>
        </DialogFooter>
      </Dialog>
      </motion.div>

      <AnimatePresence>
        {redirectingTeam && (
          <motion.div
            key="redirect-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              className="rounded-2xl border border-border bg-card shadow-2xl p-8 max-w-sm mx-4 text-center space-y-4"
            >
              <div className="mx-auto h-12 w-12 rounded-full bg-accent-soft flex items-center justify-center">
                <Spinner size="sm" className="text-accent" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-semibold text-foreground">
                  Redirection en cours
                </h3>
                <p className="text-sm text-muted-foreground">
                  Ouverture des paramètres de l&apos;équipe «&nbsp;{redirectingTeam.team.name}&nbsp;» pour {redirectingTeam.action === 'delete-team' ? 'supprimer' : redirectingTeam.action === 'transfer' ? 'transférer' : 'quitter'} l&apos;équipe.
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
