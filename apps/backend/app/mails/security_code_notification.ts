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
      <h2 style="font-size: 20px; font-weight: 600; color: #171717; letter-spacing: -0.02em; margin: 0 0 12px; text-align: center;">Code de v&eacute;rification</h2>
      <p style="font-size: 14px; line-height: 1.7; color: #707070; margin: 0 0 16px; text-align: center;">
        Bonjour${this.name ? ` <span style="color: #5957e8; font-weight: 600;">${this.name}</span>` : ''},<br><br>
        Utilisez le code ci-dessous pour confirmer votre action. Ne partagez jamais ce code avec qui que ce soit.
      </p>
      <div style="background: #f5f5f5; border-radius: 14px; padding: 20px; text-align: center; margin: 28px 0;">
        <p style="margin: 0; font-size: 32px; font-weight: 700; letter-spacing: 0.15em; color: #171717; font-family: 'SF Mono', 'Fira Code', Consolas, monospace;">${this.code}</p>
        <p style="margin: 12px 0 0; font-size: 12px; color: #5957e8; font-weight: 500; text-transform: uppercase; letter-spacing: 1.5px;">Code de s&eacute;curit&eacute;</p>
      </div>
      ${validityTag('Valide 5 minutes')}
      <p style="margin: 20px 0 0; font-size: 13px; line-height: 1.6; color: #a3a3a3; text-align: center;">
        Si vous n'avez pas demand&eacute; ce code, vous pouvez ignorer cet email en toute s&eacute;curit&eacute;.
      </p>
    `

    this.message.html(wrapHtml(content, 'Code de vérification'))
    this.message.text(`Votre code de vérification : ${this.code}`)
  }
}
