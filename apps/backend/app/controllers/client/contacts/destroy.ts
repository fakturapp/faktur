import type { HttpContext } from '@adonisjs/core/http'
import ClientContact from '#models/client/client_contact'

export default class Destroy {
  async handle({ auth, params, response }: HttpContext) {
    const user = auth.user!
    const teamId = user.currentTeamId

    if (!teamId) {
      return response.badRequest({ message: 'No team selected' })
    }

    const contact = await ClientContact.query()
      .where('id', params.id)
      .where('client_id', params.clientId)
      .where('team_id', teamId)
      .first()

    if (!contact) {
      return response.notFound({ message: 'Contact not found' })
    }

    await contact.delete()

    return response.ok({ message: 'Contact deleted' })
  }
}
