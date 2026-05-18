'use client'

import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Check,
  ChevronDown,
  ChevronRight,
  Copy,
  Eye,
  EyeOff,
  Play,
  Plus,
  Send,
  Terminal,
  Trash2,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import { Field, FieldLabel, FieldDescription } from '@/components/ui/field'
import { FormSelect } from '@/components/ui/dropdown'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/toast'
import { apiKeysClient, type ApiKeyShape } from '@/lib/api-keys-client'
import { apiProjectsClient } from '@/lib/api-projects-client'
import { API_BASE_URL } from '@/lib/oauth-config'

const API_HOST_BASE = API_BASE_URL.replace(/\/api\/v1$/, '')

type ApiPrefix = 'platform' | 'v1'
const PREFIX_PATHS: Record<ApiPrefix, string> = {
  platform: '/api/platform',
  v1: '/api/v1',
}

const METHODS = ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'] as const
type HttpMethod = (typeof METHODS)[number]

const PRESETS: Array<{
  label: string
  method: HttpMethod
  path: string
  prefix: ApiPrefix
  body?: string
}> = [
  { label: 'GET /v1/clients', method: 'GET', path: '/clients', prefix: 'v1' },
  { label: 'GET /v1/invoices', method: 'GET', path: '/invoices', prefix: 'v1' },
  { label: 'GET /v1/products', method: 'GET', path: '/products', prefix: 'v1' },
  { label: 'GET /v1/expenses', method: 'GET', path: '/expenses', prefix: 'v1' },
  { label: 'GET /v1/quotes', method: 'GET', path: '/quotes', prefix: 'v1' },
  {
    label: 'POST /v1/clients',
    method: 'POST',
    path: '/clients',
    prefix: 'v1',
    body: JSON.stringify(
      {
        type: 'company',
        company_name: 'ACME SAS',
        email: 'contact@acme.com',
      },
      null,
      2
    ),
  },
  { label: 'GET /platform/ping', method: 'GET', path: '/ping', prefix: 'platform' },
  { label: 'GET /platform/session', method: 'GET', path: '/session', prefix: 'platform' },
  { label: 'GET /platform/usage', method: 'GET', path: '/usage', prefix: 'platform' },
]

interface HeaderRow {
  id: string
  key: string
  value: string
}

interface ResponseShape {
  status: number
  statusText: string
  latencyMs: number
  headers: Array<[string, string]>
  body: string
  isJson: boolean
}

function newRow(): HeaderRow {
  return { id: crypto.randomUUID(), key: '', value: '' }
}

function statusColor(s: number): string {
  if (s < 300) return 'text-success'
  if (s < 400) return 'text-accent'
  if (s < 500) return 'text-warning'
  return 'text-danger'
}

function fmtBody(text: string): { pretty: string; isJson: boolean } {
  const trimmed = text.trim()
  if (!trimmed) return { pretty: '', isJson: false }
  try {
    const parsed = JSON.parse(trimmed)
    return { pretty: JSON.stringify(parsed, null, 2), isJson: true }
  } catch {
    return { pretty: text, isJson: false }
  }
}

function highlightJsonNodes(json: string): ReactNode {
  const pattern =
    /("(?:\\u[a-fA-F0-9]{4}|\\[^u]|[^\\"])*"\s*:?)|\b(true|false|null)\b|(-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g
  const nodes: ReactNode[] = []
  let last = 0
  let i = 0
  for (const match of json.matchAll(pattern)) {
    const idx = match.index ?? 0
    if (idx > last) nodes.push(json.slice(last, idx))
    const token = match[0]
    let cls = 'text-foreground'
    if (match[1]) {
      const isKey = /:\s*$/.test(token)
      cls = isKey ? 'text-accent' : 'text-emerald-600 dark:text-emerald-300'
    } else if (match[2]) {
      cls = match[2] === 'null' ? 'text-muted-foreground' : 'text-violet-500'
    } else if (match[3]) {
      cls = 'text-amber-600 dark:text-amber-300'
    }
    nodes.push(
      <span key={i} className={cls}>
        {token}
      </span>
    )
    last = idx + token.length
    i++
  }
  if (last < json.length) nodes.push(json.slice(last))
  return nodes
}

function humanizeValue(v: unknown, depth = 0): string {
  if (v === null) return '∅'
  if (typeof v === 'string') return v
  if (typeof v === 'number') return String(v)
  if (typeof v === 'boolean') return v ? 'oui' : 'non'
  if (Array.isArray(v)) {
    if (v.length === 0) return '(liste vide)'
    if (depth > 1) return `(${v.length} éléments)`
    return `${v.length} élément${v.length > 1 ? 's' : ''}`
  }
  if (typeof v === 'object') {
    const keys = Object.keys(v as object)
    if (depth > 1) return `(${keys.length} champs)`
    return `${keys.length} champ${keys.length > 1 ? 's' : ''}`
  }
  return String(v)
}

interface ReadableEntry {
  path: string
  label: string
  value: string
}

function humanizeJson(body: string): ReadableEntry[] {
  try {
    const parsed = JSON.parse(body)
    return flatten(parsed, '')
  } catch {
    return []
  }
}

function flatten(node: unknown, prefix: string): ReadableEntry[] {
  if (node === null || typeof node !== 'object') {
    return [
      {
        path: prefix || '$',
        label: prettifyKey(prefix || 'valeur'),
        value: humanizeValue(node),
      },
    ]
  }
  if (Array.isArray(node)) {
    if (node.length === 0) {
      return [{ path: prefix, label: prettifyKey(prefix), value: '(liste vide)' }]
    }
    return node.flatMap((item, i) =>
      flatten(item, prefix ? `${prefix}[${i}]` : `[${i}]`)
    )
  }
  const out: ReadableEntry[] = []
  for (const [key, value] of Object.entries(node as Record<string, unknown>)) {
    const childPath = prefix ? `${prefix}.${key}` : key
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      out.push(...flatten(value, childPath))
    } else if (Array.isArray(value)) {
      out.push({ path: childPath, label: prettifyKey(key), value: humanizeValue(value, 1) })
    } else {
      out.push({ path: childPath, label: prettifyKey(key), value: humanizeValue(value) })
    }
  }
  return out
}

function prettifyKey(k: string): string {
  return (
    k
      .replace(/\[\d+\]/g, '')
      .split('.')
      .pop()!
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase())
      .trim() || k
  )
}

type ResponseTab = 'pretty' | 'raw' | 'headers' | 'readable'

export default function ExplorerPage() {
  const params = useParams<{ id: string }>()
  const { toast } = useToast()
  const [keys, setKeys] = useState<ApiKeyShape[] | null>(null)
  const [selectedKeyId, setSelectedKeyId] = useState<string>('')
  const [tokenPlaintext, setTokenPlaintext] = useState('')
  const [showToken, setShowToken] = useState(false)

  const [method, setMethod] = useState<HttpMethod>('GET')
  const [prefix, setPrefix] = useState<ApiPrefix>('v1')
  const [path, setPath] = useState('/clients')
  const [query, setQuery] = useState('')
  const [headers, setHeaders] = useState<HeaderRow[]>([newRow()])
  const [body, setBody] = useState('')
  const [bodyError, setBodyError] = useState<string | null>(null)

  const [sending, setSending] = useState(false)
  const [response, setResponse] = useState<ResponseShape | null>(null)
  const [responseTab, setResponseTab] = useState<ResponseTab>('pretty')
  const [copied, setCopied] = useState<string | null>(null)
  const [optionsOpen, setOptionsOpen] = useState(false)

  useEffect(() => {
    apiKeysClient.list().then((res) => {
      const list = (res.data?.data ?? []).filter(
        (k) => k.project_id === params.id && k.status === 'active'
      )
      setKeys(list)
      if (list.length > 0 && !selectedKeyId) setSelectedKeyId(list[0].id)
    })
  }, [params.id])

  const fullUrl = useMemo(() => {
    const p = path.startsWith('/') ? path : `/${path}`
    const qs = query.trim()
    const base = `${API_HOST_BASE}${PREFIX_PATHS[prefix]}`
    return `${base}${p}${qs ? (qs.startsWith('?') ? qs : `?${qs}`) : ''}`
  }, [prefix, path, query])

  const hasBody = method !== 'GET' && method !== 'DELETE'

  function applyPreset(p: (typeof PRESETS)[number]) {
    setMethod(p.method)
    setPrefix(p.prefix)
    setPath(p.path)
    setBody(p.body ?? '')
    setQuery('')
    setResponse(null)
  }

  function addHeader() {
    setHeaders((h) => [...h, newRow()])
  }
  function updateHeader(id: string, field: 'key' | 'value', value: string) {
    setHeaders((h) => h.map((row) => (row.id === id ? { ...row, [field]: value } : row)))
  }
  function removeHeader(id: string) {
    setHeaders((h) => (h.length === 1 ? [newRow()] : h.filter((row) => row.id !== id)))
  }

  function tryFormatBody() {
    const r = fmtBody(body)
    if (r.isJson) {
      setBody(r.pretty)
      setBodyError(null)
    } else if (body.trim()) {
      setBodyError('JSON invalide')
    } else {
      setBodyError(null)
    }
  }

  async function copyText(text: string, label: string) {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(label)
      toast(`${label} copié`, 'success')
      setTimeout(() => setCopied(null), 2000)
    } catch {
      toast('Impossible de copier', 'error')
    }
  }

  function buildCurl(): string {
    const token = tokenPlaintext.trim() || 'fk_live_...'
    const parts = [`curl -X ${method}`, `"${fullUrl}"`]
    parts.push(`-H "Authorization: Bearer ${token}"`)
    for (const row of headers) {
      if (row.key.trim() && row.value.trim()) {
        parts.push(`-H "${row.key.trim()}: ${row.value.trim()}"`)
      }
    }
    if (hasBody && body.trim()) {
      parts.push(`-H "Content-Type: application/json"`)
      parts.push(`-d '${body.replace(/'/g, "\\'")}'`)
    }
    return parts.join(' \\\n  ')
  }

  async function handleSend() {
    if (!tokenPlaintext.trim()) {
      toast("Colle la clé API en clair (fk_live_…) avant d'envoyer", 'error')
      return
    }
    if (hasBody && body.trim()) {
      const r = fmtBody(body)
      if (!r.isJson) {
        setBodyError('JSON invalide')
        toast('Le body doit être du JSON valide', 'error')
        return
      }
    }
    setBodyError(null)
    setSending(true)
    setResponse(null)

    const reqHeaders: Record<string, string> = {
      Authorization: `Bearer ${tokenPlaintext.trim()}`,
    }
    if (hasBody && body.trim()) reqHeaders['Content-Type'] = 'application/json'
    for (const row of headers) {
      if (row.key.trim()) reqHeaders[row.key.trim()] = row.value
    }

    const t0 = performance.now()
    let logStatus = 0
    let logLatency = 0
    let logSize = 0
    let logError: string | null = null
    try {
      const res = await fetch(fullUrl, {
        method,
        headers: reqHeaders,
        body: hasBody && body.trim() ? body : undefined,
      })
      const latencyMs = Math.round(performance.now() - t0)
      const text = await res.text()
      const { pretty, isJson } = fmtBody(text)
      const responseHeaders: Array<[string, string]> = []
      res.headers.forEach((v, k) => responseHeaders.push([k, v]))

      setResponse({
        status: res.status,
        statusText: res.statusText,
        latencyMs,
        headers: responseHeaders,
        body: pretty || text,
        isJson,
      })
      setResponseTab(isJson ? 'pretty' : 'raw')
      logStatus = res.status
      logLatency = latencyMs
      logSize = new TextEncoder().encode(text).byteLength
    } catch (err: any) {
      const latencyMs = Math.round(performance.now() - t0)
      setResponse({
        status: 0,
        statusText: 'Network error',
        latencyMs,
        headers: [],
        body: err?.message ?? String(err),
        isJson: false,
      })
      setResponseTab('raw')
      logStatus = 0
      logLatency = latencyMs
      logError = err?.message ?? String(err)
    } finally {
      setSending(false)
      void apiProjectsClient.logExplorerCall(params.id, {
        method,
        path: path.startsWith('/') ? path : `/${path}`,
        query: query.trim() || null,
        status: logStatus,
        latency_ms: logLatency,
        response_size_bytes: logSize,
        api_key_id: selectedKeyId || null,
        error: logError,
      })
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 px-4 lg:px-6 pt-16 md:pt-20 pb-12 max-w-7xl mx-auto w-full"
    >
      <div>
        <div className="flex items-center gap-2">
          <Terminal className="h-5 w-5 text-accent" />
          <h1 className="text-xl font-bold text-foreground">API Explorer</h1>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Testez les endpoints de l&apos;API Faktur en direct depuis votre navigateur.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
      <Card className="border-border/50">
        <CardContent className="p-5 space-y-4">
          <Field>
            <FieldLabel>Clé d&apos;authentification</FieldLabel>
            <FormSelect
              value={selectedKeyId}
              onChange={setSelectedKeyId}
              placeholder="Aucune (saisie libre)"
              options={[
                { value: '', label: 'Aucune (saisie libre)' },
                ...(keys?.map((k) => ({
                  value: k.id,
                  label: `${k.name} · ${k.masked_token}`,
                })) ?? []),
              ]}
            />
            <div className="relative mt-2">
              <Input
                type={showToken ? 'text' : 'password'}
                value={tokenPlaintext}
                onChange={(e) => setTokenPlaintext(e.target.value)}
                placeholder="fk_live_…"
                autoComplete="off"
                spellCheck={false}
                className="pr-10 font-mono"
              />
              <button
                type="button"
                onClick={() => setShowToken((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label="Toggle visibility"
              >
                {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <FieldDescription>
              Le serveur ne stocke pas la clé en clair. Colle celle que tu as récupérée à la
              création (ou réinitialise la clé).
            </FieldDescription>
          </Field>

          <div className="flex flex-wrap gap-1.5">
            {PRESETS.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => applyPreset(p)}
                className="rounded-md border border-border/50 px-2 py-1 text-xs text-muted-foreground transition-colors hover:border-accent/40 hover:bg-surface-hover hover:text-foreground"
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="grid gap-2 grid-cols-[110px_140px_1fr_auto] items-center">
            <FormSelect
              value={method}
              onChange={(v) => setMethod(v as HttpMethod)}
              options={METHODS.map((m) => ({ value: m, label: m }))}
              className="font-mono font-semibold"
            />
            <FormSelect
              value={prefix}
              onChange={(v) => setPrefix(v as ApiPrefix)}
              options={[
                { value: 'v1', label: '/api/v1' },
                { value: 'platform', label: '/api/platform' },
              ]}
              className="font-mono"
            />
            <Input
              value={path}
              onChange={(e) => setPath(e.target.value)}
              placeholder="/clients"
              className="font-mono"
            />
            <Button onClick={handleSend} disabled={sending}>
              {sending ? (
                <>
                  <Spinner />
                  Envoi...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Envoyer
                </>
              )}
            </Button>
          </div>
          <p className="-mt-1 text-[11px] text-muted-foreground">
            {prefix === 'v1'
              ? 'Endpoints métier : clients, invoices, products, expenses, quotes, …'
              : 'Méta : ping, session, usage (gratuits, ne décomptent pas de crédit)'}
          </p>

          <button
            type="button"
            onClick={() => setOptionsOpen((v) => !v)}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-accent hover:underline"
          >
            {optionsOpen ? (
              <ChevronDown className="h-3.5 w-3.5" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5" />
            )}
            {optionsOpen ? 'Masquer' : 'Afficher plus d’options'}
          </button>

          {optionsOpen && (
            <div className="space-y-4 rounded-lg border border-border/40 bg-surface/40 p-4">
              <Field>
                <FieldLabel htmlFor="query-string">Paramètres de requête</FieldLabel>
                <Input
                  id="query-string"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="?limit=10&status=paid"
                  className="font-mono text-xs"
                />
              </Field>

              <div>
                <div className="mb-2 flex items-center justify-between px-1">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    En-têtes additionnels
                  </p>
                  <button
                    type="button"
                    onClick={addHeader}
                    className="inline-flex items-center gap-1 text-xs text-accent hover:underline"
                  >
                    <Plus className="h-3 w-3" />
                    Ajouter
                  </button>
                </div>
                <div className="space-y-1.5">
                  {headers.map((row) => (
                    <div key={row.id} className="flex items-center gap-2">
                      <Input
                        value={row.key}
                        onChange={(e) => updateHeader(row.id, 'key', e.target.value)}
                        placeholder="X-Custom-Header"
                        className="flex-1 font-mono text-xs"
                      />
                      <Input
                        value={row.value}
                        onChange={(e) => updateHeader(row.id, 'value', e.target.value)}
                        placeholder="valeur"
                        className="flex-[2] font-mono text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => removeHeader(row.id)}
                        className="rounded-md p-1 text-muted-foreground hover:bg-surface-hover hover:text-foreground"
                        aria-label="Supprimer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {hasBody && (
                <div>
                  <div className="mb-2 flex items-center justify-between px-1">
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Body (JSON)
                    </p>
                    <button
                      type="button"
                      onClick={tryFormatBody}
                      className="text-xs text-accent hover:underline"
                    >
                      Formater
                    </button>
                  </div>
                  <textarea
                    value={body}
                    onChange={(e) => {
                      setBody(e.target.value)
                      setBodyError(null)
                    }}
                    rows={8}
                    spellCheck={false}
                    placeholder={'{\n  "key": "value"\n}'}
                    className="w-full rounded-lg border border-border/50 bg-field px-3 py-2 font-mono text-xs text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                  />
                  {bodyError && <p className="mt-1 text-xs text-danger">{bodyError}</p>}
                </div>
              )}
            </div>
          )}

          <div className="rounded-lg border border-border/50 bg-surface p-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              URL complète
            </p>
            <p className="mt-1 break-all font-mono text-xs text-foreground">{fullUrl}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => copyText(buildCurl(), 'cURL')}
            >
              {copied === 'cURL' ? (
                <>
                  <Check className="h-3.5 w-3.5 mr-1.5" />
                  Copié
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5 mr-1.5" />
                  Copier cURL
                </>
              )}
            </Button>
            <Button variant="outline" size="sm" onClick={() => copyText(fullUrl, 'URL')}>
              {copied === 'URL' ? (
                <>
                  <Check className="h-3.5 w-3.5 mr-1.5" />
                  Copié
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5 mr-1.5" />
                  Copier URL
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/50">
        <CardContent className="p-5">
          {!response && !sending && (
            <div className="flex h-full min-h-[300px] flex-col items-center justify-center text-center">
              <Play className="h-7 w-7 text-muted-foreground/40" />
              <p className="mt-3 text-sm font-medium text-foreground">Aucune réponse</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Configurez la requête à gauche puis cliquez sur Envoyer.
              </p>
            </div>
          )}
          {sending && (
            <div className="flex h-full min-h-[300px] items-center justify-center">
              <Spinner />
            </div>
          )}
          {response && (
            <ResponseView
              response={response}
              tab={responseTab}
              onTab={setResponseTab}
              onCopy={(text, label) => copyText(text, label)}
              copied={copied}
            />
          )}
        </CardContent>
      </Card>
      </div>
    </motion.div>
  )
}

function ResponseView({
  response,
  tab,
  onTab,
  onCopy,
  copied,
}: {
  response: ResponseShape
  tab: ResponseTab
  onTab: (t: ResponseTab) => void
  onCopy: (text: string, label: string) => void
  copied: string | null
}) {
  const readable = useMemo(
    () => (response.isJson ? humanizeJson(response.body) : []),
    [response.body, response.isJson]
  )
  const highlighted = useMemo(
    () => (response.isJson ? highlightJsonNodes(response.body) : null),
    [response.body, response.isJson]
  )

  const tabs: Array<{ id: ResponseTab; label: string; disabled?: boolean }> = [
    { id: 'pretty', label: 'JSON', disabled: !response.isJson },
    { id: 'raw', label: 'Brut' },
    { id: 'headers', label: `En-têtes (${response.headers.length})` },
    {
      id: 'readable',
      label: 'Lisible',
      disabled: !response.isJson || readable.length === 0,
    },
  ]

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <span className={`font-mono text-2xl font-bold ${statusColor(response.status)}`}>
          {response.status || '—'}
        </span>
        <span className="text-sm text-muted-foreground">{response.statusText}</span>
        <Badge variant="muted" size="sm">
          {response.latencyMs} ms
        </Badge>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onCopy(response.body, 'Réponse')}
          className="ml-auto"
        >
          {copied === 'Réponse' ? (
            <>
              <Check className="h-3.5 w-3.5 mr-1.5" />
              Copié
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5 mr-1.5" />
              Copier
            </>
          )}
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-1 border-b border-border/40">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            disabled={t.disabled}
            onClick={() => onTab(t.id)}
            className={`-mb-px border-b-2 px-3 py-1.5 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
              tab === t.id
                ? 'border-accent text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'pretty' && response.isJson && (
        <pre className="max-h-[60vh] overflow-auto rounded-lg border border-border/50 bg-surface p-3 text-xs leading-relaxed">
          <code className="text-foreground">{highlighted}</code>
        </pre>
      )}

      {tab === 'raw' && (
        <pre className="max-h-[60vh] overflow-auto rounded-lg border border-border/50 bg-surface p-3 text-xs leading-relaxed">
          <code className="text-foreground">{response.body || '(vide)'}</code>
        </pre>
      )}

      {tab === 'headers' && (
        <div className="max-h-[60vh] overflow-auto rounded-lg border border-border/50 bg-surface text-xs">
          {response.headers.length === 0 ? (
            <p className="px-3 py-4 text-muted-foreground">Aucun en-tête.</p>
          ) : (
            <div className="divide-y divide-border/40">
              {response.headers.map(([k, v]) => (
                <div key={k} className="grid grid-cols-[180px_1fr] gap-2 px-3 py-1.5">
                  <code className="truncate font-mono text-muted-foreground">{k}</code>
                  <code className="break-all font-mono text-foreground">{v}</code>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'readable' && (
        <div className="max-h-[60vh] overflow-auto rounded-lg border border-border/50 bg-surface">
          {readable.length === 0 ? (
            <p className="px-3 py-4 text-xs text-muted-foreground">
              Activez l’onglet sur une réponse JSON valide.
            </p>
          ) : (
            <div className="divide-y divide-border/40 text-xs">
              {readable.map((row, i) => (
                <div
                  key={`${row.path}-${i}`}
                  className="grid grid-cols-[1fr_auto] items-baseline gap-3 px-4 py-2"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-foreground">{row.label}</p>
                    <code className="block truncate font-mono text-[10px] text-muted-foreground">
                      {row.path}
                    </code>
                  </div>
                  <div className="text-right text-foreground">{row.value}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
