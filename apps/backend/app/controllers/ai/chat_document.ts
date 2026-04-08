import type { HttpContext } from '@adonisjs/core/http'
import vine from '@vinejs/vine'
import AiService from '#services/ai/ai_service'
import AiQuotaService from '#services/ai/ai_quota_service'

const chatDocumentValidator = vine.compile(
  vine.object({
    message: vine.string().trim().minLength(1).maxLength(2000),
    currentDocument: vine.object({
      subject: vine.string().trim().optional(),
      lines: vine.array(
        vine.object({
          description: vine.string().trim().optional(),
          quantity: vine.number(),
          unitPrice: vine.number(),
          vatRate: vine.number(),
        })
      ),
      notes: vine.string().trim().optional(),
      acceptanceConditions: vine.string().trim().optional(),
    }),
    clientContext: vine
      .object({
        name: vine.string().trim().optional(),
        siren: vine.string().trim().optional(),
        siret: vine.string().trim().optional(),
        vatNumber: vine.string().trim().optional(),
        address: vine.string().trim().optional(),
        email: vine.string().trim().optional(),
      })
      .optional(),
    type: vine.enum(['invoice', 'quote']),
    detailLevel: vine.enum(['rapide', 'complet']).optional(),
    provider: vine.enum(['groq']).optional(),
    model: vine.string().trim().maxLength(100).optional(),
    mode: vine.enum(['edition', 'question', 'libre']).optional(),
    source: vine.enum(['faktur', 'apikey']).optional(),
  })
)


interface ClientCtx {
  name?: string
  siren?: string
  siret?: string
  vatNumber?: string
  address?: string
  email?: string
}

function buildClientBlock(client?: ClientCtx): string {
  if (!client || !Object.values(client).some(Boolean)) return ''
  const parts: string[] = []
  if (client.name) parts.push(`- Nom du client : ${client.name}`)
  if (client.siren) parts.push(`- SIREN : ${client.siren}`)
  if (client.siret) parts.push(`- SIRET : ${client.siret}`)
  if (client.vatNumber) parts.push(`- N° TVA : ${client.vatNumber}`)
  if (client.address) parts.push(`- Adresse : ${client.address}`)
  if (client.email) parts.push(`- Email : ${client.email}`)
  return `\n\nContexte client :\n${parts.join('\n')}`
}

function buildDetailBlock(level?: string): string {
  if (!level) return ''
  if (level === 'rapide') {
    return `\n\nNiveau de détail : RAPIDE — Génère un document concis avec les lignes principales uniquement, sans trop de sous-détails.`
  }
  return `\n\nNiveau de détail : COMPLET — Génère un document détaillé avec des lignes précises, sous-éléments, descriptions complètes et mentions spécifiques.`
}

// ─── System Prompts per Mode ──────────────────────────────────────────

function buildEditionPrompt(
  docType: string,
  currentDoc: string,
  clientCtx?: ClientCtx,
  detailLevel?: string
): string {
  return `Tu es un assistant qui modifie un document de facturation français (${docType}). Voici le document actuel en JSON:

${currentDoc}${buildClientBlock(clientCtx)}${buildDetailBlock(detailLevel)}

L'utilisateur demande une modification. Applique la modification et retourne ta réponse dans le format JSON suivant:
{
  "message": "Description courte en markdown de ce que tu as modifié",
  "document": {
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
}

Règles:
- Conserve tous les champs non modifiés
- Applique uniquement les changements demandés par l'utilisateur
- Les prix doivent rester réalistes
- Le champ "message" doit être en markdown et décrire brièvement les changements effectués
- Réponds UNIQUEMENT avec le JSON, rien d'autre`
}

function buildQuestionPrompt(
  docType: string,
  currentDoc: string,
  clientCtx?: ClientCtx,
  detailLevel?: string
): string {
  return `Tu es un expert en facturation française et en conformité légale. Tu analyses des documents de type "${docType}".

Voici le document actuel:
${currentDoc}${buildClientBlock(clientCtx)}${buildDetailBlock(detailLevel)}

Tu dois répondre aux questions de l'utilisateur en respectant ces règles:

**Format de réponse (JSON obligatoire):**
{
  "message": "Ta réponse complète en markdown"
}

**Règles de réponse:**
- Utilise du **markdown structuré** avec titres, listes, tableaux si nécessaire
- Applique un système de **code couleur** pour la conformité:
  - 🟢 **Conforme** : L'élément respecte les règles et lois en vigueur
  - 🟡 **Attention** : L'élément nécessite une vérification ou est partiellement conforme
  - 🔴 **Non conforme** : L'élément ne respecte pas les règles légales
  - 🔵 **Information** : Conseil ou information complémentaire

- Cite les articles de loi ou règlements pertinents (Code de commerce, CGI, etc.)
- Structure ta réponse avec des sections claires
- Indique les mentions obligatoires manquantes le cas échéant
- Ne modifie JAMAIS le document, réponds uniquement à la question
- Réponds UNIQUEMENT avec le JSON, rien d'autre`
}

function buildLibrePrompt(
  docType: string,
  currentDoc: string,
  clientCtx?: ClientCtx,
  detailLevel?: string
): string {
  return `Tu es un assistant créatif pour les documents de facturation français (${docType}). Voici le document actuel:

${currentDoc}${buildClientBlock(clientCtx)}${buildDetailBlock(detailLevel)}

L'utilisateur te donne une instruction libre. Tu dois:
1. Exécuter la tâche demandée
2. Retourner les modifications proposées

**Format de réponse (JSON obligatoire):**
{
  "message": "Explication en markdown de ce que tu proposes",
  "document": {
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
  },
  "modifications": [
    {
      "content": "Description en markdown de chaque modification individuelle effectuée"
    }
  ]
}

Règles:
- Le champ "message" résume ce que tu as fait en markdown
- Le champ "modifications" liste chaque changement individuel en markdown (surligné)
- Le document doit refléter toutes les modifications appliquées
- Sois créatif tout en restant professionnel et réaliste
- Les prix doivent rester réalistes
- Réponds UNIQUEMENT avec le JSON, rien d'autre`
}


export default class ChatDocument {
  async handle(ctx: HttpContext) {
    const { auth, request, response } = ctx
    const dek: Buffer | undefined = (ctx as any).dek
    const user = auth.user!
    const teamId = user.currentTeamId

    if (!teamId) {
      return response.badRequest({ message: 'No team selected' })
    }

    if (!dek) {
      return response.status(423).send({ message: 'Vault is locked. Please re-authenticate.' })
    }

    if (!(await AiService.isEnabled(teamId))) {
      return response.forbidden({ message: 'AI is not enabled. Activate it in Settings > AI.' })
    }

    const quota = await AiQuotaService.checkQuota(teamId)
    if (!quota.allowed) {
      return response.tooManyRequests({
        message: 'Quota IA dépassé. Veuillez attendre avant de réessayer.',
        quota,
      })
    }

    const payload = await request.validateUsing(chatDocumentValidator)
    const mode = payload.mode || 'edition'
    const docType = payload.type === 'invoice' ? 'facture' : 'devis'
    const currentDoc = JSON.stringify(payload.currentDocument, null, 2)

    const clientCtx = payload.clientContext as ClientCtx | undefined
    const detailLevel = payload.detailLevel

    let systemPrompt: string
    switch (mode) {
      case 'question':
        systemPrompt = buildQuestionPrompt(docType, currentDoc, clientCtx, detailLevel)
        break
      case 'libre':
        systemPrompt = buildLibrePrompt(docType, currentDoc, clientCtx, detailLevel)
        break
      case 'edition':
      default:
        systemPrompt = buildEditionPrompt(docType, currentDoc, clientCtx, detailLevel)
        break
    }

    try {
      const result = await AiService.generate(
        teamId,
        dek,
        systemPrompt,
        payload.message,
        mode === 'question' ? 4096 : 2048,
        payload.provider,
        payload.model,
        payload.source as 'faktur' | 'apikey' | undefined
      )

      let cleaned = result.trim()
      if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?\s*```$/, '')
      }

      const jsonMatch = cleaned.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        return response.badRequest({
          message: 'Failed to parse AI response',
          detail: result.slice(0, 500),
        })
      }

      const parsed = JSON.parse(jsonMatch[0])

      await AiQuotaService.recordUsage(teamId, user.id, payload.model || 'default', 'chat-document')

      if (mode === 'question') {
        return response.ok({
          message: parsed.message || result,
        })
      }

      let doc = parsed.document || null
      if (!doc || !Array.isArray(doc.lines)) {
        if (Array.isArray(parsed.lines)) {
          doc = {
            subject: parsed.subject ?? '',
            lines: parsed.lines,
            notes: parsed.notes ?? '',
            acceptanceConditions: parsed.acceptanceConditions ?? '',
          }
        }
      }

      if (!doc || !Array.isArray(doc.lines) || doc.lines.length === 0) {
        return response.badRequest({
          message: 'Invalid document structure from AI',
          detail: JSON.stringify(parsed).slice(0, 500),
        })
      }

      doc.subject = typeof doc.subject === 'string' ? doc.subject : ''
      doc.notes = typeof doc.notes === 'string' ? doc.notes : ''
      doc.acceptanceConditions =
        typeof doc.acceptanceConditions === 'string' ? doc.acceptanceConditions : ''
      doc.lines = doc.lines
        .filter((l: any) => l && typeof l === 'object')
        .map((l: any) => ({
          description: typeof l.description === 'string' ? l.description : '',
          quantity: typeof l.quantity === 'number' && l.quantity > 0 ? l.quantity : 1,
          unitPrice: typeof l.unitPrice === 'number' ? l.unitPrice : 0,
          vatRate: typeof l.vatRate === 'number' ? l.vatRate : 20,
        }))

      if (doc.lines.length === 0) {
        return response.badRequest({
          message: 'Invalid document structure from AI',
          detail: JSON.stringify(parsed).slice(0, 500),
        })
      }

      const aiMessage = parsed.message || 'Document mis à jour.'

      if (mode === 'libre') {
        return response.ok({
          message: aiMessage,
          document: doc,
          modifications: parsed.modifications || [],
        })
      }

      return response.ok({
        message: aiMessage,
        document: doc,
      })
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

      return response.internalServerError({ message: 'AI chat failed', error: msg })
    }
  }
}
