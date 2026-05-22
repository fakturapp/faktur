import env from '#start/env'

const raw = env.get('API_PREFIX', '/v1').trim()
export const API_PREFIX = raw === '/' || raw === '' ? '' : raw.replace(/\/+$/, '')
