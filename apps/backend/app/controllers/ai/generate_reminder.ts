import type { HttpContext } from '@adonisjs/core/http'
import vine from '@vinejs/vine'
import Invoice from '#models/invoice/invoice'
import Client from '#models/client/client'
import Company from '#models/team/company'
import AiService from '#services/ai/ai_service'
import { decryptModelFields, ENCRYPTED_FIELDS } from '#services/crypto/field_encryption_helper'

const reminderValidator = vine.compile(
  vine.object({
    invoiceId: vine.string().trim(),
    tone: vine.enum(['polite', 'firm', 'urgent']).optional(),
  })
)

export default class GenerateReminder {
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
      return response.forbidden({ message: 'AI is not enabled.' })
    }

    const payload = await request.validateUsing(reminderValidator)

    const invoice = await Invoice.query()
      .where('id', payload.invoiceId)
      .where('team_id', teamId)
      .first()

    if (!invoice) {
      return response.notFound({ message: 'Invoice not found' })
    }

    // Get client info
    let clientName = 'Client'
    if (invoice.clientId) {
      const client = await Client.find(invoice.clientId)
      if (client) {
        decryptModelFields(client, [...ENCRYPTED_FIELDS.client], dek)
        clientName = client.displayName || 'Client'
      }
    }

    // Get company info
    const company = await Company.findBy('teamId', teamId)
    const companyName = company?.legalName || 'Notre entreprise'

    // Calculate days overdue
    const dueDate = invoice.dueDate || invoice.issueDate
    const now = new Date()
    const due = new Date(dueDate)
    const daysOverdue = Math.max(0, Math.floor((now.getTime() - due.getTime()) / (1000 * 60 * 60 * 24)))

    const tone = payload.tone || (daysOverdue > 30 ? 'urgent' : daysOverdue > 14 ? 'firm' : 'polite')

    const toneDescriptions: Record<string, string> = {
      polite: 'poli et cordial, c\'est un premier rappel amical',
      firm: 'professionnel et ferme mais respectueux, c\'est un deuxième rappel',
      urgent: 'urgent et direct, c\'est un dernier rappel avant mise en demeure',
    }

    const systemPrompt = `Tu es un assistant de facturation français. Génère un email de relance de paiement professionnel.

Ton: ${toneDescriptions[tone]}

Réponds en JSON avec cette structure exacte:
{
  "subject": "Sujet de l'email",
  "body": "Corps de l'email complet avec formule de politesse"
}

Règles:
- Vouvoie le client
- Mentionne le numéro de facture et le montant
- Mentionne le nombre de jours de retard si > 0
- Le corps doit inclure une formule d'ouverture et de fermeture
- Signe avec le nom de l'entreprise
- Réponds UNIQUEMENT avec le JSON`

    const contextText = `
Entreprise émettrice: ${companyName}
Client: ${clientName}
Numéro de facture: ${invoice.invoiceNumber}
Montant TTC: ${Number(invoice.total).toFixed(2)}€
Date d'échéance: ${dueDate}
Jours de retard: ${daysOverdue}
Ton souhaité: ${tone}`

    try {
      const result = await ai.generate(teamId, dek, systemPrompt, contextText, 512)

      // Parse JSON
      const jsonMatch = result.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        return response.ok({ subject: '', body: '' })
      }

      const parsed = JSON.parse(jsonMatch[0])
      return response.ok({
        subject: parsed.subject || '',
        body: parsed.body || '',
        tone,
        daysOverdue,
      })
    } catch (error: any) {
      return response.internalServerError({ message: 'AI generation failed', error: error.message })
    }
  }
}
