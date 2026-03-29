import { BaseMail } from '@adonisjs/mail'
import {
  ctaButton,
  validityTag,
  linkFallback,
  wrapHtml,
  getFrontendUrl,
} from './helpers/email_template.js'

export default class VerifyEmailNotification extends BaseMail {
  subject = 'Vérifiez votre email - Faktur'

  constructor(
    email: string,
    private token: string,
    private name?: string
  ) {
    super()
    this.message.to(email)
  }

  prepare() {
    const verifyUrl = `${getFrontendUrl()}/verify-email?token=${this.token}`

    const content = `
      <h1 style="margin: 0 0 12px; font-size: 22px; font-weight: 700; color: #ffffff; letter-spacing: -0.3px; line-height: 1.3; text-align: center;">V&eacute;rifiez votre adresse email</h1>
      <p style="margin: 0 0 24px; font-size: 15px; line-height: 1.7; color: #a1a1aa; text-align: center;">
        Bonjour${this.name ? ` <span style="color: #c7d2fe; font-weight: 500;">${this.name}</span>` : ''},<br><br>
        Merci d'avoir rejoint Faktur ! Pour finaliser la cr&eacute;ation de votre compte, veuillez confirmer votre adresse email.
      </p>
      ${ctaButton(verifyUrl, 'V&eacute;rifier mon email')}
      ${validityTag('Valide 10 minutes')}
      ${linkFallback(verifyUrl)}
    `

    this.message.html(wrapHtml(content, 'Vérification email'))
    this.message.text(`Vérifiez votre email : ${verifyUrl}`)
  }
}
