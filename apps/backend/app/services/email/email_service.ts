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
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    :root { color-scheme: dark; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background-color: #0c0a13;
      color: #fafafa;
      margin: 0;
      padding: 0;
      width: 100%;
      -webkit-font-smoothing: antialiased;
      -webkit-text-size-adjust: 100%;
    }
    .outer-wrap { padding: 40px 16px; }
    .container {
      max-width: 520px;
      margin: 0 auto;
      background: #141118;
      border: 1px solid rgba(99, 102, 241, 0.12);
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 0 80px rgba(99, 102, 241, 0.06), 0 4px 32px rgba(0,0,0,0.4);
    }
    .header {
      padding: 36px 40px 28px;
      text-align: center;
      background: linear-gradient(180deg, rgba(99, 102, 241, 0.08) 0%, transparent 100%);
    }
    .logo-img {
      width: 52px;
      height: 52px;
      margin-bottom: 8px;
    }
    .logo-text {
      font-size: 22px;
      font-weight: 700;
      color: #ffffff;
      text-decoration: none;
      letter-spacing: -0.5px;
      display: block;
    }
    .divider {
      height: 1px;
      background: linear-gradient(90deg, transparent, rgba(99, 102, 241, 0.25), transparent);
      margin: 0 40px;
    }
    .content { padding: 36px 40px; }
    .icon-badge {
      width: 56px;
      height: 56px;
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 24px;
      font-size: 28px;
      line-height: 1;
    }
    .icon-badge-indigo { background: rgba(99, 102, 241, 0.12); border: 1px solid rgba(99, 102, 241, 0.2); }
    .icon-badge-amber { background: rgba(245, 158, 11, 0.12); border: 1px solid rgba(245, 158, 11, 0.2); }
    .icon-badge-green { background: rgba(34, 197, 94, 0.12); border: 1px solid rgba(34, 197, 94, 0.2); }
    .icon-badge-blue { background: rgba(59, 130, 246, 0.12); border: 1px solid rgba(59, 130, 246, 0.2); }
    .h1 {
      margin: 0 0 12px;
      font-size: 22px;
      font-weight: 700;
      color: #ffffff;
      letter-spacing: -0.3px;
      line-height: 1.3;
    }
    .text {
      margin: 0 0 24px;
      font-size: 15px;
      line-height: 1.7;
      color: #a1a1aa;
    }
    .text-small {
      margin: 0 0 20px;
      font-size: 13px;
      line-height: 1.6;
      color: #71717a;
    }
    .name-highlight {
      color: #c7d2fe;
      font-weight: 500;
    }
    .button-wrap { margin: 28px 0; text-align: center; }
    .button {
      display: inline-block;
      padding: 14px 36px;
      background: linear-gradient(135deg, #6366f1 0%, #4f46e5 50%, #4338ca 100%);
      color: #ffffff !important;
      text-align: center;
      text-decoration: none;
      font-weight: 600;
      font-size: 15px;
      border-radius: 12px;
      box-shadow: 0 4px 16px rgba(99, 102, 241, 0.3), inset 0 1px 0 rgba(255,255,255,0.1);
      letter-spacing: 0.2px;
    }
    .code-box {
      background: linear-gradient(135deg, rgba(99, 102, 241, 0.08), rgba(79, 70, 229, 0.04));
      border: 1px solid rgba(99, 102, 241, 0.15);
      border-radius: 16px;
      padding: 28px;
      text-align: center;
      margin: 28px 0;
    }
    .code-digits {
      margin: 0;
      font-size: 40px;
      font-weight: 800;
      color: #ffffff;
      letter-spacing: 12px;
      font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace;
    }
    .code-label {
      margin: 12px 0 0;
      font-size: 12px;
      color: #6366f1;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 1.5px;
    }
    .info-box {
      border-radius: 12px;
      padding: 16px 20px;
      margin: 24px 0;
      font-size: 14px;
      line-height: 1.6;
    }
    .info-box-green {
      background: rgba(34, 197, 94, 0.08);
      border: 1px solid rgba(34, 197, 94, 0.15);
      color: #4ade80;
    }
    .info-box-amber {
      background: rgba(245, 158, 11, 0.08);
      border: 1px solid rgba(245, 158, 11, 0.15);
      color: #fbbf24;
    }
    .info-box-icon { margin-right: 8px; font-size: 16px; }
    .link-fallback {
      margin: 24px 0 0;
      padding: 16px 20px;
      background: rgba(255,255,255,0.03);
      border: 1px solid rgba(255,255,255,0.06);
      border-radius: 10px;
    }
    .link-fallback-label {
      margin: 0 0 6px;
      font-size: 11px;
      color: #52525b;
      text-transform: uppercase;
      letter-spacing: 1px;
      font-weight: 500;
    }
    .link-fallback a {
      color: #818cf8;
      text-decoration: none;
      font-size: 13px;
      word-break: break-all;
      line-height: 1.5;
    }
    .footer {
      padding: 28px 40px;
      background: rgba(0,0,0,0.2);
      border-top: 1px solid rgba(255,255,255,0.04);
      text-align: center;
    }
    .footer-text {
      margin: 0;
      font-size: 12px;
      color: #3f3f46;
      line-height: 1.6;
    }
    .footer-link { color: #52525b; text-decoration: none; }
    .footer-brand {
      margin: 0 0 8px;
      font-size: 13px;
      font-weight: 600;
      color: #52525b;
      letter-spacing: -0.3px;
    }
    .validity-tag {
      display: inline-block;
      padding: 4px 12px;
      background: rgba(99, 102, 241, 0.1);
      border: 1px solid rgba(99, 102, 241, 0.15);
      border-radius: 20px;
      font-size: 12px;
      color: #818cf8;
      font-weight: 500;
      margin-top: 4px;
    }
  </style>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0c0a13; color: #fafafa; margin: 0; padding: 0; width: 100%; -webkit-font-smoothing: antialiased;">
  <div class="outer-wrap" style="padding: 40px 16px;">
    <div class="container" style="max-width: 520px; margin: 0 auto; background: #141118; border: 1px solid rgba(99, 102, 241, 0.12); border-radius: 20px; overflow: hidden;">
      <div class="header" style="padding: 36px 40px 28px; text-align: center; background: linear-gradient(180deg, rgba(99, 102, 241, 0.08) 0%, transparent 100%);">
        <a href="${this.frontendUrl}" style="text-decoration: none;">
          <img src="${this.frontendUrl}/logo.svg" alt="Faktur" class="logo-img" width="52" height="52" style="width: 52px; height: 52px; margin-bottom: 8px; display: inline-block;">
          <span class="logo-text" style="font-size: 22px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px; display: block;">Faktur</span>
        </a>
      </div>
      <div class="divider" style="height: 1px; background: linear-gradient(90deg, transparent, rgba(99, 102, 241, 0.25), transparent); margin: 0 40px;"></div>
      <div class="content" style="padding: 36px 40px;">
        ${content}
      </div>
      <div class="footer" style="padding: 28px 40px; background: rgba(0,0,0,0.2); border-top: 1px solid rgba(255,255,255,0.04); text-align: center;">
        <p class="footer-brand" style="margin: 0 0 8px; font-size: 13px; font-weight: 600; color: #52525b; letter-spacing: -0.3px;">Faktur</p>
        <p class="footer-text" style="margin: 0; font-size: 12px; color: #3f3f46; line-height: 1.6;">
          Facturation simple et gratuite.<br>
          &copy; ${new Date().getFullYear()} Faktur &mdash; Tous droits r&eacute;serv&eacute;s.
        </p>
      </div>
    </div>
  </div>
</body>
</html>`
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
      <div class="icon-badge icon-badge-indigo" style="width: 56px; height: 56px; border-radius: 16px; display: block; margin-bottom: 24px; font-size: 28px; line-height: 56px; text-align: center; background: rgba(99, 102, 241, 0.12); border: 1px solid rgba(99, 102, 241, 0.2);">
        &#9993;
      </div>
      <h1 class="h1" style="margin: 0 0 12px; font-size: 22px; font-weight: 700; color: #ffffff;">V&eacute;rifiez votre adresse email</h1>
      <p class="text" style="margin: 0 0 24px; font-size: 15px; line-height: 1.7; color: #a1a1aa;">
        Bonjour${name ? ` <span class="name-highlight" style="color: #c7d2fe; font-weight: 500;">${name}</span>` : ''},<br><br>
        Merci d'avoir rejoint Faktur ! Pour finaliser la cr&eacute;ation de votre compte, veuillez confirmer votre adresse email.
      </p>
      <div class="button-wrap" style="margin: 28px 0; text-align: center;">
        <a href="${verifyUrl}" class="button" style="display: inline-block; padding: 14px 36px; background: linear-gradient(135deg, #6366f1 0%, #4f46e5 50%, #4338ca 100%); color: #ffffff; text-align: center; text-decoration: none; font-weight: 600; font-size: 15px; border-radius: 12px;">V&eacute;rifier mon email</a>
      </div>
      <p class="text-small" style="margin: 0 0 20px; font-size: 13px; line-height: 1.6; color: #71717a;">
        <span class="validity-tag" style="display: inline-block; padding: 4px 12px; background: rgba(99, 102, 241, 0.1); border: 1px solid rgba(99, 102, 241, 0.15); border-radius: 20px; font-size: 12px; color: #818cf8; font-weight: 500;">Valide 10 minutes</span>
      </p>
      <div class="link-fallback" style="margin: 24px 0 0; padding: 16px 20px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 10px;">
        <p class="link-fallback-label" style="margin: 0 0 6px; font-size: 11px; color: #52525b; text-transform: uppercase; letter-spacing: 1px; font-weight: 500;">Ou copiez ce lien</p>
        <a href="${verifyUrl}" style="color: #818cf8; text-decoration: none; font-size: 13px; word-break: break-all; line-height: 1.5;">${verifyUrl}</a>
      </div>
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
      <div class="icon-badge icon-badge-amber" style="width: 56px; height: 56px; border-radius: 16px; display: block; margin-bottom: 24px; font-size: 28px; line-height: 56px; text-align: center; background: rgba(245, 158, 11, 0.12); border: 1px solid rgba(245, 158, 11, 0.2);">
        &#128274;
      </div>
      <h1 class="h1" style="margin: 0 0 12px; font-size: 22px; font-weight: 700; color: #ffffff;">R&eacute;initialisez votre mot de passe</h1>
      <p class="text" style="margin: 0 0 24px; font-size: 15px; line-height: 1.7; color: #a1a1aa;">
        Bonjour${name ? ` <span class="name-highlight" style="color: #c7d2fe; font-weight: 500;">${name}</span>` : ''},<br><br>
        Nous avons re&ccedil;u une demande de r&eacute;initialisation de votre mot de passe. Cliquez sur le bouton ci-dessous pour en choisir un nouveau.
      </p>
      <div class="button-wrap" style="margin: 28px 0; text-align: center;">
        <a href="${resetUrl}" class="button" style="display: inline-block; padding: 14px 36px; background: linear-gradient(135deg, #6366f1 0%, #4f46e5 50%, #4338ca 100%); color: #ffffff; text-align: center; text-decoration: none; font-weight: 600; font-size: 15px; border-radius: 12px;">R&eacute;initialiser le mot de passe</a>
      </div>
      <div class="info-box info-box-amber" style="border-radius: 12px; padding: 16px 20px; margin: 24px 0; font-size: 14px; line-height: 1.6; background: rgba(245, 158, 11, 0.08); border: 1px solid rgba(245, 158, 11, 0.15); color: #fbbf24;">
        <span class="info-box-icon">&#9888;&#65039;</span> Si vous n'&ecirc;tes pas &agrave; l'origine de cette demande, ignorez cet email. Votre mot de passe restera inchang&eacute;.
      </div>
      <p class="text-small" style="margin: 0 0 20px; font-size: 13px; line-height: 1.6; color: #71717a;">
        <span class="validity-tag" style="display: inline-block; padding: 4px 12px; background: rgba(99, 102, 241, 0.1); border: 1px solid rgba(99, 102, 241, 0.15); border-radius: 20px; font-size: 12px; color: #818cf8; font-weight: 500;">Valide 10 minutes</span>
      </p>
      <div class="link-fallback" style="margin: 24px 0 0; padding: 16px 20px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 10px;">
        <p class="link-fallback-label" style="margin: 0 0 6px; font-size: 11px; color: #52525b; text-transform: uppercase; letter-spacing: 1px; font-weight: 500;">Ou copiez ce lien</p>
        <a href="${resetUrl}" style="color: #818cf8; text-decoration: none; font-size: 13px; word-break: break-all; line-height: 1.5;">${resetUrl}</a>
      </div>
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
      <div class="icon-badge icon-badge-indigo" style="width: 56px; height: 56px; border-radius: 16px; display: block; margin-bottom: 24px; font-size: 28px; line-height: 56px; text-align: center; background: rgba(99, 102, 241, 0.12); border: 1px solid rgba(99, 102, 241, 0.2);">
        &#128737;
      </div>
      <h1 class="h1" style="margin: 0 0 12px; font-size: 22px; font-weight: 700; color: #ffffff;">Code de v&eacute;rification</h1>
      <p class="text" style="margin: 0 0 24px; font-size: 15px; line-height: 1.7; color: #a1a1aa;">
        Bonjour${name ? ` <span class="name-highlight" style="color: #c7d2fe; font-weight: 500;">${name}</span>` : ''},<br><br>
        Utilisez le code ci-dessous pour confirmer votre action. Ne partagez jamais ce code avec qui que ce soit.
      </p>
      <div class="code-box" style="background: linear-gradient(135deg, rgba(99, 102, 241, 0.08), rgba(79, 70, 229, 0.04)); border: 1px solid rgba(99, 102, 241, 0.15); border-radius: 16px; padding: 28px; text-align: center; margin: 28px 0;">
        <p class="code-digits" style="margin: 0; font-size: 40px; font-weight: 800; color: #ffffff; letter-spacing: 12px; font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace;">${code}</p>
        <p class="code-label" style="margin: 12px 0 0; font-size: 12px; color: #6366f1; font-weight: 500; text-transform: uppercase; letter-spacing: 1.5px;">Code de s&eacute;curit&eacute;</p>
      </div>
      <p class="text-small" style="margin: 0 0 20px; font-size: 13px; line-height: 1.6; color: #71717a;">
        <span class="validity-tag" style="display: inline-block; padding: 4px 12px; background: rgba(99, 102, 241, 0.1); border: 1px solid rgba(99, 102, 241, 0.15); border-radius: 20px; font-size: 12px; color: #818cf8; font-weight: 500;">Valide 5 minutes</span>
      </p>
      <p class="text-small" style="margin: 0; font-size: 13px; line-height: 1.6; color: #71717a;">
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
      <div class="icon-badge icon-badge-blue" style="width: 56px; height: 56px; border-radius: 16px; display: block; margin-bottom: 24px; font-size: 28px; line-height: 56px; text-align: center; background: rgba(59, 130, 246, 0.12); border: 1px solid rgba(59, 130, 246, 0.2);">
        &#128101;
      </div>
      <h1 class="h1" style="margin: 0 0 12px; font-size: 22px; font-weight: 700; color: #ffffff;">Invitation &agrave; rejoindre une &eacute;quipe</h1>
      <p class="text" style="margin: 0 0 24px; font-size: 15px; line-height: 1.7; color: #a1a1aa;">
        <span class="name-highlight" style="color: #c7d2fe; font-weight: 500;">${inviterName}</span> vous invite &agrave; rejoindre son &eacute;quipe sur Faktur.
      </p>
      <div class="button-wrap" style="margin: 28px 0; text-align: center;">
        <a href="${inviteUrl}" class="button" style="display: inline-block; padding: 14px 36px; background: linear-gradient(135deg, #6366f1 0%, #4f46e5 50%, #4338ca 100%); color: #ffffff; text-align: center; text-decoration: none; font-weight: 600; font-size: 15px; border-radius: 12px;">Accepter l'invitation</a>
      </div>
      <div class="info-box" style="border-radius: 12px; padding: 16px 20px; margin: 24px 0; font-size: 14px; line-height: 1.6; background: rgba(59, 130, 246, 0.08); border: 1px solid rgba(59, 130, 246, 0.15); color: #60a5fa;">
        <span class="info-box-icon">&#128161;</span> Si vous n'avez pas encore de compte Faktur, vous pourrez en cr&eacute;er un apr&egrave;s avoir cliqu&eacute; sur le lien.
      </div>
      <div class="link-fallback" style="margin: 24px 0 0; padding: 16px 20px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 10px;">
        <p class="link-fallback-label" style="margin: 0 0 6px; font-size: 11px; color: #52525b; text-transform: uppercase; letter-spacing: 1px; font-weight: 500;">Ou copiez ce lien</p>
        <a href="${inviteUrl}" style="color: #818cf8; text-decoration: none; font-size: 13px; word-break: break-all; line-height: 1.5;">${inviteUrl}</a>
      </div>
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
      <div class="icon-badge icon-badge-green" style="width: 56px; height: 56px; border-radius: 16px; display: block; margin-bottom: 24px; font-size: 28px; line-height: 56px; text-align: center; background: rgba(34, 197, 94, 0.12); border: 1px solid rgba(34, 197, 94, 0.2);">
        &#9989;
      </div>
      <h1 class="h1" style="margin: 0 0 12px; font-size: 22px; font-weight: 700; color: #ffffff;">Double authentification activ&eacute;e</h1>
      <p class="text" style="margin: 0 0 24px; font-size: 15px; line-height: 1.7; color: #a1a1aa;">
        Bonjour${name ? ` <span class="name-highlight" style="color: #c7d2fe; font-weight: 500;">${name}</span>` : ''},<br><br>
        La double authentification (2FA) a &eacute;t&eacute; activ&eacute;e sur votre compte avec succ&egrave;s.
      </p>
      <div class="info-box info-box-green" style="border-radius: 12px; padding: 16px 20px; margin: 24px 0; font-size: 14px; line-height: 1.6; background: rgba(34, 197, 94, 0.08); border: 1px solid rgba(34, 197, 94, 0.15); color: #4ade80;">
        <span class="info-box-icon">&#128272;</span> Votre compte est d&eacute;sormais mieux prot&eacute;g&eacute;. Un code de v&eacute;rification vous sera demand&eacute; &agrave; chaque connexion.
      </div>
      <div class="info-box info-box-amber" style="border-radius: 12px; padding: 16px 20px; margin: 24px 0; font-size: 14px; line-height: 1.6; background: rgba(245, 158, 11, 0.08); border: 1px solid rgba(245, 158, 11, 0.15); color: #fbbf24;">
        <span class="info-box-icon">&#9888;&#65039;</span> Si vous n'&ecirc;tes pas &agrave; l'origine de cette modification, contactez le support imm&eacute;diatement.
      </div>
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
