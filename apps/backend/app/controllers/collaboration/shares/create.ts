import type { HttpContext } from '@adonisjs/core/http'
import DocumentShare from '#models/collaboration/document_share'
import User from '#models/account/user'
import TeamMember from '#models/team/team_member'
import { createShareValidator } from '#validators/collaboration_validator'
import DocumentAccessService from '#services/collaboration/document_access_service'

export default class Create {
  async handle(ctx: HttpContext) {
    const { auth, request, response } = ctx
    const user = auth.user!
    const teamId = user.currentTeamId

    if (!teamId) {
      return response.badRequest({ message: 'No team selected' })
    }

    const payload = await request.validateUsing(createShareValidator)

    const accessService = new DocumentAccessService()
    const document = await accessService.getDocument(payload.documentType, payload.documentId, teamId)
    if (!document) {
      return response.notFound({ message: 'Document not found' })
    }

    if (payload.email === user.email) {
      return response.badRequest({ message: 'You cannot share a document with yourself' })
    }

    const targetUser = await User.findBy('email', payload.email)

    let sharedWithUserId: string | null = null
    let status: 'active' | 'pending' = 'pending'

    if (targetUser) {
      const teamMember = await TeamMember.query()
        .where('team_id', teamId)
        .where('user_id', targetUser.id)
        .where('status', 'active')
        .first()

      if (teamMember) {
        sharedWithUserId = targetUser.id
        status = 'active'
      }
    }

    if (sharedWithUserId) {
      const existingShare = await DocumentShare.query()
        .where('document_type', payload.documentType)
        .where('document_id', payload.documentId)
        .where('shared_with_user_id', sharedWithUserId)
        .where('status', 'active')
        .first()

      if (existingShare) {
        return response.conflict({ message: 'This user already has access to this document' })
      }
    }

    const share = await DocumentShare.create({
      teamId,
      documentType: payload.documentType,
      documentId: payload.documentId,
      sharedByUserId: user.id,
      sharedWithUserId,
      sharedWithEmail: payload.email,
      permission: payload.permission,
      status,
    })

    await share.load('sharedWith')
    await share.load('sharedBy')

    return response.created({
      message: 'Document shared successfully',
      data: {
        id: share.id,
        permission: share.permission,
        status: share.status,
        sharedWithEmail: share.sharedWithEmail,
        sharedWith: share.sharedWith
          ? {
              id: share.sharedWith.id,
              fullName: share.sharedWith.fullName,
              email: share.sharedWith.email,
              avatarUrl: (share.sharedWith as any).avatarUrl ?? null,
            }
          : null,
        sharedBy: {
          id: share.sharedBy.id,
          fullName: share.sharedBy.fullName,
        },
        createdAt: share.createdAt.toISO(),
      },
    })
  }
}
