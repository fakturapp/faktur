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

/**
 * Delete a team and all its associated data in correct FK order.
 * Must be called inside a transaction context or will create its own.
 */
export async function deleteTeamCascade(teamId: string) {
  await db.transaction(async (trx) => {
    // 1. Credit note lines (via credit notes)
    const creditNoteIds = await CreditNote.query({ client: trx })
      .where('teamId', teamId)
      .select('id')
    if (creditNoteIds.length > 0) {
      await CreditNoteLine.query({ client: trx })
        .whereIn('creditNoteId', creditNoteIds.map((cn) => cn.id))
        .delete()
    }

    // 2. Credit notes
    await CreditNote.query({ client: trx }).where('teamId', teamId).delete()

    // 3. Recurring invoice lines (via recurring invoices)
    const recurringIds = await RecurringInvoice.query({ client: trx })
      .where('teamId', teamId)
      .select('id')
    if (recurringIds.length > 0) {
      await RecurringInvoiceLine.query({ client: trx })
        .whereIn('recurringInvoiceId', recurringIds.map((r) => r.id))
        .delete()
    }

    // 4. Recurring invoices
    await RecurringInvoice.query({ client: trx }).where('teamId', teamId).delete()

    // 5. Invoice payments
    await InvoicePayment.query({ client: trx }).where('teamId', teamId).delete()

    // 6. Payment reminders (via invoices)
    const invoiceIds = await Invoice.query({ client: trx })
      .where('teamId', teamId)
      .select('id')
    if (invoiceIds.length > 0) {
      await PaymentReminder.query({ client: trx })
        .whereIn('invoiceId', invoiceIds.map((i) => i.id))
        .delete()
    }

    // 7. Invoice lines (via invoices)
    if (invoiceIds.length > 0) {
      await InvoiceLine.query({ client: trx })
        .whereIn('invoiceId', invoiceIds.map((i) => i.id))
        .delete()
    }

    // 8. Quote lines (via quotes)
    const quoteIds = await Quote.query({ client: trx })
      .where('teamId', teamId)
      .select('id')
    if (quoteIds.length > 0) {
      await QuoteLine.query({ client: trx })
        .whereIn('quoteId', quoteIds.map((q) => q.id))
        .delete()
    }

    // 9. Invoices
    await Invoice.query({ client: trx }).where('teamId', teamId).delete()

    // 10. Quotes
    await Quote.query({ client: trx }).where('teamId', teamId).delete()

    // 11. Client contacts
    await ClientContact.query({ client: trx }).where('teamId', teamId).delete()

    // 12. Clients
    await Client.query({ client: trx }).where('teamId', teamId).delete()

    // 13. Products
    await Product.query({ client: trx }).where('teamId', teamId).delete()

    // 14. Expenses
    await Expense.query({ client: trx }).where('teamId', teamId).delete()

    // 15. Expense categories
    await ExpenseCategory.query({ client: trx }).where('teamId', teamId).delete()

    // 16. Email logs
    await EmailLog.query({ client: trx }).where('teamId', teamId).delete()

    // 17. Email templates
    await EmailTemplate.query({ client: trx }).where('teamId', teamId).delete()

    // 18. Payment reminder settings
    await PaymentReminderSetting.query({ client: trx }).where('teamId', teamId).delete()

    // 19. Email accounts
    await EmailAccount.query({ client: trx }).where('teamId', teamId).delete()

    // 20. Bank accounts
    await BankAccount.query({ client: trx }).where('teamId', teamId).delete()

    // 21. Invoice settings
    await InvoiceSetting.query({ client: trx }).where('teamId', teamId).delete()

    // 22. Company
    await Company.query({ client: trx }).where('teamId', teamId).delete()

    // 23. Team members
    await TeamMember.query({ client: trx }).where('teamId', teamId).delete()

    // 24. Team
    await Team.query({ client: trx }).where('id', teamId).delete()
  })
}
