import { BaseMail } from '@adonisjs/mail'
import { ctaButton, infoBox, linkFallback, wrapHtml } from './helpers/email_template.js'

export default class TeamInviteNotification extends BaseMail {
  constructor(
    email: string,
    private inviterName: string,
    private inviteUrl: string
  ) {
    super()
    this.message.to(email)
    this.subject = `${inviterName} vous invite sur Faktur`
  }

  prepare() {
    const content = `
      <h1 style="margin: 0 0 12px; font-size: 22px; font-weight: 700; color: #ffffff; letter-spacing: -0.3px; line-height: 1.3; text-align: center;">Invitation &agrave; rejoindre une &eacute;quipe</h1>
      <p style="margin: 0 0 24px; font-size: 15px; line-height: 1.7; color: #a1a1aa; text-align: center;">
        <span style="color: #c7d2fe; font-weight: 500;">${this.inviterName}</span> vous invite &agrave; rejoindre son &eacute;quipe sur Faktur.
      </p>
      ${ctaButton(this.inviteUrl, "Accepter l'invitation")}
      ${infoBox("Si vous n'avez pas encore de compte Faktur, vous pourrez en cr&eacute;er un apr&egrave;s avoir cliqu&eacute; sur le lien.", 'rgba(59,130,246,0.08)', 'rgba(59,130,246,0.15)', '#60a5fa')}
      ${linkFallback(this.inviteUrl)}
    `

    this.message.html(wrapHtml(content, 'Invitation équipe'))
    this.message.text(
      `${this.inviterName} vous invite à rejoindre son équipe sur Faktur : ${this.inviteUrl}`
    )
  }
}
