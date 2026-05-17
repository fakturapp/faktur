export type ResourceType =
  | 'invoice'
  | 'invoice_line'
  | 'invoice_payment'
  | 'quote'
  | 'quote_line'
  | 'credit_note'
  | 'credit_note_line'
  | 'recurring_invoice'
  | 'recurring_invoice_line'
  | 'client'
  | 'client_contact'
  | 'product'
  | 'expense'
  | 'reminder'
  | 'payment_link'
  | 'bank_account'
  | 'company'
  | 'team'
  | 'team_member'
  | 'email_delivery'
  | 'einvoicing_submission'
  | 'file'
  | 'event'
  | 'request'
  | 'api_key'
  | 'webhook_delivery'
  | 'idempotency'

export const PREFIX_BY_RESOURCE: Record<ResourceType, string> = {
  invoice: 'inv',
  invoice_line: 'il',
  invoice_payment: 'ipm',
  quote: 'qot',
  quote_line: 'ql',
  credit_note: 'cn',
  credit_note_line: 'cnl',
  recurring_invoice: 'rec',
  recurring_invoice_line: 'rcl',
  client: 'clt',
  client_contact: 'cct',
  product: 'prd',
  expense: 'exp',
  reminder: 'rmd',
  payment_link: 'pkl',
  bank_account: 'bnk',
  company: 'cmp',
  team: 'tm',
  team_member: 'tmm',
  email_delivery: 'eml',
  einvoicing_submission: 'eis',
  file: 'fil',
  event: 'evt',
  request: 'req',
  api_key: 'apk',
  webhook_delivery: 'whd',
  idempotency: 'idem',
}

const RESOURCE_BY_PREFIX: Record<string, ResourceType> = Object.fromEntries(
  Object.entries(PREFIX_BY_RESOURCE).map(([k, v]) => [v, k as ResourceType])
) as Record<string, ResourceType>

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export class PublicIdCodec {
  encode(resource: ResourceType, internalId: string): string {
    const prefix = PREFIX_BY_RESOURCE[resource]
    if (!prefix) throw new Error(`Unknown resource type: ${resource}`)
    return `${prefix}_${internalId}`
  }

  decode(resource: ResourceType, publicId: string): string {
    const prefix = PREFIX_BY_RESOURCE[resource]
    if (!publicId.startsWith(`${prefix}_`)) {
      throw new PublicIdParseError(
        `Expected id with prefix '${prefix}_' for resource '${resource}', got: ${publicId}`
      )
    }
    const internal = publicId.slice(prefix.length + 1)
    if (!UUID_RE.test(internal)) {
      throw new PublicIdParseError(`Invalid UUID after prefix in id: ${publicId}`)
    }
    return internal
  }

  tryDecode(resource: ResourceType, publicId: string): string | null {
    try {
      return this.decode(resource, publicId)
    } catch {
      return null
    }
  }

  inferResource(publicId: string): ResourceType | null {
    const underscoreIdx = publicId.indexOf('_')
    if (underscoreIdx <= 0) return null
    const prefix = publicId.slice(0, underscoreIdx)
    return RESOURCE_BY_PREFIX[prefix] ?? null
  }
}

export class PublicIdParseError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'PublicIdParseError'
  }
}

export default new PublicIdCodec()
