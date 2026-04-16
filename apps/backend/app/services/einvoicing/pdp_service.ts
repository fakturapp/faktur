
import { validateCiiXml, type CiiValidationResult } from '#services/einvoicing/cii_xml_validator'
import * as b2b from '#services/einvoicing/b2brouter_client'
import type { B2BConfig, B2BInvoice } from '#services/einvoicing/b2brouter_client'

export interface PdpConfig {
  provider: 'b2brouter' | 'sandbox'
  apiKey: string | null
  sandbox: boolean
  b2bAccountId: string | null
}

export interface PdpSubmissionResult {
  success: boolean
  trackingId: string | null
  status: 'submitted' | 'validated' | 'rejected' | 'error'
  message: string
  externalId?: string
  b2bInvoice?: B2BInvoice | null
  timestamp: string
}

export interface PdpStatusResult {
  trackingId: string
  status: 'pending' | 'submitted' | 'accepted' | 'rejected' | 'delivered' | 'error'
  message: string
  updatedAt: string
  b2bInvoice?: B2BInvoice | null
}

export function buildPdpConfig(settings: {
  pdpProvider?: string | null
  pdpApiKey?: string | null
  pdpSandbox?: boolean
  b2bAccountId?: string | null
}): PdpConfig {
  const hasApiKey = !!settings.pdpApiKey
  const isSandbox = settings.pdpSandbox || !hasApiKey

  return {
    provider: isSandbox ? 'sandbox' : 'b2brouter',
    apiKey: settings.pdpApiKey || null,
    sandbox: isSandbox,
    b2bAccountId: settings.b2bAccountId || null,
  }
}

function toB2BConfig(config: PdpConfig): B2BConfig {
  return {
    apiKey: config.apiKey || '',
    sandbox: config.sandbox,
    accountId: config.b2bAccountId,
  }
}

export async function validatePdpConnection(
  config: PdpConfig
): Promise<{ connected: boolean; message: string; accountId?: string }> {
  if (config.sandbox && !config.apiKey) {
    return { connected: true, message: 'Mode sandbox (aucune cle API)' }
  }

  const b2bConfig = toB2BConfig(config)
  const result = await b2b.validateConnection(b2bConfig)

  return {
    connected: result.connected,
    message: result.message,
    accountId: result.account?.id,
  }
}

export async function submitInvoiceStructured(
  config: PdpConfig,
  params: b2b.B2BCreateInvoiceParams
): Promise<PdpSubmissionResult> {
  const timestamp = new Date().toISOString()

  if (config.sandbox && !config.apiKey) {
    return {
      success: true,
      trackingId: `SANDBOX-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      status: 'submitted',
      message: 'Facture soumise avec succes (mode sandbox)',
      timestamp,
    }
  }

  if (!config.b2bAccountId) {
    return {
      success: false,
      trackingId: null,
      status: 'error',
      message: 'Compte B2Brouter non configure (b2bAccountId manquant)',
      timestamp,
    }
  }

  const b2bConfig = toB2BConfig(config)
  const result = await b2b.createInvoice(b2bConfig, config.b2bAccountId, params)

  if (result.ok && result.invoice) {
    return {
      success: true,
      trackingId: String(result.invoice.id),
      status: 'submitted',
      message: `Facture soumise via B2Brouter (ID: ${result.invoice.id}, etat: ${result.invoice.state})`,
      externalId: String(result.invoice.id),
      b2bInvoice: result.invoice,
      timestamp,
    }
  }

  return {
    success: false,
    trackingId: null,
    status: 'error',
    message: result.error || 'Erreur lors de la soumission B2Brouter',
    timestamp,
  }
}

export async function submitInvoiceXml(
  config: PdpConfig,
  xml: string,
  _metadata: { documentNumber: string; documentType: string }
): Promise<PdpSubmissionResult> {
  const timestamp = new Date().toISOString()

  if (config.sandbox && !config.apiKey) {
    return {
      success: true,
      trackingId: `SANDBOX-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      status: 'submitted',
      message: 'Document soumis avec succes (mode sandbox)',
      timestamp,
    }
  }

  if (!config.b2bAccountId) {
    return {
      success: false,
      trackingId: null,
      status: 'error',
      message: 'Compte B2Brouter non configure',
      timestamp,
    }
  }

  const b2bConfig = toB2BConfig(config)
  const result = await b2b.importInvoiceDocument(
    b2bConfig,
    config.b2bAccountId,
    Buffer.from(xml, 'utf-8'),
    'application/xml'
  )

  if (result.ok && result.invoice) {
    return {
      success: true,
      trackingId: String(result.invoice.id),
      status: 'submitted',
      message: `Document importe via B2Brouter (ID: ${result.invoice.id})`,
      externalId: String(result.invoice.id),
      b2bInvoice: result.invoice,
      timestamp,
    }
  }

  return {
    success: false,
    trackingId: null,
    status: 'error',
    message: result.error || 'Erreur import B2Brouter',
    timestamp,
  }
}

export async function submitInvoice(
  config: PdpConfig,
  xml: string,
  metadata: { documentNumber: string; documentType: string }
): Promise<PdpSubmissionResult> {
  return submitInvoiceXml(config, xml, metadata)
}

export async function checkStatus(config: PdpConfig, trackingId: string): Promise<PdpStatusResult> {
  if (config.sandbox && !config.apiKey) {
    return {
      trackingId,
      status: 'accepted',
      message: 'Document accepte (mode sandbox)',
      updatedAt: new Date().toISOString(),
    }
  }

  const b2bConfig = toB2BConfig(config)
  const invoiceId = parseInt(trackingId, 10)

  if (isNaN(invoiceId)) {
    return {
      trackingId,
      status: 'error',
      message: 'Tracking ID invalide',
      updatedAt: new Date().toISOString(),
    }
  }

  const result = await b2b.getInvoice(b2bConfig, invoiceId)

  if (result.ok && result.invoice) {
    const mappedStatus = mapB2BState(result.invoice.state)
    return {
      trackingId,
      status: mappedStatus,
      message: `Etat B2Brouter: ${result.invoice.state}`,
      updatedAt: new Date().toISOString(),
      b2bInvoice: result.invoice,
    }
  }

  return {
    trackingId,
    status: 'error',
    message: result.error || 'Erreur lors de la verification',
    updatedAt: new Date().toISOString(),
  }
}

export async function lookupRecipient(
  config: PdpConfig,
  siret: string
): Promise<{ found: boolean; platform: string | null; peppol: boolean; message: string }> {
  if (config.sandbox && !config.apiKey) {
    return {
      found: true,
      platform: 'sandbox-platform',
      peppol: false,
      message: 'Destinataire trouve (mode sandbox)',
    }
  }

  const b2bConfig = toB2BConfig(config)
  const result = await b2b.lookupDirectory(b2bConfig, 'FR', '0009', siret)

  if (result.ok && result.entry) {
    return {
      found: result.entry.annuaire_registered || result.entry.peppol_registered,
      platform: result.entry.platform_name,
      peppol: result.entry.peppol_registered,
      message: result.entry.annuaire_registered
        ? `Inscrit sur ${result.entry.platform_name || 'une PA'}`
        : result.entry.peppol_registered
          ? 'Inscrit via PEPPOL'
          : 'Non inscrit dans l\'annuaire',
    }
  }

  return {
    found: false,
    platform: null,
    peppol: false,
    message: result.error || 'Destinataire non trouve',
  }
}

export async function validateXml(_config: PdpConfig, xml: string): Promise<CiiValidationResult> {
  return validateCiiXml(xml)
}

function mapB2BState(
  state: string
): 'pending' | 'submitted' | 'accepted' | 'rejected' | 'delivered' | 'error' {
  switch (state) {
    case 'new':
      return 'pending'
    case 'sending':
    case 'sent':
      return 'submitted'
    case 'registered':
    case 'accepted':
    case 'allegedly_paid':
      return 'accepted'
    case 'refused':
      return 'rejected'
    case 'delivered':
      return 'delivered'
    case 'error':
      return 'error'
    default:
      return 'pending'
  }
}
