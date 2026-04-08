
export interface PdpConfig {
  provider: 'b2brouter' | 'sandbox'
  apiKey: string | null
  sandbox: boolean
}

export interface PdpSubmissionResult {
  success: boolean
  trackingId: string | null
  status: 'submitted' | 'validated' | 'rejected' | 'error'
  message: string
  externalId?: string
  timestamp: string
}

export interface PdpStatusResult {
  trackingId: string
  status: 'pending' | 'submitted' | 'accepted' | 'rejected' | 'delivered' | 'error'
  message: string
  updatedAt: string
}

export interface PdpValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}

export function buildPdpConfig(settings: {
  pdpProvider?: string | null
  pdpApiKey?: string | null
  pdpSandbox?: boolean
}): PdpConfig {
  const hasApiKey = !!settings.pdpApiKey
  const isSandbox = settings.pdpSandbox || !hasApiKey

  return {
    provider: isSandbox ? 'sandbox' : 'b2brouter',
    apiKey: settings.pdpApiKey || null,
    sandbox: isSandbox,
  }
}

export async function validatePdpConnection(
  config: PdpConfig
): Promise<{ connected: boolean; message: string }> {
  if (config.sandbox) {
    return { connected: true, message: 'Connexion sandbox reussie' }
  }

  if (!config.apiKey) {
    return { connected: true, message: 'Mode sandbox (aucune cle API)' }
  }

  return await validateB2BRouter(config)
}

export async function submitInvoice(
  config: PdpConfig,
  xml: string,
  metadata: { documentNumber: string; documentType: string }
): Promise<PdpSubmissionResult> {
  const timestamp = new Date().toISOString()

  if (config.sandbox) {
    return {
      success: true,
      trackingId: `SANDBOX-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      status: 'submitted',
      message: 'Document soumis avec succes (mode sandbox)',
      timestamp,
    }
  }

  return await submitToB2BRouter(config, xml, metadata)
}

/**
 * Check status of a previously submitted document.
 * In sandbox mode, returns a simulated "accepted" status.
 */
export async function checkStatus(config: PdpConfig, trackingId: string): Promise<PdpStatusResult> {
  if (config.sandbox) {
    return {
      trackingId,
      status: 'accepted',
      message: 'Document accepte (mode sandbox)',
      updatedAt: new Date().toISOString(),
    }
  }

  return await checkB2BRouterStatus(config, trackingId)
}

/**
 * Validate XML structure before submission.
 * Performs basic structural checks on the CII XML.
 */
export async function validateXml(_config: PdpConfig, xml: string): Promise<PdpValidationResult> {
  const errors: string[] = []
  const warnings: string[] = []

  if (!xml.includes('CrossIndustryInvoice')) {
    errors.push('Format XML invalide: racine CrossIndustryInvoice manquante')
  }

  if (!xml.includes('SellerTradeParty')) {
    errors.push('Vendeur manquant dans le document')
  }

  if (!xml.includes('BuyerTradeParty')) {
    warnings.push('Acheteur non renseigne dans le document')
  }

  if (!xml.includes('SpecifiedTaxRegistration')) {
    warnings.push('Numero de TVA non renseigne')
  }

  if (!xml.includes('SpecifiedLegalOrganization')) {
    warnings.push('SIREN/SIRET non renseigne')
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  }
}

// ═══════════════════════════════════════════════════════════
// B2Brouter implementation
// ═══════════════════════════════════════════════════════════

async function validateB2BRouter(
  config: PdpConfig
): Promise<{ connected: boolean; message: string }> {
  try {
    const resp = await fetch('https://app.b2brouter.net/api/v1/accounts/me', {
      headers: { Authorization: `Bearer ${config.apiKey}` },
    })
    return resp.ok
      ? { connected: true, message: 'Connexion B2Brouter reussie' }
      : { connected: false, message: `Erreur B2Brouter: ${resp.status}` }
  } catch {
    return { connected: false, message: 'Impossible de contacter B2Brouter' }
  }
}

async function submitToB2BRouter(
  config: PdpConfig,
  xml: string,
  metadata: { documentNumber: string; documentType: string }
): Promise<PdpSubmissionResult> {
  try {
    const resp = await fetch('https://app.b2brouter.net/api/v1/invoices', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/xml',
        'X-Document-Number': metadata.documentNumber,
      },
      body: xml,
    })

    if (resp.ok) {
      const data = (await resp.json()) as any
      return {
        success: true,
        trackingId: data.id || null,
        status: 'submitted',
        message: 'Document soumis via B2Brouter',
        externalId: data.id,
        timestamp: new Date().toISOString(),
      }
    }

    return {
      success: false,
      trackingId: null,
      status: 'error',
      message: `Erreur B2Brouter: ${resp.status}`,
      timestamp: new Date().toISOString(),
    }
  } catch (err: any) {
    return {
      success: false,
      trackingId: null,
      status: 'error',
      message: `Erreur reseau: ${err.message}`,
      timestamp: new Date().toISOString(),
    }
  }
}

async function checkB2BRouterStatus(
  config: PdpConfig,
  trackingId: string
): Promise<PdpStatusResult> {
  try {
    const resp = await fetch(`https://app.b2brouter.net/api/v1/invoices/${trackingId}`, {
      headers: { Authorization: `Bearer ${config.apiKey}` },
    })
    if (resp.ok) {
      const data = (await resp.json()) as any
      return {
        trackingId,
        status: data.status || 'pending',
        message: data.message || '',
        updatedAt: new Date().toISOString(),
      }
    }
    return {
      trackingId,
      status: 'error',
      message: `Erreur: ${resp.status}`,
      updatedAt: new Date().toISOString(),
    }
  } catch {
    return {
      trackingId,
      status: 'error',
      message: 'Erreur reseau',
      updatedAt: new Date().toISOString(),
    }
  }
}
