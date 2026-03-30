import type { HttpContext } from '@adonisjs/core/http'
import { randomUUID } from 'node:crypto'
import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { join, extname } from 'node:path'
import app from '@adonisjs/core/services/app'
import AdmZip from 'adm-zip'
import db from '@adonisjs/lucid/services/db'
import Team from '#models/team/team'
import TeamMember from '#models/team/team_member'
import Company from '#models/team/company'
import InvoiceSetting from '#models/team/invoice_setting'
import Client from '#models/client/client'
import ClientContact from '#models/client/client_contact'
import Invoice from '#models/invoice/invoice'
import InvoiceLine from '#models/invoice/invoice_line'
import InvoicePayment from '#models/invoice/invoice_payment'
import Quote from '#models/quote/quote'
import QuoteLine from '#models/quote/quote_line'
import Product from '#models/product/product'
import CreditNote from '#models/credit_note/credit_note'
import CreditNoteLine from '#models/credit_note/credit_note_line'
import RecurringInvoice from '#models/recurring_invoice/recurring_invoice'
import RecurringInvoiceLine from '#models/recurring_invoice/recurring_invoice_line'
import Expense from '#models/expense/expense'
import ExpenseCategory from '#models/expense/expense_category'
import EmailTemplate from '#models/email/email_template'
import PaymentReminderSetting from '#models/reminder/payment_reminder_setting'
import BankAccount from '#models/team/bank_account'
import { decryptBuffer } from '#services/team/export_service'
import zeroAccessCryptoService from '#services/crypto/zero_access_crypto_service'
import keyStore from '#services/crypto/key_store'
import { encryptModelFields, ENCRYPTED_FIELDS } from '#services/crypto/field_encryption_helper'

export default class Import {
  async handle(ctx: HttpContext) {
    const { auth, request, response } = ctx
    const user = auth.user!
    const kek = keyStore.getKEK(user.id)

    if (!kek) {
      return response.unauthorized({
        code: 'SESSION_EXPIRED',
        message: 'Session expired. Please log in again.',
      })
    }

    const file = request.file('file', {
      size: '50mb',
      extnames: ['zip', 'fpdata'],
    })

    if (!file) {
      return response.badRequest({ message: 'Aucun fichier fourni' })
    }

    if (!file.isValid) {
      return response.badRequest({ message: file.errors[0]?.message || 'Fichier invalide' })
    }

    const teamName = request.input('teamName')
    if (!teamName || teamName.length < 2) {
      return response.unprocessableEntity({
        message: "Le nom de l'équipe est requis (min 2 caractères)",
      })
    }

    const decryptionPassword = request.input('decryptionPassword')

    // Read file buffer
    let buffer: Buffer<ArrayBuffer> = Buffer.from(readFileSync(file.tmpPath!))

    // Check if encrypted (.fpdata)
    const magic = buffer.subarray(0, 7).toString()
    if (magic === 'FPDATA1') {
      if (!decryptionPassword) {
        return response.unprocessableEntity({
          message: 'Ce fichier est chiffré. Veuillez fournir un mot de passe.',
        })
      }
      try {
        buffer = Buffer.from(decryptBuffer(buffer, decryptionPassword))
      } catch {
        return response.unprocessableEntity({ message: 'Mot de passe de déchiffrement incorrect' })
      }
    }

    // Parse ZIP
    let zip: AdmZip
    try {
      zip = new AdmZip(buffer)
    } catch {
      return response.unprocessableEntity({ message: 'Fichier ZIP invalide' })
    }

    // Extract JSON files
    function readJson(path: string): any {
      const entry = zip.getEntry(path)
      if (!entry) return null
      try {
        return JSON.parse(entry.getData().toString('utf8'))
      } catch {
        return null
      }
    }

    const metadata = readJson('export/metadata.json')
    const teamData = readJson('export/team.json')
    const companyData = readJson('export/company.json')
    const clientsData = readJson('export/clients.json') || []
    const invoicesData = readJson('export/invoices.json') || []
    const quotesData = readJson('export/quotes.json') || []
    const settingsData = readJson('export/settings.json')
    const bankAccountsData = readJson('export/bank_accounts.json') || []
    const productsData = readJson('export/products.json') || []
    const creditNotesData = readJson('export/credit_notes.json') || []
    const recurringInvoicesData = readJson('export/recurring_invoices.json') || []
    const expenseCategoriesData = readJson('export/expense_categories.json') || []
    const expensesData = readJson('export/expenses.json') || []
    const invoicePaymentsData = readJson('export/invoice_payments.json') || []
    const clientContactsData = readJson('export/client_contacts.json') || []
    const emailTemplatesData = readJson('export/email_templates.json') || []
    const paymentReminderSettingsData = readJson('export/payment_reminder_settings.json') || []

    if (!metadata || !teamData) {
      return response.unprocessableEntity({
        message: 'Format de fichier invalide : données manquantes',
      })
    }

    // Generate a new team DEK for the imported team
    const teamDek = zeroAccessCryptoService.generateDEK()
    const encryptedTeamDek = zeroAccessCryptoService.encryptDEK(teamDek, kek)

    // Create team with all data in a transaction
    const team = await db.transaction(async (trx) => {
      // Create team
      const newTeam = await Team.create(
        { name: teamName, iconUrl: teamData.iconUrl || null, ownerId: user.id },
        { client: trx }
      )

      // Create team member (owner) with encrypted DEK
      await TeamMember.create(
        {
          teamId: newTeam.id,
          userId: user.id,
          role: 'super_admin',
          status: 'active',
          encryptedTeamDek,
          dekVersion: 1,
        },
        { client: trx }
      )

      // Create company (encrypt sensitive fields)
      if (companyData) {
        const cData: Record<string, any> = { teamId: newTeam.id, ...companyData }
        encryptModelFields(cData, [...ENCRYPTED_FIELDS.company], teamDek)
        await Company.create(cData, { client: trx })
      }

      // Create invoice settings (no encrypted fields)
      if (settingsData) {
        await InvoiceSetting.create({ teamId: newTeam.id, ...settingsData }, { client: trx })
      }

      // Create bank accounts (encrypt iban/bic)
      for (const baData of bankAccountsData) {
        const baRecord: Record<string, any> = {
          teamId: newTeam.id,
          label: baData.label,
          bankName: baData.bankName,
          iban: baData.iban,
          bic: baData.bic,
          isDefault: baData.isDefault ?? false,
        }
        encryptModelFields(baRecord, [...ENCRYPTED_FIELDS.bankAccount], teamDek)
        await BankAccount.create(baRecord, { client: trx })
      }

      // Create clients and build ID mapping (encrypt sensitive fields)
      const clientIdMap: Record<string, string> = {}
      for (const clientData2 of clientsData) {
        const { originalId, ...rest } = clientData2
        const clientRecord: Record<string, any> = { teamId: newTeam.id, ...rest }
        encryptModelFields(clientRecord, [...ENCRYPTED_FIELDS.client], teamDek)
        const newClient = await Client.create(clientRecord, { client: trx })
        if (originalId) {
          clientIdMap[originalId] = newClient.id
        }
      }

      // Create invoices with lines and build ID mapping (encrypt sensitive fields)
      const invoiceIdMap: Record<string, string> = {}
      for (const invData of invoicesData) {
        const { lines, clientId, sourceQuoteId, originalId, ...rest } = invData
        const invRecord: Record<string, any> = {
          teamId: newTeam.id,
          clientId: clientId ? clientIdMap[clientId] || null : null,
          sourceQuoteId: null,
          ...rest,
        }
        encryptModelFields(invRecord, [...ENCRYPTED_FIELDS.invoice], teamDek)
        const newInvoice = await Invoice.create(invRecord, { client: trx })
        if (originalId) {
          invoiceIdMap[originalId] = newInvoice.id
        }

        if (lines && lines.length > 0) {
          for (const line of lines) {
            const lineRecord: Record<string, any> = { invoiceId: newInvoice.id, ...line }
            encryptModelFields(lineRecord, [...ENCRYPTED_FIELDS.invoiceLine], teamDek)
            await InvoiceLine.create(lineRecord, { client: trx })
          }
        }
      }

      // Create quotes with lines (encrypt sensitive fields)
      for (const qData of quotesData) {
        const { lines, clientId, ...rest } = qData
        const qRecord: Record<string, any> = {
          teamId: newTeam.id,
          clientId: clientId ? clientIdMap[clientId] || null : null,
          ...rest,
        }
        encryptModelFields(qRecord, [...ENCRYPTED_FIELDS.quote], teamDek)
        const newQuote = await Quote.create(qRecord, { client: trx })

        if (lines && lines.length > 0) {
          for (const line of lines) {
            const lineRecord: Record<string, any> = { quoteId: newQuote.id, ...line }
            encryptModelFields(lineRecord, [...ENCRYPTED_FIELDS.quoteLine], teamDek)
            await QuoteLine.create(lineRecord, { client: trx })
          }
        }
      }

      // Create products (encrypt sensitive fields)
      for (const prodData of productsData) {
        const prodRecord: Record<string, any> = { teamId: newTeam.id, ...prodData }
        encryptModelFields(prodRecord, [...ENCRYPTED_FIELDS.product], teamDek)
        await Product.create(prodRecord, { client: trx })
      }

      // Create credit notes with lines (encrypt sensitive fields)
      for (const cnData of creditNotesData) {
        const { lines, clientId, sourceInvoiceId, ...rest } = cnData
        const cnRecord: Record<string, any> = {
          teamId: newTeam.id,
          clientId: clientId ? clientIdMap[clientId] || null : null,
          sourceInvoiceId: sourceInvoiceId ? invoiceIdMap[sourceInvoiceId] || null : null,
          ...rest,
        }
        encryptModelFields(cnRecord, [...ENCRYPTED_FIELDS.creditNote], teamDek)
        const newCreditNote = await CreditNote.create(cnRecord, { client: trx })

        if (lines && lines.length > 0) {
          for (const line of lines) {
            const lineRecord: Record<string, any> = { creditNoteId: newCreditNote.id, ...line }
            encryptModelFields(lineRecord, [...ENCRYPTED_FIELDS.creditNoteLine], teamDek)
            await CreditNoteLine.create(lineRecord, { client: trx })
          }
        }
      }

      // Create recurring invoices with lines (encrypt sensitive fields)
      for (const riData of recurringInvoicesData) {
        const { lines, clientId, bankAccountId, ...rest } = riData
        const riRecord: Record<string, any> = {
          teamId: newTeam.id,
          clientId: clientId ? clientIdMap[clientId] || null : null,
          bankAccountId: null,
          ...rest,
        }
        encryptModelFields(riRecord, [...ENCRYPTED_FIELDS.recurringInvoice], teamDek)
        const newRecurring = await RecurringInvoice.create(riRecord, { client: trx })

        if (lines && lines.length > 0) {
          for (const line of lines) {
            const lineRecord: Record<string, any> = {
              recurringInvoiceId: newRecurring.id,
              ...line,
            }
            encryptModelFields(lineRecord, [...ENCRYPTED_FIELDS.recurringInvoiceLine], teamDek)
            await RecurringInvoiceLine.create(lineRecord, { client: trx })
          }
        }
      }

      // Create expense categories and build ID mapping
      const expenseCategoryIdMap: Record<string, string> = {}
      for (const ecData of expenseCategoriesData) {
        const { originalId, ...rest } = ecData
        const newCategory = await ExpenseCategory.create(
          { teamId: newTeam.id, ...rest },
          { client: trx }
        )
        if (originalId) {
          expenseCategoryIdMap[originalId] = newCategory.id
        }
      }

      // Create expenses (encrypt sensitive fields)
      for (const expData of expensesData) {
        const { categoryId, ...rest } = expData
        const expRecord: Record<string, any> = {
          teamId: newTeam.id,
          categoryId: categoryId ? expenseCategoryIdMap[categoryId] || null : null,
          ...rest,
        }
        encryptModelFields(expRecord, [...ENCRYPTED_FIELDS.expense], teamDek)
        await Expense.create(expRecord, { client: trx })
      }

      // Create invoice payments (encrypt sensitive fields)
      for (const ipData of invoicePaymentsData) {
        const { invoiceId, ...rest } = ipData
        const ipRecord: Record<string, any> = {
          teamId: newTeam.id,
          invoiceId: invoiceId ? invoiceIdMap[invoiceId] || null : null,
          ...rest,
        }
        encryptModelFields(ipRecord, [...ENCRYPTED_FIELDS.invoicePayment], teamDek)
        await InvoicePayment.create(ipRecord, { client: trx })
      }

      // Create client contacts (encrypt sensitive fields)
      for (const ccData of clientContactsData) {
        const { clientId, ...rest } = ccData
        const ccRecord: Record<string, any> = {
          teamId: newTeam.id,
          clientId: clientId ? clientIdMap[clientId] || null : null,
          ...rest,
        }
        encryptModelFields(ccRecord, [...ENCRYPTED_FIELDS.clientContact], teamDek)
        await ClientContact.create(ccRecord, { client: trx })
      }

      // Create email templates (no encrypted fields)
      for (const etData of emailTemplatesData) {
        await EmailTemplate.create({ teamId: newTeam.id, ...etData }, { client: trx })
      }

      // Create payment reminder settings (no encrypted fields)
      for (const prsData of paymentReminderSettingsData) {
        await PaymentReminderSetting.create({ teamId: newTeam.id, ...prsData }, { client: trx })
      }

      return newTeam
    })

    // Store the new team DEK in memory
    keyStore.storeDEK(user.id, team.id, teamDek)

    // Restore logo assets from ZIP
    const uploadsBase = join(app.tmpPath(), 'uploads')
    const assetDirs = ['team-icons', 'company-logos', 'invoice-logos'] as const

    for (const dir of assetDirs) {
      const prefix = `export/assets/${dir}/`
      const assetEntries = zip
        .getEntries()
        .filter((e) => e.entryName.startsWith(prefix) && !e.isDirectory)

      for (const entry of assetEntries) {
        const ext = extname(entry.entryName) || '.png'
        const newFileName = `${team.id}-${randomUUID()}${ext}`
        const destDir = join(uploadsBase, dir)
        if (!existsSync(destDir)) {
          mkdirSync(destDir, { recursive: true })
        }
        writeFileSync(join(destDir, newFileName), entry.getData())

        const newUrl = `/${dir}/${newFileName}`

        // Update the corresponding model's URL
        if (dir === 'team-icons') {
          await Team.query().where('id', team.id).update({ iconUrl: newUrl })
        } else if (dir === 'company-logos') {
          await Company.query().where('teamId', team.id).update({ logoUrl: newUrl })
        } else if (dir === 'invoice-logos') {
          await InvoiceSetting.query().where('teamId', team.id).update({ logoUrl: newUrl })
        }
      }
    }

    // Switch user to the new team
    user.currentTeamId = team.id
    await user.save()

    return response.ok({
      message: 'Équipe importée avec succès',
      team: {
        id: team.id,
        name: team.name,
      },
    })
  }
}
