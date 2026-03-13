import type { HttpContext } from '@adonisjs/core/http'
import Client from '#models/client/client'

export default class Delete {
  async handle({ auth, params, response }: HttpContext) {
    const user = auth.user!
    const teamId = user.currentTeamId

    if (!teamId) {
      return response.badRequest({ message: 'No team selected' })
    }

    const client = await Client.query()
      .where('id', params.id)
      .where('team_id', teamId)
      .first()

    if (!client) {
      return response.notFound({ message: 'Client not found' })
    }

    await client.delete()

    return response.ok({ message: 'Client deleted' })
  }
}
