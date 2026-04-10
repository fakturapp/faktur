import env from '#start/env'

const frontendUrl = env.get('FRONTEND_URL') || 'http://localhost:3000'

export function getFrontendUrl(): string {
  return frontendUrl
}

export function ctaButton(url: string, label: string): string {
  return `<table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 32px 0;"><tr><td align="center">
      <a href="${url}" style="display: inline-block; padding: 14px 40px; background: #5957e8; color: #ffffff; text-align: center; text-decoration: none; font-weight: 600; font-size: 15px; border-radius: 14px; letter-spacing: -0.01em;">${label}</a>
    </td></tr></table>`
}

export function infoBox(
  text: string,
  _bgColor?: string,
  _borderColor?: string,
  _textColor?: string
): string {
  return `<table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 24px 0;"><tr>
      <td style="border-radius: 14px; padding: 16px 20px; font-size: 14px; line-height: 1.6; background: #f5f5f5; color: #171717;">
        ${text}
      </td>
    </tr></table>`
}

export function validityTag(text: string): string {
  return `<table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 24px 0 0;"><tr><td align="center">
      <span style="display: inline-block; padding: 6px 16px; background: rgba(89,87,232,0.08); border-radius: 20px; font-size: 12px; color: #5957e8; font-weight: 500; letter-spacing: -0.01em;">${text}</span>
    </td></tr></table>`
}

export function linkFallback(url: string): string {
  return `<div style="margin: 24px 0 0; padding: 16px 20px; background: #f5f5f5; border-radius: 14px;">
      <p style="margin: 0 0 6px; font-size: 11px; color: #707070; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 500;">Ou copiez ce lien</p>
      <a href="${url}" style="color: #5957e8; text-decoration: none; font-size: 13px; word-break: break-all; line-height: 1.5;">${url}</a>
    </div>`
}

export function wrapHtml(content: string, title: string): string {
  return `
<!DOCTYPE html>
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
    <table width="520" cellpadding="0" cellspacing="0" border="0" style="max-width: 520px; width: 100%; background: #ffffff; border-radius: 30px; overflow: hidden; box-shadow: 0 0 0 1px rgba(0,0,0,0.06), 0 5px 15px rgba(23,23,23,0.08), 0 15px 35px rgba(23,23,23,0.04);">

      <!-- Header -->
      <tr><td style="padding: 36px 40px 28px; text-align: center;">
        <a href="${frontendUrl}" style="text-decoration: none; display: inline-flex; align-items: center; gap: 10px;">
          <img src="${frontendUrl}/logo.svg" alt="Faktur" width="28" height="28" style="display: inline-block; vertical-align: middle;" />
          <span style="font-size: 22px; font-weight: 700; color: #171717; letter-spacing: -0.03em; vertical-align: middle;">Faktur</span>
        </a>
      </td></tr>

      <!-- Divider -->
      <tr><td style="padding: 0 40px;">
        <div style="height: 1px; background: rgba(0,0,0,0.06);"></div>
      </td></tr>

      <!-- Content -->
      <tr><td style="padding: 36px 40px;">
        ${content}
      </td></tr>

      <!-- Footer -->
      <tr><td style="padding: 28px 40px; border-top: 1px solid rgba(0,0,0,0.06); text-align: center;">
        <p style="margin: 0 0 6px; font-size: 13px; font-weight: 600; color: #a3a3a3; letter-spacing: -0.02em;">Faktur</p>
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
