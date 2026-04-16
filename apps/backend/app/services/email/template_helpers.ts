const HTML_ENTITY_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
  '/': '&#x2F;',
  '`': '&#x60;',
}

export function htmlEscape(value: string | null | undefined): string {
  if (value == null) return ''
  return String(value).replace(/[&<>"'`/]/g, (ch) => HTML_ENTITY_MAP[ch] ?? ch)
}

export interface ApplyTemplateOptions {
  escape?: boolean
}

export function applyTemplate(
  template: string,
  vars: Record<string, string>,
  options: ApplyTemplateOptions = {}
): string {
  const escape = options.escape ?? true
  let result = template
  for (const [key, rawValue] of Object.entries(vars)) {
    const value = escape ? htmlEscape(rawValue) : String(rawValue ?? '')
    result = result.replaceAll(`{${key}}`, value)
  }
  return result
}
