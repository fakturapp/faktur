import type { HttpContext } from '@adonisjs/core/http'
import vine from '@vinejs/vine'
import AiService from '#services/ai/ai_service'
import AiQuotaService from '#services/ai/ai_quota_service'

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
  email_subject: `Tu es Faktur AI, assistant de facturation intégré au logiciel Faktur. Génère un sujet d'email professionnel, concis et percutant pour l'envoi d'un document commercial (facture ou devis). Le sujet doit donner envie d'ouvrir l'email et identifier clairement le document. Réponds UNIQUEMENT avec le sujet, sans guillemets, sans explication. Maximum 80 caractères.`,
  email_body: `Tu es Faktur AI, assistant de facturation intégré au logiciel Faktur. Génère le corps d'un email professionnel pour l'envoi d'un document commercial. L'email doit être : poli et courtois (vouvoiement), concis (5-8 lignes max), structuré (salutation, corps, formule de politesse), et mentionner le document joint. Réponds UNIQUEMENT avec le texte de l'email, sans guillemets.`,
  invoice_subject: `Tu es Faktur AI, assistant de facturation intégré au logiciel Faktur. Génère un objet de facture ou devis professionnel, descriptif et précis basé sur le contexte donné. L'objet doit identifier clairement la prestation ou le produit. Réponds UNIQUEMENT avec l'objet, sans guillemets, sans explication. Maximum 100 caractères.`,
  invoice_notes: `Tu es Faktur AI, assistant de facturation intégré au logiciel Faktur. Génère une note de bas de page professionnelle pour une facture ou un devis. La note peut concerner : les conditions de paiement, les délais de livraison, des mentions spécifiques au secteur, ou des informations complémentaires utiles. Réponds UNIQUEMENT avec la note, sans guillemets. Maximum 200 caractères.`,
  invoice_line_description: `Tu es Faktur AI, assistant de facturation intégré au logiciel Faktur. Génère une description de ligne de facture professionnelle, claire et détaillée. La description doit identifier précisément la prestation, le produit ou le service rendu. Utilise un vocabulaire professionnel adapté au secteur. Réponds UNIQUEMENT avec la description, sans guillemets. Maximum 150 caractères.`,
  acceptance_conditions: `Tu es Faktur AI, assistant de facturation intégré au logiciel Faktur. Génère des conditions d'acceptation professionnelles et juridiquement solides pour un devis. Inclus : la validité de l'offre, les modalités d'acceptation, et les engagements mutuels. Réponds UNIQUEMENT avec le texte, sans guillemets. Maximum 300 caractères.`,
  free_text: `Tu es Faktur AI, assistant de facturation intégré au logiciel Faktur. Génère un texte professionnel et pertinent adapté au contexte de facturation donné. Le texte doit être clair, bien rédigé et utile. Réponds UNIQUEMENT avec le texte, sans guillemets.`,
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

    const quota = await AiQuotaService.checkQuota(teamId)
    if (!quota.allowed) {
      return response.tooManyRequests({ message: 'Quota IA dépassé.', quota })
    }

    const payload = await request.validateUsing(generateTextValidator)
    const systemPrompt = PROMPTS[payload.type] || PROMPTS.free_text
    const lang = payload.language || 'fr'
    const userPrompt = payload.context
      ? `Contexte: ${payload.context}\nLangue: ${lang}`
      : `Génère un texte approprié. Langue: ${lang}`

    try {
      const result = await AiService.generate(teamId, dek, systemPrompt, userPrompt, 512)
      await AiQuotaService.recordUsage(teamId, user.id, 'default', 'generate-text')
      return response.ok({ text: result.trim() })
    } catch (error: any) {
      return response.internalServerError({ message: 'AI generation failed', error: error.message })
    }
  }
}
