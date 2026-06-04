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
      <h2 style="font-size: 20px; font-weight: 600; color: #171717; letter-spacing: -0.02em; margin: 0 0 8px; text-align: center;">V&eacute;rifiez votre adresse email</h2>
      <p style="font-size: 14px; line-height: 1.7; color: #707070; margin: 0 0 4px; text-align: center;">
        ${this.name ? `Bonjour <span style="color: #5957e8; font-weight: 600;">${this.name}</span>,` : 'Bienvenue sur Faktur,'}
      </p>
      <p style="font-size: 14px; line-height: 1.7; color: #707070; margin: 0 0 4px; text-align: center;">
        Merci d&rsquo;avoir rejoint Faktur&nbsp;! Pour finaliser la cr&eacute;ation de votre compte, veuillez confirmer votre adresse email.
      </p>
      ${ctaButton(verifyUrl, 'V&eacute;rifier mon email')}
      ${validityTag('Valide 10 minutes')}
      ${linkFallback(verifyUrl)}
    `

    this.message.html(wrapHtml(content, 'Vérification email'))
    this.message.text(`Vérifiez votre email : ${verifyUrl}`)
  }
}
