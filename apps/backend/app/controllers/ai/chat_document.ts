import type { HttpContext } from '@adonisjs/core/http'
import vine from '@vinejs/vine'
import AiService from '#services/ai/ai_service'

const chatDocumentValidator = vine.compile(
  vine.object({
    message: vine.string().trim().minLength(1).maxLength(2000),
    currentDocument: vine.object({
      subject: vine.string().trim(),
      lines: vine.array(
        vine.object({
          description: vine.string().trim(),
          quantity: vine.number(),
          unitPrice: vine.number(),
          vatRate: vine.number(),
        })
      ),
      notes: vine.string().trim().optional(),
      acceptanceConditions: vine.string().trim().optional(),
    }),
    type: vine.enum(['invoice', 'quote']),
  })
)

export default class ChatDocument {
  async handle(ctx: HttpContext) {
    const { auth, request, response } = ctx
    const dek: Buffer = (ctx as any).dek
    const user = auth.user!
    const teamId = user.currentTeamId

    if (!teamId) {
      return response.badRequest({ message: 'No team selected' })
    }

    const ai = new AiService()

    if (!(await ai.isEnabled(teamId))) {
      return response.forbidden({ message: 'AI is not enabled. Activate it in Settings > AI.' })
    }

    const payload = await request.validateUsing(chatDocumentValidator)

    const docType = payload.type === 'invoice' ? 'facture' : 'devis'

    const systemPrompt = `Tu es un assistant qui modifie un document de facturation français (${docType}). Voici le document actuel en JSON:

${JSON.stringify(payload.currentDocument, null, 2)}

L'utilisateur demande une modification. Applique la modification et retourne le document modifié complet en JSON avec la même structure exacte:
{
  "subject": "Objet du document",
  "lines": [
    {
      "description": "Description",
      "quantity": 1,
      "unitPrice": 500.00,
      "vatRate": 20
    }
  ],
  "notes": "Notes",
  "acceptanceConditions": "Conditions"
}

Règles:
- Conserve tous les champs non modifiés
- Applique uniquement les changements demandés par l'utilisateur
- Les prix doivent rester réalistes
- Réponds UNIQUEMENT avec le JSON, rien d'autre`

    try {
      const result = await ai.generate(
        teamId,
        dek,
        systemPrompt,
        payload.message,
        2048
      )

      // Parse JSON from response
      const jsonMatch = result.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        return response.badRequest({ message: 'Failed to parse AI response' })
      }

      const document = JSON.parse(jsonMatch[0])

      if (!document.subject || !Array.isArray(document.lines)) {
        return response.badRequest({ message: 'Invalid document structure from AI' })
      }

      return response.ok({ document })
    } catch (error: any) {
      return response.internalServerError({ message: 'AI chat failed', error: error.message })
    }
  }
}
