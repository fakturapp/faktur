'use client'

import { useBroadcast } from '@/components/collaboration/use-broadcast'

interface SyncBroadcasterProps {
  notes: string
  accentColor: string
  lines: any[]
  options: Record<string, any>
  documentNumber: string
  selectedClient: any
  paymentMethod?: string
  bankAccountId?: string
}

export function SyncBroadcaster({
  notes,
  accentColor,
  lines,
  options,
  documentNumber,
  selectedClient,
  paymentMethod,
  bankAccountId,
}: SyncBroadcasterProps) {
  useBroadcast('notes', notes)
  useBroadcast('accentColor', accentColor)
  useBroadcast('lines', lines)
  useBroadcast('invoiceNumber', documentNumber)
  useBroadcast('client', selectedClient)
  if (paymentMethod !== undefined) useBroadcast('paymentMethod', paymentMethod)
  if (bankAccountId !== undefined) useBroadcast('bankAccountId', bankAccountId)

  useBroadcast('options.subject', options.subject)
  useBroadcast('options.issueDate', options.issueDate)
  useBroadcast('options.validityDate', options.validityDate)
  useBroadcast('options.billingType', options.billingType)
  useBroadcast('options.language', options.language)
  useBroadcast('options.signatureField', options.signatureField)
  useBroadcast('options.globalDiscountType', options.globalDiscountType)
  useBroadcast('options.globalDiscountValue', options.globalDiscountValue)
  useBroadcast('options.vatExemptReason', options.vatExemptReason)
  useBroadcast('options.documentTitle', options.documentTitle)
  useBroadcast('options.deliveryAddress', options.deliveryAddress)
  useBroadcast('options.acceptanceConditions', options.acceptanceConditions)
  useBroadcast('options.freeField', options.freeField)
  useBroadcast('options.footerText', options.footerText)

  return null
}
