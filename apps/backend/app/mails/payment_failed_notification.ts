import { BaseMail } from '@adonisjs/mail'
import { wrapHtml, ctaButton, detailRows, getFrontendUrl } from '#mails/helpers/email_template'

export class PaymentFailedNotification extends BaseMail {
  subject = 'Paiement échoué — action requise sous 7 jours'

  constructor(
    private email: string,
    private teamName: string,
    private graceDate: string,
    private name?: string
  ) {
    super()
  }

  prepare() {
    const url = `${getFrontendUrl()}/dashboard/settings/plan?recover=1`

    const rows: { label: string; value: string }[] = [
      { label: '&Eacute;quipe', value: this.teamName },
      { label: 'Limite pour r&eacute;gulariser', value: this.graceDate },
    ]

    const content = `
      <h2 style="font-size: 20px; font-weight: 600; color: #171717; letter-spacing: -0.02em; margin: 0 0 8px; text-align: center;">Paiement &eacute;chou&eacute;</h2>
      <p style="font-size: 14px; line-height: 1.7; color: #707070; margin: 0 0 24px; text-align: center;">
        ${this.name ? `Bonjour <span style="color: #5957e8; font-weight: 600;">${this.name}</span>,<br>` : ''}
        Le dernier pr&eacute;l&egrave;vement de l&rsquo;abonnement de votre &eacute;quipe n&rsquo;a pas pu &ecirc;tre effectu&eacute;.
      </p>
      ${detailRows(rows)}
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 0 0 4px;"><tr>
        <td style="border-radius: 14px; padding: 16px 20px; font-size: 14px; line-height: 1.6; background: #fef2f2; color: #b91c1c;">
          Pass&eacute; le <strong>${this.graceDate}</strong>, votre &eacute;quipe repassera automatiquement au plan Gratuit.
        </td>
      </tr></table>
      ${ctaButton(url, 'R&eacute;gulariser le paiement')}
    `

    const plainText = `Votre paiement a échoué\n\nBonjour${this.name ? ` ${this.name}` : ''},\n\nLe dernier paiement de l'abonnement de votre équipe ${this.teamName} n'a pas pu être prélevé.\n\nVous avez jusqu'au ${this.graceDate} pour régulariser. Passé ce délai, votre équipe repassera automatiquement au plan Gratuit.\n\nRégulariser : ${url}`

    this.message.to(this.email)
    this.message.subject(this.subject)
    this.message.html(wrapHtml(content, this.subject))
    this.message.text(plainText)
  }
}
