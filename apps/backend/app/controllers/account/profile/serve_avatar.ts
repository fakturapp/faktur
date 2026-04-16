import type { HttpContext } from '@adonisjs/core/http'
import { safeServeFile } from '#services/security/safe_file_serve'

export default class ServeAvatar {
  async handle(ctx: HttpContext) {
    return safeServeFile(ctx, {
      uploadsSubdir: 'avatars',
      filename: ctx.params.filename,
    })
  }
}
