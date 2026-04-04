import type { HttpContext } from '@adonisjs/core/http'
import DocumentShare from '#models/collaboration/document_share'
import { disconnectUserFromDocument } from '#services/collaboration/websocket_service'

export default class Revoke {
  async handle(ctx: HttpContext) {
    const { auth, request, response } = ctx
    const user = auth.user!
    const teamId = user.currentTeamId

    if (!teamId) {
      return response.badRequest({ message: 'No team selected' })
    }

    const shareId = request.param('shareId') as string

    const share = await DocumentShare.query()
      .where('id', shareId)
      .where('team_id', teamId)
      .whereNot('status', 'revoked')
      .first()

    if (!share) {
      return response.notFound({ message: 'Share not found' })
    }

    share.status = 'revoked'
    await share.save()

    // Immediately disconnect the user from the WebSocket room
    if (share.sharedWithUserId) {
      await disconnectUserFromDocument(
        share.documentType,
        share.documentId,
        share.sharedWithUserId
      )
    }

    return response.ok({
      message: 'Access revoked',
      data: {
        id: share.id,
        sharedWithUserId: share.sharedWithUserId,
        documentType: share.documentType,
        documentId: share.documentId,
      },
    })
  }
}
