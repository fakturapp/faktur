import type { HttpContext } from '@adonisjs/core/http'
import { randomBytes } from 'node:crypto'
import DocumentShareLink from '#models/collaboration/document_share_link'
import { createShareLinkValidator } from '#validators/collaboration_validator'
import DocumentAccessService from '#services/collaboration/document_access_service'

export default class Create {
  async handle(ctx: HttpContext) {
    const { auth, request, response } = ctx
    const user = auth.user!
    const teamId = user.currentTeamId

    if (!teamId) {
      return response.badRequest({ message: 'No team selected' })
    }

    const payload = await request.validateUsing(createShareLinkValidator)

    const accessService = new DocumentAccessService()
    const document = await accessService.getDocument(payload.documentType, payload.documentId, teamId)
    if (!document) {
      return response.notFound({ message: 'Document not found' })
    }

    const token = randomBytes(32).toString('hex')

    const link = await DocumentShareLink.create({
      teamId,
      documentType: payload.documentType,
      documentId: payload.documentId,
      token,
      permission: payload.permission,
      visibility: payload.visibility || 'team',
      autoExpire: payload.autoExpire ?? false,
      createdByUserId: user.id,
      isActive: true,
    })

    return response.created({
      message: 'Share link created',
      data: {
        id: link.id,
        token: link.token,
        permission: link.permission,
        visibility: link.visibility,
        autoExpire: link.autoExpire,
        isActive: link.isActive,
        expiresAt: link.expiresAt?.toISO() ?? null,
        createdAt: link.createdAt.toISO(),
      },
    })
  }
}
