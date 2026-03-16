import { Resend } from 'resend'
import env from '#start/env'

const resend = new Resend(env.get('RESEND_API_KEY'))

interface EmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

// Inline SVG icons (no emoji)
const ICONS = {
  envelope: `<svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#818cf8" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>`,
  lock: `<svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/><circle cx="12" cy="16" r="1"/></svg>`,
  shield: `<svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#818cf8" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/></svg>`,
  users: `<svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
  checkCircle: `<svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#4ade80" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg>`,
  warning: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 3.98 21h16.04a2 2 0 0 0 1.71-3Z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/></svg>`,
  shieldCheck: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/></svg>`,
  info: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>`,
  logo: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="52" height="52"><g transform="translate(60, 20)"><path d="M 40 0 H 190 L 280 90 V 320 A 40 40 0 0 1 240 360 H 40 A 40 40 0 0 1 0 320 V 40 A 40 40 0 0 1 40 0 Z" fill="#6366f1"/><path d="M 190 0 V 60 A 30 30 0 0 0 220 90 H 280 Z" fill="#4f46e5"/><ellipse cx="90" cy="150" rx="30" ry="32" fill="white"/><ellipse cx="98" cy="146" rx="15" ry="16" fill="#1e1b4b"/><ellipse cx="104" cy="138" rx="5" ry="5" fill="white"/><ellipse cx="190" cy="150" rx="30" ry="32" fill="white"/><ellipse cx="198" cy="146" rx="15" ry="16" fill="#1e1b4b"/><ellipse cx="204" cy="138" rx="5" ry="5" fill="white"/><path d="M 105 220 C 120 245 160 245 175 220" stroke="white" stroke-width="15" stroke-linecap="round" fill="none"/><ellipse cx="70" cy="200" rx="20" ry="12" fill="#a5b4fc" opacity="0.5"/><ellipse cx="210" cy="200" rx="20" ry="12" fill="#a5b4fc" opacity="0.5"/><line x1="70" y1="280" x2="210" y2="280" stroke="#a5b4fc" stroke-width="12" stroke-linecap="round" opacity="0.6"/><line x1="70" y1="310" x2="160" y2="310" stroke="#a5b4fc" stroke-width="12" stroke-linecap="round" opacity="0.6"/><path d="M -20 200 C -40 200 -50 220 -40 235" stroke="#6366f1" stroke-width="20" stroke-linecap="round" fill="none"/><path d="M 300 200 C 320 200 330 220 320 235" stroke="#6366f1" stroke-width="20" stroke-linecap="round" fill="none"/></g></svg>`,
}

class EmailService {
  private frontendUrl = env.get('FRONTEND_URL') || 'http://localhost:3000'
  private fromEmail = 'noreply@authguard.net'
  private fromName = 'Faktur'

  private wrapHtml(content: string, title: string) {
    return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="dark">
  <meta name="supported-color-schemes" content="dark">
  <title>${title}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0c0a13; color: #fafafa; margin: 0; padding: 0; width: 100%; -webkit-font-smoothing: antialiased; -webkit-text-size-adjust: 100%;">
  <div style="padding: 40px 16px;">
    <div style="max-width: 520px; margin: 0 auto; background: #141118; border: 1px solid rgba(99, 102, 241, 0.12); border-radius: 20px; overflow: hidden; box-shadow: 0 0 80px rgba(99, 102, 241, 0.06), 0 4px 32px rgba(0,0,0,0.4);">

      <!-- Header -->
      <div style="padding: 36px 40px 28px; text-align: center; background: linear-gradient(180deg, rgba(99, 102, 241, 0.08) 0%, transparent 100%);">
        <a href="${this.frontendUrl}" style="text-decoration: none; display: inline-block;">
          ${ICONS.logo}
          <span style="font-size: 22px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px; display: block; margin-top: 8px;">Faktur</span>
        </a>
      </div>

      <!-- Divider -->
      <div style="height: 1px; background: linear-gradient(90deg, transparent, rgba(99, 102, 241, 0.25), transparent); margin: 0 40px;"></div>

      <!-- Content -->
      <div style="padding: 36px 40px;">
        ${content}
      </div>

      <!-- Footer -->
      <div style="padding: 28px 40px; background: rgba(0,0,0,0.2); border-top: 1px solid rgba(255,255,255,0.04); text-align: center;">
        <p style="margin: 0 0 8px; font-size: 13px; font-weight: 600; color: #52525b; letter-spacing: -0.3px;">Faktur</p>
        <p style="margin: 0; font-size: 12px; color: #3f3f46; line-height: 1.6;">
          Facturation simple et gratuite.<br>
          &copy; ${new Date().getFullYear()} Faktur &mdash; Tous droits r&eacute;serv&eacute;s.
        </p>
      </div>

    </div>
  </div>
</body>
</html>`
  }

  private iconBadge(icon: string, bgColor: string, borderColor: string) {
    return `<div style="width: 56px; height: 56px; border-radius: 16px; margin: 0 auto 24px; display: flex; align-items: center; justify-content: center; background: ${bgColor}; border: 1px solid ${borderColor};">
      <!--[if mso]><table cellpadding="0" cellspacing="0" border="0"><tr><td style="width:56px;height:56px;text-align:center;vertical-align:middle;border-radius:16px;background:${bgColor};border:1px solid ${borderColor};"><![endif]-->
      ${icon}
      <!--[if mso]></td></tr></table><![endif]-->
    </div>`
  }

  private infoBox(icon: string, text: string, bgColor: string, borderColor: string, textColor: string) {
    return `<div style="border-radius: 12px; padding: 16px 20px; margin: 24px 0; font-size: 14px; line-height: 1.6; background: ${bgColor}; border: 1px solid ${borderColor}; color: ${textColor};">
      <span style="margin-right: 8px; vertical-align: middle; display: inline-block;">${icon}</span>
      <span style="vertical-align: middle;">${text}</span>
    </div>`
  }

  private validityTag(text: string) {
    return `<div style="text-align: center; margin: 24px 0 0;">
      <span style="display: inline-block; padding: 5px 14px; background: rgba(99, 102, 241, 0.1); border: 1px solid rgba(99, 102, 241, 0.15); border-radius: 20px; font-size: 12px; color: #818cf8; font-weight: 500;">${text}</span>
    </div>`
  }

  private linkFallback(url: string) {
    return `<div style="margin: 24px 0 0; padding: 16px 20px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 10px;">
      <p style="margin: 0 0 6px; font-size: 11px; color: #52525b; text-transform: uppercase; letter-spacing: 1px; font-weight: 500;">Ou copiez ce lien</p>
      <a href="${url}" style="color: #818cf8; text-decoration: none; font-size: 13px; word-break: break-all; line-height: 1.5;">${url}</a>
    </div>`
  }

  private ctaButton(url: string, label: string) {
    return `<div style="margin: 28px 0; text-align: center;">
      <a href="${url}" style="display: inline-block; padding: 14px 36px; background: linear-gradient(135deg, #6366f1 0%, #4f46e5 50%, #4338ca 100%); color: #ffffff; text-align: center; text-decoration: none; font-weight: 600; font-size: 15px; border-radius: 12px; box-shadow: 0 4px 16px rgba(99, 102, 241, 0.3), inset 0 1px 0 rgba(255,255,255,0.1);">${label}</a>
    </div>`
  }

  async send(options: EmailOptions): Promise<void> {
    if (!env.get('RESEND_API_KEY')) {
      console.log(`[Email] Would send to ${options.to}: ${options.subject}`)
      return
    }

    const { error } = await resend.emails.send({
      from: `${this.fromName} <${this.fromEmail}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    })

    if (error) {
      console.error('[Email] Send failed:', error)
      throw new Error(`Failed to send email: ${error.message}`)
    }
  }

  async sendVerificationEmail(email: string, token: string, name?: string): Promise<void> {
    const verifyUrl = `${this.frontendUrl}/verify-email?token=${token}`

    const content = `
      ${this.iconBadge(ICONS.envelope, 'rgba(99, 102, 241, 0.12)', 'rgba(99, 102, 241, 0.2)')}
      <h1 style="margin: 0 0 12px; font-size: 22px; font-weight: 700; color: #ffffff; letter-spacing: -0.3px; line-height: 1.3; text-align: center;">V&eacute;rifiez votre adresse email</h1>
      <p style="margin: 0 0 24px; font-size: 15px; line-height: 1.7; color: #a1a1aa; text-align: center;">
        Bonjour${name ? ` <span style="color: #c7d2fe; font-weight: 500;">${name}</span>` : ''},<br><br>
        Merci d'avoir rejoint Faktur ! Pour finaliser la cr&eacute;ation de votre compte, veuillez confirmer votre adresse email.
      </p>
      ${this.ctaButton(verifyUrl, 'V&eacute;rifier mon email')}
      ${this.validityTag('Valide 10 minutes')}
      ${this.linkFallback(verifyUrl)}
    `

    await this.send({
      to: email,
      subject: 'Vérifiez votre email - Faktur',
      html: this.wrapHtml(content, 'Vérification email'),
      text: `Vérifiez votre email : ${verifyUrl}`,
    })
  }

  async sendPasswordResetEmail(email: string, token: string, name?: string): Promise<void> {
    const resetUrl = `${this.frontendUrl}/reset-password?token=${token}`

    const content = `
      ${this.iconBadge(ICONS.lock, 'rgba(245, 158, 11, 0.12)', 'rgba(245, 158, 11, 0.2)')}
      <h1 style="margin: 0 0 12px; font-size: 22px; font-weight: 700; color: #ffffff; letter-spacing: -0.3px; line-height: 1.3; text-align: center;">R&eacute;initialisez votre mot de passe</h1>
      <p style="margin: 0 0 24px; font-size: 15px; line-height: 1.7; color: #a1a1aa; text-align: center;">
        Bonjour${name ? ` <span style="color: #c7d2fe; font-weight: 500;">${name}</span>` : ''},<br><br>
        Nous avons re&ccedil;u une demande de r&eacute;initialisation de votre mot de passe. Cliquez sur le bouton ci-dessous pour en choisir un nouveau.
      </p>
      ${this.ctaButton(resetUrl, 'R&eacute;initialiser le mot de passe')}
      ${this.infoBox(ICONS.warning, "Si vous n'&ecirc;tes pas &agrave; l'origine de cette demande, ignorez cet email. Votre mot de passe restera inchang&eacute;.", 'rgba(245, 158, 11, 0.08)', 'rgba(245, 158, 11, 0.15)', '#fbbf24')}
      ${this.validityTag('Valide 10 minutes')}
      ${this.linkFallback(resetUrl)}
    `

    await this.send({
      to: email,
      subject: 'Réinitialisation du mot de passe - Faktur',
      html: this.wrapHtml(content, 'Réinitialisation mot de passe'),
      text: `Réinitialisez votre mot de passe : ${resetUrl}`,
    })
  }

  async sendSecurityCodeEmail(email: string, code: string, name?: string): Promise<void> {
    const content = `
      ${this.iconBadge(ICONS.shield, 'rgba(99, 102, 241, 0.12)', 'rgba(99, 102, 241, 0.2)')}
      <h1 style="margin: 0 0 12px; font-size: 22px; font-weight: 700; color: #ffffff; letter-spacing: -0.3px; line-height: 1.3; text-align: center;">Code de v&eacute;rification</h1>
      <p style="margin: 0 0 24px; font-size: 15px; line-height: 1.7; color: #a1a1aa; text-align: center;">
        Bonjour${name ? ` <span style="color: #c7d2fe; font-weight: 500;">${name}</span>` : ''},<br><br>
        Utilisez le code ci-dessous pour confirmer votre action. Ne partagez jamais ce code avec qui que ce soit.
      </p>
      <div style="background: linear-gradient(135deg, rgba(99, 102, 241, 0.08), rgba(79, 70, 229, 0.04)); border: 1px solid rgba(99, 102, 241, 0.15); border-radius: 16px; padding: 28px; text-align: center; margin: 28px 0;">
        <p style="margin: 0; font-size: 40px; font-weight: 800; color: #ffffff; letter-spacing: 12px; font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace;">${code}</p>
        <p style="margin: 12px 0 0; font-size: 12px; color: #6366f1; font-weight: 500; text-transform: uppercase; letter-spacing: 1.5px;">Code de s&eacute;curit&eacute;</p>
      </div>
      ${this.validityTag('Valide 5 minutes')}
      <p style="margin: 20px 0 0; font-size: 13px; line-height: 1.6; color: #71717a; text-align: center;">
        Si vous n'avez pas demand&eacute; ce code, vous pouvez ignorer cet email en toute s&eacute;curit&eacute;.
      </p>
    `

    await this.send({
      to: email,
      subject: 'Code de vérification - Faktur',
      html: this.wrapHtml(content, 'Code de vérification'),
      text: `Votre code de vérification : ${code}`,
    })
  }

  async sendTeamInviteEmail(email: string, inviterName: string, inviteUrl: string): Promise<void> {
    const content = `
      ${this.iconBadge(ICONS.users, 'rgba(59, 130, 246, 0.12)', 'rgba(59, 130, 246, 0.2)')}
      <h1 style="margin: 0 0 12px; font-size: 22px; font-weight: 700; color: #ffffff; letter-spacing: -0.3px; line-height: 1.3; text-align: center;">Invitation &agrave; rejoindre une &eacute;quipe</h1>
      <p style="margin: 0 0 24px; font-size: 15px; line-height: 1.7; color: #a1a1aa; text-align: center;">
        <span style="color: #c7d2fe; font-weight: 500;">${inviterName}</span> vous invite &agrave; rejoindre son &eacute;quipe sur Faktur.
      </p>
      ${this.ctaButton(inviteUrl, "Accepter l'invitation")}
      ${this.infoBox(ICONS.info, "Si vous n'avez pas encore de compte Faktur, vous pourrez en cr&eacute;er un apr&egrave;s avoir cliqu&eacute; sur le lien.", 'rgba(59, 130, 246, 0.08)', 'rgba(59, 130, 246, 0.15)', '#60a5fa')}
      ${this.linkFallback(inviteUrl)}
    `

    await this.send({
      to: email,
      subject: `${inviterName} vous invite sur Faktur`,
      html: this.wrapHtml(content, 'Invitation équipe'),
      text: `${inviterName} vous invite à rejoindre son équipe sur Faktur : ${inviteUrl}`,
    })
  }

  async sendTwoFactorEnabledEmail(email: string, name?: string): Promise<void> {
    const content = `
      ${this.iconBadge(ICONS.checkCircle, 'rgba(34, 197, 94, 0.12)', 'rgba(34, 197, 94, 0.2)')}
      <h1 style="margin: 0 0 12px; font-size: 22px; font-weight: 700; color: #ffffff; letter-spacing: -0.3px; line-height: 1.3; text-align: center;">Double authentification activ&eacute;e</h1>
      <p style="margin: 0 0 24px; font-size: 15px; line-height: 1.7; color: #a1a1aa; text-align: center;">
        Bonjour${name ? ` <span style="color: #c7d2fe; font-weight: 500;">${name}</span>` : ''},<br><br>
        La double authentification (2FA) a &eacute;t&eacute; activ&eacute;e sur votre compte avec succ&egrave;s.
      </p>
      ${this.infoBox(ICONS.shieldCheck, "Votre compte est d&eacute;sormais mieux prot&eacute;g&eacute;. Un code de v&eacute;rification vous sera demand&eacute; &agrave; chaque connexion.", 'rgba(34, 197, 94, 0.08)', 'rgba(34, 197, 94, 0.15)', '#4ade80')}
      ${this.infoBox(ICONS.warning, "Si vous n'&ecirc;tes pas &agrave; l'origine de cette modification, contactez le support imm&eacute;diatement.", 'rgba(245, 158, 11, 0.08)', 'rgba(245, 158, 11, 0.15)', '#fbbf24')}
    `

    await this.send({
      to: email,
      subject: '2FA activée - Faktur',
      html: this.wrapHtml(content, '2FA activée'),
      text: 'La double authentification a été activée sur votre compte Faktur.',
    })
  }
}

export default new EmailService()
