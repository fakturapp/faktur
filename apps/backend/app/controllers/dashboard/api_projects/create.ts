import type { HttpContext } from '@adonisjs/core/http'
import ApiProject from '#models/api/api_project'
import transformer from '#transformers/api/api_project_transformer'
import auditLog from '#services/api/audit_log_service'
import { createProjectValidator } from '#validators/api/api_key_dashboard_validators'

export default class Create {
  async handle(ctx: HttpContext) {
    const { auth, request, response } = ctx
    const user = auth.user!
    const teamId = user.currentTeamId
    if (!teamId) return response.badRequest({ message: 'No team selected' })

    const payload = await createProjectValidator.validate(request.body())

    const duplicate = await ApiProject.query()
      .where('team_id', teamId)
      .where('name', payload.name.trim())
      .first()
    if (duplicate) {
      return response.unprocessableEntity({
        code: 'project_name_taken',
        message: 'Un projet avec ce nom existe déjà.',
      })
    }

    const project = await ApiProject.create({
      teamId,
      createdByUserId: user.id,
      name: payload.name.trim(),
      description: payload.description ?? null,
      color: payload.color ?? null,
      isDefault: false,
      isArchived: false,
    })

    await auditLog.emit({
      ctx,
      teamId,
      projectId: project.id,
      action: 'project.created',
      targetType: 'project',
      targetId: project.id,
      targetLabel: project.name,
      metadata: { description: project.description },
    })

    return response.created({ data: transformer.transform(project, 0) })
  }
}
