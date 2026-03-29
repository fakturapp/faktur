import { BaseMail } from '@adonisjs/mail'
import {
  ctaButton,
  infoBox,
  validityTag,
  linkFallback,
  wrapHtml,
  getFrontendUrl,
} from './helpers/email_template.js'

export default class PasswordResetNotification extends BaseMail {
  subject = 'Réinitialisation du mot de passe - Faktur'

  constructor(
    email: string,
    private token: string,
    private name?: string
  ) {
    super()
    this.message.to(email)
  }

  prepare() {
    const resetUrl = `${getFrontendUrl()}/reset-password?token=${this.token}`

    const content = `
      <h1 style="margin: 0 0 12px; font-size: 22px; font-weight: 700; color: #ffffff; letter-spacing: -0.3px; line-height: 1.3; text-align: center;">R&eacute;initialisez votre mot de passe</h1>
      <p style="margin: 0 0 24px; font-size: 15px; line-height: 1.7; color: #a1a1aa; text-align: center;">
        Bonjour${this.name ? ` <span style="color: #c7d2fe; font-weight: 500;">${this.name}</span>` : ''},<br><br>
        Nous avons re&ccedil;u une demande de r&eacute;initialisation de votre mot de passe. Cliquez sur le bouton ci-dessous pour en choisir un nouveau.
      </p>
      ${ctaButton(resetUrl, 'R&eacute;initialiser le mot de passe')}
      ${infoBox("Si vous n'&ecirc;tes pas &agrave; l'origine de cette demande, ignorez cet email. Votre mot de passe restera inchang&eacute;.", 'rgba(245,158,11,0.08)', 'rgba(245,158,11,0.15)', '#fbbf24')}
      ${validityTag('Valide 10 minutes')}
      ${linkFallback(resetUrl)}
    `

    this.message.html(wrapHtml(content, 'Réinitialisation mot de passe'))
    this.message.text(`Réinitialisez votre mot de passe : ${resetUrl}`)
  }
}
