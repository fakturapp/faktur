import type { HttpContext } from '@adonisjs/core/http'
import { generateInvoicePdf } from '#services/pdf/document_pdf_service'

export default class Pdf {
  async handle({ auth, params, response }: HttpContext) {
    const user = auth.user!
    const teamId = user.currentTeamId

    if (!teamId) {
      return response.badRequest({ message: 'No team selected' })
    }

    try {
      const { pdfBuffer, filename } = await generateInvoicePdf(params.id, teamId)

      response.header('Content-Type', 'application/pdf')
      response.header('Content-Disposition', `attachment; filename="${filename}"`)
      response.header('Content-Length', pdfBuffer.length.toString())
      return response.send(pdfBuffer)
    } catch {
      return response.notFound({ message: 'Invoice not found' })
    }
  }
}
