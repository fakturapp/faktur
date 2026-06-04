import { randomUUID } from 'node:crypto'
import db from '@adonisjs/lucid/services/db'
import StorageFile, { type StorageCategory } from '#models/storage/storage_file'
import Company from '#models/team/company'
import InvoiceSetting from '#models/team/invoice_setting'
import Team from '#models/team/team'
import PaymentLink from '#models/invoice/payment_link'
import r2StorageService from '#services/storage/r2_storage_service'

export type PlanId = 'free' | 'pro' | 'team'

export const QUOTA_BYTES: Record<PlanId, number> = {
  free: 10 * 1024 * 1024,
  pro: 100 * 1024 * 1024,
  team: 20 * 1024 * 1024 * 1024,
}

export const DOC_BASE_BYTES = 25 * 1024
export const DOC_PER_LINE_BYTES = 2 * 1024

const SINGLETON_CATEGORIES: StorageCategory[] = ['company_logo', 'invoice_logo', 'team_icon']

const DOCUMENT_DEFS = [
  {
    type: 'invoice',
    label: 'Factures',
    table: 'invoices',
    lineTable: 'invoice_lines',
    fk: 'invoice_id',
  },
  { type: 'quote', label: 'Devis', table: 'quotes', lineTable: 'quote_lines', fk: 'quote_id' },
  {
    type: 'credit_note',
    label: 'Avoirs',
    table: 'credit_notes',
    lineTable: 'credit_note_lines',
    fk: 'credit_note_id',
  },
  {
    type: 'recurring',
    label: 'Factures récurrentes',
    table: 'recurring_invoices',
    lineTable: 'recurring_invoice_lines',
    fk: 'recurring_invoice_id',
  },
] as const

export interface StorageUsage {
  fileBytes: number
  docBytes: number
  totalBytes: number
  quotaBytes: number
  percent: number
  isOver: boolean
  plan: PlanId
  documents: DocCategoryUsage[]
}

export interface StorageFileEntry {
  id: string
  category: StorageCategory
  objectKey: string
  publicUrl: string
  sizeBytes: number
  contentType: string | null
  originalName: string | null
  isActive: boolean
  createdAt: string | null
}

export interface DocCategoryUsage {
  type: string
  label: string
  count: number
  bytes: number
}

class StorageService {
  async recordUpload(
    teamId: string,
    category: StorageCategory,
    objectKey: string,
    publicUrl: string,
    sizeBytes: number,
    contentType?: string | null,
    originalName?: string | null
  ): Promise<StorageFile> {
    if (SINGLETON_CATEGORIES.includes(category)) {
      await StorageFile.query()
        .where('teamId', teamId)
        .where('category', category)
        .where('isOrphaned', false)
        .update({ is_orphaned: true, updated_at: new Date() })
    }

    return StorageFile.create({
      id: randomUUID(),
      teamId,
      category,
      objectKey,
      publicUrl,
      sizeBytes,
      contentType: contentType ?? null,
      originalName: originalName ?? null,
      isOrphaned: false,
    })
  }

  async reconcileActiveFiles(teamId: string): Promise<void> {
    const [company, invoiceSetting, team] = await Promise.all([
      Company.findBy('teamId', teamId),
      InvoiceSetting.findBy('teamId', teamId),
      Team.find(teamId),
    ])

    const refs: { url: string | null; category: StorageCategory }[] = [
      { url: company?.logoUrl ?? null, category: 'company_logo' },
      { url: invoiceSetting?.logoUrl ?? null, category: 'invoice_logo' },
      { url: team?.iconUrl ?? null, category: 'team_icon' },
    ]

    for (const ref of refs) {
      if (!ref.url) continue
      const objectKey = r2StorageService.keyFromUrl(ref.url)
      if (!objectKey) continue

      const existing = await StorageFile.findBy('objectKey', objectKey)
      if (existing) continue

      const head = await r2StorageService.headObject(objectKey)
      if (!head) continue

      await StorageFile.create({
        id: randomUUID(),
        teamId,
        category: ref.category,
        objectKey,
        publicUrl: ref.url,
        sizeBytes: head.size,
        contentType: head.contentType ?? null,
        originalName: null,
        isOrphaned: false,
      })
    }
  }

  async purgeByPublicUrl(teamId: string, url: string | null | undefined): Promise<void> {
    if (!url) return

    try {
      await r2StorageService.delete(url)
    } catch {}

    const objectKey = r2StorageService.keyFromUrl(url)
    const query = StorageFile.query().where('teamId', teamId)
    if (objectKey) query.where('objectKey', objectKey)
    else query.where('publicUrl', url)
    await query.delete()
  }

  async fileBytes(teamId: string): Promise<number> {
    const row = await db
      .from('storage_files')
      .where('team_id', teamId)
      .sum('size_bytes as total')
      .first()
    return Number(row?.total ?? 0)
  }

  async docBreakdown(teamId: string): Promise<DocCategoryUsage[]> {
    const breakdown: DocCategoryUsage[] = []
    for (const def of DOCUMENT_DEFS) {
      const docRow = await db.from(def.table).where('team_id', teamId).count('* as total').first()
      const lineRow = await db
        .from(def.lineTable)
        .join(def.table, `${def.table}.id`, `${def.lineTable}.${def.fk}`)
        .where(`${def.table}.team_id`, teamId)
        .count('* as total')
        .first()
      const count = Number(docRow?.total ?? 0)
      const lineCount = Number(lineRow?.total ?? 0)
      breakdown.push({
        type: def.type,
        label: def.label,
        count,
        bytes: count * DOC_BASE_BYTES + lineCount * DOC_PER_LINE_BYTES,
      })
    }
    return breakdown
  }

  async usage(teamId: string, plan: PlanId): Promise<StorageUsage> {
    const [fileBytes, documents] = await Promise.all([
      this.fileBytes(teamId),
      this.docBreakdown(teamId),
    ])
    const docBytes = documents.reduce((sum, def) => sum + def.bytes, 0)
    const totalBytes = fileBytes + docBytes
    const quotaBytes = QUOTA_BYTES[plan] ?? QUOTA_BYTES.free
    const percent =
      quotaBytes > 0 ? Math.min(100, Math.round((totalBytes / quotaBytes) * 1000) / 10) : 0
    return {
      fileBytes,
      docBytes,
      totalBytes,
      quotaBytes,
      percent,
      isOver: totalBytes >= quotaBytes,
      plan,
      documents,
    }
  }

  async isOverQuota(teamId: string, plan: PlanId): Promise<boolean> {
    const usage = await this.usage(teamId, plan)
    return usage.isOver
  }

  async listFiles(teamId: string): Promise<StorageFileEntry[]> {
    const [files, company, invoiceSetting, team] = await Promise.all([
      StorageFile.query().where('teamId', teamId).orderBy('created_at', 'desc'),
      Company.findBy('teamId', teamId),
      InvoiceSetting.findBy('teamId', teamId),
      Team.find(teamId),
    ])

    const activeUrls = new Set(
      [company?.logoUrl, invoiceSetting?.logoUrl, team?.iconUrl].filter(Boolean) as string[]
    )

    return files.map((f) => ({
      id: f.id,
      category: f.category,
      objectKey: f.objectKey,
      publicUrl: f.publicUrl,
      sizeBytes: Number(f.sizeBytes),
      contentType: f.contentType,
      originalName: f.originalName,
      isActive: f.category === 'payment_link_pdf' ? !f.isOrphaned : activeUrls.has(f.publicUrl),
      createdAt: f.createdAt?.toISO() ?? null,
    }))
  }

  async deleteFile(teamId: string, fileId: string): Promise<boolean> {
    const file = await StorageFile.query().where('id', fileId).where('teamId', teamId).first()
    if (!file) return false

    try {
      await r2StorageService.delete(file.objectKey)
    } catch {}

    if (file.category === 'company_logo') {
      const company = await Company.findBy('teamId', teamId)
      if (company && company.logoUrl === file.publicUrl) {
        company.logoUrl = null
        await company.save()
      }
    } else if (file.category === 'invoice_logo') {
      const setting = await InvoiceSetting.findBy('teamId', teamId)
      if (setting && setting.logoUrl === file.publicUrl) {
        setting.logoUrl = null
        await setting.save()
      }
    } else if (file.category === 'team_icon') {
      const team = await Team.find(teamId)
      if (team && team.iconUrl === file.publicUrl) {
        team.iconUrl = null
        await team.save()
      }
    } else if (file.category === 'payment_link_pdf') {
      const link = await PaymentLink.query().where('pdf_storage_key', file.publicUrl).first()
      if (link) {
        link.pdfStorageKey = null
        await link.save()
      }
    }

    await file.delete()
    return true
  }
}

export default new StorageService()
