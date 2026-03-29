import app from '@adonisjs/core/services/app'
import { existsSync, readFileSync } from 'node:fs'
import { join, extname } from 'node:path'
import Invoice from '#models/invoice/invoice'
import Quote from '#models/quote/quote'
import CreditNote from '#models/credit_note/credit_note'
import Company from '#models/team/company'
import InvoiceSetting from '#models/team/invoice_setting'
import BankAccount from '#models/team/bank_account'
import zeroAccessCryptoService from '#services/crypto/zero_access_crypto_service'
import {
  decryptModelFields,
  decryptModelFieldsArray,
  ENCRYPTED_FIELDS,
} from '#services/crypto/field_encryption_helper'
import { renderQuoteHtml } from '#services/pdf/html_renderer'
import { generatePdf } from '#services/pdf/pdf_generator'

function resolveLogoToBase64(logoUrl: string | null): string | null {
  if (!logoUrl) return null
  if (
    logoUrl.startsWith('data:') ||
    logoUrl.startsWith('http://') ||
    logoUrl.startsWith('https://')
  ) {
    return logoUrl
  }
  const match = logoUrl.match(/^\/(invoice-logos|company-logos)\/(.+)$/)
  if (!match) return null
  const filePath = join(app.tmpPath(), 'uploads', match[1], match[2])
  if (!existsSync(filePath)) return null
  const ext = extname(filePath).toLowerCase().replace('.', '')
  const mimeMap: Record<string, string> = {
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    svg: 'image/svg+xml',
    webp: 'image/webp',
  }
  const mime = mimeMap[ext] || 'image/png'
  const base64 = readFileSync(filePath).toString('base64')
  return `data:${mime};base64,${base64}`
}

function resolveFilenamePattern(
  pattern: string,
  vars: { numero: string; date: string; client: string; entreprise: string }
): string {
  return pattern
    .replace(/\{numero\}/gi, vars.numero)
    .replace(/\{date\}/gi, vars.date)
    .replace(/\{client\}/gi, vars.client)
    .replace(/\{entreprise\}/gi, vars.entreprise)
    .replace(/[^a-zA-Z0-9àâäéèêëïîôùûüçÀÂÄÉÈÊËÏÎÔÙÛÜÇ\-_.\s]/g, '')
    .replace(/\s+/g, '_')
}

function buildClientData(client: any) {
  if (!client) return null
  return {
    type: client.type,
    displayName: client.displayName,
    companyName: client.companyName,
    firstName: client.firstName,
    lastName: client.lastName,
    email: client.email,
    phone: client.phone,
    address: client.address,
    addressComplement: client.addressComplement,
    postalCode: client.postalCode,
    city: client.city,
    country: client.country,
    siren: client.siren,
    vatNumber: client.vatNumber,
  }
}

function buildCompanyData(company: Company | null) {
  if (!company) return null
  return {
    legalName: company.legalName,
    tradeName: company.tradeName,
    siren: company.siren,
    siret: company.siret,
    vatNumber: company.vatNumber,
    legalForm: company.legalForm,
    addressLine1: company.addressLine1,
    addressLine2: company.addressLine2,
    city: company.city,
    postalCode: company.postalCode,
    country: company.country,
    phone: company.phone,
    email: company.email,
    website: company.website,
    iban: company.iban,
    bic: company.bic,
    bankName: company.bankName,
  }
}

export async function generateInvoicePdf(
  invoiceId: string,
  teamId: string,
  dek: Buffer
): Promise<{ pdfBuffer: Buffer; filename: string }> {
  const invoice = await Invoice.query()
    .where('id', invoiceId)
    .where('team_id', teamId)
    .preload('client')
    .preload('lines', (q) => q.orderBy('position', 'asc'))
    .firstOrFail()

  // Decrypt invoice, lines, and client
  decryptModelFields(invoice, [...ENCRYPTED_FIELDS.invoice], dek)
  decryptModelFieldsArray(invoice.lines, [...ENCRYPTED_FIELDS.invoiceLine], dek)
  if (invoice.client) {
    decryptModelFields(invoice.client, [...ENCRYPTED_FIELDS.client], dek)
  }

  const company = await Company.query().where('team_id', teamId).first()
  if (company) {
    decryptModelFields(company, [...ENCRYPTED_FIELDS.company], dek)
  }

  const invoiceSettings = await InvoiceSetting.query().where('team_id', teamId).first()

  // Use the invoice's specific payment method, not all settings methods
  const invoicePaymentMethods: string[] = invoice.paymentMethod ? [invoice.paymentMethod] : []

  const settingsData = {
    template: invoiceSettings?.template || 'classique',
    darkMode: invoiceSettings?.darkMode || false,
    paymentMethods: invoicePaymentMethods,
    customPaymentMethod: invoiceSettings?.customPaymentMethod || null,
    documentFont: invoiceSettings?.documentFont || 'Lexend',
    documentType: 'invoice' as const,
    footerMode:
      (invoiceSettings?.footerMode as 'company_info' | 'vat_exempt' | 'custom') || 'vat_exempt',
  }

  const logoSource = invoiceSettings?.logoSource || 'custom'
  const rawLogoUrl =
    logoSource === 'company' ? company?.logoUrl || null : invoiceSettings?.logoUrl || null
  const resolvedLogoUrl = resolveLogoToBase64(rawLogoUrl)

  const quoteData = {
    quoteNumber: invoice.invoiceNumber,
    status: invoice.status,
    subject: invoice.subject,
    issueDate: invoice.issueDate,
    validityDate: invoice.dueDate,
    billingType: invoice.billingType,
    accentColor: invoice.accentColor,
    logoUrl: resolvedLogoUrl,
    notes: invoice.notes,
    acceptanceConditions: invoice.acceptanceConditions,
    signatureField: invoice.signatureField,
    documentTitle: invoice.documentTitle || 'Facture',
    freeField: invoice.freeField,
    globalDiscountType: invoice.globalDiscountType,
    globalDiscountValue: invoice.globalDiscountValue,
    deliveryAddress: invoice.deliveryAddress,
    clientSiren: invoice.clientSiren,
    clientVatNumber: invoice.clientVatNumber,
    subtotal: invoice.subtotal,
    taxAmount: invoice.taxAmount,
    total: invoice.total,
    language: invoice.language || 'fr',
    vatExemptReason: invoice.vatExemptReason || 'none',
    footerText: invoiceSettings?.defaultFooterText || null,
    logoBorderRadius: invoiceSettings?.logoBorderRadius ?? 0,
  }

  const linesData = invoice.lines.map((l) => ({
    description: l.description,
    saleType: l.saleType,
    quantity: l.quantity,
    unit: l.unit,
    unitPrice: l.unitPrice,
    vatRate: l.vatRate,
    total: l.total,
  }))

  const clientData = invoice.clientSnapshot
    ? JSON.parse(invoice.clientSnapshot)
    : buildClientData(invoice.client)
  const companyData = invoice.companySnapshot
    ? JSON.parse(invoice.companySnapshot)
    : buildCompanyData(company)

  // Override bank info from linked bank account
  if (invoice.bankAccountId && companyData) {
    const bankAccount = await BankAccount.find(invoice.bankAccountId)
    if (bankAccount) {
      let iban = bankAccount.iban
      let bic = bankAccount.bic
      if (iban && zeroAccessCryptoService.isEncryptedField(iban)) {
        try {
          iban = zeroAccessCryptoService.decryptField(iban, dek)
        } catch {
          iban = null
        }
      }
      if (bic && zeroAccessCryptoService.isEncryptedField(bic)) {
        try {
          bic = zeroAccessCryptoService.decryptField(bic, dek)
        } catch {
          bic = null
        }
      }
      companyData.iban = iban
      companyData.bic = bic
      companyData.bankName = bankAccount.bankName
    }
  }

  const html = renderQuoteHtml(quoteData, linesData, clientData, companyData, settingsData)
  const pdfBuffer = await generatePdf(html)

  const filenamePattern = invoiceSettings?.invoiceFilenamePattern || 'FAC-{numero}'
  const resolvedName = resolveFilenamePattern(filenamePattern, {
    numero: invoice.invoiceNumber,
    date: invoice.issueDate
      ? new Date(invoice.issueDate.toString()).toISOString().slice(0, 10)
      : new Date().toISOString().slice(0, 10),
    client: invoice.client?.displayName || invoice.client?.companyName || 'client',
    entreprise: company?.legalName || company?.tradeName || 'entreprise',
  })

  return { pdfBuffer, filename: `${resolvedName}.pdf` }
}

export async function generateQuotePdf(
  quoteId: string,
  teamId: string,
  dek: Buffer
): Promise<{ pdfBuffer: Buffer; filename: string }> {
  const quote = await Quote.query()
    .where('id', quoteId)
    .where('team_id', teamId)
    .preload('client')
    .preload('lines', (q) => q.orderBy('position', 'asc'))
    .firstOrFail()

  // Decrypt quote, lines, and client
  decryptModelFields(quote, [...ENCRYPTED_FIELDS.quote], dek)
  decryptModelFieldsArray(quote.lines, [...ENCRYPTED_FIELDS.quoteLine], dek)
  if (quote.client) {
    decryptModelFields(quote.client, [...ENCRYPTED_FIELDS.client], dek)
  }

  const company = await Company.query().where('team_id', teamId).first()
  if (company) {
    decryptModelFields(company, [...ENCRYPTED_FIELDS.company], dek)
  }

  const invoiceSettings = await InvoiceSetting.query().where('team_id', teamId).first()

  const settingsData = {
    template: invoiceSettings?.template || 'classique',
    darkMode: invoiceSettings?.darkMode || false,
    paymentMethods: invoiceSettings?.paymentMethods || ['bank_transfer'],
    customPaymentMethod: invoiceSettings?.customPaymentMethod || null,
    documentFont: invoiceSettings?.documentFont || 'Lexend',
    documentType: 'quote' as const,
    footerMode:
      (invoiceSettings?.footerMode as 'company_info' | 'vat_exempt' | 'custom') || 'vat_exempt',
  }

  const logoSource = invoiceSettings?.logoSource || 'custom'
  const rawLogoUrl =
    logoSource === 'company' ? company?.logoUrl || null : invoiceSettings?.logoUrl || null
  const resolvedLogoUrl = resolveLogoToBase64(rawLogoUrl)

  const quoteData = {
    quoteNumber: quote.quoteNumber,
    status: quote.status,
    subject: quote.subject,
    issueDate: quote.issueDate,
    validityDate: quote.validityDate,
    billingType: quote.billingType,
    accentColor: quote.accentColor,
    logoUrl: resolvedLogoUrl,
    notes: quote.notes,
    acceptanceConditions: quote.acceptanceConditions,
    signatureField: quote.signatureField,
    documentTitle: quote.documentTitle,
    freeField: quote.freeField,
    globalDiscountType: quote.globalDiscountType,
    globalDiscountValue: quote.globalDiscountValue,
    deliveryAddress: quote.deliveryAddress,
    clientSiren: quote.clientSiren,
    clientVatNumber: quote.clientVatNumber,
    subtotal: quote.subtotal,
    taxAmount: quote.taxAmount,
    total: quote.total,
    language: quote.language || 'fr',
    vatExemptReason: quote.vatExemptReason || 'none',
    footerText: invoiceSettings?.defaultFooterText || null,
    logoBorderRadius: invoiceSettings?.logoBorderRadius ?? 0,
  }

  const linesData = quote.lines.map((l) => ({
    description: l.description,
    saleType: l.saleType,
    quantity: l.quantity,
    unit: l.unit,
    unitPrice: l.unitPrice,
    vatRate: l.vatRate,
    total: l.total,
  }))

  const clientData = quote.clientSnapshot
    ? JSON.parse(quote.clientSnapshot)
    : buildClientData(quote.client)
  const companyData = quote.companySnapshot
    ? JSON.parse(quote.companySnapshot)
    : buildCompanyData(company)

  const html = renderQuoteHtml(quoteData, linesData, clientData, companyData, settingsData)
  const pdfBuffer = await generatePdf(html)

  const filenamePattern = invoiceSettings?.quoteFilenamePattern || 'DEV-{numero}'
  const resolvedName = resolveFilenamePattern(filenamePattern, {
    numero: quote.quoteNumber,
    date: quote.issueDate
      ? new Date(quote.issueDate.toString()).toISOString().slice(0, 10)
      : new Date().toISOString().slice(0, 10),
    client: quote.client?.displayName || quote.client?.companyName || 'client',
    entreprise: company?.legalName || company?.tradeName || 'entreprise',
  })

  return { pdfBuffer, filename: `${resolvedName}.pdf` }
}

export async function generateCreditNotePdf(
  creditNoteId: string,
  teamId: string,
  dek: Buffer
): Promise<{ pdfBuffer: Buffer; filename: string }> {
  const creditNote = await CreditNote.query()
    .where('id', creditNoteId)
    .where('team_id', teamId)
    .preload('client')
    .preload('lines', (q) => q.orderBy('position', 'asc'))
    .firstOrFail()

  decryptModelFields(creditNote, [...ENCRYPTED_FIELDS.creditNote], dek)
  decryptModelFieldsArray(creditNote.lines, [...ENCRYPTED_FIELDS.creditNoteLine], dek)
  if (creditNote.client) {
    decryptModelFields(creditNote.client, [...ENCRYPTED_FIELDS.client], dek)
  }

  const company = await Company.query().where('team_id', teamId).first()
  if (company) {
    decryptModelFields(company, [...ENCRYPTED_FIELDS.company], dek)
  }

  const invoiceSettings = await InvoiceSetting.query().where('team_id', teamId).first()

  const settingsData = {
    template: invoiceSettings?.template || 'classique',
    darkMode: invoiceSettings?.darkMode || false,
    paymentMethods: [] as string[],
    customPaymentMethod: null as string | null,
    documentFont: invoiceSettings?.documentFont || 'Lexend',
    documentType: 'credit_note' as const,
    footerMode:
      (invoiceSettings?.footerMode as 'company_info' | 'vat_exempt' | 'custom') || 'vat_exempt',
  }

  const logoSource = invoiceSettings?.logoSource || 'custom'
  const rawLogoUrl =
    logoSource === 'company' ? company?.logoUrl || null : invoiceSettings?.logoUrl || null
  const resolvedLogoUrl = resolveLogoToBase64(rawLogoUrl)

  const quoteData = {
    quoteNumber: creditNote.creditNoteNumber,
    status: creditNote.status,
    subject: creditNote.subject,
    issueDate: creditNote.issueDate,
    validityDate: null as string | null,
    billingType: creditNote.billingType,
    accentColor: creditNote.accentColor,
    logoUrl: resolvedLogoUrl,
    notes: creditNote.notes,
    acceptanceConditions: creditNote.acceptanceConditions,
    signatureField: creditNote.signatureField,
    documentTitle: creditNote.documentTitle || 'Avoir',
    freeField: creditNote.freeField,
    globalDiscountType: creditNote.globalDiscountType,
    globalDiscountValue: creditNote.globalDiscountValue,
    deliveryAddress: creditNote.deliveryAddress,
    clientSiren: creditNote.clientSiren,
    clientVatNumber: creditNote.clientVatNumber,
    subtotal: creditNote.subtotal,
    taxAmount: creditNote.taxAmount,
    total: creditNote.total,
    language: creditNote.language || 'fr',
    vatExemptReason: creditNote.vatExemptReason || 'none',
    footerText: invoiceSettings?.defaultFooterText || null,
    logoBorderRadius: invoiceSettings?.logoBorderRadius ?? 0,
  }

  const linesData = creditNote.lines.map((l) => ({
    description: l.description,
    saleType: l.saleType,
    quantity: l.quantity,
    unit: l.unit,
    unitPrice: l.unitPrice,
    vatRate: l.vatRate,
    total: l.total,
  }))

  const clientData = buildClientData(creditNote.client)
  const companyData = buildCompanyData(company)

  const html = renderQuoteHtml(quoteData, linesData, clientData, companyData, settingsData)
  const pdfBuffer = await generatePdf(html)

  const resolvedName = resolveFilenamePattern('AV-{numero}', {
    numero: creditNote.creditNoteNumber,
    date: creditNote.issueDate
      ? new Date(creditNote.issueDate.toString()).toISOString().slice(0, 10)
      : new Date().toISOString().slice(0, 10),
    client: creditNote.client?.displayName || creditNote.client?.companyName || 'client',
    entreprise: company?.legalName || company?.tradeName || 'entreprise',
  })

  return { pdfBuffer, filename: `${resolvedName}.pdf` }
}
