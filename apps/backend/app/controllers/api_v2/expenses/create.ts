import type { HttpContext } from '@adonisjs/core/http'
import Expense from '#models/expense/expense'
import {
  decryptModelFields,
  encryptModelFields,
  ENCRYPTED_FIELDS,
} from '#services/crypto/field_encryption_helper'
import apiResponse from '#services/api/api_response'
import apiExpenseTransformer from '#transformers/api_v2/api_expense_transformer'
import webhookEmitter from '#services/api/webhook_event_emitter'
import { createExpenseValidator } from '#validators/api_v2/expense_validators'

export default class Create {
  async handle(ctx: HttpContext) {
    const team = ctx.team!
    const dek = ctx.dek!
    const payload = await createExpenseValidator.validate(ctx.request.body())

    const vatRate = payload.vat_rate ?? 20
    const amount = payload.amount_cents / 100
    const vatAmount =
      payload.vat_amount_cents !== undefined ? payload.vat_amount_cents / 100 : amount * (vatRate / 100)

    const data: Record<string, any> = {
      teamId: team.id,
      categoryId: payload.category_id ?? null,
      description: payload.description,
      supplier: payload.supplier ?? null,
      amount,
      vatAmount,
      vatRate,
      currency: payload.currency ?? 'EUR',
      expenseDate: payload.expense_date,
      paymentMethod: payload.payment_method ?? null,
      isDeductible: payload.is_deductible ?? true,
      notes: payload.notes ?? null,
    }

    encryptModelFields(data, [...ENCRYPTED_FIELDS.expense], dek)

    const expense = await Expense.create(data)
    decryptModelFields(expense, [...ENCRYPTED_FIELDS.expense], dek)
    const shape = apiExpenseTransformer.transform(expense)

    webhookEmitter
      .emit({ type: 'expense.created', teamId: team.id, data: { expense: shape } })
      .catch(() => {})

    return apiResponse.created(ctx.response, shape)
  }
}
