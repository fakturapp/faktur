import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import User from '#models/account/user'
import { isAdminEmail } from '#services/auth/is_admin'

export default class ListUsers {
  async handle({ request, response }: HttpContext) {
    const q = String(request.input('q') ?? '').trim()

    const query = User.query().orderBy('created_at', 'desc').limit(500)
    if (q) {
      query.where((b) => {
        b.where('email', 'ilike', `%${q}%`).orWhere('fullName', 'ilike', `%${q}%`)
      })
    }

    const users = await query
    const userIds = users.map((u) => u.id)

    const memberCounts = new Map<string, number>()
    const ownedCounts = new Map<string, number>()

    if (userIds.length > 0) {
      const memberRows = await db
        .from('team_members')
        .whereIn('user_id', userIds)
        .where('status', 'active')
        .groupBy('user_id')
        .select('user_id')
        .count('* as count')
      for (const row of memberRows) memberCounts.set(row.user_id, Number(row.count))

      const ownedRows = await db
        .from('teams')
        .whereIn('owner_id', userIds)
        .groupBy('owner_id')
        .select('owner_id')
        .count('* as count')
      for (const row of ownedRows) ownedCounts.set(row.owner_id, Number(row.count))
    }

    return response.ok({
      users: users.map((u) => ({
        id: u.id,
        email: u.email,
        fullName: u.fullName,
        avatarUrl: u.avatarUrl,
        emailVerified: u.emailVerified,
        twoFactorEnabled: u.twoFactorEnabled,
        status: u.status,
        hasPassword: !!u.password,
        isAdmin: isAdminEmail(u.email),
        teamCount: memberCounts.get(u.id) ?? 0,
        ownedTeamCount: ownedCounts.get(u.id) ?? 0,
        lastLoginAt: u.lastLoginAt ? u.lastLoginAt.toISO() : null,
        createdAt: u.createdAt.toISO(),
      })),
    })
  }
}
