import { BaseCommand } from '@adonisjs/core/ace'
import { CommandOptions } from '@adonisjs/core/types/ace'

const UUID_LENGTH = 36

export default class StorageBackfill extends BaseCommand {
  static commandName = 'storage:backfill'
  static description =
    'Recompute team storage usage from existing Cloudflare R2 objects (logos, icons, payment-link PDFs).'

  static options: CommandOptions = {
    startApp: true,
  }

  async run() {
    const { randomUUID } = await import('node:crypto')
    const { default: r2StorageService } = await import('#services/storage/r2_storage_service')
    const { default: StorageFile } = await import('#models/storage/storage_file')
    const { default: Company } = await import('#models/team/company')
    const { default: InvoiceSetting } = await import('#models/team/invoice_setting')
    const { default: Team } = await import('#models/team/team')
    const { default: PaymentLink } = await import('#models/invoice/payment_link')

    const companies = await Company.query().select('teamId', 'logoUrl')
    const settings = await InvoiceSetting.query().select('teamId', 'logoUrl')
    const teams = await Team.query().select('id', 'iconUrl')
    const links = await PaymentLink.query().select('id', 'teamId', 'pdfStorageKey')

    const companyLogo = new Map(companies.map((c) => [c.teamId, c.logoUrl]))
    const invoiceLogo = new Map(settings.map((s) => [s.teamId, s.logoUrl]))
    const teamIcon = new Map(teams.map((t) => [t.id, t.iconUrl]))
    const linkById = new Map(links.map((l) => [l.id, l]))

    const singletons = [
      { prefix: 'company-logos/', category: 'company_logo' as const, active: companyLogo },
      { prefix: 'invoice-logos/', category: 'invoice_logo' as const, active: invoiceLogo },
      { prefix: 'team-icons/', category: 'team_icon' as const, active: teamIcon },
    ]

    let inserted = 0
    let updated = 0
    let skipped = 0

    const upsert = async (params: {
      teamId: string
      category: 'company_logo' | 'invoice_logo' | 'team_icon' | 'payment_link_pdf'
      objectKey: string
      publicUrl: string
      sizeBytes: number
      isOrphaned: boolean
    }) => {
      const existing = await StorageFile.findBy('objectKey', params.objectKey)
      if (existing) {
        existing.teamId = params.teamId
        existing.category = params.category
        existing.publicUrl = params.publicUrl
        existing.sizeBytes = params.sizeBytes
        existing.isOrphaned = params.isOrphaned
        await existing.save()
        updated++
        return
      }
      await StorageFile.create({
        id: randomUUID(),
        teamId: params.teamId,
        category: params.category,
        objectKey: params.objectKey,
        publicUrl: params.publicUrl,
        sizeBytes: params.sizeBytes,
        contentType: null,
        originalName: null,
        isOrphaned: params.isOrphaned,
      })
      inserted++
    }

    for (const def of singletons) {
      const objects = await r2StorageService.listObjects(def.prefix)
      for (const obj of objects) {
        const fileName = obj.key.slice(def.prefix.length)
        const teamId = fileName.slice(0, UUID_LENGTH)
        if (teamId.length < UUID_LENGTH) {
          skipped++
          continue
        }
        const publicUrl = r2StorageService.getPublicUrl(obj.key)
        const activeUrl = def.active.get(teamId) ?? null
        await upsert({
          teamId,
          category: def.category,
          objectKey: obj.key,
          publicUrl,
          sizeBytes: obj.size,
          isOrphaned: activeUrl !== publicUrl,
        })
      }
    }

    const pdfObjects = await r2StorageService.listObjects('payment-links/')
    for (const obj of pdfObjects) {
      const rest = obj.key.slice('payment-links/'.length)
      const linkId = rest.split('/')[0]
      const link = linkById.get(linkId)
      if (!link) {
        skipped++
        continue
      }
      const publicUrl = r2StorageService.getPublicUrl(obj.key)
      await upsert({
        teamId: link.teamId,
        category: 'payment_link_pdf',
        objectKey: obj.key,
        publicUrl,
        sizeBytes: obj.size,
        isOrphaned: link.pdfStorageKey !== publicUrl,
      })
    }

    this.logger.info(
      `Storage backfill complete: ${inserted} inserted, ${updated} updated, ${skipped} skipped.`
    )
  }
}
