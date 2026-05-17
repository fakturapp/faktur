import type { HttpContext } from '@adonisjs/core/http'
import ApiProject from '#models/api/api_project'
import transformer from '#transformers/api/api_project_transformer'
import auditLog from '#services/api/audit_log_service'
import { updateProjectValidator } from '#validators/api/api_key_dashboard_validators'
import publicIdCodec, { PublicIdParseError } from '#services/api/public_id_codec'

export default class Update {
  async handle(ctx: HttpContext) {
    const { auth, params, request, response } = ctx
    const user = auth.user!
    const teamId = user.currentTeamId
    if (!teamId) return response.badRequest({ message: 'No team selected' })

    let internalId: string
    try {
      internalId = publicIdCodec.decode('api_project', params.id)
    } catch (err) {
      if (err instanceof PublicIdParseError) {
        return response.notFound({ message: 'Project not found' })
      }
      throw err
    }

    const project = await ApiProject.query()
      .where('id', internalId)
      .where('team_id', teamId)
      .first()
    if (!project) return response.notFound({ message: 'Project not found' })

    const payload = await updateProjectValidator.validate(request.body())
    const previous = {
      name: project.name,
      description: project.description,
      color: project.color,
      is_archived: project.isArchived,
    }

    if (payload.name && payload.name.trim() !== project.name) {
      const dup = await ApiProject.query()
        .where('team_id', teamId)
        .where('name', payload.name.trim())
        .whereNot('id', project.id)
        .first()
      if (dup) {
        return response.unprocessableEntity({
          code: 'project_name_taken',
          message: 'Un projet avec ce nom existe déjà.',
        })
      }
      project.name = payload.name.trim()
    }
    if (payload.description !== undefined) project.description = payload.description
    if (payload.color !== undefined) project.color = payload.color
    if (payload.is_archived !== undefined) project.isArchived = payload.is_archived
    await project.save()

    const archiveChanged =
      payload.is_archived !== undefined && payload.is_archived !== previous.is_archived
    if (archiveChanged) {
      await auditLog.emit({
        ctx,
        teamId,
        projectId: project.id,
        action: project.isArchived ? 'project.archived' : 'project.unarchived',
        targetType: 'project',
        targetId: project.id,
        targetLabel: project.name,
      })
    } else {
      await auditLog.emit({
        ctx,
        teamId,
        projectId: project.id,
        action: 'project.updated',
        targetType: 'project',
        targetId: project.id,
        targetLabel: project.name,
        metadata: {
          previous,
          changes: {
            name: payload.name?.trim() ?? undefined,
            description: payload.description ?? undefined,
            color: payload.color ?? undefined,
          },
        },
      })
    }

    return response.ok({ data: transformer.transform(project) })
  }
}
