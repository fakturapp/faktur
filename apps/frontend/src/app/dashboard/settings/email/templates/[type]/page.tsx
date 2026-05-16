'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  ArrowLeft, Download, Save, Sparkles, FileText, Receipt, FileMinus2, RotateCcw,
  Reply, Forward, Star, MoreHorizontal, Wand2, Check,
} from 'lucide-react'
import CodeMirror from '@uiw/react-codemirror'
import { html as htmlLang } from '@codemirror/lang-html'
import { sublime } from '@uiw/codemirror-theme-sublime'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Spinner } from '@/components/ui/spinner'
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { useToast } from '@/components/ui/toast'
import { api } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import { useEmail } from '@/lib/email-context'

type TemplateType = 'invoice_send' | 'quote_send' | 'credit_note_send'

const TEMPLATE_TYPES = [
  { key: 'invoice_send' as TemplateType, label: 'Envoi facture', short: 'Facture', icon: FileText, color: 'text-blue-500', bgColor: 'bg-blue-500/10', documentLabel: 'Facture' },
  { key: 'quote_send' as TemplateType, label: 'Envoi devis', short: 'Devis', icon: Receipt, color: 'text-orange-500', bgColor: 'bg-orange-500/10', documentLabel: 'Devis' },
  { key: 'credit_note_send' as TemplateType, label: 'Envoi avoir', short: 'Avoir', icon: FileMinus2, color: 'text-violet-500', bgColor: 'bg-violet-500/10', documentLabel: 'Avoir' },
] as const

const VARIABLES: { key: string; description: string }[] = [
  { key: '{type}', description: 'Type de document (Facture, Devis, Avoir)' },
  { key: '{numero}', description: 'Numéro du document' },
  { key: '{montant}', description: 'Montant TTC' },
  { key: '{client_name}', description: 'Nom du client' },
]

function resolveVariables(text: string, documentLabel: string): string {
  return text
    .replace(/\{type\}/gi, documentLabel)
    .replace(/\{numero\}/gi, `${documentLabel.slice(0, 3).toUpperCase()}-2026-001`)
    .replace(/\{montant\}/gi, '1 234,56 €')
    .replace(/\{client_name\}/gi, 'Acme S.A.S.')
}

type TemplateMap = Record<TemplateType, { subject: string; body: string }>
const EMPTY: TemplateMap = {
  invoice_send: { subject: '', body: '' },
  quote_send: { subject: '', body: '' },
  credit_note_send: { subject: '', body: '' },
}

export default function EmailTemplateEditorPage() {
  const params = useParams<{ type: string }>()
  const router = useRouter()
  const { toast } = useToast()
  const { user } = useAuth()
  const { accounts } = useEmail()

  const typeParam = (params?.type ?? 'invoice_send') as TemplateType
  const meta = TEMPLATE_TYPES.find((t) => t.key === typeParam) ?? TEMPLATE_TYPES[0]
  const active = meta.key

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [resetOpen, setResetOpen] = useState(false)
  const [formatting, setFormatting] = useState(false)
  const [useFakeData, setUseFakeData] = useState(true)
  const [templates, setTemplates] = useState<TemplateMap>(EMPTY)
  const [saved, setSaved] = useState<TemplateMap>(EMPTY)

  const current = templates[active]
  const currentSaved = saved[active]
  const dirty = current.subject !== currentSaved.subject || current.body !== currentSaved.body

  const load = useCallback(async () => {
    setLoading(true)
    const { data, error } = await api.get<{ templates: TemplateMap }>('/email/templates')
    setLoading(false)
    if (error || !data) {
      toast(error || 'Impossible de charger les templates', 'error')
      return
    }
    setTemplates(data.templates)
    setSaved(data.templates)
  }, [toast])

  useEffect(() => { load() }, [load])

  const updateField = (field: 'subject' | 'body', value: string) => {
    setTemplates((p) => ({ ...p, [active]: { ...p[active], [field]: value } }))
  }

  const switchTab = (key: TemplateType) => {
    if (key === active) return
    router.replace(`/dashboard/settings/email/templates/${key}`)
  }

  const handleSave = useCallback(async () => {
    setSaving(true)
    const { error } = await api.put('/email/templates', {
      templateType: active,
      subject: current.subject,
      body: current.body,
    })
    setSaving(false)
    if (error) { toast(error, 'error'); return }
    setSaved((p) => ({ ...p, [active]: { subject: current.subject, body: current.body } }))
    toast('Template enregistré', 'success')
  }, [active, current, toast])

  const handleDownload = useCallback(() => {
    const blob = new Blob([current.body], { type: 'text/html;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${active}.html`
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 100)
  }, [current.body, active])

  const handleFormat = useCallback(async () => {
    if (!current.body.trim()) return
    setFormatting(true)
    try {
      const [{ format }, htmlParser] = await Promise.all([
        import('prettier/standalone'),
        import('prettier/plugins/html'),
      ])
      const formatted = await format(current.body, {
        parser: 'html',
        plugins: [htmlParser.default],
        printWidth: 100,
        htmlWhitespaceSensitivity: 'css',
        tabWidth: 2,
      })
      setTemplates((p) => ({ ...p, [active]: { ...p[active], body: formatted.trimEnd() } }))
      toast('Code formaté', 'success')
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Erreur de formatage', 'error')
    } finally {
      setFormatting(false)
    }
  }, [active, current.body, toast])

  const handleReset = useCallback(async () => {
    setResetting(true)
    const { error } = await api.delete(`/email/templates/${active}`)
    if (error) {
      setResetting(false)
      toast(error, 'error')
      return
    }
    const { data, error: e2 } = await api.get<{ templates: TemplateMap }>('/email/templates')
    setResetting(false)
    setResetOpen(false)
    if (e2 || !data) {
      toast(e2 || 'Erreur après réinitialisation', 'error')
      return
    }
    setTemplates(data.templates)
    setSaved(data.templates)
    toast('Template réinitialisé', 'success')
  }, [active, toast])

  const renderedBody = useMemo(
    () => (useFakeData ? resolveVariables(current.body, meta.documentLabel) : current.body),
    [current.body, meta.documentLabel, useFakeData]
  )
  const renderedSubject = useMemo(
    () => (useFakeData ? resolveVariables(current.subject, meta.documentLabel) : current.subject),
    [current.subject, meta.documentLabel, useFakeData]
  )

  const senderName = user?.fullName?.split(' ')[0] ?? 'Faktur'
  const defaultAcc = accounts.find((a) => a.isDefault) ?? accounts[0]
  const senderEmail = defaultAcc?.email ?? 'noreply@faktur.fr'
  const senderInitial = (senderName[0] || 'F').toUpperCase()
  const todayStr = useMemo(() => {
    const now = new Date()
    return now.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="px-4 lg:px-6 py-4 md:py-6"
    >
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <button
          onClick={() => router.push('/dashboard/settings/email/accounts')}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          aria-label="Retour"
        >
          <ArrowLeft className="h-4.5 w-4.5" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-foreground truncate">Templates d&apos;email</h1>
          <p className="text-xs text-muted-foreground">Personnalisez vos modèles avec aperçu en direct.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-4 flex flex-wrap items-center gap-1.5 border-b border-border pb-0">
        {TEMPLATE_TYPES.map((t) => {
          const isActive = t.key === active
          const Icon = t.icon
          return (
            <button
              key={t.key}
              onClick={() => switchTab(t.key)}
              className={`relative inline-flex items-center gap-2 rounded-t-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? 'text-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
              }`}
            >
              <span className={`flex h-5 w-5 items-center justify-center rounded-md ${t.bgColor}`}>
                <Icon className={`h-3 w-3 ${t.color}`} />
              </span>
              {t.label}
              {isActive && (
                <motion.span
                  layoutId="tpl-tab-underline"
                  className="absolute left-0 right-0 -bottom-px h-0.5 bg-accent"
                />
              )}
            </button>
          )
        })}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <Skeleton className="h-[640px] rounded-xl" />
          <Skeleton className="h-[640px] rounded-xl" />
        </div>
      ) : (
        <div className="space-y-4">
          {/* Subject */}
          <Card className="overflow-hidden border-border/50">
            <CardContent className="p-4 space-y-3">
              <div>
                <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">
                  Objet de l&apos;email
                </label>
                <Input
                  value={current.subject}
                  onChange={(e) => updateField('subject', e.target.value)}
                  placeholder="Votre {type} {numero}"
                  className="text-sm"
                />
              </div>
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mr-1">
                  <Sparkles className="inline h-3 w-3 mr-1 text-accent" />
                  Variables
                </span>
                {VARIABLES.map((v) => (
                  <code
                    key={v.key}
                    title={v.description}
                    className="text-[11px] font-mono bg-accent/10 text-accent px-2 py-0.5 rounded-md cursor-help"
                  >
                    {v.key}
                  </code>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Editor + Preview */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {/* Code editor */}
            <Card className="overflow-hidden border-border/50 flex flex-col">
              <div className="flex items-center justify-between border-b border-border bg-[#23272e] px-3 py-2">
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f56]" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[#ffbd2e]" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[#27c93f]" />
                  <span className="ml-2 text-[11px] font-mono text-zinc-400">{active}.html</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-zinc-500 font-mono">HTML · {current.body.length} car.</span>
                  <button
                    type="button"
                    onClick={handleFormat}
                    disabled={formatting || !current.body.trim()}
                    title="Formater le code (Prettier)"
                    className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-zinc-300 hover:bg-white/10 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    {formatting ? <Spinner className="h-3 w-3" /> : <Wand2 className="h-3 w-3" />}
                    Formater
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-hidden">
                <CodeMirror
                  value={current.body}
                  onChange={(v) => updateField('body', v)}
                  theme={sublime}
                  extensions={[htmlLang()]}
                  height="600px"
                  basicSetup={{
                    lineNumbers: true,
                    foldGutter: true,
                    autocompletion: true,
                    bracketMatching: true,
                    highlightActiveLine: true,
                    highlightSelectionMatches: true,
                    indentOnInput: true,
                  }}
                />
              </div>
            </Card>

            {/* Spacemail-style preview */}
            <Card className="overflow-hidden border-border/50 flex flex-col">
              <div className="border-b border-border bg-muted/30 px-4 py-2.5 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-medium text-foreground">Aperçu email</p>
                  <p className="text-[10px] text-muted-foreground">
                    {useFakeData ? 'Variables remplacées par des données fictives' : 'Variables affichées telles quelles'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setUseFakeData((v) => !v)}
                  className="inline-flex items-center gap-2 select-none cursor-pointer group"
                  aria-pressed={useFakeData}
                >
                  <span
                    className={`relative h-4 w-4 rounded border transition-colors flex items-center justify-center ${
                      useFakeData
                        ? 'bg-accent border-accent'
                        : 'border-border bg-background group-hover:border-foreground'
                    }`}
                  >
                    {useFakeData && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
                  </span>
                  <span className="text-[11px] font-medium text-foreground">Données fictives</span>
                </button>
              </div>
              <div className="flex-1 bg-[#18191b] p-4 min-h-[640px]">
                <div className="rounded-2xl bg-[#252628] p-4 text-[#f9f9f9] font-sans">
                  {/* Header row */}
                  <div className="flex items-start gap-3 px-2 pb-3">
                    <div className="h-12 w-12 shrink-0 rounded-full bg-[#2c2244] flex items-center justify-center text-[#c3a3ff] text-xl font-medium uppercase">
                      {senderInitial}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <span className="text-sm font-bold text-[#f9f9f9] mr-1">{senderName}</span>
                          <span className="text-sm text-[#a37de7] break-all">&lt;{senderEmail}&gt;</span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <p className="text-[13px] text-[#b3b3b4] whitespace-nowrap">{todayStr}</p>
                          <button className="h-6 w-6 rounded-full flex items-center justify-center hover:bg-white/5 text-[#f9f9f9]">
                            <Reply className="h-3.5 w-3.5" />
                          </button>
                          <button className="h-6 w-6 rounded-full flex items-center justify-center hover:bg-white/5 text-[#f9f9f9]">
                            <Star className="h-3.5 w-3.5" />
                          </button>
                          <button className="h-6 w-6 rounded-full flex items-center justify-center hover:bg-white/5 text-[#f9f9f9]">
                            <MoreHorizontal className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                      <div className="mt-1 flex items-center gap-1 text-[13px]">
                        <span className="text-[#909091]">À :</span>
                        <span className="text-[#b3b3b4] break-all">&lt;contact@acme.fr&gt;</span>
                      </div>
                    </div>
                  </div>

                  {/* Subject */}
                  <h2 className="px-2 mb-2 text-[1.25rem] font-bold leading-tight text-[#f9f9f9] break-words">
                    {renderedSubject || <span className="text-[#6b6b6c] italic font-normal">(Aucun objet)</span>}
                  </h2>

                  {/* Body iframe */}
                  <div className="overflow-hidden rounded-xl bg-[#252628]">
                    <iframe
                      title="Aperçu email"
                      sandbox=""
                      srcDoc={`<!doctype html><html><head><meta charset="utf-8"><base target="_blank"><style>html,body{margin:0;padding:8px 8px 12px;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;color:#f9f9f9;font-size:14px;line-height:1.6;background:#252628}a{color:#c3a3ff}p{margin:0 0 0.85em}</style></head><body>${renderedBody || '<p style="color:#6b6b6c;font-style:italic">(Aperçu vide)</p>'}</body></html>`}
                      className="w-full"
                      style={{ minHeight: 360, border: 0, colorScheme: 'dark' }}
                    />
                  </div>

                  {/* Footer actions */}
                  <div className="mt-3 px-2 flex flex-wrap items-center gap-2">
                    <button className="inline-flex items-center gap-1.5 rounded-full px-3 h-8 text-sm font-bold text-[#c3a3ff] hover:bg-white/5">
                      <Reply className="h-4 w-4" /> Répondre
                    </button>
                    <button className="inline-flex items-center gap-1.5 rounded-full px-3 h-8 text-sm font-bold text-[#c3a3ff] hover:bg-white/5">
                      <Forward className="h-4 w-4" /> Transférer
                    </button>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Actions footer */}
          <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
            <Button
              variant="ghost"
              onClick={() => setResetOpen(true)}
              disabled={resetting}
              className="gap-2 text-muted-foreground hover:text-danger"
            >
              <RotateCcw className="h-4 w-4" />
              Remettre par défaut
            </Button>
            <Button variant="outline" onClick={handleDownload} className="gap-2">
              <Download className="h-4 w-4" />
              Télécharger HTML
            </Button>
            <Button onClick={handleSave} disabled={saving || !dirty} className="gap-2">
              {saving ? <Spinner className="h-4 w-4" /> : <Save className="h-4 w-4" />}
              {saving ? 'Enregistrement…' : 'Enregistrer'}
            </Button>
          </div>
        </div>
      )}

      {/* Reset confirmation */}
      <Dialog open={resetOpen} onClose={() => !resetting && setResetOpen(false)} className="max-w-sm">
        <DialogHeader showClose={false} icon={<RotateCcw className="h-5 w-5 text-danger" />}>
          <DialogTitle>Remettre par défaut ?</DialogTitle>
          <DialogDescription>
            Le template <strong className="text-foreground">{meta.label}</strong> sera réinitialisé. Vos modifications actuelles seront perdues.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setResetOpen(false)} disabled={resetting}>
            Annuler
          </Button>
          <Button variant="destructive" onClick={handleReset} disabled={resetting} className="gap-2">
            {resetting ? <Spinner className="h-3.5 w-3.5" /> : <RotateCcw className="h-3.5 w-3.5" />}
            Réinitialiser
          </Button>
        </DialogFooter>
      </Dialog>
    </motion.div>
  )
}
