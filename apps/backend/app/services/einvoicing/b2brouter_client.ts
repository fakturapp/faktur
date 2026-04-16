const PRODUCTION_URL = 'https://api.b2brouter.net'
const STAGING_URL = 'https://api-staging.b2brouter.net'
const API_VERSION = '2026-03-02'

export interface B2BConfig {
  apiKey: string
  sandbox: boolean
  accountId?: string | null
}

export interface B2BAccount {
  id: string
  name: string
  tin_value: string | null
  cin_value: string | null
  currency: string
  country: string
  created_at: string
  updated_at: string
}

export interface B2BContact {
  id: number
  name: string
  cin_value: string | null
  cin_scheme: string | null
  tin_value: string | null
  tin_scheme: string | null
  country: string
  created_at: string
  updated_at: string
}

export interface B2BInvoiceLine {
  description: string
  quantity: number
  price: number
  taxes_attributes: B2BTaxLine[]
  unit?: string
}

export interface B2BTaxLine {
  category: 'S' | 'E' | 'Z' | 'AE' | 'K' | 'G' | 'O'
  percent: number
  comment?: string
}

export interface B2BCreateInvoiceParams {
  send_after_import: boolean
  type: 'IssuedInvoice' | 'IssuedSimplifiedInvoice' | 'ReceivedInvoice'
  contact_id: number
  number: string
  date: string
  due_date?: string
  currency: string
  payment_method: number
  payment_method_text?: string
  payment_terms?: string
  remittance_information?: string
  invoice_lines_attributes: B2BInvoiceLine[]
  is_amend?: boolean
  amended_number?: string
  amended_date?: string
}

export interface B2BInvoice {
  id: number
  state: string
  number: string
  date: string
  due_date: string | null
  subtotal: number
  taxes: number
  total: number
  download_legal_url: string | null
  document_type_code: string | null
  tax_report_ids: number[]
  errors: string[]
  created_at: string
  updated_at: string
}

export interface B2BTaxReportSetting {
  code: string
  enabled: boolean
  locked: boolean
  type_operation: string
  naf_code: string
  enterprise_size: string
  start_date: string
  created_at: string
  updated_at: string
}

export interface B2BTaxReport {
  id: number
  state: string
  amounts: Record<string, number>
  invoice_id: number
  ledger_id: number
}

export interface B2BDirectoryEntry {
  cin_value: string
  cin_scheme: string
  country: string
  peppol_registered: boolean
  annuaire_registered: boolean
  platform_name: string | null
  platform_id: string | null
  transport_type_code: string | null
  document_type_code: string | null
}

export interface B2BWebhookPayload {
  event: 'invoice.state_changed' | 'tax_report.state_changed'
  invoice_id?: number
  tax_report_id?: number
  state: string
  previous_state: string
  timestamp: string
}

function getBaseUrl(sandbox: boolean): string {
  return sandbox ? STAGING_URL : PRODUCTION_URL
}

async function request<T>(
  config: B2BConfig,
  method: string,
  path: string,
  body?: unknown
): Promise<{ ok: boolean; data: T | null; error: string | null; status: number }> {
  const baseUrl = getBaseUrl(config.sandbox)
  const url = `${baseUrl}${path}`

  const headers: Record<string, string> = {
    'X-B2B-API-Key': config.apiKey,
    'X-B2B-API-Version': API_VERSION,
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }

  try {
    const resp = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    })

    if (resp.ok) {
      const data = (await resp.json()) as T
      return { ok: true, data, error: null, status: resp.status }
    }

    let errorMsg: string
    try {
      const errorBody = await resp.json() as any
      errorMsg = errorBody.message || errorBody.error || `HTTP ${resp.status}`
    } catch {
      errorMsg = `HTTP ${resp.status}`
    }
    return { ok: false, data: null, error: errorMsg, status: resp.status }
  } catch (err: any) {
    return { ok: false, data: null, error: `Erreur reseau: ${err.message}`, status: 0 }
  }
}

export async function createAccount(
  config: B2BConfig,
  params: {
    name: string
    country: string
    address?: string
    city?: string
    postalcode?: string
    tin_value?: string
    tin_scheme?: string
    cin_value?: string
    cin_scheme?: string
    email?: string
  }
): Promise<{ ok: boolean; account: B2BAccount | null; error: string | null }> {
  const result = await request<B2BAccount>(config, 'POST', '/accounts', params)
  return { ok: result.ok, account: result.data, error: result.error }
}

export async function getAccount(
  config: B2BConfig,
  accountId: string
): Promise<{ ok: boolean; account: B2BAccount | null; error: string | null }> {
  const result = await request<B2BAccount>(config, 'GET', `/accounts/${accountId}`)
  return { ok: result.ok, account: result.data, error: result.error }
}

export async function createContact(
  config: B2BConfig,
  accountId: string,
  params: {
    name: string
    country: string
    address?: string
    city?: string
    postalcode?: string
    cin_value?: string
    cin_scheme?: string
    tin_value?: string
    tin_scheme?: string
    is_client?: boolean
    document_type_code?: string
  }
): Promise<{ ok: boolean; contact: B2BContact | null; error: string | null }> {
  const result = await request<B2BContact>(config, 'POST', `/accounts/${accountId}/contacts`, params)
  return { ok: result.ok, contact: result.data, error: result.error }
}

export async function getContact(
  config: B2BConfig,
  contactId: number
): Promise<{ ok: boolean; contact: B2BContact | null; error: string | null }> {
  const result = await request<B2BContact>(config, 'GET', `/contacts/${contactId}`)
  return { ok: result.ok, contact: result.data, error: result.error }
}

export async function listContacts(
  config: B2BConfig,
  accountId: string
): Promise<{ ok: boolean; contacts: B2BContact[]; error: string | null }> {
  const result = await request<B2BContact[]>(config, 'GET', `/accounts/${accountId}/contacts`)
  return { ok: result.ok, contacts: result.data || [], error: result.error }
}

export async function createInvoice(
  config: B2BConfig,
  accountId: string,
  params: B2BCreateInvoiceParams
): Promise<{ ok: boolean; invoice: B2BInvoice | null; error: string | null }> {
  const result = await request<B2BInvoice>(config, 'POST', `/accounts/${accountId}/invoices`, params)
  return { ok: result.ok, invoice: result.data, error: result.error }
}

export async function importInvoiceDocument(
  config: B2BConfig,
  accountId: string,
  document: Buffer,
  contentType: 'application/pdf' | 'application/xml'
): Promise<{ ok: boolean; invoice: B2BInvoice | null; error: string | null }> {
  const baseUrl = getBaseUrl(config.sandbox)
  const url = `${baseUrl}/accounts/${accountId}/invoices/import`

  try {
    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        'X-B2B-API-Key': config.apiKey,
        'X-B2B-API-Version': API_VERSION,
        'Content-Type': contentType,
        'Accept': 'application/json',
      },
      body: document,
    })

    if (resp.ok) {
      const data = (await resp.json()) as B2BInvoice
      return { ok: true, invoice: data, error: null }
    }

    let errorMsg: string
    try {
      const errorBody = await resp.json() as any
      errorMsg = errorBody.message || `HTTP ${resp.status}`
    } catch {
      errorMsg = `HTTP ${resp.status}`
    }
    return { ok: false, invoice: null, error: errorMsg }
  } catch (err: any) {
    return { ok: false, invoice: null, error: `Erreur reseau: ${err.message}` }
  }
}

export async function getInvoice(
  config: B2BConfig,
  invoiceId: number
): Promise<{ ok: boolean; invoice: B2BInvoice | null; error: string | null }> {
  const result = await request<B2BInvoice>(config, 'GET', `/invoices/${invoiceId}`)
  return { ok: result.ok, invoice: result.data, error: result.error }
}

export async function listInvoices(
  config: B2BConfig,
  accountId: string,
  params?: { type?: string; offset?: number; limit?: number; state_updated_at_from?: string }
): Promise<{ ok: boolean; invoices: B2BInvoice[]; error: string | null }> {
  let path = `/accounts/${accountId}/invoices`
  if (params) {
    const qs = new URLSearchParams()
    if (params.type) qs.set('type', params.type)
    if (params.offset !== undefined) qs.set('offset', String(params.offset))
    if (params.limit !== undefined) qs.set('limit', String(params.limit))
    if (params.state_updated_at_from) qs.set('state_updated_at_from', params.state_updated_at_from)
    const qsStr = qs.toString()
    if (qsStr) path += `?${qsStr}`
  }
  const result = await request<B2BInvoice[]>(config, 'GET', path)
  return { ok: result.ok, invoices: result.data || [], error: result.error }
}

export async function markInvoiceState(
  config: B2BConfig,
  invoiceId: number,
  state: 'accepted' | 'refused'
): Promise<{ ok: boolean; invoice: B2BInvoice | null; error: string | null }> {
  const result = await request<B2BInvoice>(config, 'POST', `/invoices/${invoiceId}/mark_as`, { state })
  return { ok: result.ok, invoice: result.data, error: result.error }
}

export async function createTaxReportSetting(
  config: B2BConfig,
  accountId: string,
  params: {
    code: 'dgfip'
    start_date: string
    type_operation: 'services' | 'goods' | 'mixed'
    naf_code: string
    enterprise_size: 'micro' | 'pme' | 'eti' | 'ge'
    reason_vat_exempt?: string
    email?: string
    auto_send?: boolean
  }
): Promise<{ ok: boolean; setting: B2BTaxReportSetting | null; error: string | null }> {
  const result = await request<B2BTaxReportSetting>(
    config,
    'POST',
    `/accounts/${accountId}/tax_report_settings`,
    params
  )
  return { ok: result.ok, setting: result.data, error: result.error }
}

export async function getTaxReportSetting(
  config: B2BConfig,
  accountId: string,
  code: string
): Promise<{ ok: boolean; setting: B2BTaxReportSetting | null; error: string | null }> {
  const result = await request<B2BTaxReportSetting>(
    config,
    'GET',
    `/accounts/${accountId}/tax_report_settings/${code}`
  )
  return { ok: result.ok, setting: result.data, error: result.error }
}

export async function listTaxReports(
  config: B2BConfig,
  accountId: string,
  params?: { offset?: number; limit?: number }
): Promise<{ ok: boolean; reports: B2BTaxReport[]; error: string | null }> {
  let path = `/accounts/${accountId}/tax_reports`
  if (params) {
    const qs = new URLSearchParams()
    if (params.offset !== undefined) qs.set('offset', String(params.offset))
    if (params.limit !== undefined) qs.set('limit', String(params.limit))
    const qsStr = qs.toString()
    if (qsStr) path += `?${qsStr}`
  }
  const result = await request<B2BTaxReport[]>(config, 'GET', path)
  return { ok: result.ok, reports: result.data || [], error: result.error }
}

export async function lookupDirectory(
  config: B2BConfig,
  country: string,
  cinScheme: string,
  cinValue: string
): Promise<{ ok: boolean; entry: B2BDirectoryEntry | null; error: string | null }> {
  const result = await request<B2BDirectoryEntry>(
    config,
    'GET',
    `/directory/${encodeURIComponent(country)}/${encodeURIComponent(cinScheme)}/${encodeURIComponent(cinValue)}`
  )
  return { ok: result.ok, entry: result.data, error: result.error }
}

export async function validateConnection(
  config: B2BConfig
): Promise<{ connected: boolean; message: string; account: B2BAccount | null }> {
  if (!config.apiKey) {
    return { connected: false, message: 'Cle API B2Brouter manquante', account: null }
  }

  if (config.accountId) {
    const result = await getAccount(config, config.accountId)
    if (result.ok && result.account) {
      return { connected: true, message: 'Connexion B2Brouter reussie', account: result.account }
    }
    return { connected: false, message: result.error || 'Compte introuvable', account: null }
  }

  const result = await request<B2BAccount[]>(config, 'GET', '/accounts')
  if (result.ok) {
    const accounts = result.data || []
    return {
      connected: true,
      message: `Connexion reussie (${accounts.length} compte(s))`,
      account: accounts[0] || null,
    }
  }

  return { connected: false, message: result.error || 'Echec de connexion', account: null }
}

export function mapPaymentMethod(method: string | null): number {
  switch (method) {
    case 'bank_transfer':
    case 'virement':
      return 30
    case 'card':
    case 'cb':
      return 48
    case 'direct_debit':
    case 'prelevement':
      return 49
    case 'check':
    case 'cheque':
      return 20
    case 'cash':
    case 'especes':
      return 10
    default:
      return 30
  }
}

export function mapVatCategory(
  rate: number,
  exemptReason?: string | null
): { category: 'S' | 'E' | 'Z' | 'AE' | 'K' | 'G' | 'O'; comment?: string } {
  if (rate === 0) {
    if (exemptReason === 'not_subject') return { category: 'O' }
    if (exemptReason === 'outside_france') return { category: 'G' }
    if (exemptReason === 'france_no_vat') return { category: 'E', comment: 'VATEX-FR-FRANCHISE' }
    return { category: 'E' }
  }
  return { category: 'S' }
}
