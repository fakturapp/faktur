import { randomBytes, scryptSync, createCipheriv, createDecipheriv } from 'node:crypto'
import archiver from 'archiver'
import Team from '#models/team/team'
import Company from '#models/team/company'
import Client from '#models/client/client'
import Invoice from '#models/invoice/invoice'
import Quote from '#models/quote/quote'
import InvoiceSetting from '#models/team/invoice_setting'

const MAGIC = Buffer.from('FPDATA1')
const FLAG_ENCRYPTED = 0x01

interface ExportData {
  metadata: {
    exportDate: string
    version: string
    teamId: string
  }
  team: Record<string, unknown>
  company: Record<string, unknown> | null
  clients: Record<string, unknown>[]
  invoices: Record<string, unknown>[]
  quotes: Record<string, unknown>[]
  settings: Record<string, unknown> | null
}

export async function collectTeamData(teamId: string): Promise<ExportData> {
  const team = await Team.find(teamId)
  if (!team) throw new Error('Team not found')

  const company = await Company.query().where('teamId', teamId).first()

  const clients = await Client.query().where('teamId', teamId)

  const invoices = await Invoice.query()
    .where('teamId', teamId)
    .preload('lines', (q) => q.orderBy('position', 'asc'))

  const quotes = await Quote.query()
    .where('teamId', teamId)
    .preload('lines', (q) => q.orderBy('position', 'asc'))

  const settings = await InvoiceSetting.query().where('teamId', teamId).first()

  return {
    metadata: {
      exportDate: new Date().toISOString(),
      version: '1.0',
      teamId,
    },
    team: {
      name: team.name,
      iconUrl: team.iconUrl,
    },
    company: company
      ? {
          legalName: company.legalName,
          tradeName: company.tradeName,
          legalForm: company.legalForm,
          siren: company.siren,
          siret: company.siret,
          vatNumber: company.vatNumber,
          addressLine1: company.addressLine1,
          addressLine2: company.addressLine2,
          postalCode: company.postalCode,
          city: company.city,
          country: company.country,
          phone: company.phone,
          email: company.email,
          website: company.website,
          logoUrl: company.logoUrl,
          iban: company.iban,
          bic: company.bic,
          bankName: company.bankName,
          paymentConditions: company.paymentConditions,
          currency: company.currency,
        }
      : null,
    clients: clients.map((c) => ({
      type: c.type,
      companyName: c.companyName,
      siren: c.siren,
      siret: c.siret,
      vatNumber: c.vatNumber,
      firstName: c.firstName,
      lastName: c.lastName,
      email: c.email,
      phone: c.phone,
      includeInEmails: c.includeInEmails,
      address: c.address,
      addressComplement: c.addressComplement,
      postalCode: c.postalCode,
      city: c.city,
      country: c.country,
      notes: c.notes,
      originalId: c.id,
    })),
    invoices: invoices.map((inv) => ({
      invoiceNumber: inv.invoiceNumber,
      status: inv.status,
      subject: inv.subject,
      issueDate: inv.issueDate,
      dueDate: inv.dueDate,
      billingType: inv.billingType,
      accentColor: inv.accentColor,
      logoUrl: inv.logoUrl,
      language: inv.language,
      notes: inv.notes,
      acceptanceConditions: inv.acceptanceConditions,
      signatureField: inv.signatureField,
      documentTitle: inv.documentTitle,
      freeField: inv.freeField,
      globalDiscountType: inv.globalDiscountType,
      globalDiscountValue: inv.globalDiscountValue,
      deliveryAddress: inv.deliveryAddress,
      clientSiren: inv.clientSiren,
      clientVatNumber: inv.clientVatNumber,
      subtotal: inv.subtotal,
      taxAmount: inv.taxAmount,
      total: inv.total,
      comment: inv.comment,
      paymentTerms: inv.paymentTerms,
      paidDate: inv.paidDate,
      sourceQuoteId: inv.sourceQuoteId,
      clientId: inv.clientId,
      lines: inv.lines.map((l) => ({
        position: l.position,
        description: l.description,
        saleType: l.saleType,
        quantity: l.quantity,
        unit: l.unit,
        unitPrice: l.unitPrice,
        vatRate: l.vatRate,
        total: l.total,
      })),
    })),
    quotes: quotes.map((q) => ({
      quoteNumber: q.quoteNumber,
      status: q.status,
      subject: q.subject,
      issueDate: q.issueDate,
      validityDate: q.validityDate,
      billingType: q.billingType,
      accentColor: q.accentColor,
      logoUrl: q.logoUrl,
      language: q.language,
      notes: q.notes,
      acceptanceConditions: q.acceptanceConditions,
      signatureField: q.signatureField,
      documentTitle: q.documentTitle,
      freeField: q.freeField,
      globalDiscountType: q.globalDiscountType,
      globalDiscountValue: q.globalDiscountValue,
      deliveryAddress: q.deliveryAddress,
      clientSiren: q.clientSiren,
      clientVatNumber: q.clientVatNumber,
      subtotal: q.subtotal,
      taxAmount: q.taxAmount,
      total: q.total,
      comment: q.comment,
      clientId: q.clientId,
      lines: q.lines.map((l) => ({
        position: l.position,
        description: l.description,
        saleType: l.saleType,
        quantity: l.quantity,
        unit: l.unit,
        unitPrice: l.unitPrice,
        vatRate: l.vatRate,
        total: l.total,
      })),
    })),
    settings: settings
      ? {
          template: settings.template,
          accentColor: settings.accentColor,
          billingType: settings.billingType,
          logoUrl: settings.logoUrl,
          logoSource: settings.logoSource,
          documentFont: settings.documentFont,
          darkMode: settings.darkMode,
          paymentMethods: settings.paymentMethods,
          customPaymentMethod: settings.customPaymentMethod,
          defaultSubject: settings.defaultSubject,
          defaultAcceptanceConditions: settings.defaultAcceptanceConditions,
          defaultSignatureField: settings.defaultSignatureField,
          defaultFreeField: settings.defaultFreeField,
          defaultShowNotes: settings.defaultShowNotes,
          defaultVatExempt: settings.defaultVatExempt,
          defaultFooterText: settings.defaultFooterText,
          defaultShowDeliveryAddress: settings.defaultShowDeliveryAddress,
          defaultLanguage: settings.defaultLanguage,
          footerMode: settings.footerMode,
          invoiceFilenamePattern: settings.invoiceFilenamePattern,
          quoteFilenamePattern: settings.quoteFilenamePattern,
          nextInvoiceNumber: settings.nextInvoiceNumber,
          nextQuoteNumber: settings.nextQuoteNumber,
        }
      : null,
  }
}

export async function createZipBuffer(data: ExportData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const archive = archiver('zip', { zlib: { level: 9 } })
    const chunks: Buffer[] = []

    archive.on('data', (chunk: Buffer) => chunks.push(chunk))
    archive.on('end', () => resolve(Buffer.concat(chunks)))
    archive.on('error', reject)

    archive.append(JSON.stringify(data.metadata, null, 2), { name: 'export/metadata.json' })
    archive.append(JSON.stringify(data.team, null, 2), { name: 'export/team.json' })
    archive.append(JSON.stringify(data.company, null, 2), { name: 'export/company.json' })
    archive.append(JSON.stringify(data.clients, null, 2), { name: 'export/clients.json' })
    archive.append(JSON.stringify(data.invoices, null, 2), { name: 'export/invoices.json' })
    archive.append(JSON.stringify(data.quotes, null, 2), { name: 'export/quotes.json' })
    archive.append(JSON.stringify(data.settings, null, 2), { name: 'export/settings.json' })

    archive.finalize()
  })
}

export function encryptBuffer(buffer: Buffer, password: string): Buffer {
  const salt = randomBytes(32)
  const key = scryptSync(password, salt, 32)
  const iv = randomBytes(16)

  const cipher = createCipheriv('aes-256-gcm', key, iv)
  const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()])
  const authTag = cipher.getAuthTag()

  // Format: MAGIC (7) + flags (1) + salt (32) + iv (16) + authTag (16) + data
  const flags = Buffer.alloc(1)
  flags[0] = FLAG_ENCRYPTED

  return Buffer.concat([MAGIC, flags, salt, iv, authTag, encrypted])
}

export function decryptBuffer(buffer: Buffer, password: string): Buffer {
  // Verify magic
  const magic = buffer.subarray(0, 7)
  if (!magic.equals(MAGIC)) {
    throw new Error('Invalid file format')
  }

  const flags = buffer[7]
  if (!(flags & FLAG_ENCRYPTED)) {
    // Not encrypted, just return the data after the header
    return buffer.subarray(8)
  }

  const salt = buffer.subarray(8, 40)
  const iv = buffer.subarray(40, 56)
  const authTag = buffer.subarray(56, 72)
  const data = buffer.subarray(72)

  const key = scryptSync(password, salt, 32)
  const decipher = createDecipheriv('aes-256-gcm', key, iv)
  decipher.setAuthTag(authTag)

  return Buffer.concat([decipher.update(data), decipher.final()])
}
