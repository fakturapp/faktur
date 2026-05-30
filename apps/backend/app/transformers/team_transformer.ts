import type Team from '#models/team/team'
import { BaseTransformer } from '@adonisjs/core/transformers'
import TeamMemberTransformer from '#transformers/team_member_transformer'

export default class TeamTransformer extends BaseTransformer<Team> {
  toObject() {
    return {
      ...this.pick(this.resource, ['id', 'name', 'iconUrl', 'ownerId', 'createdAt']),
      plan: this.resource.plan,
      subscriptionStatus: this.resource.subscriptionStatus,
      planPeriod: this.resource.planPeriod,
      subscriptionCurrentPeriodEnd: this.resource.subscriptionCurrentPeriodEnd
        ? this.resource.subscriptionCurrentPeriodEnd.toISO()
        : null,
      subscriptionGraceEndsAt: this.resource.subscriptionGraceEndsAt
        ? this.resource.subscriptionGraceEndsAt.toISO()
        : null,
      subscriptionCancelAtPeriodEnd: this.resource.subscriptionCancelAtPeriodEnd,
      encryptionMode: this.resource.encryptionMode,
      encryptionModeConfirmedAt: this.resource.encryptionModeConfirmedAt
        ? this.resource.encryptionModeConfirmedAt.toISO()
        : null,
      hasCompany: !!this.resource.company,
      members: TeamMemberTransformer.transform(this.whenLoaded(this.resource.members)),
    }
  }
}
