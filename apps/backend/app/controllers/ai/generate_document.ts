import type { HttpContext } from '@adonisjs/core/http'
import vine from '@vinejs/vine'
import AiService from '#services/ai/ai_service'
import { enforceQuota } from '#services/billing/quota_guard'
import quotaService from '#services/billing/quota_service'
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

    if (!(await AiService.isEnabled(teamId))) {
      return response.forbidden({ message: 'AI is not enabled. Activate it in Settings > AI.' })
    }

    const blocked = await enforceQuota(user.id, response)
    if (blocked) return blocked

    const payload = await request.validateUsing(generateDocumentValidator)

    // Load company info
    let companyContext = ''
    const company = await Company.findBy('teamId', teamId)
    if (company) {
      decryptModelFields(company, [...ENCRYPTED_FIELDS.company], dek)
      const parts: string[] = []
      if (company.legalName) parts.push(`Raison sociale : ${company.legalName}`)
      if (company.legalForm) parts.push(`Forme juridique : ${company.legalForm}`)
      if (company.city) parts.push(`Ville : ${company.city}`)
      if (company.country) parts.push(`Pays : ${company.country}`)
      if (parts.length > 0)
        companyContext = `\nEntreprise émettrice :\n${parts.map((p) => `- ${p}`).join('\n')}`
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
        const parts: string[] = []
        if (client.type === 'company') {
          if (client.companyName) parts.push(`Entreprise : ${client.companyName}`)
          if (client.siren) parts.push(`SIREN : ${client.siren}`)
          if (client.siret) parts.push(`SIRET : ${client.siret}`)
          if (client.vatNumber) parts.push(`N° TVA : ${client.vatNumber}`)
        } else {
          const name = `${client.firstName || ''} ${client.lastName || ''}`.trim()
          if (name) parts.push(`Nom : ${name}`)
        }
        if (client.email) parts.push(`Email : ${client.email}`)
        if (client.address) parts.push(`Adresse : ${client.address}`)
        if (client.city) parts.push(`Ville : ${client.city}`)
        if (parts.length > 0)
          clientContext = `\nClient destinataire :\n${parts.map((p) => `- ${p}`).join('\n')}`
      }
    }

    const docType = payload.type === 'invoice' ? 'facture' : 'devis'

    const systemPrompt = `Tu es Faktur AI, un assistant expert en facturation et devis français. Tu génères des documents professionnels, précis et conformes à la législation française.

CONTEXTE :
- Type de document : ${docType}${companyContext}${clientContext}

MISSION :
Génère un document complet basé sur la description de l'utilisateur. Le résultat doit être directement exploitable.

FORMAT DE RÉPONSE — JSON STRICT :
Tu dois répondre UNIQUEMENT avec un objet JSON valide, sans aucun texte avant ou après, sans bloc de code markdown (\`\`\`), sans commentaire, sans explication.

Voici la structure EXACTE attendue :
{
  "subject": "string — Objet professionnel du document (max 120 caractères)",
  "lines": [
    {
      "description": "string — Description claire de la prestation ou du produit",
      "quantity": 1,
      "unitPrice": 100.00,
      "vatRate": 20
    }
  ],
  "notes": "string — Notes de bas de page (ou chaîne vide \"\")",
  "acceptanceConditions": "string — Conditions d'acceptation (ou chaîne vide \"\")"
}

RÈGLES IMPÉRATIVES :
1. **JSON uniquement** : Aucun texte hors du JSON. Pas de \`\`\`json, pas de commentaires, pas d'explication.
2. **subject** : Toujours une chaîne non vide. Professionnel, descriptif, max 120 caractères. Exemples : "Création de site web e-commerce", "Prestation de conseil en marketing digital".
3. **lines** : Tableau de 1 à 15 lignes. Chaque ligne DOIT avoir les 4 champs (description, quantity, unitPrice, vatRate).
   - description : Claire et détaillée, décrivant précisément la prestation ou le produit
   - quantity : Nombre entier ou décimal > 0
   - unitPrice : Prix unitaire HT en euros, nombre décimal (ex: 500.00). DOIT être réaliste et cohérent avec la prestation décrite
   - vatRate : Taux de TVA en pourcentage. Valeurs courantes : 20 (standard), 10 (intermédiaire), 5.5 (réduit), 0 (exonéré)
4. **notes** : Informations complémentaires (conditions de paiement, délais, mentions). Chaîne vide "" si non pertinent.
5. **acceptanceConditions** : Conditions contractuelles d'acceptation. Chaîne vide "" si non pertinent.
6. **Prix réalistes** : Les tarifs doivent correspondre aux standards du marché français pour le type de prestation décrit.
7. **TVA** : Applique le taux de TVA 20% par défaut. Utilise 10% pour la restauration/rénovation, 5.5% pour l'alimentaire/énergétique, 0% uniquement si l'utilisateur le demande explicitement.
8. **Langue** : Tout le contenu DOIT être en français.

EXEMPLE DE RÉPONSE VALIDE :
{
  "subject": "Développement d'une application mobile iOS/Android",
  "lines": [
    { "description": "Design UX/UI — maquettes et prototypage interactif", "quantity": 1, "unitPrice": 2500.00, "vatRate": 20 },
    { "description": "Développement front-end React Native", "quantity": 1, "unitPrice": 8000.00, "vatRate": 20 },
    { "description": "Intégration API back-end et base de données", "quantity": 1, "unitPrice": 4000.00, "vatRate": 20 },
    { "description": "Tests, recette et déploiement stores", "quantity": 1, "unitPrice": 1500.00, "vatRate": 20 }
  ],
  "notes": "Paiement : 30% à la commande, 40% à la livraison, 30% à la recette finale.",
  "acceptanceConditions": ""
}`

    try {
      const result = await AiService.generate(
        teamId,
        dek,
        systemPrompt,
        payload.prompt,
        2048,
        payload.provider,
        payload.model
      )

      // Parse JSON from response — strip markdown code fences if present
      let cleaned = result.trim()
      if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?\s*```$/, '')
      }

      const jsonMatch = cleaned.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        return response.badRequest({ message: 'Failed to parse AI response' })
      }

      const document = JSON.parse(jsonMatch[0])

      // Validate structure — subject can be empty string if user requested it
      if (typeof document.subject !== 'string') {
        document.subject = ''
      }
      if (!Array.isArray(document.lines) || document.lines.length === 0) {
        return response.badRequest({ message: 'Invalid document structure from AI' })
      }

      // Sanitize lines
      document.lines = document.lines
        .filter((l: any) => l && typeof l.description === 'string')
        .map((l: any) => ({
          description: String(l.description || '').trim(),
          quantity: typeof l.quantity === 'number' && l.quantity > 0 ? l.quantity : 1,
          unitPrice: typeof l.unitPrice === 'number' ? l.unitPrice : 0,
          vatRate: typeof l.vatRate === 'number' ? l.vatRate : 20,
        }))

      if (document.lines.length === 0) {
        return response.badRequest({ message: 'Invalid document structure from AI' })
      }

      // Ensure notes and acceptanceConditions are strings
      document.notes = typeof document.notes === 'string' ? document.notes : ''
      document.acceptanceConditions =
        typeof document.acceptanceConditions === 'string' ? document.acceptanceConditions : ''

      await quotaService.recordUsage(user.id, teamId, 'generate_document', 'ai', 'default')
      return response.ok({ document })
    } catch (error: any) {
      const msg = error.message || 'Unknown error'

      if (msg.includes('clé API') || msg.includes('API key') || msg.includes('No API key')) {
        return response.badRequest({ message: msg })
      }

      if (msg.includes('API error')) {
        return response
          .status(502)
          .send({ message: 'Le service IA est temporairement indisponible.', error: msg })
      }

      return response.internalServerError({ message: 'AI generation failed', error: msg })
    }
  }
}
