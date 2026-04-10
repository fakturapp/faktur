import { BaseMail } from '@adonisjs/mail'
import { wrapHtml } from './helpers/email_template.js'

export default class TwoFactorEnabledNotification extends BaseMail {
  subject = '2FA activée - Faktur'

  constructor(
    email: string,
    private name?: string
  ) {
    super()
    this.message.to(email)
  }

  prepare() {
    const content = `
      <h2 style="font-size: 20px; font-weight: 600; color: #171717; letter-spacing: -0.02em; margin: 0 0 12px; text-align: center;">Double authentification activ&eacute;e</h2>
      <p style="font-size: 14px; line-height: 1.7; color: #707070; margin: 0 0 16px; text-align: center;">
        Bonjour${this.name ? ` <span style="color: #5957e8; font-weight: 600;">${this.name}</span>` : ''},<br><br>
        La double authentification (2FA) a &eacute;t&eacute; activ&eacute;e sur votre compte avec succ&egrave;s.
      </p>
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 24px 0;"><tr>
        <td style="border-radius: 14px; padding: 16px 20px; font-size: 14px; line-height: 1.6; background: #f0fdf4; color: #16a34a;">
          Votre compte est d&eacute;sormais mieux prot&eacute;g&eacute;. Un code de v&eacute;rification vous sera demand&eacute; &agrave; chaque connexion.
        </td>
      </tr></table>
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 24px 0;"><tr>
        <td style="border-radius: 14px; padding: 16px 20px; font-size: 14px; line-height: 1.6; background: #fef2f2; color: #dc2626;">
          Si vous n'&ecirc;tes pas &agrave; l'origine de cette modification, contactez le support imm&eacute;diatement.
        </td>
      </tr></table>
    `

    this.message.html(wrapHtml(content, '2FA activée'))
    this.message.text('La double authentification a été activée sur votre compte Faktur.')
  }
}
