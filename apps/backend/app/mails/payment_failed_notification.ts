import { BaseMail } from '@adonisjs/mail'
import { wrapHtml, ctaButton, getFrontendUrl } from '#mails/helpers/email_template'

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
    const content = `
      <h2 style="font-size: 20px; font-weight: 600; color: #171717; letter-spacing: -0.02em; margin: 0 0 12px;">
        Votre paiement a &eacute;chou&eacute;
      </h2>
      <p style="font-size: 14px; line-height: 1.7; color: #707070; margin: 0 0 16px;">
        Bonjour${this.name ? ` ${this.name}` : ''},
      </p>
      <p style="font-size: 14px; line-height: 1.7; color: #707070; margin: 0 0 16px;">
        Le dernier paiement de l&rsquo;abonnement de votre &eacute;quipe
        <strong style="color: #171717;">${this.teamName}</strong> n&rsquo;a pas pu &ecirc;tre pr&eacute;lev&eacute;.
      </p>
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 24px 0;"><tr>
        <td style="border-radius: 14px; padding: 16px 20px; font-size: 14px; line-height: 1.6; background: #fef2f2; color: #b91c1c;">
          Vous avez jusqu&rsquo;au <strong>${this.graceDate}</strong> pour r&eacute;gulariser votre paiement.
          Pass&eacute; ce d&eacute;lai, votre &eacute;quipe repassera automatiquement au plan Gratuit.
        </td>
      </tr></table>
      ${ctaButton(url, 'Régulariser le paiement')}
    `

    const plainText = `Votre paiement a échoué\n\nBonjour${this.name ? ` ${this.name}` : ''},\n\nLe dernier paiement de l'abonnement de votre équipe ${this.teamName} n'a pas pu être prélevé.\n\nVous avez jusqu'au ${this.graceDate} pour régulariser. Passé ce délai, votre équipe repassera automatiquement au plan Gratuit.\n\nRégulariser : ${url}`

    this.message.to(this.email)
    this.message.subject(this.subject)
    this.message.html(wrapHtml(content, this.subject))
    this.message.text(plainText)
  }
}
