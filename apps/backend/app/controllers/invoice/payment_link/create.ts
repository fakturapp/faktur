import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import Invoice from '#models/invoice/invoice'
import PaymentLink from '#models/invoice/payment_link'
import BankAccount from '#models/team/bank_account'
import { createPaymentLinkValidator } from '#validators/payment_link_validator'
import { encryptModelFields, decryptModelFields, ENCRYPTED_FIELDS } from '#services/crypto/field_encryption_helper'
import encryptionService from '#services/encryption/encryption_service'
import { generateInvoicePdf } from '#services/pdf/document_pdf_service'
import r2StorageService from '#services/storage/r2_storage_service'
import env from '#start/env'

export default class Create {
  async handle(ctx: HttpContext) {
    const { auth, params, request, response } = ctx
    const dek: Buffer = (ctx as any).dek
    const user = auth.user!
    const teamId = user.currentTeamId

    if (!teamId) {
      return response.badRequest({ message: 'No team selected' })
    }

    const invoice = await Invoice.query()
      .where('id', params.invoiceId)
      .where('team_id', teamId)
      .preload('client')
      .first()

    if (!invoice) {
      return response.notFound({ message: 'Invoice not found' })
    }

    // Check no active link already exists
    const existingLink = await PaymentLink.query()
      .where('invoice_id', invoice.id)
      .where('is_active', true)
      .first()

    if (existingLink) {
      return response.conflict({ message: 'A payment link already exists for this invoice' })
    }

    const payload = await request.validateUsing(createPaymentLinkValidator)

    // Get bank account info if showing IBAN
    let encryptedIban: string | null = null
    let encryptedBic: string | null = null
    let encryptedBankName: string | null = null

    const showIban = payload.showIban !== false

    if (showIban && invoice.bankAccountId) {
      const bankAccount = await BankAccount.query()
        .where('id', invoice.bankAccountId)
        .where('team_id', teamId)
        .first()

      if (bankAccount) {
        // Decrypt IBAN/BIC with DEK (zero-access)
        decryptModelFields(bankAccount, [...ENCRYPTED_FIELDS.bankAccount], dek)

        // Re-encrypt with app-level EncryptionService for public access
        if (bankAccount.iban) {
          encryptedIban = encryptionService.encrypt(bankAccount.iban)
        }
        if (bankAccount.bic) {
          encryptedBic = encryptionService.encrypt(bankAccount.bic)
        }
        if (bankAccount.bankName) {
          encryptedBankName = encryptionService.encrypt(bankAccount.bankName)
        }
      }
    }

    // Generate secure token
    const rawToken = encryptionService.generateSecureToken(64)
    const tokenHash = encryptionService.hash(rawToken)

    // Hash and encrypt password if provided
    let passwordHash: string | null = null
    if (payload.password) {
      const pwHash = encryptionService.hash(payload.password)
      passwordHash = encryptionService.encrypt(pwHash)
    }

    // Calculate expiration
    let expiresAt: DateTime | null = null
    const expirationType = payload.expirationType || null

    if (expirationType === 'due_date' && invoice.dueDate) {
      expiresAt = DateTime.fromSQL(invoice.dueDate).endOf('day')
    } else if (expirationType === 'custom' && payload.expiresAt) {
      expiresAt = DateTime.fromISO(payload.expiresAt).endOf('day')
    } else if (expirationType === 'days' && payload.expirationDays) {
      expiresAt = DateTime.now().plus({ days: payload.expirationDays }).endOf('day')
    }

    // Get client info and company name for snapshot
    let clientEmail: string | null = null
    let clientName: string | null = null
    let companyName: string | null = null

    if (invoice.client) {
      decryptModelFields(invoice.client, [...ENCRYPTED_FIELDS.client], dek)
      clientEmail = invoice.client.email || null
      clientName = invoice.client.displayName || null
    }

    // Get company name from companySnapshot
    if (invoice.companySnapshot) {
      decryptModelFields(invoice, ['companySnapshot'] as any, dek)
      try {
        const snap = JSON.parse(invoice.companySnapshot!)
        companyName = snap.legalName || snap.companyName || null
      } catch {
        // ignore parse errors
      }
    }

    // App-level encrypt client email for use in public checkout notifications
    let appEncryptedClientEmail: string | null = null
    let appEncryptedClientName: string | null = null
    if (clientEmail) {
      appEncryptedClientEmail = encryptionService.encrypt(clientEmail)
    }
    if (clientName) {
      appEncryptedClientName = encryptionService.encrypt(clientName)
    }

    // Also app-level encrypt company name for public display
    let appEncryptedCompanyName: string | null = null
    if (companyName) {
      appEncryptedCompanyName = encryptionService.encrypt(companyName)
    }

    // Build payment link data
    const linkData: Record<string, any> = {
      teamId,
      invoiceId: invoice.id,
      createdByUserId: user.id,
      tokenHash,
      paymentMethod: payload.paymentMethod,
      paymentType: payload.paymentType,
      showIban,
      passwordHash,
      expirationType,
      expiresAt: expiresAt?.toSQL() || null,
      isActive: true,
      encryptedIban,
      encryptedBic,
      encryptedBankName,
      clientEmail: appEncryptedClientEmail,
      clientName: appEncryptedClientName,
      amount: Number(invoice.total),
      currency: 'EUR',
      invoiceNumber: invoice.invoiceNumber,
      companyName: appEncryptedCompanyName,
    }

    // Encrypt DEK-based fields
    encryptModelFields(linkData, [...ENCRYPTED_FIELDS.paymentLink], dek)

    const paymentLink = await PaymentLink.create(linkData)

    // Generate and upload PDF to R2 if includePdf is enabled (default: true)
    const includePdf = payload.includePdf !== false
    if (includePdf) {
      try {
        const { pdfBuffer, filename } = await generateInvoicePdf(invoice.id, teamId, dek)
        const pdfUrl = await r2StorageService.upload(
          'payment-links',
          `${paymentLink.id}/${filename}`,
          pdfBuffer,
          'application/pdf'
        )
        paymentLink.pdfStorageKey = pdfUrl
        await paymentLink.save()
      } catch {
        // PDF generation/upload failure is non-blocking
      }
    }

    // Build checkout URL
    const checkoutUrl = env.get('CHECKOUT_URL') || env.get('FRONTEND_URL') || 'http://localhost:3000'
    const fullUrl = `${checkoutUrl}/checkout/${rawToken}/pay`

    return response.created({
      message: 'Payment link created',
      paymentLink: {
        id: paymentLink.id,
        token: rawToken,
        url: fullUrl,
        expiresAt: expiresAt?.toISO() || null,
        isActive: true,
        isPasswordProtected: !!payload.password,
        hasPdf: !!paymentLink.pdfStorageKey,
      },
    })
  }
}
