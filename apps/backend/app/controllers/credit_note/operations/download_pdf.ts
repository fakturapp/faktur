import type { HttpContext } from '@adonisjs/core/http'
import { generateCreditNotePdf } from '#services/pdf/document_pdf_service'

export default class DownloadPdf {
  async handle(ctx: HttpContext) {
    const { auth, params, response } = ctx
    const dek: Buffer = (ctx as any).dek
    const user = auth.user!
    const teamId = user.currentTeamId

    if (!teamId) {
      return response.badRequest({ message: 'No team selected' })
    }

    try {
      const { pdfBuffer, filename } = await generateCreditNotePdf(params.id, teamId, dek)

      response.header('Content-Type', 'application/pdf')
      response.header('Content-Disposition', `attachment; filename="${filename}"`)
      return response.send(pdfBuffer)
    } catch {
      return response.notFound({ message: 'Credit note not found' })
    }
  }
}
