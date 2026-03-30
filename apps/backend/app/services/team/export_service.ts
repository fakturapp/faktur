import { randomBytes, scryptSync, createCipheriv, createDecipheriv } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import app from '@adonisjs/core/services/app'
import archiver from 'archiver'
import Team from '#models/team/team'
import Company from '#models/team/company'
import Client from '#models/client/client'
import ClientContact from '#models/client/client_contact'
import Invoice from '#models/invoice/invoice'
import InvoicePayment from '#models/invoice/invoice_payment'
import Quote from '#models/quote/quote'
import Product from '#models/product/product'
import CreditNote from '#models/credit_note/credit_note'
import RecurringInvoice from '#models/recurring_invoice/recurring_invoice'
import Expense from '#models/expense/expense'
import ExpenseCategory from '#models/expense/expense_category'
import EmailTemplate from '#models/email/email_template'
import PaymentReminderSetting from '#models/reminder/payment_reminder_setting'
import InvoiceSetting from '#models/team/invoice_setting'
import BankAccount from '#models/team/bank_account'
import zeroAccessCryptoService from '#services/crypto/zero_access_crypto_service'
import {
  decryptModelFields,
  decryptModelFieldsArray,
  ENCRYPTED_FIELDS,
} from '#services/crypto/field_encryption_helper'

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
  bankAccounts?: Record<string, unknown>[]
  products: Record<string, unknown>[]
  creditNotes: Record<string, unknown>[]
  recurringInvoices: Record<string, unknown>[]
  expenses: Record<string, unknown>[]
  expenseCategories: Record<string, unknown>[]
  invoicePayments: Record<string, unknown>[]
  clientContacts: Record<string, unknown>[]
  emailTemplates: Record<string, unknown>[]
  paymentReminderSettings: Record<string, unknown>[]
}

export async function collectTeamData(
  teamId: string,
  dek: Buffer,
  options?: { includeBankAccounts?: boolean }
): Promise<ExportData> {
  const team = await Team.find(teamId)
  if (!team) throw new Error('Team not found')

  const company = await Company.query().where('teamId', teamId).first()
  if (company) {
    decryptModelFields(company, [...ENCRYPTED_FIELDS.company], dek)
  }

  const clients = await Client.query().where('teamId', teamId)
  decryptModelFieldsArray(clients, [...ENCRYPTED_FIELDS.client], dek)

  const invoices = await Invoice.query()
    .where('teamId', teamId)
    .preload('lines', (q) => q.orderBy('position', 'asc'))
  for (const inv of invoices) {
    decryptModelFields(inv, [...ENCRYPTED_FIELDS.invoice], dek)
    decryptModelFieldsArray(inv.lines, [...ENCRYPTED_FIELDS.invoiceLine], dek)
  }

  const quotes = await Quote.query()
    .where('teamId', teamId)
    .preload('lines', (q) => q.orderBy('position', 'asc'))
  for (const q of quotes) {
    decryptModelFields(q, [...ENCRYPTED_FIELDS.quote], dek)
    decryptModelFieldsArray(q.lines, [...ENCRYPTED_FIELDS.quoteLine], dek)
  }

  const settings = await InvoiceSetting.query().where('teamId', teamId).first()

  // Collect bank accounts if requested, decrypting with zero-access DEK
  let bankAccountsData: Record<string, unknown>[] | undefined
  if (options?.includeBankAccounts) {
    const bankAccounts = await BankAccount.query().where('teamId', teamId)
    bankAccountsData = bankAccounts.map((ba) => {
      let iban = ba.iban
      let bic = ba.bic
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
      return {
        label: ba.label,
        bankName: ba.bankName,
        iban,
        bic,
        isDefault: ba.isDefault,
      }
    })
  }

  // Collect products
  const products = await Product.query().where('teamId', teamId)
  decryptModelFieldsArray(products, [...ENCRYPTED_FIELDS.product], dek)

  // Collect credit notes with lines
  const creditNotes = await CreditNote.query()
    .where('teamId', teamId)
    .preload('lines', (q) => q.orderBy('position', 'asc'))
  for (const cn of creditNotes) {
    decryptModelFields(cn, [...ENCRYPTED_FIELDS.creditNote], dek)
    decryptModelFieldsArray(cn.lines, [...ENCRYPTED_FIELDS.creditNoteLine], dek)
  }

  // Collect recurring invoices with lines
  const recurringInvoices = await RecurringInvoice.query()
    .where('teamId', teamId)
    .preload('lines', (q) => q.orderBy('position', 'asc'))
  for (const ri of recurringInvoices) {
    decryptModelFields(ri, [...ENCRYPTED_FIELDS.recurringInvoice], dek)
    decryptModelFieldsArray(ri.lines, [...ENCRYPTED_FIELDS.recurringInvoiceLine], dek)
  }

  // Collect expense categories
  const expenseCategories = await ExpenseCategory.query().where('teamId', teamId)

  // Collect expenses
  const expenses = await Expense.query().where('teamId', teamId)
  decryptModelFieldsArray(expenses, [...ENCRYPTED_FIELDS.expense], dek)

  // Collect invoice payments
  const invoicePayments = await InvoicePayment.query().where('teamId', teamId)
  decryptModelFieldsArray(invoicePayments, [...ENCRYPTED_FIELDS.invoicePayment], dek)

  // Collect client contacts
  const clientContacts = await ClientContact.query().where('teamId', teamId)
  decryptModelFieldsArray(clientContacts, [...ENCRYPTED_FIELDS.clientContact], dek)

  // Collect email templates
  const emailTemplates = await EmailTemplate.query().where('teamId', teamId)

  // Collect payment reminder settings
  const paymentReminderSettings = await PaymentReminderSetting.query().where('teamId', teamId)

  return {
    metadata: {
      exportDate: new Date().toISOString(),
      version: '2.0',
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
      originalId: inv.id,
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
    ...(bankAccountsData ? { bankAccounts: bankAccountsData } : {}),
    products: products.map((p) => ({
      name: p.name,
      description: p.description,
      unitPrice: p.unitPrice,
      vatRate: p.vatRate,
      unit: p.unit,
      saleType: p.saleType,
      reference: p.reference,
      isArchived: p.isArchived,
    })),
    creditNotes: creditNotes.map((cn) => ({
      creditNoteNumber: cn.creditNoteNumber,
      status: cn.status,
      reason: cn.reason,
      subject: cn.subject,
      issueDate: cn.issueDate,
      billingType: cn.billingType,
      accentColor: cn.accentColor,
      logoUrl: cn.logoUrl,
      language: cn.language,
      notes: cn.notes,
      acceptanceConditions: cn.acceptanceConditions,
      signatureField: cn.signatureField,
      documentTitle: cn.documentTitle,
      freeField: cn.freeField,
      globalDiscountType: cn.globalDiscountType,
      globalDiscountValue: cn.globalDiscountValue,
      deliveryAddress: cn.deliveryAddress,
      clientSiren: cn.clientSiren,
      clientVatNumber: cn.clientVatNumber,
      subtotal: cn.subtotal,
      taxAmount: cn.taxAmount,
      total: cn.total,
      comment: cn.comment,
      vatExemptReason: cn.vatExemptReason,
      operationCategory: cn.operationCategory,
      clientId: cn.clientId,
      sourceInvoiceId: cn.sourceInvoiceId,
      lines: cn.lines.map((l) => ({
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
    recurringInvoices: recurringInvoices.map((ri) => ({
      name: ri.name,
      frequency: ri.frequency,
      customIntervalDays: ri.customIntervalDays,
      startDate: ri.startDate,
      nextExecutionDate: ri.nextExecutionDate,
      endDate: ri.endDate,
      isActive: ri.isActive,
      lastGeneratedAt: ri.lastGeneratedAt,
      generationCount: ri.generationCount,
      subject: ri.subject,
      billingType: ri.billingType,
      accentColor: ri.accentColor,
      logoUrl: ri.logoUrl,
      language: ri.language,
      notes: ri.notes,
      acceptanceConditions: ri.acceptanceConditions,
      signatureField: ri.signatureField,
      documentTitle: ri.documentTitle,
      freeField: ri.freeField,
      globalDiscountType: ri.globalDiscountType,
      globalDiscountValue: ri.globalDiscountValue,
      deliveryAddress: ri.deliveryAddress,
      clientSiren: ri.clientSiren,
      clientVatNumber: ri.clientVatNumber,
      paymentTerms: ri.paymentTerms,
      paymentMethod: ri.paymentMethod,
      vatExemptReason: ri.vatExemptReason,
      operationCategory: ri.operationCategory,
      dueDays: ri.dueDays,
      clientId: ri.clientId,
      lines: ri.lines.map((l) => ({
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
    expenseCategories: expenseCategories.map((ec) => ({
      name: ec.name,
      color: ec.color,
      originalId: ec.id,
    })),
    expenses: expenses.map((e) => ({
      description: e.description,
      amount: e.amount,
      vatAmount: e.vatAmount,
      vatRate: e.vatRate,
      currency: e.currency,
      expenseDate: e.expenseDate,
      paymentMethod: e.paymentMethod,
      supplier: e.supplier,
      notes: e.notes,
      receiptUrl: e.receiptUrl,
      isDeductible: e.isDeductible,
      categoryId: e.categoryId,
    })),
    invoicePayments: invoicePayments.map((ip) => ({
      amount: ip.amount,
      paymentDate: ip.paymentDate,
      paymentMethod: ip.paymentMethod,
      notes: ip.notes,
      invoiceId: ip.invoiceId,
    })),
    clientContacts: clientContacts.map((cc) => ({
      firstName: cc.firstName,
      lastName: cc.lastName,
      email: cc.email,
      phone: cc.phone,
      role: cc.role,
      notes: cc.notes,
      isPrimary: cc.isPrimary,
      includeInEmails: cc.includeInEmails,
      clientId: cc.clientId,
    })),
    emailTemplates: emailTemplates.map((et) => ({
      templateType: et.templateType,
      subject: et.subject,
      body: et.body,
    })),
    paymentReminderSettings: paymentReminderSettings.map((prs) => ({
      enabled: prs.enabled,
      daysBeforeDue: prs.daysBeforeDue,
      daysAfterDue: prs.daysAfterDue,
      repeatIntervalDays: prs.repeatIntervalDays,
      emailSubjectTemplate: prs.emailSubjectTemplate,
      emailBodyTemplate: prs.emailBodyTemplate,
      autoSend: prs.autoSend,
    })),
  }
}

interface LogoFile {
  zipPath: string
  buffer: Buffer
}

export function collectLogoFiles(data: ExportData): LogoFile[] {
  const files: LogoFile[] = []
  const uploadsBase = join(app.tmpPath(), 'uploads')

  function tryAdd(urlField: string | null | undefined) {
    if (!urlField) return
    // URL is like /team-icons/filename.png
    const match = urlField.match(/^\/(team-icons|company-logos|invoice-logos)\/(.+)$/)
    if (!match) return
    const [, dir, filename] = match
    const diskPath = join(uploadsBase, dir, filename)
    if (existsSync(diskPath)) {
      files.push({
        zipPath: `export/assets/${dir}/${filename}`,
        buffer: readFileSync(diskPath),
      })
    }
  }

  tryAdd(data.team.iconUrl as string)
  tryAdd(data.company?.logoUrl as string)
  tryAdd(data.settings?.logoUrl as string)

  return files
}

export async function createZipBuffer(data: ExportData, logoFiles?: LogoFile[]): Promise<Buffer> {
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

    if (data.bankAccounts) {
      archive.append(JSON.stringify(data.bankAccounts, null, 2), {
        name: 'export/bank_accounts.json',
      })
    }

    archive.append(JSON.stringify(data.products, null, 2), { name: 'export/products.json' })
    archive.append(JSON.stringify(data.creditNotes, null, 2), {
      name: 'export/credit_notes.json',
    })
    archive.append(JSON.stringify(data.recurringInvoices, null, 2), {
      name: 'export/recurring_invoices.json',
    })
    archive.append(JSON.stringify(data.expenseCategories, null, 2), {
      name: 'export/expense_categories.json',
    })
    archive.append(JSON.stringify(data.expenses, null, 2), { name: 'export/expenses.json' })
    archive.append(JSON.stringify(data.invoicePayments, null, 2), {
      name: 'export/invoice_payments.json',
    })
    archive.append(JSON.stringify(data.clientContacts, null, 2), {
      name: 'export/client_contacts.json',
    })
    archive.append(JSON.stringify(data.emailTemplates, null, 2), {
      name: 'export/email_templates.json',
    })
    archive.append(JSON.stringify(data.paymentReminderSettings, null, 2), {
      name: 'export/payment_reminder_settings.json',
    })

    if (logoFiles) {
      for (const file of logoFiles) {
        archive.append(file.buffer, { name: file.zipPath })
      }
    }

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
