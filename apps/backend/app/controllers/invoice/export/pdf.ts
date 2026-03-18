import type { HttpContext } from '@adonisjs/core/http'
import { generateInvoicePdf } from '#services/pdf/document_pdf_service'

export default class Pdf {
  async handle(ctx: HttpContext) {
    const { auth, params, response } = ctx
    const user = auth.user!
    const teamId = user.currentTeamId
    const dek: Buffer = (ctx as any).dek

    if (!teamId) {
      return response.badRequest({ message: 'No team selected' })
    }

    try {
      const { pdfBuffer, filename } = await generateInvoicePdf(params.id, teamId, dek)

      response.header('Content-Type', 'application/pdf')
      response.header('Content-Disposition', `attachment; filename="${filename}"`)
      response.header('Content-Length', pdfBuffer.length.toString())
      return response.send(pdfBuffer)
    } catch {
      return response.notFound({ message: 'Invoice not found' })
    }
  }
}
