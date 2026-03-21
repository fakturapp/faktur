import type { HttpContext } from '@adonisjs/core/http'
import vine from '@vinejs/vine'
import AiService from '#services/ai/ai_service'
import Client from '#models/client/client'
import Company from '#models/team/company'
import { decryptModelFields, ENCRYPTED_FIELDS } from '#services/crypto/field_encryption_helper'

const generateDocumentValidator = vine.compile(
  vine.object({
    type: vine.enum(['invoice', 'quote']),
    prompt: vine.string().trim().minLength(5).maxLength(2000),
    clientId: vine.string().trim().optional(),
    provider: vine.enum(['claude', 'gemini', 'groq']).optional(),
    model: vine.string().trim().maxLength(100).optional(),
  })
)

export default class GenerateDocument {
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

    const payload = await request.validateUsing(generateDocumentValidator)

    // Load company info
    let companyContext = ''
    const company = await Company.findBy('teamId', teamId)
    if (company) {
      decryptModelFields(company, [...ENCRYPTED_FIELDS.company], dek)
      companyContext = `Entreprise émettrice: ${company.legalName || ''}, ${company.city || ''}`
    }

    // Load client info if provided
    let clientContext = ''
    if (payload.clientId) {
      const client = await Client.query()
        .where('id', payload.clientId)
        .where('teamId', teamId)
        .first()

      if (client) {
        decryptModelFields(client, [...ENCRYPTED_FIELDS.client], dek)
        const clientName = client.type === 'company'
          ? client.companyName
          : `${client.firstName || ''} ${client.lastName || ''}`.trim()
        clientContext = `Client: ${clientName}`
      }
    }

    const docType = payload.type === 'invoice' ? 'facture' : 'devis'

    const systemPrompt = `Tu es un assistant de facturation français expert. Génère un document complet de type ${docType} basé sur la description de l'utilisateur.

${companyContext}
${clientContext}

Réponds UNIQUEMENT en JSON valide avec cette structure exacte:
{
  "subject": "Objet du document",
  "lines": [
    {
      "description": "Description de la prestation",
      "quantity": 1,
      "unitPrice": 500.00,
      "vatRate": 20
    }
  ],
  "notes": "Notes optionnelles",
  "acceptanceConditions": "Conditions d'acceptation optionnelles"
}

Règles:
- L'objet (subject) doit être professionnel et descriptif (max 100 caractères)
- Les descriptions de lignes doivent être claires et détaillées
- Les prix doivent être réalistes et en euros
- Le taux de TVA standard est 20%, réduit 10% ou 5.5%
- Maximum 10 lignes
- Les notes et acceptanceConditions sont optionnels (chaîne vide si non pertinent)
- Réponds UNIQUEMENT avec le JSON, rien d'autre`

    try {
      const result = await ai.generate(
        teamId,
        dek,
        systemPrompt,
        payload.prompt,
        2048,
        payload.provider,
        payload.model,
      )

      // Parse JSON from response
      const jsonMatch = result.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        return response.badRequest({ message: 'Failed to parse AI response' })
      }

      const document = JSON.parse(jsonMatch[0])

      // Validate structure
      if (!document.subject || !Array.isArray(document.lines) || document.lines.length === 0) {
        return response.badRequest({ message: 'Invalid document structure from AI' })
      }

      return response.ok({ document })
    } catch (error: any) {
      return response.internalServerError({ message: 'AI generation failed', error: error.message })
    }
  }
}
