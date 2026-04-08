export interface AiDocumentLine {
  description: string
  quantity: number
  unitPrice: number
  vatRate: number
}

export interface AiDocumentData {
  type: 'invoice' | 'quote'
  subject: string
  lines: AiDocumentLine[]
  notes?: string
  acceptanceConditions?: string
  clientId?: string
  billingType?: 'quick' | 'detailed'
  paymentMethod?: 'bank_transfer' | 'cash' | 'other'
}

const STORAGE_KEY = 'faktur_ai_document'

export function storeAiDocument(data: AiDocumentData): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {
  }
}

export function retrieveAiDocument(): AiDocumentData | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function clearAiDocument(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY)
  } catch {
  }
}
