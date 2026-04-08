import type { HttpContext } from '@adonisjs/core/http'
import Feedback from '#models/admin/feedback'

export default class Create {
  async handle({ auth, request, response }: HttpContext) {
    const user = auth.user!
    const { rating, comment } = request.only(['rating', 'comment'])

    if (!rating || rating < 1 || rating > 5) {
      return response.badRequest({ message: 'La note doit être entre 1 et 5' })
    }

    const existing = await Feedback.query().where('userId', user.id).first()
    if (existing) {
      existing.rating = Math.round(rating)
      existing.comment = comment?.trim() || null
      await existing.save()
      return response.ok({ feedback: existing })
    }

    const feedback = await Feedback.create({
      userId: user.id,
      rating: Math.round(rating),
      comment: comment?.trim() || null,
    })

    return response.created({ feedback })
  }
}
