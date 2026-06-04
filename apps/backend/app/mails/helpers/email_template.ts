import env from '#start/env'

const frontendUrl = env.get('FRONTEND_URL') || 'http://localhost:3000'

export function getFrontendUrl(): string {
  return frontendUrl
}

export function ctaButton(url: string, label: string): string {
  return `<table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 28px 0 0;"><tr><td>
      <a href="${url}" style="display: block; width: 100%; box-sizing: border-box; padding: 0; background: #5957e8; color: #ffffff; text-align: center; text-decoration: none; font-weight: 600; font-size: 15px; border-radius: 16px; letter-spacing: -0.01em; line-height: 56px; height: 56px;">
        ${label}
      </a>
    </td></tr></table>`
}

export function brandBadge(name?: string, logoUrl?: string): string {
  const src = logoUrl || `${frontendUrl}/logo.svg`
  const displayName = name || 'Faktur'
  return `<table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 0 0 28px;"><tr><td align="center">
      <table cellpadding="0" cellspacing="0" border="0"><tr><td align="center">
        <div style="width: 56px; height: 56px; border-radius: 16px; border: 1px solid rgba(0,0,0,0.08); background: #ffffff; overflow: hidden; display: inline-block; vertical-align: top;">
          <img src="${src}" alt="${displayName}" width="56" height="56" style="display: block; width: 56px; height: 56px; border-radius: 16px;" />
        </div>
      </td></tr><tr><td align="center" style="padding-top: 12px;">
        <span style="font-size: 18px; font-weight: 600; color: #171717; letter-spacing: -0.02em;">${displayName}</span>
      </td></tr></table>
    </td></tr></table>`
}

export function amountDisplay(formattedAmount: string, caption?: string): string {
  return `<table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 0 0 28px;"><tr><td align="center">
      <p style="margin: 0; font-size: 36px; font-weight: 700; color: #171717; letter-spacing: -0.03em; line-height: 1.1;">${formattedAmount}</p>
      ${caption ? `<p style="margin: 8px 0 0; font-size: 13px; color: #a3a3a3; font-weight: 400; letter-spacing: -0.01em;">${caption}</p>` : ''}
    </td></tr></table>`
}

export function detailRows(rows: { label: string; value: string }[]): string {
  const rowsHtml = rows
    .map(
      (row) =>
        `<tr>
      <td style="padding: 11px 0; font-size: 14px; color: #171717; font-weight: 400; border-bottom: 1px solid rgba(0,0,0,0.06); white-space: nowrap; width: 50%;">${row.label}</td>
      <td style="padding: 11px 0; font-size: 14px; color: #707070; font-weight: 400; border-bottom: 1px solid rgba(0,0,0,0.06); text-align: right;">${row.value}</td>
    </tr>`
    )
    .join('')
  return `<table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 0 0 28px; border-top: 1px solid rgba(0,0,0,0.06);">
    ${rowsHtml}
  </table>`
}

export function infoBox(
  text: string,
  _bgColor?: string,
  _borderColor?: string,
  _textColor?: string
): string {
  return `<table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 20px 0 0;"><tr>
      <td style="border-radius: 14px; padding: 16px 20px; font-size: 14px; line-height: 1.6; background: #f5f5f5; color: #171717;">
        ${text}
      </td>
    </tr></table>`
}

export function validityTag(text: string): string {
  return `<table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 20px 0 0;"><tr><td align="center">
      <span style="display: inline-block; padding: 6px 16px; background: rgba(89,87,232,0.08); border-radius: 20px; font-size: 12px; color: #5957e8; font-weight: 500; letter-spacing: -0.01em;">${text}</span>
    </td></tr></table>`
}

export function linkFallback(url: string): string {
  return `<table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 20px 0 0;"><tr>
      <td style="padding: 16px 20px; background: #f5f5f5; border-radius: 14px;">
        <p style="margin: 0 0 6px; font-size: 11px; color: #707070; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 500;">Ou copiez ce lien</p>
        <a href="${url}" style="color: #5957e8; text-decoration: none; font-size: 13px; word-break: break-all; line-height: 1.5;">${url}</a>
      </td>
    </tr></table>`
}

export function wrapHtml(content: string, title: string): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>${title}</title>
  <!--[if mso]>
  <noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
  <![endif]-->
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5; color: #171717; margin: 0; padding: 0; width: 100%; -webkit-font-smoothing: antialiased; -webkit-text-size-adjust: 100%; letter-spacing: -0.015em;">
  <div style="padding: 48px 16px;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td align="center">
    <table width="520" cellpadding="0" cellspacing="0" border="0" style="max-width: 520px; width: 100%; background: #ffffff; border-radius: 32px; overflow: hidden; box-shadow: 0 0 0 1px rgba(0,0,0,0.06), 0 8px 24px rgba(23,23,23,0.08), 0 20px 48px rgba(23,23,23,0.05);">

      <tr><td style="padding: 36px 40px 28px; text-align: center;">
        <a href="${frontendUrl}" style="text-decoration: none; display: inline-block;">
          <table cellpadding="0" cellspacing="0" border="0" style="display: inline-table;"><tr>
            <td style="vertical-align: middle; padding-right: 10px;">
              <img src="${frontendUrl}/logo.svg" alt="Faktur" width="28" height="28" style="display: block;" />
            </td>
            <td style="vertical-align: middle;">
              <span style="font-size: 22px; font-weight: 700; color: #171717; letter-spacing: -0.03em;">Faktur</span>
            </td>
          </tr></table>
        </a>
      </td></tr>

      <tr><td style="padding: 0 40px;">
        <div style="height: 1px; background: rgba(0,0,0,0.06);"></div>
      </td></tr>

      <tr><td style="padding: 40px 40px 36px;">
        ${content}
      </td></tr>

      <tr><td style="padding: 24px 40px 32px; border-top: 1px solid rgba(0,0,0,0.06); text-align: center;">
        <p style="margin: 0 0 4px; font-size: 13px; font-weight: 600; color: #a3a3a3; letter-spacing: -0.02em;">Faktur</p>
        <p style="margin: 0; font-size: 12px; color: #a3a3a3; line-height: 1.6;">
          Facturation simple et gratuite.<br>
          &copy; ${new Date().getFullYear()} Faktur &mdash; Tous droits r&eacute;serv&eacute;s.
        </p>
      </td></tr>

    </table>
    </td></tr></table>
  </div>
</body>
</html>`
}
