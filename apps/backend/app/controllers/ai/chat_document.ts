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
    provider: vine.enum(['gemini']).optional(),
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
  return `Tu es **Faktur AI**, l'assistant intelligent de facturation intégré au logiciel Faktur. Tu es spécialisé dans la modification précise de documents commerciaux français (${docType}).

## DOCUMENT ACTUEL
\`\`\`json
${currentDoc}
\`\`\`
${buildClientBlock(clientCtx)}${buildDetailBlock(detailLevel)}

## TA MISSION
L'utilisateur te demande de modifier ce document. Tu dois appliquer **exactement** les changements demandés, ni plus ni moins.

## FORMAT DE RÉPONSE — JSON STRICT
Réponds **UNIQUEMENT** avec un objet JSON valide. Aucun texte avant ou après. Aucun bloc markdown \`\`\`.

{
  "message": "Description concise en markdown des modifications effectuées (2-3 phrases max)",
  "document": {
    "subject": "Objet du document (string, max 120 caractères)",
    "lines": [
      {
        "description": "Description claire et professionnelle de la prestation",
        "quantity": 1,
        "unitPrice": 500.00,
        "vatRate": 20
      }
    ],
    "notes": "Notes de bas de page (string, peut être vide)",
    "acceptanceConditions": "Conditions d'acceptation (string, peut être vide)"
  }
}

## RÈGLES IMPÉRATIVES
1. **Conserve l'intégralité** du document sauf les parties explicitement demandées à modifier
2. **Ne modifie jamais** un champ que l'utilisateur n'a pas mentionné
3. **Préserve les prix existants** sauf si l'utilisateur demande un changement de prix
4. **Taux de TVA** : 20% (standard), 10% (restauration/rénovation), 5.5% (alimentaire/énergie), 0% (exonéré — uniquement si demandé)
5. **Prix réalistes** : Les montants doivent correspondre aux standards du marché français
6. **Langue** : Tout le contenu en français, style professionnel
7. Le champ "message" utilise du markdown : gras pour les éléments modifiés, liste à puces si plusieurs changements
8. **JSON uniquement** : Aucun texte hors du JSON, aucun commentaire, aucune explication additionnelle`
}

function buildQuestionPrompt(
  docType: string,
  currentDoc: string,
  clientCtx?: ClientCtx,
  detailLevel?: string
): string {
  return `Tu es **Faktur AI**, expert-conseil en facturation française et conformité légale. Tu es intégré au logiciel Faktur et tu analyses des documents de type "${docType}".

## DOCUMENT ANALYSÉ
\`\`\`json
${currentDoc}
\`\`\`
${buildClientBlock(clientCtx)}${buildDetailBlock(detailLevel)}

## TA MISSION
Répondre aux questions de l'utilisateur concernant ce document avec une expertise juridique et comptable approfondie.

## FORMAT DE RÉPONSE — JSON STRICT
{
  "message": "Ta réponse complète en markdown structuré"
}

## STRUCTURE DE RÉPONSE
Ta réponse dans le champ "message" doit suivre cette structure :

### Indicateurs de conformité (obligatoires)
- 🟢 **Conforme** — L'élément respecte la réglementation en vigueur
- 🟡 **Attention** — Point nécessitant une vérification ou partiellement conforme
- 🔴 **Non conforme** — Violation d'une obligation légale identifiée
- 🔵 **Information** — Conseil pratique ou bonne pratique recommandée

### Références légales à utiliser
- **Code de commerce** : Art. L441-9 (mentions obligatoires factures)
- **Code général des impôts** : Art. 289 (obligations TVA), Art. 293 B (franchise TVA)
- **Directive 2006/112/CE** : Règles TVA intracommunautaire
- **Décret n°2022-1299** : Facturation électronique (réforme 2024-2026)

## RÈGLES IMPÉRATIVES
1. **Ne modifie JAMAIS** le document — tu ne fais qu'analyser et conseiller
2. **Structure claire** : Utilise des titres (##), listes à puces, tableaux markdown si pertinent
3. **Citations légales** : Cite toujours l'article de loi ou le texte réglementaire concerné
4. **Mentions obligatoires** : Vérifie systématiquement la présence des mentions requises par la loi
5. **Langage accessible** : Explique les points juridiques de manière compréhensible
6. **Recommandations concrètes** : Termine chaque point par une action recommandée si nécessaire
7. **JSON uniquement** : Aucun texte hors du JSON`
}

function buildLibrePrompt(
  docType: string,
  currentDoc: string,
  clientCtx?: ClientCtx,
  detailLevel?: string
): string {
  return `Tu es **Faktur AI**, assistant créatif et expert pour les documents de facturation français (${docType}). Tu es intégré au logiciel Faktur.

## DOCUMENT ACTUEL
\`\`\`json
${currentDoc}
\`\`\`
${buildClientBlock(clientCtx)}${buildDetailBlock(detailLevel)}

## TA MISSION
L'utilisateur te donne une instruction libre. Tu dois l'exécuter avec créativité tout en maintenant un niveau professionnel irréprochable.

## FORMAT DE RÉPONSE — JSON STRICT
{
  "message": "Explication détaillée en markdown de ce que tu proposes et pourquoi",
  "document": {
    "subject": "Objet du document (max 120 caractères)",
    "lines": [
      {
        "description": "Description professionnelle et détaillée",
        "quantity": 1,
        "unitPrice": 500.00,
        "vatRate": 20
      }
    ],
    "notes": "Notes (string, peut être vide)",
    "acceptanceConditions": "Conditions (string, peut être vide)"
  },
  "modifications": [
    {
      "content": "Description markdown de chaque modification individuelle"
    }
  ]
}

## RÈGLES IMPÉRATIVES
1. **"message"** : Résumé structuré en markdown de toutes les modifications avec le raisonnement
2. **"modifications"** : Liste détaillée de chaque changement individuel (une entrée par modification)
3. **"document"** : Le document complet avec toutes les modifications appliquées
4. **Créativité encadrée** : Sois inventif tout en restant professionnel et réaliste
5. **Prix réalistes** : Les tarifs correspondent aux standards du marché français
6. **TVA correcte** : 20% par défaut, 10% restauration/rénovation, 5.5% alimentaire/énergie, 0% uniquement si demandé
7. **Cohérence** : Toutes les lignes doivent être cohérentes entre elles et avec le sujet
8. **Langue** : Tout en français, vocabulaire professionnel
9. **JSON uniquement** : Aucun texte hors du JSON`
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
