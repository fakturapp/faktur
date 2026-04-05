import type { HttpContext } from '@adonisjs/core/http'
import { getActiveEditors } from '#services/collaboration/websocket_service'
import type { DocumentType } from '#models/collaboration/document_share'

export default class ActiveEditors {
  async handle(ctx: HttpContext) {
    const { auth, request, response } = ctx
    const user = auth.user!
    const teamId = user.currentTeamId

    if (!teamId) {
      return response.badRequest({ message: 'No team selected' })
    }

    const documentType = request.param('documentType') as DocumentType
    const validTypes = ['invoice', 'quote', 'credit_note']
    if (!validTypes.includes(documentType)) {
      return response.badRequest({ message: 'Invalid document type' })
    }

    const editors = getActiveEditors(documentType, teamId)

    return response.ok({ data: editors })
  }
}
