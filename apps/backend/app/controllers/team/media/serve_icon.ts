import type { HttpContext } from '@adonisjs/core/http'
import { safeServeFile } from '#services/security/safe_file_serve'

export default class ServeIcon {
  async handle(ctx: HttpContext) {
    return safeServeFile(ctx, {
      uploadsSubdir: 'team-icons',
      filename: ctx.params.filename,
    })
  }
}
