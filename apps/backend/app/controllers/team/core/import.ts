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
import Invoice from '#models/invoice/invoice'
import InvoiceLine from '#models/invoice/invoice_line'
import Quote from '#models/quote/quote'
import QuoteLine from '#models/quote/quote_line'
import { decryptBuffer } from '#services/team/export_service'

export default class Import {
  async handle({ auth, request, response }: HttpContext) {
    const user = auth.user!

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
      return response.unprocessableEntity({ message: 'Le nom de l\'équipe est requis (min 2 caractères)' })
    }

    const decryptionPassword = request.input('decryptionPassword')

    // Read file buffer
    let buffer: Buffer<ArrayBuffer> = Buffer.from(readFileSync(file.tmpPath!))

    // Check if encrypted (.fpdata)
    const magic = buffer.subarray(0, 7).toString()
    if (magic === 'FPDATA1') {
      if (!decryptionPassword) {
        return response.unprocessableEntity({ message: 'Ce fichier est chiffré. Veuillez fournir un mot de passe.' })
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

    if (!metadata || !teamData) {
      return response.unprocessableEntity({ message: 'Format de fichier invalide : données manquantes' })
    }

    // Create team with all data in a transaction
    const team = await db.transaction(async (trx) => {
      // Create team
      const newTeam = await Team.create(
        { name: teamName, iconUrl: teamData.iconUrl || null, ownerId: user.id },
        { client: trx }
      )

      // Create team member (owner)
      await TeamMember.create(
        { teamId: newTeam.id, userId: user.id, role: 'super_admin', status: 'active' },
        { client: trx }
      )

      // Create company
      if (companyData) {
        await Company.create(
          { teamId: newTeam.id, ...companyData },
          { client: trx }
        )
      }

      // Create invoice settings
      if (settingsData) {
        await InvoiceSetting.create(
          { teamId: newTeam.id, ...settingsData },
          { client: trx }
        )
      }

      // Create clients and build ID mapping
      const clientIdMap: Record<string, string> = {}
      for (const clientData of clientsData) {
        const originalId = clientData.originalId
        const { originalId: _, ...rest } = clientData
        const newClient = await Client.create(
          { teamId: newTeam.id, ...rest },
          { client: trx }
        )
        if (originalId) {
          clientIdMap[originalId] = newClient.id
        }
      }

      // Create invoices with lines
      for (const invData of invoicesData) {
        const { lines, clientId, sourceQuoteId, ...rest } = invData
        const newInvoice = await Invoice.create(
          {
            teamId: newTeam.id,
            clientId: clientId ? (clientIdMap[clientId] || null) : null,
            sourceQuoteId: null, // Reset source quote reference
            ...rest,
          },
          { client: trx }
        )

        if (lines && lines.length > 0) {
          for (const line of lines) {
            await InvoiceLine.create(
              { invoiceId: newInvoice.id, ...line },
              { client: trx }
            )
          }
        }
      }

      // Create quotes with lines
      for (const qData of quotesData) {
        const { lines, clientId, ...rest } = qData
        const newQuote = await Quote.create(
          {
            teamId: newTeam.id,
            clientId: clientId ? (clientIdMap[clientId] || null) : null,
            ...rest,
          },
          { client: trx }
        )

        if (lines && lines.length > 0) {
          for (const line of lines) {
            await QuoteLine.create(
              { quoteId: newQuote.id, ...line },
              { client: trx }
            )
          }
        }
      }

      return newTeam
    })

    // Restore logo assets from ZIP
    const uploadsBase = join(app.tmpPath(), 'uploads')
    const assetDirs = ['team-icons', 'company-logos', 'invoice-logos'] as const

    for (const dir of assetDirs) {
      const prefix = `export/assets/${dir}/`
      const assetEntries = zip.getEntries().filter((e) => e.entryName.startsWith(prefix) && !e.isDirectory)

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
