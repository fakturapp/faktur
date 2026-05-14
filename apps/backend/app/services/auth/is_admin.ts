import env from '#start/env'

/**
 * Parses the ADMIN_EMAILS env var (comma- or semicolon-separated) into a
 * normalised, lowercased list. Single source of truth for "who is an admin".
 */
export function adminEmails(): string[] {
  return (env.get('ADMIN_EMAILS') || '')
    .split(/[,;]/)
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
}

/** Whether the given email belongs to an admin. */
export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false
  return adminEmails().includes(email.toLowerCase())
}
