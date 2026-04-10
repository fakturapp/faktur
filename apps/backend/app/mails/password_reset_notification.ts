import { BaseMail } from '@adonisjs/mail'
import {
  ctaButton,
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
      <h2 style="font-size: 20px; font-weight: 600; color: #171717; letter-spacing: -0.02em; margin: 0 0 12px; text-align: center;">R&eacute;initialisez votre mot de passe</h2>
      <p style="font-size: 14px; line-height: 1.7; color: #707070; margin: 0 0 16px; text-align: center;">
        Bonjour${this.name ? ` <span style="color: #5957e8; font-weight: 600;">${this.name}</span>` : ''},<br><br>
        Nous avons re&ccedil;u une demande de r&eacute;initialisation de votre mot de passe. Cliquez sur le bouton ci-dessous pour en choisir un nouveau.
      </p>
      ${ctaButton(resetUrl, 'R&eacute;initialiser le mot de passe')}
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 24px 0;"><tr>
        <td style="border-radius: 14px; padding: 16px 20px; font-size: 14px; line-height: 1.6; background: #fef2f2; color: #dc2626;">
          Si vous n'&ecirc;tes pas &agrave; l'origine de cette demande, ignorez cet email. Votre mot de passe restera inchang&eacute;.
        </td>
      </tr></table>
      ${validityTag('Valide 10 minutes')}
      ${linkFallback(resetUrl)}
    `

    this.message.html(wrapHtml(content, 'Réinitialisation mot de passe'))
    this.message.text(`Réinitialisez votre mot de passe : ${resetUrl}`)
  }
}
