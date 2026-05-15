'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, Download, Save, Mail, Code2, Eye, Sparkles } from 'lucide-react'
import CodeMirror from '@uiw/react-codemirror'
import { html as htmlLang } from '@codemirror/lang-html'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Spinner } from '@/components/ui/spinner'
import { useToast } from '@/components/ui/toast'
import { api } from '@/lib/api'

type TemplateType = 'invoice_send' | 'quote_send' | 'credit_note_send'

const TEMPLATE_META: Record<TemplateType, { label: string; documentLabel: string }> = {
  invoice_send: { label: 'Envoi de facture', documentLabel: 'Facture' },
  quote_send: { label: 'Envoi de devis', documentLabel: 'Devis' },
  credit_note_send: { label: 'Envoi d’avoir', documentLabel: 'Avoir' },
}

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

export default function EmailTemplateEditorPage() {
  const params = useParams<{ type: string }>()
  const router = useRouter()
  const { toast } = useToast()

  const typeParam = (params?.type ?? '') as TemplateType
  const meta = TEMPLATE_META[typeParam]

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [savedSubject, setSavedSubject] = useState('')
  const [savedBody, setSavedBody] = useState('')

  const dirty = subject !== savedSubject || body !== savedBody

  const load = useCallback(async () => {
    setLoading(true)
    const { data, error } = await api.get<{ templates: Record<TemplateType, { subject: string; body: string }> }>(
      '/email/templates'
    )
    setLoading(false)
    if (error || !data) {
      toast(error || 'Impossible de charger le template', 'error')
      return
    }
    const tpl = data.templates[typeParam]
    if (tpl) {
      setSubject(tpl.subject || '')
      setBody(tpl.body || '')
      setSavedSubject(tpl.subject || '')
      setSavedBody(tpl.body || '')
    }
  }, [typeParam, toast])

  useEffect(() => { if (meta) load() }, [load, meta])

  const handleSave = useCallback(async () => {
    if (!meta) return
    setSaving(true)
    const { error } = await api.put('/email/templates', {
      templateType: typeParam,
      subject,
      body,
    })
    setSaving(false)
    if (error) { toast(error, 'error'); return }
    setSavedSubject(subject)
    setSavedBody(body)
    toast('Template enregistré', 'success')
  }, [meta, typeParam, subject, body, toast])

  const handleDownload = useCallback(() => {
    const blob = new Blob([body], { type: 'text/html;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${typeParam}.html`
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 100)
  }, [body, typeParam])

  const renderedBody = useMemo(
    () => resolveVariables(body, meta?.documentLabel || 'Document'),
    [body, meta]
  )
  const renderedSubject = useMemo(
    () => resolveVariables(subject, meta?.documentLabel || 'Document'),
    [subject, meta]
  )

  if (!meta) {
    return (
      <div className="px-4 lg:px-6 py-6">
        <div className="rounded-xl border border-danger/30 bg-danger/5 p-6 text-center">
          <p className="text-sm font-semibold text-danger">Template introuvable</p>
          <p className="text-xs text-muted-foreground mt-1">Le type « {typeParam} » n&apos;existe pas.</p>
          <Button className="mt-4" variant="ghost" onClick={() => router.push('/dashboard/settings/email/accounts')}>
            Retour
          </Button>
        </div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="px-4 lg:px-6 py-4 md:py-6"
    >
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <button
          onClick={() => router.push('/dashboard/settings/email/accounts')}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          aria-label="Retour"
        >
          <ArrowLeft className="h-4.5 w-4.5" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-foreground truncate">{meta.label}</h1>
          <p className="text-xs text-muted-foreground">Éditeur HTML avec aperçu en direct</p>
        </div>
        <Button variant="ghost" onClick={handleDownload} disabled={loading} className="gap-2">
          <Download className="h-4 w-4" /> Télécharger HTML
        </Button>
        <Button onClick={handleSave} disabled={loading || saving || !dirty} className="gap-2">
          {saving ? <Spinner className="h-4 w-4" /> : <Save className="h-4 w-4" />}
          {saving ? 'Enregistrement...' : 'Enregistrer'}
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <Skeleton className="h-[600px] rounded-xl" />
          <Skeleton className="h-[600px] rounded-xl" />
        </div>
      ) : (
        <div className="space-y-6">
          <Card className="overflow-hidden border-border/50">
            <CardContent className="p-4 space-y-3">
              <div>
                <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">
                  Objet de l&apos;email
                </label>
                <Input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
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

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <Card className="overflow-hidden border-border/50 flex flex-col">
              <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4 text-muted-foreground" />
                  <p className="text-xs font-medium text-foreground">Aperçu Gmail</p>
                </div>
                <p className="text-[10px] text-muted-foreground">Variables résolues</p>
              </div>
              <div className="flex-1 bg-muted/30 p-4 min-h-[600px]">
                <div className="mx-auto max-w-2xl rounded-lg border border-border bg-white dark:bg-zinc-50 shadow-sm overflow-hidden text-zinc-900">
                  <div className="border-b border-zinc-200 px-5 py-3 flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-zinc-200 flex items-center justify-center text-zinc-500 shrink-0">
                      <Mail className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-zinc-900 truncate">
                        {renderedSubject || <span className="text-zinc-400 italic font-normal">(Aucun objet)</span>}
                      </p>
                      <p className="text-[11px] text-zinc-500 mt-0.5">
                        Faktur &lt;noreply@faktur.fr&gt; · à Acme S.A.S.
                      </p>
                    </div>
                  </div>
                  <iframe
                    title="Aperçu email"
                    sandbox=""
                    srcDoc={`<!doctype html><html><head><meta charset="utf-8"><base target="_blank"><style>html,body{margin:0;padding:16px;font-family:Arial,Helvetica,sans-serif;color:#0f172a;font-size:14px;line-height:1.5}a{color:#2563eb}</style></head><body>${renderedBody || '<p style="color:#94a3b8;font-style:italic">(Aperçu vide)</p>'}</body></html>`}
                    className="w-full bg-white"
                    style={{ minHeight: 480, border: 0 }}
                  />
                </div>
              </div>
            </Card>

            <Card className="overflow-hidden border-border/50 flex flex-col">
              <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
                <div className="flex items-center gap-2">
                  <Code2 className="h-4 w-4 text-muted-foreground" />
                  <p className="text-xs font-medium text-foreground">Code HTML</p>
                </div>
                <p className="text-[10px] text-muted-foreground">{body.length} caractères</p>
              </div>
              <div className="flex-1 min-h-[600px] overflow-hidden">
                <CodeMirror
                  value={body}
                  onChange={setBody}
                  extensions={[htmlLang()]}
                  height="600px"
                  basicSetup={{
                    lineNumbers: true,
                    foldGutter: true,
                    autocompletion: true,
                    bracketMatching: true,
                    highlightActiveLine: true,
                  }}
                />
              </div>
            </Card>
          </div>
        </div>
      )}
    </motion.div>
  )
}
