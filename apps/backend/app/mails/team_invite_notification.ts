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
      <h2 style="font-size: 20px; font-weight: 600; color: #171717; letter-spacing: -0.02em; margin: 0 0 12px; text-align: center;">Invitation &agrave; rejoindre une &eacute;quipe</h2>
      <p style="font-size: 14px; line-height: 1.7; color: #707070; margin: 0 0 16px; text-align: center;">
        <span style="color: #5957e8; font-weight: 600;">${this.inviterName}</span> vous invite &agrave; rejoindre son &eacute;quipe sur Faktur.
      </p>
      ${ctaButton(this.inviteUrl, "Accepter l'invitation")}
      ${infoBox("Si vous n'avez pas encore de compte Faktur, vous pourrez en cr&eacute;er un apr&egrave;s avoir cliqu&eacute; sur le lien.")}
      ${linkFallback(this.inviteUrl)}
    `

    this.message.html(wrapHtml(content, 'Invitation équipe'))
    this.message.text(
      `${this.inviterName} vous invite à rejoindre son équipe sur Faktur : ${this.inviteUrl}`
    )
  }
}
