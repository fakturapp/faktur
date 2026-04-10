import { BaseMail } from '@adonisjs/mail'
import { wrapHtml } from './helpers/email_template.js'
import zeroAccessCryptoService from '#services/crypto/zero_access_crypto_service'

export default class RecoveryKeyNotification extends BaseMail {
  subject = 'Votre clef de secours - Faktur'

  constructor(
    email: string,
    private recoveryKey: string,
    private name?: string
  ) {
    super()
    this.message.to(email)
  }

  prepare() {
    const formatted = zeroAccessCryptoService.formatRecoveryKey(this.recoveryKey)

    const content = `
      <h2 style="font-size: 20px; font-weight: 600; color: #171717; letter-spacing: -0.02em; margin: 0 0 12px; text-align: center;">Votre clef de secours</h2>
      <p style="font-size: 14px; line-height: 1.7; color: #707070; margin: 0 0 16px; text-align: center;">
        Bonjour${this.name ? ` <span style="color: #5957e8; font-weight: 600;">${this.name}</span>` : ''},<br><br>
        Voici votre clef de secours pour r&eacute;cup&eacute;rer vos donn&eacute;es chiffr&eacute;es en cas de perte de mot de passe.
      </p>

      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 24px 0;">
        <tr><td align="center">
          <div style="display: inline-block; padding: 16px 24px; background: #f5f5f5; border: 2px dashed rgba(89,87,232,0.25); border-radius: 14px; font-family: 'Courier New', Courier, monospace; font-size: 16px; font-weight: 700; color: #171717; letter-spacing: 1px; word-break: break-all;">
            ${formatted}
          </div>
        </td></tr>
      </table>

      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 24px 0;"><tr>
        <td style="border-radius: 14px; padding: 16px 20px; font-size: 14px; line-height: 1.6; background: #f0fdf4; color: #16a34a;">
          Conservez cette clef dans un endroit s&ucirc;r (gestionnaire de mots de passe, coffre-fort, etc.). Elle vous permettra de r&eacute;cup&eacute;rer vos donn&eacute;es si vous perdez votre mot de passe.
        </td>
      </tr></table>
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 24px 0;"><tr>
        <td style="border-radius: 14px; padding: 16px 20px; font-size: 14px; line-height: 1.6; background: #fef2f2; color: #dc2626;">
          Cette clef ne sera <strong>plus jamais affich&eacute;e</strong>. Faktur ne la stocke pas et ne peut pas la r&eacute;cup&eacute;rer pour vous.
        </td>
      </tr></table>
    `

    this.message.html(wrapHtml(content, 'Clef de secours'))
    this.message.text(
      `Votre clef de secours Faktur : ${formatted}\n\nConservez cette clef dans un endroit sûr. Elle ne sera plus jamais affichée.`
    )
  }
}
