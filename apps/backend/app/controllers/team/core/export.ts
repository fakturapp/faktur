import type { HttpContext } from '@adonisjs/core/http'
import vine from '@vinejs/vine'
import hash from '@adonisjs/core/services/hash'
import TeamMember from '#models/team/team_member'
import { collectTeamData, collectLogoFiles, createZipBuffer, encryptBuffer } from '#services/team/export_service'

const exportValidator = vine.compile(
  vine.object({
    password: vine.string(),
    encryptionPassword: vine.string().optional(),
  })
)

export default class Export {
  async handle({ auth, request, response }: HttpContext) {
    const user = auth.user!
    const teamId = user.currentTeamId

    if (!teamId) {
      return response.badRequest({ message: 'No team selected' })
    }

    const payload = await request.validateUsing(exportValidator)

    // Verify user is admin or super_admin
    const membership = await TeamMember.query()
      .where('teamId', teamId)
      .where('userId', user.id)
      .where('status', 'active')
      .first()

    if (!membership || !['admin', 'super_admin'].includes(membership.role)) {
      return response.forbidden({ message: 'Permissions insuffisantes' })
    }

    // Verify account password
    const isValid = await hash.verify(user.password, payload.password)
    if (!isValid) {
      return response.unauthorized({ message: 'Mot de passe incorrect' })
    }

    // Collect and export data
    const data = await collectTeamData(teamId)
    const logoFiles = collectLogoFiles(data)
    const zipBuffer = await createZipBuffer(data, logoFiles)

    if (payload.encryptionPassword) {
      const encrypted = encryptBuffer(zipBuffer, payload.encryptionPassword)
      const filename = `${data.team.name || 'team'}-export.fpdata`

      response.header('Content-Type', 'application/octet-stream')
      response.header('Content-Disposition', `attachment; filename="${filename}"`)
      return response.send(encrypted)
    }

    const filename = `${data.team.name || 'team'}-export.zip`
    response.header('Content-Type', 'application/zip')
    response.header('Content-Disposition', `attachment; filename="${filename}"`)
    return response.send(zipBuffer)
  }
}
