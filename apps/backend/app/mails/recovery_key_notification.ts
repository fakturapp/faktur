import { BaseMail } from '@adonisjs/mail'
import { infoBox, wrapHtml } from './helpers/email_template.js'
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
      <h1 style="margin: 0 0 12px; font-size: 22px; font-weight: 700; color: #ffffff; letter-spacing: -0.3px; line-height: 1.3; text-align: center;">Votre clef de secours</h1>
      <p style="margin: 0 0 24px; font-size: 15px; line-height: 1.7; color: #a1a1aa; text-align: center;">
        Bonjour${this.name ? ` <span style="color: #c7d2fe; font-weight: 500;">${this.name}</span>` : ''},<br><br>
        Voici votre clef de secours pour r&eacute;cup&eacute;rer vos donn&eacute;es chiffr&eacute;es en cas de perte de mot de passe.
      </p>

      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 24px 0;">
        <tr><td align="center">
          <div style="display: inline-block; padding: 16px 24px; background: rgba(99,102,241,0.08); border: 2px dashed rgba(99,102,241,0.3); border-radius: 12px; font-family: 'Courier New', Courier, monospace; font-size: 16px; font-weight: 700; color: #c7d2fe; letter-spacing: 1px; word-break: break-all;">
            ${formatted}
          </div>
        </td></tr>
      </table>

      ${infoBox('Conservez cette clef dans un endroit s&ucirc;r (gestionnaire de mots de passe, coffre-fort, etc.). Elle vous permettra de r&eacute;cup&eacute;rer vos donn&eacute;es si vous perdez votre mot de passe.', 'rgba(34,197,94,0.08)', 'rgba(34,197,94,0.15)', '#4ade80')}
      ${infoBox('Cette clef ne sera <strong>plus jamais affich&eacute;e</strong>. Faktur ne la stocke pas et ne peut pas la r&eacute;cup&eacute;rer pour vous.', 'rgba(245,158,11,0.08)', 'rgba(245,158,11,0.15)', '#fbbf24')}
    `

    this.message.html(wrapHtml(content, 'Clef de secours'))
    this.message.text(
      `Votre clef de secours Faktur : ${formatted}\n\nConservez cette clef dans un endroit sûr. Elle ne sera plus jamais affichée.`
    )
  }
}
