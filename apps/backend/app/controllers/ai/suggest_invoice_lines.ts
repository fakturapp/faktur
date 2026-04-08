import type { HttpContext } from '@adonisjs/core/http'
import vine from '@vinejs/vine'
import Invoice from '#models/invoice/invoice'
import AiService from '#services/ai/ai_service'
import AiQuotaService from '#services/ai/ai_quota_service'
import {
  decryptModelFields,
  decryptModelFieldsArray,
  ENCRYPTED_FIELDS,
} from '#services/crypto/field_encryption_helper'

const suggestValidator = vine.compile(
  vine.object({
    clientId: vine.string().trim(),
    description: vine.string().trim().maxLength(500).optional(),
  })
)

export default class SuggestInvoiceLines {
  async handle(ctx: HttpContext) {
    const { auth, request, response } = ctx
    const dek: Buffer = (ctx as any).dek
    const user = auth.user!
    const teamId = user.currentTeamId

    if (!teamId) {
      return response.badRequest({ message: 'No team selected' })
    }

    if (!(await AiService.isEnabled(teamId))) {
      return response.forbidden({ message: 'AI is not enabled. Activate it in Settings > AI.' })
    }

    const quota = await AiQuotaService.checkQuota(teamId)
    if (!quota.allowed) {
      return response.tooManyRequests({ message: 'Quota IA dépassé.', quota })
    }

    const payload = await request.validateUsing(suggestValidator)

    const pastInvoices = await Invoice.query()
      .where('team_id', teamId)
      .where('client_id', payload.clientId)
      .whereNotIn('status', ['cancelled'])
      .orderBy('created_at', 'desc')
      .limit(5)
      .preload('lines')

    const historyLines: string[] = []
    for (const inv of pastInvoices) {
      decryptModelFields(inv, [...ENCRYPTED_FIELDS.invoice], dek)
      decryptModelFieldsArray(inv.lines, [...ENCRYPTED_FIELDS.invoiceLine], dek)
      for (const line of inv.lines) {
        historyLines.push(
          `- ${line.description || 'Sans description'} | ${line.quantity} x ${line.unitPrice}€ | TVA ${line.vatRate}%`
        )
      }
    }

    const historyContext =
      historyLines.length > 0
        ? `Historique des dernières factures pour ce client:\n${historyLines.slice(0, 15).join('\n')}`
        : 'Aucun historique de facturation pour ce client.'

    const userDescription = payload.description
      ? `\nDescription de la prestation à facturer: ${payload.description}`
      : ''

    const systemPrompt = `Tu es un assistant de facturation français expert. On te donne l'historique de facturation d'un client et éventuellement une description de la prestation. Génère des lignes de facture pertinentes.

Réponds UNIQUEMENT en JSON valide, un tableau d'objets avec cette structure:
[
  {
    "description": "Description de la ligne",
    "quantity": 1,
    "unitPrice": 500.00,
    "vatRate": 20,
    "unit": "forfait"
  }
]

Règles:
- Utilise les mêmes prix et TVA que l'historique si disponible
- Maximum 5 lignes
- Les descriptions doivent être professionnelles et claires
- Les unités courantes: "forfait", "heure", "jour", "unité", "mois"
- Si pas d'historique, génère des lignes basées sur la description fournie
- Réponds UNIQUEMENT avec le JSON, rien d'autre`

    try {
      const result = await AiService.generate(
        teamId,
        dek,
        systemPrompt,
        `${historyContext}${userDescription}`,
        1024
      )

      // Parse JSON from response
      const jsonMatch = result.match(/\[[\s\S]*\]/)
      if (!jsonMatch) {
        return response.ok({ lines: [] })
      }

      const lines = JSON.parse(jsonMatch[0])
      await AiQuotaService.recordUsage(teamId, user.id, 'default', 'suggest-invoice-lines')
      return response.ok({ lines })
    } catch (error: any) {
      return response.internalServerError({ message: 'AI suggestion failed', error: error.message })
    }
  }
}
