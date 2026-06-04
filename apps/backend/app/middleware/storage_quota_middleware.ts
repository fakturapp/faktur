import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import Team from '#models/team/team'
import storageService from '#services/storage/storage_service'
import { buildStructuredErrorResponse } from '#services/http/error_response_service'

export default class StorageQuotaMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const user = ctx.auth.user
    if (!user || !user.currentTeamId) {
      return next()
    }

    const team = await Team.find(user.currentTeamId)
    if (!team) {
      return next()
    }

    const over = await storageService.isOverQuota(team.id, team.plan)
    if (over) {
      const isRead = ctx.request.method() === 'GET'
      const message = isRead
        ? 'Accès refusé : votre espace de stockage est plein. Veuillez le vider pour pouvoir lire vos données.'
        : 'Accès refusé : votre espace de stockage est plein. Veuillez le vider pour pouvoir continuer.'
      return ctx.response.status(403).send(
        buildStructuredErrorResponse(ctx, {
          errorCode: 'storage_full',
          message,
        })
      )
    }

    return next()
  }
}
