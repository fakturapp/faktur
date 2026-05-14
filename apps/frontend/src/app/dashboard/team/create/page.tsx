'use client'

import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { Users, ArrowLeft, Upload, Plus, FileArchive, Lock } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Field, FieldGroup, FieldLabel, FieldDescription } from '@/components/ui/field'
import {
  CheckboxRoot,
  CheckboxControl,
  CheckboxIndicator,
  CheckboxContent,
} from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import { Spinner } from '@/components/ui/spinner'
import { useToast } from '@/components/ui/toast'
import { RecoveryKeyModal } from '@/components/modals/recovery-key-modal'
import { toast as t } from '@/components/ui/toast'
import { useAuth } from '@/lib/auth'
import { api } from '@/lib/api'
import {
  EncryptionModeChooser,
  type EncryptionMode,
  type EncryptionAcks,
} from '@/components/team/encryption-mode-chooser'
import { ConfirmPasswordModal } from '@/components/team/confirm-password-modal'

interface TeamActionResponse {
  team: { id: string; name: string }
  recoveryKey?: string
}

export default function CreateTeamPage() {
  const router = useRouter()
  const { refreshUser } = useAuth()
  const { toast } = useToast()

  const [mode, setMode] = useState<'create' | 'import'>('create')

  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [encryptionMode, setEncryptionMode] = useState<EncryptionMode>('standard')
  const [acks, setAcks] = useState<EncryptionAcks>({ dataLoss: false, notResponsible: false })
  const [configureNow, setConfigureNow] = useState(true)

  const [importFile, setImportFile] = useState<File | null>(null)
  const [importName, setImportName] = useState('')
  const [importPassword, setImportPassword] = useState('')
  const [isEncrypted, setIsEncrypted] = useState(false)
  const [importing, setImporting] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [importEncryptionMode, setImportEncryptionMode] = useState<EncryptionMode>('standard')
  const [importAcks, setImportAcks] = useState<EncryptionAcks>({ dataLoss: false, notResponsible: false })
  const [recoveryKeyModal, setRecoveryKeyModal] = useState<{
    recoveryKey: string
    successMessage: string
    redirectTo?: string
  } | null>(null)
  const [confirmPasswordOpen, setConfirmPasswordOpen] = useState(false)
  const [confirmPasswordSubmitting, setConfirmPasswordSubmitting] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleRecoveryKeyClose() {
    if (!recoveryKeyModal) return

    const { successMessage, redirectTo } = recoveryKeyModal
    setRecoveryKeyModal(null)
    toast(successMessage, 'success')

    if (redirectTo) {
      router.push(redirectTo)
    }
  }

  const createAcksValid =
    encryptionMode === 'standard' || (acks.dataLoss && acks.notResponsible)
  const importAcksValid =
    importEncryptionMode === 'standard' || (importAcks.dataLoss && importAcks.notResponsible)

  async function submitCreate(confirmPassword?: string) {
    const { data, error, errorCode } = await api.post<TeamActionResponse>('/team/create', {
      name,
      encryptionMode,
      ackDataLoss: acks.dataLoss,
      ackNotResponsible: acks.notResponsible,
      confirmPassword,
      skipOnboarding: !configureNow,
    })

    if (error) {
      if (errorCode === 'kek_required') {
        setLoading(false)
        setConfirmPasswordOpen(true)
        return null
      }
      if (errorCode === 'invalid_password') {
        setConfirmPasswordSubmitting(false)
        toast('Mot de passe incorrect.', 'error')
        return null
      }
      setLoading(false)
      setConfirmPasswordSubmitting(false)
      toast(error, 'error')
      return null
    }

    setLoading(false)
    setConfirmPasswordSubmitting(false)
    setConfirmPasswordOpen(false)
    return data
  }

  async function handleConfirmPassword(password: string) {
    setConfirmPasswordSubmitting(true)
    const data = await submitCreate(password)
    if (!data) return

    if (data.recoveryKey) {
      sessionStorage.setItem(`faktur_recovery_key_${data.team.id}`, data.recoveryKey)
      window.location.href = '/onboarding/recovery-key'
      return
    }

    await refreshUser()
    const redirectTo = configureNow ? '/onboarding' : '/dashboard'
    t.success(`Équipe « ${data?.team.name} » créée`, {
      description: 'Vous pouvez désormais inviter des membres et créer des factures.',
    })
    router.push(redirectTo)
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!createAcksValid) {
      toast('Veuillez accepter les avertissements pour activer le Mode Privé.', 'error')
      return
    }
    setLoading(true)
    const data = await submitCreate()
    if (!data) return

    if (data.recoveryKey) {
      sessionStorage.setItem(`faktur_recovery_key_${data.team.id}`, data.recoveryKey)
      window.location.href = '/onboarding/recovery-key'
      return
    }

    await refreshUser()

    if (configureNow) {
      t.success(`Équipe « ${data?.team.name} » créée`, {
        description: 'Configurons votre nouvelle équipe.',
      })
      router.push('/onboarding')
      return
    }

    t.success(`Équipe « ${data?.team.name} » créée`, {
      description: 'Vous pouvez désormais inviter des membres et créer des factures.',
      actionProps: {
        children: 'Inviter un membre',
        variant: 'outline',
        onPress: () => router.push('/dashboard/settings/members'),
      },
    })
    router.push('/dashboard')
  }

  const handleFileSelect = useCallback((file: File) => {
    setImportFile(file)
    setIsEncrypted(file.name.endsWith('.fpdata'))

    const baseName = file.name.replace(/\.(zip|fpdata)$/, '').replace(/-export$/, '')
    if (baseName && !importName) {
      setImportName(baseName)
    }
  }, [importName])

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)

    const file = e.dataTransfer.files[0]
    if (file && (file.name.endsWith('.zip') || file.name.endsWith('.fpdata'))) {
      handleFileSelect(file)
    } else {
      toast('Format non supporte. Utilisez un fichier .zip ou .fpdata', 'error')
    }
  }

  async function handleImport(e: React.FormEvent) {
    e.preventDefault()
    if (!importFile) return
    if (!importAcksValid) {
      toast('Veuillez accepter les avertissements pour activer le Mode Privé.', 'error')
      return
    }

    setImporting(true)
    const formData = new FormData()
    formData.append('file', importFile)
    formData.append('teamName', importName)
    formData.append('encryptionMode', importEncryptionMode)
    formData.append('ackDataLoss', String(importAcks.dataLoss))
    formData.append('ackNotResponsible', String(importAcks.notResponsible))
    if (isEncrypted && importPassword) {
      formData.append('decryptionPassword', importPassword)
    }

    const { data, error } = await api.upload<TeamActionResponse>('/team/import', formData)
    setImporting(false)

    if (error) return toast(error, 'error')

    await refreshUser()

    if (data?.recoveryKey) {
      setRecoveryKeyModal({
        recoveryKey: data.recoveryKey,
        successMessage: `Equipe "${data.team.name}" importee`,
        redirectTo: '/dashboard',
      })
      return
    }

    t.success(`Équipe « ${data?.team.name} » importée`, {
      description: 'Vos données ont été restaurées avec succès.',
    })
    router.push('/dashboard')
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-lg mx-auto space-y-6 px-4 lg:px-6 py-4 md:py-6"
    >
      <div>
        <Link
          href="/dashboard/team"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-5"
        >
          <ArrowLeft className="h-4 w-4" /> Retour aux equipes
        </Link>

        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent-soft">
            <Users className="h-6 w-6 text-accent" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Nouvelle equipe</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Creez une nouvelle equipe ou importez une equipe existante.
            </p>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => setMode('create')}
          className={`flex-1 flex items-center gap-3 rounded-xl border-2 p-4 text-left transition-all ${
            mode === 'create'
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-primary/40'
          }`}
        >
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
            mode === 'create' ? 'bg-primary/20' : 'bg-surface-hover'
          }`}>
            <Plus className={`h-5 w-5 ${mode === 'create' ? 'text-primary' : 'text-muted-foreground'}`} />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">Creer</p>
            <p className="text-xs text-muted-foreground">Nouvelle equipe vide</p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setMode('import')}
          className={`flex-1 flex items-center gap-3 rounded-xl border-2 p-4 text-left transition-all ${
            mode === 'import'
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-primary/40'
          }`}
        >
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
            mode === 'import' ? 'bg-primary/20' : 'bg-surface-hover'
          }`}>
            <Upload className={`h-5 w-5 ${mode === 'import' ? 'text-primary' : 'text-muted-foreground'}`} />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">Importer</p>
            <p className="text-xs text-muted-foreground">Depuis un fichier</p>
          </div>
        </button>
      </div>

      <AnimatePresence mode="wait">
        {mode === 'create' ? (
          <motion.div
            key="create"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <Card>
              <CardContent className="p-6">
                <form onSubmit={handleCreate}>
                  <FieldGroup>
                    <Field>
                      <FieldLabel htmlFor="teamName">Nom de l&apos;equipe</FieldLabel>
                      <Input
                        id="teamName"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Mon equipe"
                        required
                        minLength={2}
                        autoFocus
                      />
                      <FieldDescription>
                        Choisissez un nom pour identifier cette equipe.
                      </FieldDescription>
                    </Field>

                    <EncryptionModeChooser
                      value={encryptionMode}
                      onChange={setEncryptionMode}
                      acks={acks}
                      onAcksChange={setAcks}
                    />

                    <CheckboxRoot
                      isSelected={configureNow}
                      onChange={(checked) => setConfigureNow(!!checked)}
                      className="flex items-start gap-3 cursor-pointer rounded-lg border border-border p-3"
                    >
                      <CheckboxControl className="mt-0.5">
                        <CheckboxIndicator />
                      </CheckboxControl>
                      <CheckboxContent className="text-sm text-foreground leading-tight">
                        Configurer l&apos;equipe maintenant
                        <span className="block text-xs text-muted-foreground mt-0.5">
                          Lance l&apos;assistant de configuration (entreprise, apparence,
                          facturation). Sinon, vous configurerez tout depuis les reglages.
                        </span>
                      </CheckboxContent>
                    </CheckboxRoot>

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={loading || name.length < 2 || !createAcksValid}
                    >
                      {loading ? <><Spinner /> Creation...</> : "Creer l'equipe"}
                    </Button>
                  </FieldGroup>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            key="import"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <Card>
              <CardContent className="p-6">
                <form onSubmit={handleImport}>
                  <FieldGroup>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".zip,.fpdata"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handleFileSelect(file)
                      }}
                    />

                    <div
                      onDragOver={(e) => {
                        e.preventDefault()
                        setDragOver(true)
                      }}
                      onDragLeave={() => setDragOver(false)}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={`flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-8 cursor-pointer transition-all ${
                        dragOver
                          ? 'border-primary bg-primary/5'
                          : importFile
                            ? 'border-primary/40 bg-primary/5'
                            : 'border-border hover:border-primary/40'
                      }`}
                    >
                      {importFile ? (
                        <>
                          <FileArchive className="h-8 w-8 text-primary" />
                          <div className="text-center">
                            <p className="text-sm font-medium text-foreground">{importFile.name}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {(importFile.size / 1024).toFixed(1)} Ko
                              {isEncrypted && (
                                <span className="inline-flex items-center gap-1 ml-2 text-amber-400">
                                  <Lock className="h-3 w-3" /> Chiffre
                                </span>
                              )}
                            </p>
                          </div>
                          <p className="text-xs text-muted-foreground">Cliquez pour changer</p>
                        </>
                      ) : (
                        <>
                          <Upload className="h-8 w-8 text-muted-foreground" />
                          <div className="text-center">
                            <p className="text-sm font-medium text-foreground">
                              Glissez-deposez un fichier ici
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              ou cliquez pour selectionner (.zip ou .fpdata)
                            </p>
                          </div>
                        </>
                      )}
                    </div>

                    {isEncrypted && (
                      <Field>
                        <FieldLabel htmlFor="importPassword">Mot de passe de dechiffrement</FieldLabel>
                        <Input
                          id="importPassword"
                          type="password"
                          value={importPassword}
                          onChange={(e) => setImportPassword(e.target.value)}
                          placeholder="Mot de passe utilise lors de l'export"
                        />
                        <FieldDescription>
                          Ce fichier est chiffre. Entrez le mot de passe defini lors de l&apos;export.
                        </FieldDescription>
                      </Field>
                    )}

                    <Separator />

                    <Field>
                      <FieldLabel htmlFor="importName">Nom de l&apos;equipe</FieldLabel>
                      <Input
                        id="importName"
                        value={importName}
                        onChange={(e) => setImportName(e.target.value)}
                        placeholder="Nom de l'equipe importee"
                        required
                        minLength={2}
                      />
                      <FieldDescription>
                        Vous pouvez modifier le nom de l&apos;equipe importee.
                      </FieldDescription>
                    </Field>

                    <EncryptionModeChooser
                      value={importEncryptionMode}
                      onChange={setImportEncryptionMode}
                      acks={importAcks}
                      onAcksChange={setImportAcks}
                    />

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={
                        importing ||
                        !importFile ||
                        importName.length < 2 ||
                        (isEncrypted && !importPassword) ||
                        !importAcksValid
                      }
                    >
                      {importing ? (
                        <><Spinner /> Importation en cours...</>
                      ) : (
                        <><Upload className="h-4 w-4 mr-2" /> Importer l&apos;equipe</>
                      )}
                    </Button>
                  </FieldGroup>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {recoveryKeyModal && (
        <RecoveryKeyModal
          open={!!recoveryKeyModal}
          recoveryKey={recoveryKeyModal.recoveryKey}
          onClose={handleRecoveryKeyClose}
          title="Clef de secours mise a jour"
          description="La creation ou l'import d'equipe a genere une nouvelle clef de secours valable pour toutes vos equipes actives. Notez-la avant de continuer."
          minVisibleSeconds={12}
        />
      )}

      <ConfirmPasswordModal
        open={confirmPasswordOpen}
        onClose={() => {
          if (!confirmPasswordSubmitting) {
            setConfirmPasswordOpen(false)
          }
        }}
        onConfirm={handleConfirmPassword}
        submitting={confirmPasswordSubmitting}
      />
    </motion.div>
  )
}
