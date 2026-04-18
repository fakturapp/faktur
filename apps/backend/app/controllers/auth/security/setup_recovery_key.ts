import type { HttpContext } from '@adonisjs/core/http'
import vine from '@vinejs/vine'
import User from '#models/account/user'
import zeroAccessCryptoService from '#services/crypto/zero_access_crypto_service'
import keyStore from '#services/crypto/key_store'
import RecoveryKeyGenerated from '#events/recovery_key_generated'
import recoveryKeyService from '#services/crypto/recovery_key_service'

const setupValidator = vine.compile(
  vine.object({
    password: vine.string(),
  })
)

export default class SetupRecoveryKey {
  async handle({ auth, request, response }: HttpContext) {
    const user = auth.user!
    const { password } = await request.validateUsing(setupValidator)

    if (user.hasRecoveryKey) {
      return response.badRequest({ message: 'Recovery key already set up' })
    }

    const passwordValid = await User.verifyCredentials(user.email, password)
      .then(() => true)
      .catch(() => false)

    if (!passwordValid) {
      return response.unauthorized({ message: 'Mot de passe incorrect' })
    }

    let kek = keyStore.getKEK(user.id)
    if (!kek) {
      if (!user.saltKdf) {
        return response.badRequest({ message: 'No encryption salt found for this account' })
      }
      kek = await zeroAccessCryptoService.deriveKEK(password, Buffer.from(user.saltKdf, 'hex'))
    }

    const rotation = await recoveryKeyService.rotateForUser(user, kek)

    RecoveryKeyGenerated.dispatch(user.email, rotation.recoveryKey, user.fullName ?? undefined)

    return response.ok({
      message: 'Recovery key sent by email',
      recoveryKey: rotation.formattedRecoveryKey,
    })
  }
}
