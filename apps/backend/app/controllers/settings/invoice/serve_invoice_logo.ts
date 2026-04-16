import type { HttpContext } from '@adonisjs/core/http'
import { safeServeFile } from '#services/security/safe_file_serve'

export default class ServeInvoiceLogo {
  async handle(ctx: HttpContext) {
    return safeServeFile(ctx, {
      uploadsSubdir: 'invoice-logos',
      filename: ctx.params.filename,
    })
  }
}
