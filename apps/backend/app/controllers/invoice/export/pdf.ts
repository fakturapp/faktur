import type { HttpContext } from '@adonisjs/core/http'
import Invoice from '#models/invoice/invoice'
import Company from '#models/team/company'
import InvoiceSetting from '#models/team/invoice_setting'
import { generateInvoicePdf } from '#services/pdf/document_pdf_service'
import { buildFacturXFromInvoice, generateFacturXXml } from '#services/pdf/facturx_generator'
import { embedFacturXInPdf } from '#services/pdf/pdfa3_embedder'
import {
  decryptModelFields,
  decryptModelFieldsArray,
  ENCRYPTED_FIELDS,
} from '#services/crypto/field_encryption_helper'

export default class Pdf {
  async handle(ctx: HttpContext) {
    const { auth, params, response } = ctx
    const user = auth.user!
    const teamId = user.currentTeamId
    const dek: Buffer = (ctx as any).dek

    if (!teamId) {
      return response.badRequest({ message: 'No team selected' })
    }

    try {
      let { pdfBuffer, filename } = await generateInvoicePdf(params.id, teamId, dek)

      const invoiceSettings = await InvoiceSetting.query().where('team_id', teamId).first()
      if (invoiceSettings?.eInvoicingEnabled) {
        const invoice = await Invoice.query()
          .where('id', params.id)
          .where('team_id', teamId)
          .preload('client')
          .preload('lines', (q) => q.orderBy('position', 'asc'))
          .first()

        if (invoice) {
          decryptModelFields(invoice, [...ENCRYPTED_FIELDS.invoice], dek)
          decryptModelFieldsArray(invoice.lines, [...ENCRYPTED_FIELDS.invoiceLine], dek)
          if (invoice.client) {
            decryptModelFields(invoice.client, [...ENCRYPTED_FIELDS.client], dek)
          }

          const company = await Company.query().where('team_id', teamId).first()
          if (company) {
            decryptModelFields(company, [...ENCRYPTED_FIELDS.company], dek)
          }

          const clientData = invoice.clientSnapshot
            ? JSON.parse(invoice.clientSnapshot)
            : invoice.client
              ? {
                  displayName: invoice.client.displayName,
                  companyName: invoice.client.companyName,
                  firstName: invoice.client.firstName,
                  lastName: invoice.client.lastName,
                  email: invoice.client.email,
                  address: invoice.client.address,
                  postalCode: invoice.client.postalCode,
                  city: invoice.client.city,
                  country: invoice.client.country,
                  siren: invoice.client.siren,
                  siret: (invoice.client as any).siret,
                  vatNumber: invoice.client.vatNumber,
                }
              : null

          const companyData = invoice.companySnapshot
            ? JSON.parse(invoice.companySnapshot)
            : company
              ? {
                  legalName: company.legalName,
                  siren: company.siren,
                  siret: company.siret,
                  vatNumber: company.vatNumber,
                  addressLine1: company.addressLine1,
                  postalCode: company.postalCode,
                  city: company.city,
                  country: company.country,
                  email: company.email,
                  phone: company.phone,
                  iban: company.iban,
                  bic: company.bic,
                }
              : null

          const linesData = invoice.lines.map((l) => ({
            description: l.description,
            saleType: l.saleType,
            quantity: l.quantity,
            unitPrice: l.unitPrice,
            vatRate: l.vatRate,
            total: l.total,
          }))

          const invoiceData = {
            invoiceNumber: invoice.invoiceNumber,
            issueDate: invoice.issueDate,
            dueDate: invoice.dueDate,
            subtotal: invoice.subtotal,
            taxAmount: invoice.taxAmount,
            total: invoice.total,
            notes: invoice.notes,
            language: invoice.language || 'fr',
            operationCategory: invoice.operationCategory,
            paymentMethod: invoice.paymentMethod,
            vatExemptReason: invoice.vatExemptReason,
          }

          const facturxDoc = buildFacturXFromInvoice(invoiceData, linesData, clientData, companyData)
          const facturxXml = generateFacturXXml(facturxDoc)

          try {
            pdfBuffer = await embedFacturXInPdf(pdfBuffer, facturxXml)
            response.header('X-Facturx-Embedded', 'true')
          } catch {
            response.header('X-Facturx-Embedded', 'false')
          }

          response.header('X-Facturx-Profile', 'EN16931')
        }
      }

      response.header('Content-Type', 'application/pdf')
      response.header('Content-Disposition', `attachment; filename="${filename}"`)
      response.header('Content-Length', pdfBuffer.length.toString())
      return response.send(pdfBuffer)
    } catch {
      return response.notFound({ message: 'Invoice not found' })
    }
  }
}
