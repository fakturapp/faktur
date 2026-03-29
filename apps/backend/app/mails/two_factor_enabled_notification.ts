import { BaseMail } from '@adonisjs/mail'
import { infoBox, wrapHtml } from './helpers/email_template.js'

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
      <h1 style="margin: 0 0 12px; font-size: 22px; font-weight: 700; color: #ffffff; letter-spacing: -0.3px; line-height: 1.3; text-align: center;">Double authentification activ&eacute;e</h1>
      <p style="margin: 0 0 24px; font-size: 15px; line-height: 1.7; color: #a1a1aa; text-align: center;">
        Bonjour${this.name ? ` <span style="color: #c7d2fe; font-weight: 500;">${this.name}</span>` : ''},<br><br>
        La double authentification (2FA) a &eacute;t&eacute; activ&eacute;e sur votre compte avec succ&egrave;s.
      </p>
      ${infoBox('Votre compte est d&eacute;sormais mieux prot&eacute;g&eacute;. Un code de v&eacute;rification vous sera demand&eacute; &agrave; chaque connexion.', 'rgba(34,197,94,0.08)', 'rgba(34,197,94,0.15)', '#4ade80')}
      ${infoBox("Si vous n'&ecirc;tes pas &agrave; l'origine de cette modification, contactez le support imm&eacute;diatement.", 'rgba(245,158,11,0.08)', 'rgba(245,158,11,0.15)', '#fbbf24')}
    `

    this.message.html(wrapHtml(content, '2FA activée'))
    this.message.text('La double authentification a été activée sur votre compte Faktur.')
  }
}
