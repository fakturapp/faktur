import zeroAccessCryptoService from '#services/crypto/zero_access_crypto_service'

/**
 * Encrypt specified fields on a model instance before saving.
 * Skips null/undefined values.
 */
export function encryptModelFields<T extends Record<string, any>>(
  model: T,
  fields: (keyof T & string)[],
  dek: Buffer
): void {
  for (const field of fields) {
    const value = model[field]
    if (value != null && typeof value === 'string' && value.length > 0) {
      ;(model as any)[field] = zeroAccessCryptoService.encryptField(value, dek)
    }
  }
}

/**
 * Decrypt specified fields on a model instance after loading.
 * Skips null/undefined values and values that are not encrypted (no "v1:" prefix).
 */
export function decryptModelFields<T extends Record<string, any>>(
  model: T,
  fields: (keyof T & string)[],
  dek: Buffer
): void {
  for (const field of fields) {
    const value = model[field]
    if (
      value != null &&
      typeof value === 'string' &&
      zeroAccessCryptoService.isEncryptedField(value)
    ) {
      ;(model as any)[field] = zeroAccessCryptoService.decryptField(value, dek)
    }
  }
}

/**
 * Decrypt fields on an array of model instances.
 */
export function decryptModelFieldsArray<T extends Record<string, any>>(
  models: T[],
  fields: (keyof T & string)[],
  dek: Buffer
): void {
  for (const model of models) {
    decryptModelFields(model, fields, dek)
  }
}

/** Fields to encrypt per model */
export const ENCRYPTED_FIELDS = {
  client: [
    'companyName',
    'firstName',
    'lastName',
    'email',
    'phone',
    'address',
    'addressComplement',
    'notes',
    'siren',
    'siret',
    'vatNumber',
  ] as const,

  invoice: [
    'subject',
    'notes',
    'acceptanceConditions',
    'documentTitle',
    'freeField',
    'deliveryAddress',
    'clientSiren',
    'clientVatNumber',
    'comment',
    'paymentTerms',
  ] as const,

  invoiceLine: ['description', 'saleType', 'unit'] as const,

  quote: [
    'subject',
    'notes',
    'acceptanceConditions',
    'documentTitle',
    'freeField',
    'deliveryAddress',
    'clientSiren',
    'clientVatNumber',
    'comment',
  ] as const,

  quoteLine: ['description', 'saleType', 'unit'] as const,

  company: [
    'phone',
    'email',
    'iban',
    'bic',
    'bankName',
    'paymentConditions',
  ] as const,

  bankAccount: ['iban', 'bic'] as const,

  emailLog: ['fromEmail', 'toEmail', 'subject', 'body', 'errorMessage'] as const,

  invoiceSetting: ['pdpApiKey'] as const,

  product: ['name', 'description', 'reference', 'unit', 'saleType'] as const,
} as const
