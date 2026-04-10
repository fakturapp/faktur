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

    const systemPrompt = `Tu es Faktur AI, assistant expert en facturation intégré au logiciel Faktur. On te fournit l'historique de facturation d'un client et éventuellement une description de la nouvelle prestation à facturer.

## TA MISSION
Génère des lignes de facture pertinentes, cohérentes avec l'historique du client et la prestation décrite.

## FORMAT DE RÉPONSE — JSON STRICT
Réponds UNIQUEMENT avec un tableau JSON valide, sans texte avant ou après :
[
  {
    "description": "Description professionnelle et détaillée de la prestation",
    "quantity": 1,
    "unitPrice": 500.00,
    "vatRate": 20,
    "unit": "forfait"
  }
]

## RÈGLES
1. **Cohérence historique** : Si un historique existe, reprends les mêmes tarifs, TVA et style de description pour ce client
2. **Maximum 5 lignes** : Sois concis et pertinent
3. **Descriptions professionnelles** : Claires, détaillées, identifiant précisément chaque prestation
4. **Unités standards** : "forfait", "heure", "jour", "unité", "mois", "lot"
5. **TVA** : 20% par défaut, 10% restauration/rénovation, 5.5% alimentaire, 0% si exonéré
6. **Prix réalistes** : Cohérents avec le marché français et l'historique du client
7. **Sans historique** : Base-toi sur la description fournie avec des prix marché
8. **JSON uniquement** : Aucun texte hors du tableau JSON`

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
