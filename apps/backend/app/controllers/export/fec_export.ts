import type { HttpContext } from '@adonisjs/core/http'
import Invoice from '#models/invoice/invoice'
import Expense from '#models/expense/expense'
import Company from '#models/team/company'
import { decryptModelFields, ENCRYPTED_FIELDS } from '#services/crypto/field_encryption_helper'

/**
 * FEC Export (Fichier des Écritures Comptables)
 * French legal accounting export format (Article A47 A-1 du LPF)
 *
 * Tab-separated text file with required columns:
 * JournalCode|JournalLib|EcritureNum|EcritureDate|CompteNum|CompteLib|
 * CompAuxNum|CompAuxLib|PieceRef|PieceDate|EcritureLib|Debit|Credit|
 * EcrtureLet|DateLet|ValidDate|Montantdevise|Idevise
 */

const FEC_HEADER = [
  'JournalCode',
  'JournalLib',
  'EcritureNum',
  'EcritureDate',
  'CompteNum',
  'CompteLib',
  'CompAuxNum',
  'CompAuxLib',
  'PieceRef',
  'PieceDate',
  'EcritureLib',
  'Debit',
  'Credit',
  'EcrtureLet',
  'DateLet',
  'ValidDate',
  'Montantdevise',
  'Idevise',
].join('\t')

function fecDate(dateStr: string | null): string {
  if (!dateStr) return ''
  return dateStr.replace(/-/g, '')
}

function fecAmount(n: number): string {
  return n.toFixed(2).replace('.', ',')
}

export default class FecExport {
  async handle(ctx: HttpContext) {
    const { auth, request, response } = ctx
    const dek: Buffer = (ctx as any).dek
    const user = auth.user!
    const teamId = user.currentTeamId

    if (!teamId) {
      return response.badRequest({ message: 'No team selected' })
    }

    const startDate = request.input('startDate')
    const endDate = request.input('endDate')

    if (!startDate || !endDate) {
      return response.badRequest({ message: 'startDate and endDate are required' })
    }

    const company = await Company.findBy('teamId', teamId)
    const siren = company?.siren || 'UNKNOWN'

    // Fetch invoices
    const invoices = await Invoice.query()
      .where('team_id', teamId)
      .whereNotIn('status', ['draft', 'cancelled'])
      .where('issue_date', '>=', startDate)
      .where('issue_date', '<=', endDate)
      .preload('client')
      .orderBy('issue_date', 'asc')

    // Decrypt client fields for display names
    for (const inv of invoices) {
      if (inv.client) {
        decryptModelFields(inv.client, [...ENCRYPTED_FIELDS.client], dek)
      }
    }

    // Fetch expenses
    const expenses = await Expense.query()
      .where('team_id', teamId)
      .where('expense_date', '>=', startDate)
      .where('expense_date', '<=', endDate)
      .orderBy('expense_date', 'asc')

    for (const exp of expenses) {
      decryptModelFields(exp, [...ENCRYPTED_FIELDS.expense], dek)
    }

    const lines: string[] = [FEC_HEADER]
    let entryNum = 1

    // --- Sales journal (VE) ---
    for (const inv of invoices) {
      const num = String(entryNum).padStart(6, '0')
      const date = fecDate(inv.issueDate)
      const clientName = inv.client?.displayName || ''
      const clientId = inv.clientId || ''
      const ht = Number(inv.subtotal) || 0
      const tva = Number(inv.taxAmount) || 0
      const ttc = Number(inv.total) || 0

      // Client debit line (411xxx)
      lines.push(
        [
          'VE', 'Journal des ventes', num, date,
          '411000', 'Clients', clientId, clientName,
          inv.invoiceNumber, date, `Facture ${inv.invoiceNumber}`,
          fecAmount(ttc), fecAmount(0),
          '', '', date, fecAmount(ttc), 'EUR',
        ].join('\t')
      )

      // Revenue credit line (706xxx for services, 707xxx for goods)
      const revenueAccount = inv.operationCategory === 'goods' ? '707000' : '706000'
      const revenueLabel = inv.operationCategory === 'goods' ? 'Ventes de marchandises' : 'Prestations de services'
      lines.push(
        [
          'VE', 'Journal des ventes', num, date,
          revenueAccount, revenueLabel, '', '',
          inv.invoiceNumber, date, `Facture ${inv.invoiceNumber}`,
          fecAmount(0), fecAmount(ht),
          '', '', date, fecAmount(ht), 'EUR',
        ].join('\t')
      )

      // VAT credit line (44571x)
      if (tva > 0) {
        lines.push(
          [
            'VE', 'Journal des ventes', num, date,
            '445710', 'TVA collectée', '', '',
            inv.invoiceNumber, date, `TVA Facture ${inv.invoiceNumber}`,
            fecAmount(0), fecAmount(tva),
            '', '', date, fecAmount(tva), 'EUR',
          ].join('\t')
        )
      }

      entryNum++
    }

    // --- Purchase journal (HA) ---
    for (const exp of expenses) {
      const num = String(entryNum).padStart(6, '0')
      const date = fecDate(exp.expenseDate)
      const amount = Number(exp.amount) || 0
      const vatAmount = Number(exp.vatAmount) || 0
      const ttc = amount + vatAmount

      // Expense debit line (6xxxxx)
      lines.push(
        [
          'HA', 'Journal des achats', num, date,
          '625000', 'Charges externes', '', '',
          `DEP-${exp.id.slice(0, 8)}`, date, exp.description || 'Dépense',
          fecAmount(amount), fecAmount(0),
          '', '', date, fecAmount(amount), 'EUR',
        ].join('\t')
      )

      // Deductible VAT (44566x)
      if (vatAmount > 0) {
        lines.push(
          [
            'HA', 'Journal des achats', num, date,
            '445660', 'TVA déductible', '', '',
            `DEP-${exp.id.slice(0, 8)}`, date, `TVA ${exp.description || 'Dépense'}`,
            fecAmount(vatAmount), fecAmount(0),
            '', '', date, fecAmount(vatAmount), 'EUR',
          ].join('\t')
        )
      }

      // Supplier credit line (401xxx)
      lines.push(
        [
          'HA', 'Journal des achats', num, date,
          '401000', 'Fournisseurs', '', exp.supplier || '',
          `DEP-${exp.id.slice(0, 8)}`, date, exp.description || 'Dépense',
          fecAmount(0), fecAmount(ttc),
          '', '', date, fecAmount(ttc), 'EUR',
        ].join('\t')
      )

      entryNum++
    }

    const fecContent = lines.join('\r\n')

    // Filename format: SirenFEC + YYYYMMDD
    const endDateClean = endDate.replace(/-/g, '')
    const filename = `${siren}FEC${endDateClean}.txt`

    response.header('Content-Type', 'text/plain; charset=UTF-8')
    response.header('Content-Disposition', `attachment; filename="${filename}"`)

    return response.send(fecContent)
  }
}
