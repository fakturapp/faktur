import vine from '@vinejs/vine'
import securityConfig from '#config/security'

const { password } = securityConfig

const parts: string[] = []
if (password.requireLowercase) parts.push('(?=.*[a-z])')
if (password.requireUppercase) parts.push('(?=.*[A-Z])')
if (password.requireNumbers) parts.push('(?=.*\\d)')
if (password.requireSymbols) parts.push('(?=.*[^A-Za-z0-9])')

const COMPLEXITY_REGEX = parts.length > 0 ? new RegExp(`^${parts.join('')}.*$`) : null

export function passwordField() {
  let schema = vine.string().minLength(password.minLength).maxLength(password.maxLength)
  if (COMPLEXITY_REGEX) {
    schema = schema.regex(COMPLEXITY_REGEX)
  }
  return schema
}

export function confirmedPasswordField() {
  return passwordField().confirmed()
}
