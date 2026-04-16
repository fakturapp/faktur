import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import Invoice from '#models/invoice/invoice'
import Company from '#models/team/company'
import Client from '#models/client/client'
import InvoiceSetting from '#models/team/invoice_setting'
import EinvoicingSubmission from '#models/einvoicing/einvoicing_submission'
import { buildFacturXFromInvoice, generateFacturXXml } from '#services/pdf/facturx_generator'
import { buildPdpConfig, submitInvoiceStructured, submitInvoiceXml } from '#services/einvoicing/pdp_service'
import { validateCiiXml } from '#services/einvoicing/cii_xml_validator'
import * as b2b from '#services/einvoicing/b2brouter_client'
import {
  decryptModelFields,
  decryptModelFieldsArray,
  ENCRYPTED_FIELDS,
} from '#services/crypto/field_encryption_helper'

export default class SubmitInvoice {
  async handle(ctx: HttpContext) {
    const { auth, params, response } = ctx
    const dek: Buffer = (ctx as any).dek
    const user = auth.user!
    const teamId = user.currentTeamId

    if (!teamId) {
      return response.badRequest({ message: 'No team selected' })
    }

    const invoiceSettings = await InvoiceSetting.query().where('team_id', teamId).first()
    if (!invoiceSettings?.eInvoicingEnabled) {
      return response.forbidden({ message: "La facturation electronique n'est pas activee" })
    }

    const invoice = await Invoice.query()
      .where('id', params.id)
      .where('team_id', teamId)
      .preload('client')
      .preload('lines', (q) => q.orderBy('position', 'asc'))
      .first()

    if (!invoice) {
      return response.notFound({ message: 'Facture non trouvee' })
    }

    if (invoice.status === 'draft') {
      return response.unprocessableEntity({ message: 'Impossible de soumettre un brouillon' })
    }

    const existingSubmission = await EinvoicingSubmission.query()
      .where('document_type', 'invoice')
      .where('document_id', invoice.id)
      .whereIn('status', ['submitted', 'accepted', 'delivered'])
      .first()

    if (existingSubmission) {
      return response.conflict({
        message: 'Cette facture a deja ete soumise',
        submission: {
          id: existingSubmission.id,
          status: existingSubmission.status,
          trackingId: existingSubmission.trackingId,
        },
      })
    }

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

    decryptModelFields(invoiceSettings, [...ENCRYPTED_FIELDS.invoiceSetting], dek)
    const pdpConfig = buildPdpConfig(invoiceSettings)

    const submission = await EinvoicingSubmission.create({
      teamId,
      documentType: 'invoice',
      documentId: invoice.id,
      documentNumber: invoice.invoiceNumber,
      provider: invoiceSettings.pdpProvider || 'sandbox',
      status: 'pending',
      statusMessage: 'Soumission en cours',
      lifecycleEvents: [{ status: 'pending', message: 'Soumission initiee', timestamp: new Date().toISOString() }],
      submittedByUserId: user.id,
    })

    let result

    const clientRecord = invoice.clientId
      ? await Client.find(invoice.clientId)
      : null
    const hasB2BContact = clientRecord?.b2bContactId

    if (pdpConfig.b2bAccountId && pdpConfig.apiKey && hasB2BContact) {
      const b2bLines: b2b.B2BInvoiceLine[] = invoice.lines
        .filter((l) => l.saleType !== 'section')
        .map((l) => {
          const vatCat = b2b.mapVatCategory(l.vatRate, invoice.vatExemptReason)
          return {
            description: l.description || 'Article',
            quantity: l.quantity || 1,
            price: l.unitPrice || 0,
            taxes_attributes: [{
              ...vatCat,
              percent: l.vatRate || 0,
            }],
          }
        })

      const invoiceParams: b2b.B2BCreateInvoiceParams = {
        send_after_import: true,
        type: 'IssuedInvoice',
        contact_id: clientRecord!.b2bContactId!,
        number: invoice.invoiceNumber,
        date: invoice.issueDate,
        due_date: invoice.dueDate || undefined,
        currency: 'EUR',
        payment_method: b2b.mapPaymentMethod(invoice.paymentMethod),
        payment_method_text: invoice.paymentMethod || 'Virement bancaire',
        payment_terms: invoice.paymentTerms || 'A reception',
        remittance_information: invoice.invoiceNumber,
        invoice_lines_attributes: b2bLines,
      }

      result = await submitInvoiceStructured(pdpConfig, invoiceParams)
    } else {
      const invoiceDataForXml = {
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

      const facturxDoc = buildFacturXFromInvoice(invoiceDataForXml, linesData, clientData, companyData)
      const xml = generateFacturXXml(facturxDoc)

      const validation = validateCiiXml(xml)
      if (!validation.valid) {
        submission.status = 'error'
        submission.statusMessage = validation.errors.join('; ')
        submission.addLifecycleEvent('error', `Validation echouee: ${validation.errors.join('; ')}`)
        await submission.save()

        return response.unprocessableEntity({
          message: 'Le document ne passe pas la validation CII EN 16931',
          errors: validation.errors,
          warnings: validation.warnings,
          submissionId: submission.id,
        })
      }

      submission.xmlContent = xml
      result = await submitInvoiceXml(pdpConfig, xml, {
        documentNumber: invoice.invoiceNumber,
        documentType: 'invoice',
      })
    }

    submission.trackingId = result.trackingId
    submission.externalId = result.externalId || null
    submission.status = result.success ? 'submitted' : 'error'
    submission.statusMessage = result.message
    submission.submittedAt = DateTime.now()
    submission.addLifecycleEvent(
      result.success ? 'submitted' : 'error',
      result.message
    )
    await submission.save()

    return response.ok({
      message: result.success ? 'Facture soumise avec succes' : 'Erreur lors de la soumission',
      submission: {
        id: submission.id,
        status: submission.status,
        trackingId: submission.trackingId,
        provider: submission.provider,
        externalId: submission.externalId,
      },
    })
  }
}
