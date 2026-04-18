'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, type Variants } from 'framer-motion'
import Link from 'next/link'
import { ArrowLeft, FileArchive, Lock, Upload } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Spinner } from '@/components/ui/spinner'
import { useToast } from '@/components/ui/toast'
import { useAuth } from '@/lib/auth'
import { api } from '@/lib/api'

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
} satisfies Variants

interface ImportTeamResponse {
  team: { id: string; name: string }
  recoveryKey?: string
}

export default function OnboardingTeamImportPage() {
  const router = useRouter()
  const { user, refreshUser } = useAuth()
  const { toast } = useToast()

  const [importFile, setImportFile] = useState<File | null>(null)
  const [importName, setImportName] = useState('')
  const [importPassword, setImportPassword] = useState('')
  const [isEncrypted, setIsEncrypted] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (user?.currentTeamId) {
      const hasKey = sessionStorage.getItem('zenvoice_recovery_key')
      router.replace(hasKey ? '/onboarding/recovery-key' : '/onboarding/company')
    }
  }, [user, router])

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
      return
    }

    setError('Format non supporte. Utilisez un fichier .zip ou .fpdata')
  }

  async function handleImport(e: React.FormEvent) {
    e.preventDefault()
    if (!importFile) return

    setError('')
    setLoading(true)

    const formData = new FormData()
    formData.append('file', importFile)
    formData.append('teamName', importName)
    if (isEncrypted && importPassword) {
      formData.append('decryptionPassword', importPassword)
    }

    const { data, error: requestError } = await api.upload<ImportTeamResponse>('/team/import', formData)
    setLoading(false)

    if (requestError) {
      setError(requestError)
      return
    }

    if (data?.recoveryKey) {
      sessionStorage.setItem('zenvoice_recovery_key', data.recoveryKey)
    }

    await refreshUser()
    toast(`Equipe "${data?.team.name}" importee`, 'success')
    router.push(data?.recoveryKey ? '/onboarding/recovery-key' : '/onboarding/company')
  }

  return (
    <motion.div initial="hidden" animate="visible" className="space-y-6">
      <motion.div variants={fadeUp} custom={0}>
        <Link
          href="/onboarding/team"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour a la creation d&apos;equipe
        </Link>
      </motion.div>

      <Card className="overflow-hidden border-border/50">
        <CardContent className="p-8">
          <form onSubmit={handleImport}>
            <FieldGroup>
              <motion.div variants={fadeUp} custom={1} className="text-center">
                <h1 className="text-2xl font-bold">Importer une equipe</h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  Importez une sauvegarde existante puis continuez l&apos;onboarding avec cette equipe.
                </p>
              </motion.div>

              {error && (
                <motion.div variants={fadeUp} custom={2}>
                  <FieldError className="text-center bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                    {error}
                  </FieldError>
                </motion.div>
              )}

              <motion.div variants={fadeUp} custom={3}>
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
                              <Lock className="h-3 w-3" />
                              Chiffre
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
                        <p className="text-sm font-medium text-foreground">Glissez-deposez un fichier ici</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          ou cliquez pour selectionner (.zip ou .fpdata)
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </motion.div>

              {isEncrypted && (
                <motion.div variants={fadeUp} custom={4}>
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
                </motion.div>
              )}

              <motion.div variants={fadeUp} custom={5}>
                <Separator />
              </motion.div>

              <motion.div variants={fadeUp} custom={6}>
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
                    Vous pouvez modifier le nom de l&apos;equipe importee avant la fin de l&apos;import.
                  </FieldDescription>
                </Field>
              </motion.div>

              <motion.div variants={fadeUp} custom={7}>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={loading || !importFile || importName.length < 2 || (isEncrypted && !importPassword)}
                >
                  {loading ? (
                    <><Spinner /> Importation en cours...</>
                  ) : (
                    <><Upload className="h-4 w-4 mr-2" /> Importer l&apos;equipe</>
                  )}
                </Button>
              </motion.div>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  )
}
