import type { HttpContext } from '@adonisjs/core/http'
import RecurringInvoice from '#models/recurring_invoice/recurring_invoice'
import apiResponse from '#services/api/api_response'
import apiRecurringInvoiceTransformer from '#transformers/api_v2/api_recurring_invoice_transformer'
import publicIdCodec, { PublicIdParseError } from '#services/api/public_id_codec'

export class Pause {
  async handle(ctx: HttpContext) {
    return setActive(ctx, false, 'pause')
  }
}

export class Resume {
  async handle(ctx: HttpContext) {
    return setActive(ctx, true, 'resume')
  }
}

async function setActive(ctx: HttpContext, active: boolean, label: string) {
  const team = ctx.team!

  let internalId: string
  try {
    internalId = publicIdCodec.decode('recurring_invoice', ctx.params.id)
  } catch (err) {
    if (err instanceof PublicIdParseError) {
      return apiResponse.notFound(
        ctx.response,
        'resource_not_found',
        'Recurring invoice not found',
        ctx.requestId
      )
    }
    throw err
  }

  const r = await RecurringInvoice.query()
    .where('id', internalId)
    .where('team_id', team.id)
    .first()
  if (!r) {
    return apiResponse.notFound(
      ctx.response,
      'resource_not_found',
      'Recurring invoice not found',
      ctx.requestId
    )
  }

  if (r.isActive === active) {
    return apiResponse.conflict(
      ctx.response,
      'conflict',
      `Already ${active ? 'active' : 'paused'}`,
      ctx.requestId
    )
  }

  r.isActive = active
  await r.save()

  void label
  return apiResponse.ok(ctx.response, apiRecurringInvoiceTransformer.transform(r))
}
