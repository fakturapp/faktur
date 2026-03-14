import type { HttpContext } from '@adonisjs/core/http'
import Quote from '#models/quote/quote'
import Company from '#models/team/company'
import InvoiceSetting from '#models/team/invoice_setting'
import { renderQuoteHtml } from '#services/pdf/html_renderer'
import { generatePdf } from '#services/pdf/pdf_generator'

export default class Pdf {
  async handle({ auth, params, response }: HttpContext) {
    const user = auth.user!
    const teamId = user.currentTeamId

    if (!teamId) {
      return response.badRequest({ message: 'No team selected' })
    }

    const quote = await Quote.query()
      .where('id', params.id)
      .where('team_id', teamId)
      .preload('client')
      .preload('lines', (q) => q.orderBy('position', 'asc'))
      .first()

    if (!quote) {
      return response.notFound({ message: 'Quote not found' })
    }

    const company = await Company.query().where('team_id', teamId).first()

    const invoiceSettings = await InvoiceSetting.query().where('team_id', teamId).first()

    const settingsData = {
      template: invoiceSettings?.template || 'classique',
      paymentMethods: invoiceSettings?.paymentMethods || ['bank_transfer'],
      customPaymentMethod: invoiceSettings?.customPaymentMethod || null,
    }

    const quoteData = {
      quoteNumber: quote.quoteNumber,
      status: quote.status,
      subject: quote.subject,
      issueDate: quote.issueDate,
      validityDate: quote.validityDate,
      billingType: quote.billingType,
      accentColor: quote.accentColor,
      logoUrl: quote.logoUrl,
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

    const clientData = quote.client
      ? {
          type: quote.client.type,
          displayName: quote.client.displayName,
          companyName: quote.client.companyName,
          firstName: quote.client.firstName,
          lastName: quote.client.lastName,
          email: quote.client.email,
          phone: quote.client.phone,
          address: quote.client.address,
          addressComplement: quote.client.addressComplement,
          postalCode: quote.client.postalCode,
          city: quote.client.city,
          country: quote.client.country,
          siren: quote.client.siren,
          vatNumber: quote.client.vatNumber,
        }
      : null

    const companyData = company
      ? {
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
      : null

    const html = renderQuoteHtml(quoteData, linesData, clientData, companyData, settingsData)
    const pdfBuffer = await generatePdf(html)

    const filename = `${quote.quoteNumber.replace(/[^a-zA-Z0-9-_]/g, '_')}.pdf`

    response.header('Content-Type', 'application/pdf')
    response.header('Content-Disposition', `attachment; filename="${filename}"`)
    response.header('Content-Length', pdfBuffer.length.toString())
    return response.send(pdfBuffer)
  }
}
