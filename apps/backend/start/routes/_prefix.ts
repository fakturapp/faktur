import env from '#start/env'

const raw = env.get('API_PREFIX', '')
export const API_PREFIX = raw === '/' ? '' : raw.replace(/\/+$/, '')
