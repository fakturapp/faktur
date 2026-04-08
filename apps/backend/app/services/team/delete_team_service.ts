import db from '@adonisjs/lucid/services/db'
import CreditNoteLine from '#models/credit_note/credit_note_line'
import CreditNote from '#models/credit_note/credit_note'
import RecurringInvoiceLine from '#models/recurring_invoice/recurring_invoice_line'
import RecurringInvoice from '#models/recurring_invoice/recurring_invoice'
import InvoicePayment from '#models/invoice/invoice_payment'
import PaymentReminder from '#models/reminder/payment_reminder'
import InvoiceLine from '#models/invoice/invoice_line'
import QuoteLine from '#models/quote/quote_line'
import Invoice from '#models/invoice/invoice'
import Quote from '#models/quote/quote'
import ClientContact from '#models/client/client_contact'
import Client from '#models/client/client'
import Product from '#models/product/product'
import Expense from '#models/expense/expense'
import ExpenseCategory from '#models/expense/expense_category'
import EmailLog from '#models/email/email_log'
import EmailTemplate from '#models/email/email_template'
import PaymentReminderSetting from '#models/reminder/payment_reminder_setting'
import EmailAccount from '#models/email/email_account'
import BankAccount from '#models/team/bank_account'
import InvoiceSetting from '#models/team/invoice_setting'
import Company from '#models/team/company'
import TeamMember from '#models/team/team_member'
import Team from '#models/team/team'

export async function deleteTeamCascade(teamId: string) {
  await db.transaction(async (trx) => {
    const creditNoteIds = await CreditNote.query({ client: trx })
      .where('teamId', teamId)
      .select('id')
    if (creditNoteIds.length > 0) {
      await CreditNoteLine.query({ client: trx })
        .whereIn('creditNoteId', creditNoteIds.map((cn) => cn.id))
        .delete()
    }

    await CreditNote.query({ client: trx }).where('teamId', teamId).delete()

    const recurringIds = await RecurringInvoice.query({ client: trx })
      .where('teamId', teamId)
      .select('id')
    if (recurringIds.length > 0) {
      await RecurringInvoiceLine.query({ client: trx })
        .whereIn('recurringInvoiceId', recurringIds.map((r) => r.id))
        .delete()
    }

    await RecurringInvoice.query({ client: trx }).where('teamId', teamId).delete()

    await InvoicePayment.query({ client: trx }).where('teamId', teamId).delete()

    const invoiceIds = await Invoice.query({ client: trx })
      .where('teamId', teamId)
      .select('id')
    if (invoiceIds.length > 0) {
      await PaymentReminder.query({ client: trx })
        .whereIn('invoiceId', invoiceIds.map((i) => i.id))
        .delete()
    }

    if (invoiceIds.length > 0) {
      await InvoiceLine.query({ client: trx })
        .whereIn('invoiceId', invoiceIds.map((i) => i.id))
        .delete()
    }

    const quoteIds = await Quote.query({ client: trx })
      .where('teamId', teamId)
      .select('id')
    if (quoteIds.length > 0) {
      await QuoteLine.query({ client: trx })
        .whereIn('quoteId', quoteIds.map((q) => q.id))
        .delete()
    }

    await Invoice.query({ client: trx }).where('teamId', teamId).delete()

    await Quote.query({ client: trx }).where('teamId', teamId).delete()

    await ClientContact.query({ client: trx }).where('teamId', teamId).delete()

    await Client.query({ client: trx }).where('teamId', teamId).delete()

    await Product.query({ client: trx }).where('teamId', teamId).delete()

    await Expense.query({ client: trx }).where('teamId', teamId).delete()

    await ExpenseCategory.query({ client: trx }).where('teamId', teamId).delete()

    await EmailLog.query({ client: trx }).where('teamId', teamId).delete()

    await EmailTemplate.query({ client: trx }).where('teamId', teamId).delete()

    await PaymentReminderSetting.query({ client: trx }).where('teamId', teamId).delete()

    await EmailAccount.query({ client: trx }).where('teamId', teamId).delete()

    await BankAccount.query({ client: trx }).where('teamId', teamId).delete()

    await InvoiceSetting.query({ client: trx }).where('teamId', teamId).delete()

    await Company.query({ client: trx }).where('teamId', teamId).delete()

    await TeamMember.query({ client: trx }).where('teamId', teamId).delete()

    await Team.query({ client: trx }).where('id', teamId).delete()
  })
}
