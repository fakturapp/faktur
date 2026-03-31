import env from '#start/env'

export function isAiEnabled(): boolean {
  const flag = env.get('ENABLE_AI_FEATURES')
  // Enabled by default unless explicitly set to 'false'
  return flag !== 'false'
}
