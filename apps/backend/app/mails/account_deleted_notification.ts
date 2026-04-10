import { BaseMail } from '@adonisjs/mail'
import { wrapHtml } from './helpers/email_template.js'

export default class AccountDeletedNotification extends BaseMail {
  subject = 'Compte supprimé - Faktur'

  constructor(
    email: string,
    private name?: string
  ) {
    super()
    this.message.to(email)
  }

  prepare() {
    const content = `
      <h2 style="font-size: 20px; font-weight: 600; color: #171717; letter-spacing: -0.02em; margin: 0 0 12px; text-align: center;">Compte supprim&eacute;</h2>
      <p style="font-size: 14px; line-height: 1.7; color: #707070; margin: 0 0 16px; text-align: center;">
        Bonjour${this.name ? ` <span style="color: #5957e8; font-weight: 600;">${this.name}</span>` : ''},<br><br>
        Votre compte Faktur a &eacute;t&eacute; supprim&eacute; d&eacute;finitivement conform&eacute;ment &agrave; votre demande. Toutes vos donn&eacute;es ont &eacute;t&eacute; effac&eacute;es.
      </p>
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 24px 0;"><tr>
        <td style="border-radius: 14px; padding: 16px 20px; font-size: 14px; line-height: 1.6; background: #fef2f2; color: #dc2626;">
          Si vous n'&ecirc;tes pas &agrave; l'origine de cette suppression, contactez le support imm&eacute;diatement.
        </td>
      </tr></table>
      <p style="margin: 24px 0 0; font-size: 13px; line-height: 1.7; color: #a3a3a3; text-align: center;">
        Merci d'avoir utilis&eacute; Faktur. Vous pouvez recr&eacute;er un compte &agrave; tout moment.
      </p>
    `

    this.message.html(wrapHtml(content, 'Compte supprimé'))
    this.message.text(
      'Votre compte Faktur a été supprimé définitivement. Toutes vos données ont été effacées.'
    )
  }
}
