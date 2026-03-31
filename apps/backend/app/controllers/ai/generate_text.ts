import type { HttpContext } from '@adonisjs/core/http'
import vine from '@vinejs/vine'
import AiService from '#services/ai/ai_service'
import { enforceQuota } from '#services/billing/quota_guard'
import quotaService from '#services/billing/quota_service'

const generateTextValidator = vine.compile(
  vine.object({
    type: vine.enum([
      'email_subject',
      'email_body',
      'invoice_subject',
      'invoice_notes',
      'invoice_line_description',
      'acceptance_conditions',
      'free_text',
    ]),
    context: vine.string().trim().maxLength(2000).optional(),
    language: vine.string().trim().maxLength(5).optional(),
  })
)

const PROMPTS: Record<string, string> = {
  email_subject: `Tu es un assistant de facturation français. Génère un sujet d'email professionnel et concis pour l'envoi d'un document commercial. Réponds UNIQUEMENT avec le sujet, sans guillemets, sans explication.`,
  email_body: `Tu es un assistant de facturation français. Génère le corps d'un email professionnel, poli et concis pour l'envoi d'un document commercial. Inclus une formule de politesse. Réponds UNIQUEMENT avec le texte de l'email, sans guillemets.`,
  invoice_subject: `Tu es un assistant de facturation français. Génère un objet de facture professionnel et descriptif basé sur le contexte donné. Réponds UNIQUEMENT avec l'objet, sans guillemets, sans explication. Maximum 100 caractères.`,
  invoice_notes: `Tu es un assistant de facturation français. Génère une note de bas de facture professionnelle basée sur le contexte. Réponds UNIQUEMENT avec la note, sans guillemets. Maximum 200 caractères.`,
  invoice_line_description: `Tu es un assistant de facturation français. Génère une description de ligne de facture professionnelle et claire. Réponds UNIQUEMENT avec la description, sans guillemets. Maximum 150 caractères.`,
  acceptance_conditions: `Tu es un assistant de facturation français. Génère des conditions d'acceptation professionnelles pour un devis ou une facture. Réponds UNIQUEMENT avec le texte, sans guillemets.`,
  free_text: `Tu es un assistant de facturation français. Génère un texte professionnel adapté au contexte de facturation donné. Réponds UNIQUEMENT avec le texte, sans guillemets.`,
}

export default class GenerateText {
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

    const blocked = await enforceQuota(user.id, response)
    if (blocked) return blocked

    const payload = await request.validateUsing(generateTextValidator)
    const systemPrompt = PROMPTS[payload.type] || PROMPTS.free_text
    const lang = payload.language || 'fr'
    const userPrompt = payload.context
      ? `Contexte: ${payload.context}\nLangue: ${lang}`
      : `Génère un texte approprié. Langue: ${lang}`

    try {
      const result = await AiService.generate(teamId, dek, systemPrompt, userPrompt, 512)
      await quotaService.recordUsage(user.id, teamId, 'generate_text', 'ai', 'default')
      return response.ok({ text: result.trim() })
    } catch (error: any) {
      return response.internalServerError({ message: 'AI generation failed', error: error.message })
    }
  }
}
