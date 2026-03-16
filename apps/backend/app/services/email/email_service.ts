import { Resend } from 'resend'
import env from '#start/env'

const resend = new Resend(env.get('RESEND_API_KEY'))

interface EmailOptions {
  to: string
  subject: string
  html: string
  text?: string
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
  <noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
  <![endif]-->
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0c0a13; color: #fafafa; margin: 0; padding: 0; width: 100%; -webkit-font-smoothing: antialiased; -webkit-text-size-adjust: 100%;">
  <div style="padding: 40px 16px;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td align="center">
    <table width="520" cellpadding="0" cellspacing="0" border="0" style="max-width: 520px; width: 100%; background: #141118; border: 1px solid rgba(99,102,241,0.12); border-radius: 20px; overflow: hidden; box-shadow: 0 0 80px rgba(99,102,241,0.06), 0 4px 32px rgba(0,0,0,0.4);">

      <!-- Header -->
      <tr><td style="padding: 32px 40px 24px; text-align: center; background: linear-gradient(180deg, rgba(99,102,241,0.08) 0%, transparent 100%);">
        <a href="${this.frontendUrl}" style="text-decoration: none; font-size: 24px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px;">Faktur</a>
      </td></tr>

      <!-- Divider -->
      <tr><td style="padding: 0 40px;">
        <div style="height: 1px; background: linear-gradient(90deg, transparent, rgba(99,102,241,0.25), transparent);"></div>
      </td></tr>

      <!-- Content -->
      <tr><td style="padding: 36px 40px;">
        ${content}
      </td></tr>

      <!-- Footer -->
      <tr><td style="padding: 28px 40px; background: rgba(0,0,0,0.2); border-top: 1px solid rgba(255,255,255,0.04); text-align: center;">
        <p style="margin: 0 0 8px; font-size: 13px; font-weight: 600; color: #52525b; letter-spacing: -0.3px;">Faktur</p>
        <p style="margin: 0; font-size: 12px; color: #3f3f46; line-height: 1.6;">
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

  private infoBox(text: string, bgColor: string, borderColor: string, textColor: string) {
    return `<table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 24px 0;"><tr>
      <td style="border-radius: 12px; padding: 16px 20px; font-size: 14px; line-height: 1.6; background: ${bgColor}; border: 1px solid ${borderColor}; color: ${textColor};">
        ${text}
      </td>
    </tr></table>`
  }

  private validityTag(text: string) {
    return `<table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 24px 0 0;"><tr><td align="center">
      <span style="display: inline-block; padding: 5px 14px; background: rgba(99,102,241,0.1); border: 1px solid rgba(99,102,241,0.15); border-radius: 20px; font-size: 12px; color: #818cf8; font-weight: 500;">${text}</span>
    </td></tr></table>`
  }

  private linkFallback(url: string) {
    return `<div style="margin: 24px 0 0; padding: 16px 20px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 10px;">
      <p style="margin: 0 0 6px; font-size: 11px; color: #52525b; text-transform: uppercase; letter-spacing: 1px; font-weight: 500;">Ou copiez ce lien</p>
      <a href="${url}" style="color: #818cf8; text-decoration: none; font-size: 13px; word-break: break-all; line-height: 1.5;">${url}</a>
    </div>`
  }

  private ctaButton(url: string, label: string) {
    return `<table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 28px 0;"><tr><td align="center">
      <a href="${url}" style="display: inline-block; padding: 14px 36px; background: linear-gradient(135deg, #6366f1 0%, #4f46e5 50%, #4338ca 100%); color: #ffffff; text-align: center; text-decoration: none; font-weight: 600; font-size: 15px; border-radius: 12px; box-shadow: 0 4px 16px rgba(99,102,241,0.3), inset 0 1px 0 rgba(255,255,255,0.1);">${label}</a>
    </td></tr></table>`
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
      <h1 style="margin: 0 0 12px; font-size: 22px; font-weight: 700; color: #ffffff; letter-spacing: -0.3px; line-height: 1.3; text-align: center;">R&eacute;initialisez votre mot de passe</h1>
      <p style="margin: 0 0 24px; font-size: 15px; line-height: 1.7; color: #a1a1aa; text-align: center;">
        Bonjour${name ? ` <span style="color: #c7d2fe; font-weight: 500;">${name}</span>` : ''},<br><br>
        Nous avons re&ccedil;u une demande de r&eacute;initialisation de votre mot de passe. Cliquez sur le bouton ci-dessous pour en choisir un nouveau.
      </p>
      ${this.ctaButton(resetUrl, 'R&eacute;initialiser le mot de passe')}
      ${this.infoBox("Si vous n'&ecirc;tes pas &agrave; l'origine de cette demande, ignorez cet email. Votre mot de passe restera inchang&eacute;.", 'rgba(245,158,11,0.08)', 'rgba(245,158,11,0.15)', '#fbbf24')}
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
      <h1 style="margin: 0 0 12px; font-size: 22px; font-weight: 700; color: #ffffff; letter-spacing: -0.3px; line-height: 1.3; text-align: center;">Code de v&eacute;rification</h1>
      <p style="margin: 0 0 24px; font-size: 15px; line-height: 1.7; color: #a1a1aa; text-align: center;">
        Bonjour${name ? ` <span style="color: #c7d2fe; font-weight: 500;">${name}</span>` : ''},<br><br>
        Utilisez le code ci-dessous pour confirmer votre action. Ne partagez jamais ce code avec qui que ce soit.
      </p>
      <div style="background: linear-gradient(135deg, rgba(99,102,241,0.08), rgba(79,70,229,0.04)); border: 1px solid rgba(99,102,241,0.15); border-radius: 16px; padding: 28px; text-align: center; margin: 28px 0;">
        <p style="margin: 0; font-size: 40px; font-weight: 800; color: #ffffff; letter-spacing: 12px; font-family: 'SF Mono', 'Fira Code', Consolas, monospace;">${code}</p>
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
      <h1 style="margin: 0 0 12px; font-size: 22px; font-weight: 700; color: #ffffff; letter-spacing: -0.3px; line-height: 1.3; text-align: center;">Invitation &agrave; rejoindre une &eacute;quipe</h1>
      <p style="margin: 0 0 24px; font-size: 15px; line-height: 1.7; color: #a1a1aa; text-align: center;">
        <span style="color: #c7d2fe; font-weight: 500;">${inviterName}</span> vous invite &agrave; rejoindre son &eacute;quipe sur Faktur.
      </p>
      ${this.ctaButton(inviteUrl, "Accepter l'invitation")}
      ${this.infoBox("Si vous n'avez pas encore de compte Faktur, vous pourrez en cr&eacute;er un apr&egrave;s avoir cliqu&eacute; sur le lien.", 'rgba(59,130,246,0.08)', 'rgba(59,130,246,0.15)', '#60a5fa')}
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
      <h1 style="margin: 0 0 12px; font-size: 22px; font-weight: 700; color: #ffffff; letter-spacing: -0.3px; line-height: 1.3; text-align: center;">Double authentification activ&eacute;e</h1>
      <p style="margin: 0 0 24px; font-size: 15px; line-height: 1.7; color: #a1a1aa; text-align: center;">
        Bonjour${name ? ` <span style="color: #c7d2fe; font-weight: 500;">${name}</span>` : ''},<br><br>
        La double authentification (2FA) a &eacute;t&eacute; activ&eacute;e sur votre compte avec succ&egrave;s.
      </p>
      ${this.infoBox("Votre compte est d&eacute;sormais mieux prot&eacute;g&eacute;. Un code de v&eacute;rification vous sera demand&eacute; &agrave; chaque connexion.", 'rgba(34,197,94,0.08)', 'rgba(34,197,94,0.15)', '#4ade80')}
      ${this.infoBox("Si vous n'&ecirc;tes pas &agrave; l'origine de cette modification, contactez le support imm&eacute;diatement.", 'rgba(245,158,11,0.08)', 'rgba(245,158,11,0.15)', '#fbbf24')}
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
