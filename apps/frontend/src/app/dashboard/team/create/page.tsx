'use client'

import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Field, FieldGroup, FieldLabel, FieldDescription } from '@/components/ui/field'
import { Separator } from '@/components/ui/separator'
import { useAuth } from '@/lib/auth'
import { useToast } from '@/components/ui/toast'
import { api } from '@/lib/api'
import { Spinner } from '@/components/ui/spinner'
import { Users, ArrowLeft, Upload, Plus, FileArchive, Lock } from 'lucide-react'
import Link from 'next/link'

export default function CreateTeamPage() {
  const router = useRouter()
  const { refreshUser } = useAuth()
  const { toast } = useToast()

  const [mode, setMode] = useState<'create' | 'import'>('create')

  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)

  const [importFile, setImportFile] = useState<File | null>(null)
  const [importName, setImportName] = useState('')
  const [importPassword, setImportPassword] = useState('')
  const [isEncrypted, setIsEncrypted] = useState(false)
  const [importing, setImporting] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const { data, error } = await api.post<{ team: { id: string; name: string } }>(
      '/team/create',
      { name }
    )
    setLoading(false)

    if (error) return toast(error, 'error')

    toast(`Équipe "${data?.team.name}" créée`, 'success')
    await refreshUser()
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
      toast('Format non supporté. Utilisez un fichier .zip ou .fpdata', 'error')
    }
  }

  async function handleImport(e: React.FormEvent) {
    e.preventDefault()
    if (!importFile) return

    setImporting(true)
    const formData = new FormData()
    formData.append('file', importFile)
    formData.append('teamName', importName)
    if (isEncrypted && importPassword) {
      formData.append('decryptionPassword', importPassword)
    }

    const { data, error } = await api.upload<{ team: { id: string; name: string } }>(
      '/team/import',
      formData
    )
    setImporting(false)

    if (error) return toast(error, 'error')

    await refreshUser()
    toast(`Équipe "${data?.team.name}" importée`, 'success')
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
          <ArrowLeft className="h-4 w-4" /> Retour aux &eacute;quipes
        </Link>
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
            <Users className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Nouvelle &eacute;quipe</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Cr&eacute;ez une nouvelle &eacute;quipe ou importez une &eacute;quipe existante.
            </p>
          </div>
        </div>
      </div>

      {}
      <div className="flex gap-3">
        <button
          onClick={() => setMode('create')}
          className={`flex-1 flex items-center gap-3 rounded-xl border-2 p-4 text-left transition-all ${
            mode === 'create'
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-primary/40'
          }`}
        >
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
            mode === 'create' ? 'bg-primary/20' : 'bg-muted/50'
          }`}>
            <Plus className={`h-5 w-5 ${mode === 'create' ? 'text-primary' : 'text-muted-foreground'}`} />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">Créer</p>
            <p className="text-xs text-muted-foreground">Nouvelle équipe vide</p>
          </div>
        </button>

        <button
          onClick={() => setMode('import')}
          className={`flex-1 flex items-center gap-3 rounded-xl border-2 p-4 text-left transition-all ${
            mode === 'import'
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-primary/40'
          }`}
        >
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
            mode === 'import' ? 'bg-primary/20' : 'bg-muted/50'
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
                      <FieldLabel htmlFor="teamName">Nom de l&apos;équipe</FieldLabel>
                      <Input
                        id="teamName"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Mon équipe"
                        required
                        minLength={2}
                        autoFocus
                      />
                      <FieldDescription>
                        Choisissez un nom pour identifier cette équipe.
                      </FieldDescription>
                    </Field>

                    <Button type="submit" className="w-full" disabled={loading || name.length < 2}>
                      {loading ? <><Spinner /> Création...</> : 'Créer l\'équipe'}
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
                    {/* Drop zone */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".zip,.fpdata"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0]
                        if (f) handleFileSelect(f)
                      }}
                    />

                    <div
                      onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
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
                                  <Lock className="h-3 w-3" /> Chiffré
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
                              Glissez-déposez un fichier ici
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              ou cliquez pour sélectionner (.zip ou .fpdata)
                            </p>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Decryption password */}
                    {isEncrypted && (
                      <Field>
                        <FieldLabel htmlFor="importPassword">Mot de passe de déchiffrement</FieldLabel>
                        <Input
                          id="importPassword"
                          type="password"
                          value={importPassword}
                          onChange={(e) => setImportPassword(e.target.value)}
                          placeholder="Mot de passe utilisé lors de l'export"
                        />
                        <FieldDescription>
                          Ce fichier est chiffré. Entrez le mot de passe défini lors de l&apos;export.
                        </FieldDescription>
                      </Field>
                    )}

                    <Separator />

                    {/* Team name */}
                    <Field>
                      <FieldLabel htmlFor="importName">Nom de l&apos;équipe</FieldLabel>
                      <Input
                        id="importName"
                        value={importName}
                        onChange={(e) => setImportName(e.target.value)}
                        placeholder="Nom de l'équipe importée"
                        required
                        minLength={2}
                      />
                      <FieldDescription>
                        Vous pouvez modifier le nom de l&apos;équipe importée.
                      </FieldDescription>
                    </Field>

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={importing || !importFile || importName.length < 2 || (isEncrypted && !importPassword)}
                    >
                      {importing ? <><Spinner /> Importation en cours...</> : <><Upload className="h-4 w-4 mr-2" /> Importer l&apos;équipe</>}
                    </Button>
                  </FieldGroup>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
