'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Dialog, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field, FieldGroup, FieldLabel, FieldDescription } from '@/components/ui/field'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Spinner } from '@/components/ui/spinner'
import { api } from '@/lib/api'
import { useToast } from '@/components/ui/toast'
import {
  ChevronRight,
  ChevronLeft,
  Lock,
  Download,
  Shield,
  CheckCircle2,
  FileArchive,
} from 'lucide-react'

interface TeamInfo {
  id: string
  name: string
  iconUrl: string | null
  role: string
  isOwner: boolean
  isCurrent: boolean
}

interface ExportModalProps {
  open: boolean
  onClose: () => void
}

type Step = 1 | 2 | 3 | 4
type ExportStatus = 'idle' | 'exporting' | 'downloading' | 'done'

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 80 : -80,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -80 : 80,
    opacity: 0,
  }),
}

export function ExportModal({ open, onClose }: ExportModalProps) {
  const { toast } = useToast()

  // State
  const [step, setStep] = useState<Step>(1)
  const [direction, setDirection] = useState(1)
  const [teams, setTeams] = useState<TeamInfo[]>([])
  const [teamsLoading, setTeamsLoading] = useState(false)
  const [selectedTeam, setSelectedTeam] = useState<string>('')
  const [fileName, setFileName] = useState('')
  const [encrypt, setEncrypt] = useState(false)
  const [encryptionPassword, setEncryptionPassword] = useState('')
  const [encryptionConfirm, setEncryptionConfirm] = useState('')
  const [accountPassword, setAccountPassword] = useState('')
  const [exportStatus, setExportStatus] = useState<ExportStatus>('idle')

  // Load teams when modal opens
  useEffect(() => {
    if (open) {
      setTeamsLoading(true)
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
    }
  }, [open])

  // Update default filename when team changes
  useEffect(() => {
    if (selectedTeam) {
      const team = teams.find((t) => t.id === selectedTeam)
      if (team) {
        const date = new Date().toISOString().split('T')[0]
        setFileName(`${team.name}-export-${date}`)
      }
    }
  }, [selectedTeam, teams])

  function reset() {
    setStep(1)
    setDirection(1)
    setSelectedTeam('')
    setFileName('')
    setEncrypt(false)
    setEncryptionPassword('')
    setEncryptionConfirm('')
    setAccountPassword('')
    setExportStatus('idle')
  }

  function handleClose() {
    if (exportStatus === 'exporting') return
    reset()
    onClose()
  }

  function goNext() {
    setDirection(1)
    if (step === 2 && !encrypt) {
      setStep(4)
    } else {
      setStep((s) => Math.min(s + 1, 4) as Step)
    }
  }

  function goBack() {
    setDirection(-1)
    if (step === 4 && !encrypt) {
      setStep(2)
    } else {
      setStep((s) => Math.max(s - 1, 1) as Step)
    }
  }

  async function handleExport() {
    // Switch to the selected team first
    const currentTeam = teams.find((t) => t.isCurrent)
    if (currentTeam && currentTeam.id !== selectedTeam) {
      await api.post('/team/switch', { teamId: selectedTeam })
    }

    setExportStatus('exporting')

    const body: Record<string, string> = { password: accountPassword }
    if (encrypt && encryptionPassword) {
      body.encryptionPassword = encryptionPassword
    }

    const { blob, filename: serverFilename, error } = await api.postBlob('/team/export', body)

    // Switch back to original team
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
  const canProceedStep2 = fileName.trim().length > 0
  const canProceedStep3 = encryptionPassword.length >= 4 && encPasswordsMatch

  return (
    <Dialog open={open} onClose={handleClose} className="max-w-lg">
      {/* Progress indicator */}
      <div className="flex items-center gap-2 mb-5">
        {[1, 2, 3, 4].map((s) => {
          if (s === 3 && !encrypt) return null
          return (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full transition-colors ${
                s <= step ? 'bg-primary' : 'bg-muted'
              }`}
            />
          )
        })}
      </div>

      <div className="min-h-[280px] relative overflow-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          {/* Step 1: Team selection */}
          {step === 1 && (
            <motion.div
              key="step1"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25, ease: 'easeInOut' }}
            >
              <DialogTitle>Choisir l&apos;equipe</DialogTitle>
              <DialogDescription>
                Selectionnez l&apos;equipe dont vous souhaitez exporter les donnees.
              </DialogDescription>

              <div className="mt-4 space-y-2 max-h-[200px] overflow-y-auto pr-1">
                {teamsLoading ? (
                  <div className="flex items-center justify-center gap-2 py-8">
                    <Spinner size="sm" className="text-primary" />
                    <span className="text-sm text-muted-foreground">Chargement...</span>
                  </div>
                ) : (
                  teams.map((t) => {
                    const canExport = ['admin', 'super_admin'].includes(t.role)
                    return (
                      <label
                        key={t.id}
                        className={`flex items-center gap-3 rounded-xl border p-3 transition-all cursor-pointer ${
                          selectedTeam === t.id
                            ? 'border-primary bg-primary/5'
                            : canExport
                              ? 'border-border hover:border-primary/40'
                              : 'border-border/50 opacity-50 cursor-not-allowed'
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
                          {t.iconUrl ? (
                            <img
                              src={t.iconUrl}
                              alt={t.name}
                              className="h-8 w-8 rounded-lg object-contain bg-white p-0.5"
                            />
                          ) : (
                            <div className="h-8 w-8 rounded-lg bg-zinc-800 flex items-center justify-center text-xs font-bold text-foreground">
                              {t.name
                                .split(' ')
                                .map((w) => w[0])
                                .join('')
                                .slice(0, 2)
                                .toUpperCase()}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">
                              {t.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {t.isOwner
                                ? 'Proprietaire'
                                : t.role === 'admin'
                                  ? 'Administrateur'
                                  : t.role === 'member'
                                    ? 'Membre'
                                    : 'Lecteur'}
                              {!canExport && ' — Permissions insuffisantes'}
                            </p>
                          </div>
                        </div>
                      </label>
                    )
                  })
                )}
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={handleClose}>
                  Annuler
                </Button>
                <Button onClick={goNext} disabled={!selectedTeam}>
                  Suivant <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </DialogFooter>
            </motion.div>
          )}

          {/* Step 2: Options */}
          {step === 2 && (
            <motion.div
              key="step2"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25, ease: 'easeInOut' }}
            >
              <DialogTitle>Options d&apos;export</DialogTitle>
              <DialogDescription>Configurez les parametres de l&apos;export.</DialogDescription>

              <div className="mt-4 space-y-4">
                <Field>
                  <FieldLabel htmlFor="exportFileName">Nom du fichier</FieldLabel>
                  <Input
                    id="exportFileName"
                    value={fileName}
                    onChange={(e) => setFileName(e.target.value)}
                    placeholder="mon-export"
                  />
                  <FieldDescription>
                    Extension ajoutee automatiquement ({encrypt ? '.fpdata' : '.zip'})
                  </FieldDescription>
                </Field>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                      <Lock className="h-4.5 w-4.5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Chiffrer l&apos;export</p>
                      <p className="text-xs text-muted-foreground">AES-256-GCM (.fpdata)</p>
                    </div>
                  </div>
                  <Switch
                    checked={encrypt}
                    onChange={(v) => {
                      setEncrypt(v)
                      if (!v) {
                        setEncryptionPassword('')
                        setEncryptionConfirm('')
                      }
                    }}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={goBack}>
                  <ChevronLeft className="h-4 w-4 mr-1" /> Retour
                </Button>
                <Button onClick={goNext} disabled={!canProceedStep2}>
                  Suivant <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </DialogFooter>
            </motion.div>
          )}

          {/* Step 3: Encryption password */}
          {step === 3 && (
            <motion.div
              key="step3"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25, ease: 'easeInOut' }}
            >
              <DialogTitle>Mot de passe de chiffrement</DialogTitle>
              <DialogDescription>
                Definissez un mot de passe pour proteger votre export. Vous en aurez besoin pour
                reimporter les donnees.
              </DialogDescription>

              <div className="mt-4">
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="encPass">Mot de passe</FieldLabel>
                    <Input
                      id="encPass"
                      type="password"
                      value={encryptionPassword}
                      onChange={(e) => setEncryptionPassword(e.target.value)}
                      placeholder="Mot de passe de chiffrement"
                      autoFocus
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="encPassConfirm">Confirmer</FieldLabel>
                    <Input
                      id="encPassConfirm"
                      type="password"
                      value={encryptionConfirm}
                      onChange={(e) => setEncryptionConfirm(e.target.value)}
                      placeholder="Confirmer le mot de passe"
                    />
                    {encryptionPassword &&
                      encryptionConfirm &&
                      !encPasswordsMatch && (
                        <p className="text-xs text-destructive mt-1">
                          Les mots de passe ne correspondent pas
                        </p>
                      )}
                  </Field>
                </FieldGroup>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={goBack}>
                  <ChevronLeft className="h-4 w-4 mr-1" /> Retour
                </Button>
                <Button onClick={goNext} disabled={!canProceedStep3}>
                  Suivant <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </DialogFooter>
            </motion.div>
          )}

          {/* Step 4: Confirmation & export */}
          {step === 4 && (
            <motion.div
              key="step4"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25, ease: 'easeInOut' }}
            >
              {exportStatus === 'idle' ? (
                <>
                  <DialogTitle>Confirmer l&apos;export</DialogTitle>
                  <DialogDescription>
                    Verifiez les parametres et entrez votre mot de passe de compte.
                  </DialogDescription>

                  <div className="mt-4 space-y-3">
                    {/* Summary */}
                    <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Equipe</span>
                        <span className="font-medium text-foreground">
                          {selectedTeamInfo?.name}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Fichier</span>
                        <span className="font-medium text-foreground">
                          {fileName}
                          {encrypt ? '.fpdata' : '.zip'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Chiffrement</span>
                        <span className="font-medium text-foreground">
                          {encrypt ? (
                            <span className="flex items-center gap-1 text-primary">
                              <Shield className="h-3.5 w-3.5" /> AES-256-GCM
                            </span>
                          ) : (
                            'Non'
                          )}
                        </span>
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
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && accountPassword) handleExport()
                        }}
                        autoFocus
                      />
                    </Field>
                  </div>

                  <DialogFooter>
                    <Button variant="outline" onClick={goBack}>
                      <ChevronLeft className="h-4 w-4 mr-1" /> Retour
                    </Button>
                    <Button onClick={handleExport} disabled={!accountPassword}>
                      <Download className="h-4 w-4 mr-2" /> Exporter
                    </Button>
                  </DialogFooter>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 gap-4">
                  <AnimatePresence mode="wait">
                    {exportStatus === 'exporting' && (
                      <motion.div
                        key="exporting"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="flex flex-col items-center gap-3"
                      >
                        <Spinner className="h-10 w-10 text-primary" />
                        <p className="text-sm font-medium text-foreground">
                          Preparation de l&apos;export...
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Collecte des donnees et fichiers
                        </p>
                      </motion.div>
                    )}

                    {exportStatus === 'downloading' && (
                      <motion.div
                        key="downloading"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="flex flex-col items-center gap-3"
                      >
                        <motion.div
                          animate={{ y: [0, -5, 0] }}
                          transition={{ duration: 1, repeat: Infinity }}
                        >
                          <FileArchive className="h-10 w-10 text-primary" />
                        </motion.div>
                        <p className="text-sm font-medium text-foreground">Telechargement...</p>
                      </motion.div>
                    )}

                    {exportStatus === 'done' && (
                      <motion.div
                        key="done"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex flex-col items-center gap-3"
                      >
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: 'spring', bounce: 0.5 }}
                        >
                          <CheckCircle2 className="h-12 w-12 text-emerald-500" />
                        </motion.div>
                        <p className="text-sm font-medium text-foreground">Export termine !</p>
                        <p className="text-xs text-muted-foreground">
                          Le fichier a ete telecharge automatiquement.
                        </p>
                        <Button onClick={handleClose} className="mt-2">
                          Fermer
                        </Button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Dialog>
  )
}
