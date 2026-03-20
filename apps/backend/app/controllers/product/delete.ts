import type { HttpContext } from '@adonisjs/core/http'
import Product from '#models/product/product'

export default class Delete {
  async handle({ auth, params, response }: HttpContext) {
    const user = auth.user!
    const teamId = user.currentTeamId

    if (!teamId) {
      return response.badRequest({ message: 'No team selected' })
    }

    const product = await Product.query()
      .where('id', params.id)
      .where('team_id', teamId)
      .first()

    if (!product) {
      return response.notFound({ message: 'Product not found' })
    }

    await product.delete()

    return response.ok({ message: 'Product deleted' })
  }
}
