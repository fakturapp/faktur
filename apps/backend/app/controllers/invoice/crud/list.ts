import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import Invoice from '#models/invoice/invoice'
import InvoiceTransformer from '#transformers/invoice_transformer'
import {
  decryptModelFields,
  decryptModelFieldsArray,
  ENCRYPTED_FIELDS,
} from '#services/crypto/field_encryption_helper'
import { ApiError } from '#exceptions/api_error'

export default class List {
  async handle(ctx: HttpContext) {
    const { auth, request, response } = ctx
    const user = auth.user!
    const teamId = user.currentTeamId
    const dek: Buffer = (ctx as any).dek

    if (!teamId) {
      throw new ApiError('team_not_selected')
    }

    await Invoice.query()
      .where('teamId', teamId)
      .where('status', 'sent')
      .whereNotNull('dueDate')
      .where('dueDate', '<', DateTime.now().toSQLDate()!)
      .update({ status: 'overdue' })

    const status = request.input('status', '')
    const clientId = request.input('clientId', '')
    const issueDateFrom = request.input('issueDateFrom', '')
    const issueDateTo = request.input('issueDateTo', '')
    const page = request.input('page', 1)
    const perPage = request.input('perPage', 20)

    const query = Invoice.query()
      .where('team_id', teamId)
      .preload('client')
      .orderBy('created_at', 'desc')

    if (status) {
      query.where('status', status)
    }

    if (clientId) {
      query.where('client_id', clientId)
    }

    if (issueDateFrom) {
      query.where('issue_date', '>=', issueDateFrom)
    }

    if (issueDateTo) {
      query.where('issue_date', '<=', issueDateTo)
    }

    const search = request.input('search', '')
    if (search) {
      query.whereILike('invoice_number', `%${search}%`)
    }

    const result = await query.paginate(page, perPage)
    const invoices = result.all()

    // Decrypt invoice fields
    decryptModelFieldsArray(invoices, [...ENCRYPTED_FIELDS.invoice], dek)

    // Decrypt client fields for display
    for (const inv of invoices) {
      if (inv.client) {
        decryptModelFields(inv.client, [...ENCRYPTED_FIELDS.client], dek)
      }
    }

    const transformed = await ctx.serialize.withoutWrapping(InvoiceTransformer.transform(invoices))
    const invoiceList = (Array.isArray(transformed) ? transformed : [transformed]).map(
      (inv: any) => ({
        ...inv,
        needsAction: inv.status === 'paid_unconfirmed' || inv.status === 'overdue',
      })
    )

    return response.ok({
      invoices: invoiceList,
      meta: {
        total: result.total,
        perPage: result.perPage,
        currentPage: result.currentPage,
        lastPage: result.lastPage,
      },
    })
  }
}
