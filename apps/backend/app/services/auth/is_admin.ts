import env from '#start/env'

export function adminEmails(): string[] {
  return (env.get('ADMIN_EMAILS') || '')
    .split(/[,;]/)
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false
  return adminEmails().includes(email.toLowerCase())
}
