import type { HttpContext } from '@adonisjs/core/http'
import AuthProvider from '#models/account/auth_provider'
import PasskeyCredential from '#models/account/passkey_credential'
import Team from '#models/team/team'
import TeamMember from '#models/team/team_member'
import keyStore from '#services/crypto/key_store'
import keyStoreWarmer from '#services/crypto/key_store_warmer'
import UserTransformer from '#transformers/user_transformer'
import { isAdminEmail } from '#services/auth/is_admin'

export default class Me {
  async handle(ctx: HttpContext) {
    const { auth, request, response } = ctx
    const user = auth.user!

    const [googleProvider, passkeyCount] = await Promise.all([
      AuthProvider.query().where('userId', user.id).where('provider', 'google').first(),
      PasskeyCredential.query().where('userId', user.id).count('* as total').first(),
    ])

    const memberships = await TeamMember.query()
      .where('userId', user.id)
      .where('status', 'active')
      .select(['team_id'])
    const teamIds = memberships.map((m) => m.teamId)
    const teams = teamIds.length > 0 ? await Team.query().whereIn('id', teamIds) : []

    const currentTeam = user.currentTeamId
      ? (teams.find((t) => t.id === user.currentTeamId) ?? null)
      : null
    const currentTeamEncryptionMode = currentTeam ? currentTeam.encryptionMode : null
    const currentTeamPlan = currentTeam ? currentTeam.plan : null

    let vaultLocked = false
    if (currentTeam && currentTeam.encryptionMode === 'private' && user.saltKdf) {
      vaultLocked = !keyStore.isUnlocked(user.id, currentTeam.id)
      if (vaultLocked) {
        const sessionKeyHex = request.header('X-Vault-Key')
        if (sessionKeyHex) {
          const recovered = await keyStoreWarmer.warmFromRequest(
            user.id,
            currentTeam.id,
            String(user.currentAccessToken.identifier),
            sessionKeyHex
          )
          if (recovered && keyStore.isUnlocked(user.id, currentTeam.id)) {
            vaultLocked = false
          }
        }
      }
    }

    const isAdmin = isAdminEmail(user.email)

    const teamsSummary = teams.map((t) => ({
      id: t.id,
      name: t.name,
      plan: t.plan,
      subscriptionStatus: t.subscriptionStatus,
      planPeriod: t.planPeriod,
      subscriptionCurrentPeriodEnd: t.subscriptionCurrentPeriodEnd
        ? t.subscriptionCurrentPeriodEnd.toISO()
        : null,
      subscriptionGraceEndsAt: t.subscriptionGraceEndsAt
        ? t.subscriptionGraceEndsAt.toISO()
        : null,
      subscriptionCancelAtPeriodEnd: t.subscriptionCancelAtPeriodEnd,
      subscriptionCancelExternal: t.subscriptionCancelExternal,
      subscriptionStartedAt: t.subscriptionStartedAt ? t.subscriptionStartedAt.toISO() : null,
      hasStripeSubscription: !!t.stripeSubscriptionId,
      encryptionMode: t.encryptionMode,
      encryptionModeConfirmedAt: t.encryptionModeConfirmedAt
        ? t.encryptionModeConfirmedAt.toISO()
        : null,
      onboardingCompletedAt: t.onboardingCompletedAt ? t.onboardingCompletedAt.toISO() : null,
    }))

    return response.ok({
      user: {
        ...(await ctx.serialize.withoutWrapping(UserTransformer.transform(user))),
        hasGoogleProvider: !!googleProvider,
        hasPasskeys: Number(passkeyCount?.$extras.total || 0) > 0,
        vaultLocked,
        isAdmin,
        currentTeamEncryptionMode,
        currentTeamPlan,
        teams: teamsSummary,
      },
    })
  }
}
