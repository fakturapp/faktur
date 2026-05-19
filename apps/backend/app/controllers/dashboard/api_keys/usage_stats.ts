import type { HttpContext } from '@adonisjs/core/http'
import ApiKey from '#models/api/api_key'
import db from '@adonisjs/lucid/services/db'
import publicIdCodec, { PublicIdParseError } from '#services/api/public_id_codec'
import { DateTime } from 'luxon'

export default class UsageStats {
  async handle({ auth, params, response }: HttpContext) {
    const user = auth.user!
    const teamId = user.currentTeamId
    if (!teamId) return response.badRequest({ message: 'No team selected' })

    let internalId: string
    try {
      internalId = publicIdCodec.decode('api_key', params.id)
    } catch (err) {
      if (err instanceof PublicIdParseError) {
        return response.notFound({ message: 'API key not found' })
      }
      throw err
    }

    const key = await ApiKey.query().where('id', internalId).where('team_id', teamId).first()
    if (!key) return response.notFound({ message: 'API key not found' })

    const since = DateTime.now().minus({ days: 30 }).toSQL()!

    const dailyRaw = await db.connection().rawQuery(
      `SELECT DATE(created_at) AS day, COUNT(*)::int AS count
         FROM api_request_logs
         WHERE api_key_id = ? AND created_at >= ?
         GROUP BY day ORDER BY day ASC`,
      [key.id, since]
    )

    const topEndpointsRaw = await db.connection().rawQuery(
      `SELECT method, path, COUNT(*)::int AS count
         FROM api_request_logs
         WHERE api_key_id = ? AND created_at >= ?
         GROUP BY method, path
         ORDER BY count DESC
         LIMIT 10`,
      [key.id, since]
    )

    const statusDistRaw = await db.connection().rawQuery(
      `SELECT (status / 100) AS bucket, COUNT(*)::int AS count
         FROM api_request_logs
         WHERE api_key_id = ? AND created_at >= ?
         GROUP BY bucket
         ORDER BY bucket ASC`,
      [key.id, since]
    )

    const totalThisMonthRaw = await db.connection().rawQuery(
      `SELECT COUNT(*)::int AS count
         FROM api_request_logs
         WHERE api_key_id = ? AND created_at >= date_trunc('month', NOW())`,
      [key.id]
    )

    const dailyRows = (dailyRaw.rows ?? dailyRaw) as Array<{ day: string; count: number }>
    const topRows = (topEndpointsRaw.rows ?? topEndpointsRaw) as Array<{
      method: string
      path: string
      count: number
    }>
    const statusRows = (statusDistRaw.rows ?? statusDistRaw) as Array<{
      bucket: number
      count: number
    }>
    const totalThisMonth = ((totalThisMonthRaw.rows ?? totalThisMonthRaw)[0]?.count ?? 0) as number

    return response.ok({
      data: {
        daily: dailyRows.map((d) => ({ day: d.day, count: Number(d.count) })),
        top_endpoints: topRows.map((r) => ({
          endpoint: `${r.method} ${r.path}`,
          count: Number(r.count),
        })),
        status_distribution: statusRows.map((s) => ({
          bucket: `${s.bucket}xx`,
          count: Number(s.count),
        })),
        total_this_month: Number(totalThisMonth),
        usage_count_lifetime: Number(key.usageCount ?? 0),
      },
    })
  }
}
