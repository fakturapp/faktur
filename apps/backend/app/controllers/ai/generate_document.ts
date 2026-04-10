import type { HttpContext } from '@adonisjs/core/http'
import vine from '@vinejs/vine'
import AiService from '#services/ai/ai_service'
import AiQuotaService from '#services/ai/ai_quota_service'
import Client from '#models/client/client'
import Company from '#models/team/company'
import { decryptModelFields, ENCRYPTED_FIELDS } from '#services/crypto/field_encryption_helper'

const generateDocumentValidator = vine.compile(
  vine.object({
    type: vine.enum(['invoice', 'quote']),
    prompt: vine.string().trim().minLength(5).maxLength(2000),
    clientId: vine.string().trim().optional(),
    provider: vine.enum(['gemini']).optional(),
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

    const quota = await AiQuotaService.checkQuota(teamId)
    if (!quota.allowed) {
      return response.tooManyRequests({ message: 'Quota IA dépassé.', quota })
    }

    const payload = await request.validateUsing(generateDocumentValidator)

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

    const systemPrompt = `Tu es **Faktur AI**, l'assistant intelligent de facturation intégré au logiciel Faktur. Tu es spécialisé dans la génération de documents commerciaux français professionnels, précis et conformes à la législation.

## CONTEXTE
- **Type de document** : ${docType}${companyContext}${clientContext}

## TA MISSION
Génère un document complet, professionnel et directement exploitable à partir de la description de l'utilisateur. Le document doit être prêt à être envoyé au client sans modification.

## FORMAT DE RÉPONSE — JSON STRICT
Réponds **UNIQUEMENT** avec un objet JSON valide. Aucun texte avant ou après. Aucun bloc markdown \`\`\`. Aucun commentaire.

{
  "subject": "Objet professionnel et descriptif (max 120 caractères)",
  "lines": [
    {
      "description": "Description détaillée et professionnelle de la prestation ou du produit",
      "quantity": 1,
      "unitPrice": 500.00,
      "vatRate": 20
    }
  ],
  "notes": "Notes de bas de page pertinentes (ou chaîne vide)",
  "acceptanceConditions": "Conditions d'acceptation (ou chaîne vide)"
}

## RÈGLES IMPÉRATIVES

### Structure du document
1. **subject** : Chaîne non vide, professionnelle et descriptive. Identifie clairement la nature de la prestation. Max 120 caractères.
2. **lines** : 1 à 15 lignes. Chaque ligne contient obligatoirement les 4 champs : description, quantity, unitPrice, vatRate.
   - **description** : Phrase complète, professionnelle, identifiant précisément la prestation. Utilise des tirets cadratins (—) pour séparer les sous-éléments.
   - **quantity** : Nombre > 0 (entier ou décimal)
   - **unitPrice** : Prix unitaire HT en euros (nombre décimal, ex: 500.00). DOIT être réaliste et cohérent avec le marché français.
   - **vatRate** : 20 (standard), 10 (restauration/rénovation/transport), 5.5 (alimentaire/énergie/travaux rénovation énergétique), 0 (exonéré — uniquement si explicitement demandé)
3. **notes** : Conditions de paiement, délais, mentions spécifiques. Chaîne vide "" si non pertinent.
4. **acceptanceConditions** : Pour les devis : validité de l'offre, engagement. Chaîne vide "" si non pertinent.

### Qualité
5. **Prix réalistes** : Les tarifs correspondent aux standards du marché français 2024-2025 pour le secteur concerné
6. **Granularité** : Décompose les prestations en lignes distinctes et compréhensibles
7. **Cohérence** : Toutes les lignes sont cohérentes entre elles et avec le sujet
8. **Langue** : Tout le contenu en français, vocabulaire professionnel et précis
9. **JSON uniquement** : Aucun texte hors du JSON

## EXEMPLE
{
  "subject": "Développement d'une application mobile iOS/Android",
  "lines": [
    { "description": "Design UX/UI — maquettes haute fidélité et prototypage interactif", "quantity": 1, "unitPrice": 2500.00, "vatRate": 20 },
    { "description": "Développement front-end React Native — écrans principaux et navigation", "quantity": 1, "unitPrice": 8000.00, "vatRate": 20 },
    { "description": "Intégration API back-end, authentification et base de données", "quantity": 1, "unitPrice": 4000.00, "vatRate": 20 },
    { "description": "Tests unitaires, recette fonctionnelle et déploiement App Store / Play Store", "quantity": 1, "unitPrice": 1500.00, "vatRate": 20 }
  ],
  "notes": "Paiement : 30% à la commande, 40% à la livraison, 30% à la recette finale. Délai estimé : 8 semaines.",
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

      let cleaned = result.trim()
      if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?\s*```$/, '')
      }

      const jsonMatch = cleaned.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        return response.badRequest({ message: 'Failed to parse AI response' })
      }

      const document = JSON.parse(jsonMatch[0])

      if (typeof document.subject !== 'string') {
        document.subject = ''
      }
      if (!Array.isArray(document.lines) || document.lines.length === 0) {
        return response.badRequest({ message: 'Invalid document structure from AI' })
      }

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

      document.notes = typeof document.notes === 'string' ? document.notes : ''
      document.acceptanceConditions =
        typeof document.acceptanceConditions === 'string' ? document.acceptanceConditions : ''

      await AiQuotaService.recordUsage(teamId, user.id, payload.model || 'default', 'generate-document')
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
