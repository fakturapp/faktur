import type { HttpContext } from '@adonisjs/core/http'
import vine from '@vinejs/vine'
import hash from '@adonisjs/core/services/hash'
import TeamMember from '#models/team/team_member'
import {
  collectTeamData,
  collectLogoFiles,
  createZipBuffer,
  encryptBuffer,
} from '#services/team/export_service'

const exportValidator = vine.compile(
  vine.object({
    password: vine.string(),
    encryptionPassword: vine.string().optional(),
    includeBankAccounts: vine.boolean().optional(),
  })
)

export default class Export {
  async handle(ctx: HttpContext) {
    const { auth, request, response } = ctx
    const dek: Buffer = (ctx as any).dek
    const user = auth.user!
    const teamId = user.currentTeamId

    if (!teamId) {
      return response.badRequest({ message: 'No team selected' })
    }

    const payload = await request.validateUsing(exportValidator)

    const membership = await TeamMember.query()
      .where('teamId', teamId)
      .where('userId', user.id)
      .where('status', 'active')
      .first()

    if (!membership || !['admin', 'super_admin'].includes(membership.role)) {
      return response.forbidden({ message: 'Permissions insuffisantes' })
    }

    const isValid = await hash.verify(user.password, payload.password)
    if (!isValid) {
      return response.unauthorized({ message: 'Mot de passe incorrect' })
    }

    const data = await collectTeamData(teamId, dek, {
      includeBankAccounts: payload.includeBankAccounts ?? false,
    })
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
