import type { Response } from '@adonisjs/core/http'
import quotaService from '#services/billing/quota_service'

/**
 * Checks if a user can make an AI request. Returns a 429 response if blocked,
 * or null if the request is allowed.
 */
export async function enforceQuota(
  userId: string,
  response: Response
): Promise<Response | null> {
  const { allowed, reason } = await quotaService.canMakeRequest(userId)
  if (!allowed) {
    return response.tooManyRequests({
      message: reason || 'Quota exceeded',
      code: 'QUOTA_EXCEEDED',
    })
  }
  return null
}
