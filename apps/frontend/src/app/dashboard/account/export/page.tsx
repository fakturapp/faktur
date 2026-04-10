'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field, FieldGroup, FieldLabel, FieldDescription } from '@/components/ui/field'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Spinner } from '@/components/ui/spinner'
import { api } from '@/lib/api'
import { useToast } from '@/components/ui/toast'
import {
  ChevronRight, ChevronLeft, Lock, Download, Shield,
  CheckCircle2, FileArchive, Landmark, ArrowRight, CreditCard,
} from 'lucide-react'

interface TeamInfo {
  id: string
  name: string
  iconUrl: string | null
  role: string
  isOwner: boolean
  isCurrent: boolean
}

const steps = [
  { label: '\u00c9quipe' },
  { label: 'Options' },
  { label: 'Chiffrement' },
  { label: 'Confirmation' },
]

type Step = 0 | 1 | 2 | 3
type ExportStatus = 'idle' | 'exporting' | 'downloading' | 'done'

export default function ExportPage() {
  const { toast } = useToast()

  const [step, setStep] = useState<Step>(0)
  const [direction, setDirection] = useState(1)
  const [teams, setTeams] = useState<TeamInfo[]>([])
  const [teamsLoading, setTeamsLoading] = useState(true)
  const [selectedTeam, setSelectedTeam] = useState('')
  const [fileName, setFileName] = useState('')
  const [encrypt, setEncrypt] = useState(false)
  const [includeBankAccounts, setIncludeBankAccounts] = useState(false)
  const [includeStripeKeys, setIncludeStripeKeys] = useState(false)
  const [encryptionPassword, setEncryptionPassword] = useState('')
  const [encryptionConfirm, setEncryptionConfirm] = useState('')
  const [accountPassword, setAccountPassword] = useState('')
  const [exportStatus, setExportStatus] = useState<ExportStatus>('idle')

  useEffect(() => {
    api.get<{ teams: TeamInfo[] }>('/team/all').then(({ data }) => {
      if (data?.teams) {
        setTeams(data.teams)
        const current = data.teams.find((t) => t.isCurrent)
        if (current && ['admin', 'super_admin'].includes(current.role)) {
          setSelectedTeam(current.id)
        }
      }
      setTeamsLoading(false)
    })
  }, [])

  useEffect(() => {
    if (selectedTeam) {
      const team = teams.find((t) => t.id === selectedTeam)
      if (team) {
        const date = new Date().toISOString().split('T')[0]
        setFileName(`${team.name}-export-${date}`)
      }
    }
  }, [selectedTeam, teams])

  function goNext() {
    setDirection(1)
    if (step === 1 && !encrypt) setStep(3)
    else setStep((s) => Math.min(s + 1, 3) as Step)
  }

  function goBack() {
    setDirection(-1)
    if (step === 3 && !encrypt) setStep(1)
    else setStep((s) => Math.max(s - 1, 0) as Step)
  }

  async function handleExport() {
    const currentTeam = teams.find((t) => t.isCurrent)
    if (currentTeam && currentTeam.id !== selectedTeam) {
      await api.post('/team/switch', { teamId: selectedTeam })
    }

    setExportStatus('exporting')

    const body: Record<string, string | boolean> = { password: accountPassword }
    if (encrypt && encryptionPassword) body.encryptionPassword = encryptionPassword
    if (includeBankAccounts) body.includeBankAccounts = true
    if (includeStripeKeys) body.includeStripeKeys = true

    const { blob, filename: serverFilename, error } = await api.postBlob('/team/export', body)

    if (currentTeam && currentTeam.id !== selectedTeam) {
      await api.post('/team/switch', { teamId: currentTeam.id })
    }

    if (error || !blob) {
      setExportStatus('idle')
      return toast(error || "Erreur lors de l'export", 'error')
    }

    setExportStatus('downloading')

    const ext = encrypt ? '.fpdata' : '.zip'
    const downloadName = fileName ? `${fileName}${ext}` : serverFilename || `export${ext}`
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = downloadName
    a.click()
    URL.revokeObjectURL(url)

    setExportStatus('done')
  }

  const selectedTeamInfo = teams.find((t) => t.id === selectedTeam)
  const encPasswordsMatch = encryptionPassword === encryptionConfirm
  const canProceedStep1 = fileName.trim().length > 0
  const canProceedStep2 = encryptionPassword.length >= 4 && encPasswordsMatch

  const slideVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? 20 : -20, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -20 : 20, opacity: 0 }),
  }

  const activeSteps = encrypt ? steps : steps.filter((_, i) => i !== 2)
  const visualStep = encrypt ? step : (step > 1 ? step - 1 : step)

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto space-y-6"
    >
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent-soft">
          <Download className="h-6 w-6 text-accent" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Exporter mes donn&eacute;es</h1>
          <p className="text-sm text-muted-foreground">T&eacute;l&eacute;chargez une copie compl&egrave;te de vos donn&eacute;es.</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="rounded-xl bg-overlay shadow-surface p-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-muted-foreground">
            &Eacute;tape {visualStep + 1} sur {activeSteps.length}
          </p>
          <p className="text-xs font-medium text-primary">
            {activeSteps[visualStep]?.label}
          </p>
        </div>
        <div className="flex gap-1 mt-2.5">
          {activeSteps.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                i < visualStep ? 'bg-primary' : i === visualStep ? 'bg-primary/60' : 'bg-muted'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Steps */}
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={step}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.2 }}
        >
          {/* Step 0: Team selection */}
          {step === 0 && (
            <Card>
              <CardContent className="p-6 space-y-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-soft">
                    <Download className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-foreground">Choisir l&apos;&eacute;quipe</h2>
                    <p className="text-sm text-muted-foreground">S&eacute;lectionnez l&apos;&eacute;quipe &agrave; exporter.</p>
                  </div>
                </div>

                <div className="space-y-2 max-h-[260px] overflow-y-auto">
                  {teamsLoading ? (
                    <div className="flex items-center justify-center gap-2 py-8">
                      <Spinner className="text-primary" />
                      <span className="text-sm text-muted-foreground">Chargement...</span>
                    </div>
                  ) : (
                    teams.map((t) => {
                      const canExport = ['admin', 'super_admin'].includes(t.role)
                      return (
                        <label
                          key={t.id}
                          className={`flex items-center gap-3 rounded-xl border p-3.5 transition-all cursor-pointer ${
                            selectedTeam === t.id
                              ? 'border-primary bg-primary/5'
                              : canExport
                                ? 'border-border hover:border-primary/40'
                                : 'border-border/50 opacity-40 cursor-not-allowed'
                          }`}
                        >
                          <input
                            type="radio"
                            name="exportTeam"
                            value={t.id}
                            checked={selectedTeam === t.id}
                            onChange={() => canExport && setSelectedTeam(t.id)}
                            disabled={!canExport}
                            className="accent-primary"
                          />
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center text-xs font-bold text-foreground shrink-0 overflow-hidden">
                              {t.iconUrl ? (
                                <img src={t.iconUrl} alt="" className="h-full w-full object-cover" />
                              ) : (
                                t.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">{t.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {t.isOwner ? 'Propri\u00e9taire' : t.role === 'admin' ? 'Administrateur' : 'Membre'}
                                {!canExport && ' \u2014 Permissions insuffisantes'}
                              </p>
                            </div>
                          </div>
                        </label>
                      )
                    })
                  )}
                </div>

                <Separator />
                <div className="flex justify-end">
                  <Button onClick={goNext} disabled={!selectedTeam}>
                    Continuer <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 1: Options */}
          {step === 1 && (
            <Card>
              <CardContent className="p-6 space-y-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-soft">
                    <FileArchive className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-foreground">Options d&apos;export</h2>
                    <p className="text-sm text-muted-foreground">Configurez les param&egrave;tres.</p>
                  </div>
                </div>

                <Field>
                  <FieldLabel htmlFor="exportFileName">Nom du fichier</FieldLabel>
                  <Input id="exportFileName" value={fileName} onChange={(e) => setFileName(e.target.value)} placeholder="mon-export" />
                  <FieldDescription>Extension ajout&eacute;e automatiquement ({encrypt ? '.fpdata' : '.zip'})</FieldDescription>
                </Field>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-soft">
                      <Lock className="h-4 w-4 text-accent" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Chiffrer l&apos;export</p>
                      <p className="text-xs text-muted-foreground">AES-256-GCM (.fpdata)</p>
                    </div>
                  </div>
                  <Switch checked={encrypt} onChange={(v) => { setEncrypt(v); if (!v) { setEncryptionPassword(''); setEncryptionConfirm('') } }} />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-soft">
                      <Landmark className="h-4 w-4 text-accent" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Inclure les comptes bancaires</p>
                      <p className="text-xs text-muted-foreground">IBAN, BIC d&eacute;chiffr&eacute;s si n&eacute;cessaire</p>
                    </div>
                  </div>
                  <Switch checked={includeBankAccounts} onChange={setIncludeBankAccounts} />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-soft">
                      <CreditCard className="h-4 w-4 text-accent" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Inclure les cl&eacute;s Stripe</p>
                      <p className="text-xs text-muted-foreground">Cl&eacute;s API, webhook secrets</p>
                    </div>
                  </div>
                  <Switch checked={includeStripeKeys} onChange={setIncludeStripeKeys} />
                </div>

                <Separator />
                <div className="flex justify-between">
                  <Button variant="outline" onClick={goBack}><ChevronLeft className="h-4 w-4 mr-1" /> Retour</Button>
                  <Button onClick={goNext} disabled={!canProceedStep1}>Continuer <ArrowRight className="h-4 w-4 ml-2" /></Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Encryption password (only if encrypt=true) */}
          {step === 2 && (
            <Card>
              <CardContent className="p-6 space-y-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-soft">
                    <Shield className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-foreground">Mot de passe de chiffrement</h2>
                    <p className="text-sm text-muted-foreground">N&eacute;cessaire pour r&eacute;importer les donn&eacute;es.</p>
                  </div>
                </div>

                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="encPass">Mot de passe</FieldLabel>
                    <Input id="encPass" type="password" value={encryptionPassword} onChange={(e) => setEncryptionPassword(e.target.value)} autoFocus />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="encConfirm">Confirmer</FieldLabel>
                    <Input id="encConfirm" type="password" value={encryptionConfirm} onChange={(e) => setEncryptionConfirm(e.target.value)} />
                    {encryptionPassword && encryptionConfirm && !encPasswordsMatch && (
                      <p className="text-xs text-destructive mt-1">Les mots de passe ne correspondent pas</p>
                    )}
                  </Field>
                </FieldGroup>

                <Separator />
                <div className="flex justify-between">
                  <Button variant="outline" onClick={goBack}><ChevronLeft className="h-4 w-4 mr-1" /> Retour</Button>
                  <Button onClick={goNext} disabled={!canProceedStep2}>Continuer <ArrowRight className="h-4 w-4 ml-2" /></Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Confirm & export */}
          {step === 3 && (
            <Card>
              <CardContent className="p-6 space-y-5">
                {exportStatus === 'idle' ? (
                  <>
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-soft">
                        <CheckCircle2 className="h-5 w-5 text-accent" />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-foreground">Confirmer l&apos;export</h2>
                        <p className="text-sm text-muted-foreground">Entrez votre mot de passe de compte.</p>
                      </div>
                    </div>

                    {/* Summary */}
                    <div className="rounded-lg bg-surface-secondary p-4 space-y-2.5">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">&Eacute;quipe</span>
                        <span className="font-medium text-foreground">{selectedTeamInfo?.name}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Fichier</span>
                        <span className="font-medium text-foreground">{fileName}{encrypt ? '.fpdata' : '.zip'}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Chiffrement</span>
                        <span className="font-medium">{encrypt ? <span className="text-primary flex items-center gap-1"><Shield className="h-3.5 w-3.5" /> AES-256</span> : 'Non'}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Comptes bancaires</span>
                        <span className="font-medium">{includeBankAccounts ? <span className="text-primary flex items-center gap-1"><Landmark className="h-3.5 w-3.5" /> Inclus</span> : 'Non'}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Cl&eacute;s Stripe</span>
                        <span className="font-medium">{includeStripeKeys ? <span className="text-primary flex items-center gap-1"><CreditCard className="h-3.5 w-3.5" /> Inclus</span> : 'Non'}</span>
                      </div>
                    </div>

                    <Field>
                      <FieldLabel htmlFor="accountPass">Mot de passe du compte</FieldLabel>
                      <Input
                        id="accountPass"
                        type="password"
                        value={accountPassword}
                        onChange={(e) => setAccountPassword(e.target.value)}
                        placeholder="Votre mot de passe"
                        onKeyDown={(e) => { if (e.key === 'Enter' && accountPassword) handleExport() }}
                        autoFocus
                      />
                    </Field>

                    <Separator />
                    <div className="flex justify-between">
                      <Button variant="outline" onClick={goBack}><ChevronLeft className="h-4 w-4 mr-1" /> Retour</Button>
                      <Button onClick={handleExport} disabled={!accountPassword}>
                        <Download className="h-4 w-4 mr-2" /> Exporter
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center py-10 gap-4">
                    <AnimatePresence mode="wait">
                      {exportStatus === 'exporting' && (
                        <motion.div key="exp" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-3">
                          <Spinner className="h-10 w-10 text-primary" />
                          <p className="text-sm font-medium">Pr&eacute;paration de l&apos;export...</p>
                          <p className="text-xs text-muted-foreground">Collecte des donn&eacute;es et fichiers</p>
                        </motion.div>
                      )}
                      {exportStatus === 'downloading' && (
                        <motion.div key="dl" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-3">
                          <motion.div animate={{ y: [0, -5, 0] }} transition={{ duration: 1, repeat: Infinity }}>
                            <FileArchive className="h-10 w-10 text-primary" />
                          </motion.div>
                          <p className="text-sm font-medium">T&eacute;l&eacute;chargement...</p>
                        </motion.div>
                      )}
                      {exportStatus === 'done' && (
                        <motion.div key="done" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center gap-3">
                          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', bounce: 0.5 }}>
                            <CheckCircle2 className="h-12 w-12 text-emerald-500" />
                          </motion.div>
                          <p className="text-sm font-medium">Export termin&eacute; !</p>
                          <p className="text-xs text-muted-foreground">Le fichier a &eacute;t&eacute; t&eacute;l&eacute;charg&eacute; automatiquement.</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  )
}
