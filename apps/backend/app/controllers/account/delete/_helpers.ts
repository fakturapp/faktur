import { DateTime } from 'luxon'
import type User from '#models/account/user'
import { timingSafeEqualStr } from '#services/security/timing_safe'

const DELETION_SESSION_TTL_MINUTES = 30

export function validateDeletionSession(
  user: User,
  token: string | undefined,
  requiredStep?: number
): string | null {
  if (!user.deletionToken || !user.deletionStartedAt) {
    return 'Aucune session de suppression en cours'
  }

  if (!timingSafeEqualStr(user.deletionToken, token)) {
    return 'Token de suppression invalide'
  }

  const elapsed = DateTime.now().diff(user.deletionStartedAt, 'minutes').minutes
  if (elapsed > DELETION_SESSION_TTL_MINUTES) {
    return 'La session de suppression a expiré. Veuillez recommencer.'
  }

  if (requiredStep !== undefined && user.deletionStep < requiredStep) {
    return 'Étape de suppression invalide'
  }

  return null
}
