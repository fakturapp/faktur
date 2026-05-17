'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Check,
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

const API_V2_BASE_URL = API_BASE_URL.replace(/\/api\/v1$/, '/api/v2')

const METHODS = ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'] as const
type HttpMethod = (typeof METHODS)[number]

const PRESETS: Array<{ label: string; method: HttpMethod; path: string; body?: string }> = [
  { label: 'GET /clients', method: 'GET', path: '/clients' },
  { label: 'GET /invoices', method: 'GET', path: '/invoices' },
  { label: 'GET /products', method: 'GET', path: '/products' },
  { label: 'GET /expenses', method: 'GET', path: '/expenses' },
  { label: 'GET /quotes', method: 'GET', path: '/quotes' },
  {
    label: 'POST /clients',
    method: 'POST',
    path: '/clients',
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

export default function ExplorerPage() {
  const params = useParams<{ id: string }>()
  const { toast } = useToast()
  const [keys, setKeys] = useState<ApiKeyShape[] | null>(null)
  const [selectedKeyId, setSelectedKeyId] = useState<string>('')
  const [tokenPlaintext, setTokenPlaintext] = useState('')
  const [showToken, setShowToken] = useState(false)

  const [method, setMethod] = useState<HttpMethod>('GET')
  const [path, setPath] = useState('/clients')
  const [query, setQuery] = useState('')
  const [headers, setHeaders] = useState<HeaderRow[]>([newRow()])
  const [body, setBody] = useState('')
  const [bodyError, setBodyError] = useState<string | null>(null)

  const [sending, setSending] = useState(false)
  const [response, setResponse] = useState<ResponseShape | null>(null)
  const [copied, setCopied] = useState<string | null>(null)

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
    return `${API_V2_BASE_URL}${p}${qs ? (qs.startsWith('?') ? qs : `?${qs}`) : ''}`
  }, [path, query])

  const hasBody = method !== 'GET' && method !== 'DELETE'

  function applyPreset(p: (typeof PRESETS)[number]) {
    setMethod(p.method)
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
      className="space-y-6 px-4 lg:px-6 py-6 max-w-6xl mx-auto w-full"
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

      <Card className="border-border/50">
        <CardContent className="p-5 space-y-4">
          <Field>
            <FieldLabel>Clé d&apos;authentification</FieldLabel>
            <div className="grid gap-2 sm:grid-cols-[1fr,2fr]">
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
              <div className="relative">
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
            </div>
            <FieldDescription>
              Pour des raisons de sécurité, le serveur ne stocke pas le plaintext. Colle la clé
              que tu as récupérée à la création (ou rote la clé pour en regénérer une).
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

          <div className="grid gap-2 sm:grid-cols-[120px,1fr,auto]">
            <FormSelect
              value={method}
              onChange={(v) => setMethod(v as HttpMethod)}
              options={METHODS.map((m) => ({ value: m, label: m }))}
              className="font-mono font-semibold"
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

          <div className="rounded-lg border border-border/50 bg-surface p-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              URL complète
            </p>
            <p className="mt-1 break-all font-mono text-xs text-foreground">{fullUrl}</p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2 px-1">
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
              <div className="flex items-center justify-between mb-2 px-1">
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
              {bodyError && (
                <p className="mt-1 text-xs text-danger">{bodyError}</p>
              )}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => copyText(buildCurl(), 'curl')}
            >
              {copied === 'curl' ? (
                <>
                  <Check className="h-3.5 w-3.5 mr-1.5" />
                  Copié
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5 mr-1.5" />
                  Copier curl
                </>
              )}
            </Button>
            <Button variant="outline" size="sm" onClick={() => copyText(fullUrl, 'URL')}>
              <Copy className="h-3.5 w-3.5 mr-1.5" />
              Copier URL
            </Button>
          </div>
        </CardContent>
      </Card>

      {response && (
        <Card className="border-border/50">
          <CardContent className="p-5 space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className={`font-mono text-2xl font-bold ${statusColor(response.status)}`}>
                {response.status || '—'}
              </span>
              <span className="text-sm text-muted-foreground">{response.statusText}</span>
              <Badge variant="muted" size="sm">
                {response.latencyMs} ms
              </Badge>
              <div className="ml-auto flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyText(response.body, 'Réponse')}
                >
                  <Copy className="h-3.5 w-3.5 mr-1.5" />
                  Copier la réponse
                </Button>
              </div>
            </div>

            {response.headers.length > 0 && (
              <details className="rounded-lg border border-border/50 bg-surface">
                <summary className="cursor-pointer select-none px-3 py-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  En-têtes de réponse ({response.headers.length})
                </summary>
                <div className="border-t border-border/50 px-3 py-2 space-y-0.5 text-xs">
                  {response.headers.map(([k, v]) => (
                    <div key={k} className="grid grid-cols-[160px,1fr] gap-2">
                      <code className="truncate font-mono text-muted-foreground">{k}</code>
                      <code className="break-all font-mono text-foreground">{v}</code>
                    </div>
                  ))}
                </div>
              </details>
            )}

            <div>
              <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Body
              </p>
              <pre className="max-h-[60vh] overflow-auto rounded-lg border border-border/50 bg-surface p-3 text-xs leading-relaxed">
                <code className={response.isJson ? 'text-foreground' : 'text-muted-foreground'}>
                  {response.body || '(vide)'}
                </code>
              </pre>
            </div>
          </CardContent>
        </Card>
      )}

      {!response && !sending && (
        <Card className="border-dashed border-border/50">
          <CardContent className="p-6 text-center">
            <Play className="h-6 w-6 text-muted-foreground/40 mx-auto" />
            <p className="mt-2 text-sm text-muted-foreground">
              Configurez la requête puis cliquez sur Envoyer.
            </p>
          </CardContent>
        </Card>
      )}
    </motion.div>
  )
}
