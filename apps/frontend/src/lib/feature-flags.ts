export function isAiFeaturesEnabled(): boolean {
  const flag = process.env.NEXT_PUBLIC_ENABLE_AI_FEATURES
  // Enabled by default unless explicitly set to 'false'
  return flag !== 'false'
}
