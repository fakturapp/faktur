import type { HttpContext } from '@adonisjs/core/http'
import Feedback from '#models/admin/feedback'

export default class Feedbacks {
  async handle({ response }: HttpContext) {
    const feedbacks = await Feedback.query().preload('user').orderBy('createdAt', 'desc')

    return response.ok({
      feedbacks: feedbacks.map((f) => ({
        id: f.id,
        rating: f.rating,
        comment: f.comment,
        createdAt: f.createdAt.toISO(),
        user: {
          id: f.user.id,
          fullName: f.user.fullName,
          email: f.user.email,
          avatarUrl: f.user.avatarUrl,
        },
      })),
    })
  }
}
