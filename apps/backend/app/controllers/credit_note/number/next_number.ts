import type { HttpContext } from '@adonisjs/core/http'
import InvoiceSetting from '#models/team/invoice_setting'
import { ApiError } from '#exceptions/api_error'
import { generateNextNumber } from '#services/documents/number_generator'

export default class NextNumber {
  async handle({ auth, response }: HttpContext) {
    const user = auth.user!
    const teamId = user.currentTeamId

    if (!teamId) {
      throw new ApiError('team_not_selected')
    }

    const settings = await InvoiceSetting.query().where('team_id', teamId).first()
    if (settings?.nextCreditNoteNumber) {
      return response.ok({ nextNumber: settings.nextCreditNoteNumber })
    }

    const nextNumber = await generateNextNumber({
      teamId,
      table: 'credit_notes',
      numberColumn: 'credit_note_number',
      pattern: settings?.creditNoteFilenamePattern || 'AV-{annee}-{numero}',
    })

    return response.ok({ nextNumber })
  }
}
