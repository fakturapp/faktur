import type User from '#models/account/user'
import { BaseTransformer } from '@adonisjs/core/transformers'

export default class UserTransformer extends BaseTransformer<User> {
  toObject() {
    return {
      ...this.pick(this.resource, [
        'id',
        'fullName',
        'email',
        'avatarUrl',
        'emailVerified',
        'twoFactorEnabled',
        'onboardingCompleted',
        'currentTeamId',
        'lastLoginAt',
        'createdAt',
        'updatedAt',
        'initials',
      ]),
      cryptoResetNeeded: this.resource.cryptoResetNeeded || false,
      hasRecoveryKey: this.resource.hasRecoveryKey || false,
      canRecoverWithPassword: !!this.resource.oldSaltKdf,
    }
  }
}
