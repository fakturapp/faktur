import ApiProject from '#models/api/api_project'

const DEFAULT_NAME = 'Mon premier projet'
const DEFAULT_DESCRIPTION = 'Projet créé automatiquement à la création de l’équipe.'

class DefaultProjectService {
  async ensureForTeam(
    teamId: string,
    ownerUserId: string | null
  ): Promise<ApiProject> {
    const existing = await ApiProject.query()
      .where('team_id', teamId)
      .where('is_archived', false)
      .orderBy('is_default', 'desc')
      .orderBy('created_at', 'asc')
      .first()
    if (existing) {
      if (!existing.isDefault) {
        const alreadyDefault = await ApiProject.query()
          .where('team_id', teamId)
          .where('is_default', true)
          .where('is_archived', false)
          .first()
        if (!alreadyDefault) {
          existing.isDefault = true
          await existing.save()
        }
      }
      return existing
    }

    return ApiProject.create({
      teamId,
      createdByUserId: ownerUserId,
      name: DEFAULT_NAME,
      description: DEFAULT_DESCRIPTION,
      color: null,
      isDefault: true,
      isArchived: false,
    })
  }
}

export default new DefaultProjectService()
