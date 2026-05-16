import type Expense from '#models/expense/expense'
import publicIdCodec from '#services/api/public_id_codec'

export interface ApiExpenseShape {
  id: string
  description: string
  supplier: string | null
  category_id: string | null
  amount_cents: number
  vat_amount_cents: number
  vat_rate: number
  currency: string
  expense_date: string
  payment_method: string | null
  receipt_url: string | null
  is_deductible: boolean
  notes: string | null
  created_at: string
  updated_at: string | null
}

class ApiExpenseTransformer {
  transform(expense: Expense): ApiExpenseShape {
    return {
      id: publicIdCodec.encode('expense', expense.id),
      description: expense.description,
      supplier: expense.supplier,
      category_id: expense.categoryId,
      amount_cents: Math.round(Number(expense.amount) * 100),
      vat_amount_cents: Math.round(Number(expense.vatAmount) * 100),
      vat_rate: Number(expense.vatRate),
      currency: expense.currency,
      expense_date: expense.expenseDate,
      payment_method: expense.paymentMethod,
      receipt_url: expense.receiptUrl,
      is_deductible: expense.isDeductible,
      notes: expense.notes,
      created_at: expense.createdAt.toISO() ?? '',
      updated_at: expense.updatedAt?.toISO() ?? null,
    }
  }

  transformMany(expenses: Expense[]): ApiExpenseShape[] {
    return expenses.map((e) => this.transform(e))
  }
}

export default new ApiExpenseTransformer()
