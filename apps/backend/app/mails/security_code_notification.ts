import { BaseMail } from '@adonisjs/mail'
import { validityTag, wrapHtml } from './helpers/email_template.js'

export default class SecurityCodeNotification extends BaseMail {
  subject = 'Code de vérification - Faktur'

  constructor(
    email: string,
    private code: string,
    private name?: string
  ) {
    super()
    this.message.to(email)
  }

  prepare() {
    const content = `
      <h1 style="margin: 0 0 12px; font-size: 22px; font-weight: 700; color: #ffffff; letter-spacing: -0.3px; line-height: 1.3; text-align: center;">Code de v&eacute;rification</h1>
      <p style="margin: 0 0 24px; font-size: 15px; line-height: 1.7; color: #a1a1aa; text-align: center;">
        Bonjour${this.name ? ` <span style="color: #c7d2fe; font-weight: 500;">${this.name}</span>` : ''},<br><br>
        Utilisez le code ci-dessous pour confirmer votre action. Ne partagez jamais ce code avec qui que ce soit.
      </p>
      <div style="background: linear-gradient(135deg, rgba(99,102,241,0.08), rgba(79,70,229,0.04)); border: 1px solid rgba(99,102,241,0.15); border-radius: 16px; padding: 28px; text-align: center; margin: 28px 0;">
        <p style="margin: 0; font-size: 40px; font-weight: 800; color: #ffffff; letter-spacing: 12px; font-family: 'SF Mono', 'Fira Code', Consolas, monospace;">${this.code}</p>
        <p style="margin: 12px 0 0; font-size: 12px; color: #6366f1; font-weight: 500; text-transform: uppercase; letter-spacing: 1.5px;">Code de s&eacute;curit&eacute;</p>
      </div>
      ${validityTag('Valide 5 minutes')}
      <p style="margin: 20px 0 0; font-size: 13px; line-height: 1.6; color: #71717a; text-align: center;">
        Si vous n'avez pas demand&eacute; ce code, vous pouvez ignorer cet email en toute s&eacute;curit&eacute;.
      </p>
    `

    this.message.html(wrapHtml(content, 'Code de vérification'))
    this.message.text(`Votre code de vérification : ${this.code}`)
  }
}
