import { BaseMail } from '@adonisjs/mail'
import { wrapHtml, ctaButton } from '#mails/helpers/email_template'

export class PaymentMarkedToCreator extends BaseMail {
  subject: string

  constructor(
    private email: string,
    private invoiceNumber: string,
    private amount: number,
    private currency: string,
    private invoiceUrl: string
  ) {
    super()
    this.subject = `Paiement reçu — Facture ${this.invoiceNumber}`
  }

  prepare() {
    const formattedAmount = new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: this.currency,
    }).format(this.amount)

    const content = `
      <h2 style="font-size: 20px; font-weight: 600; color: #171717; letter-spacing: -0.02em; margin: 0 0 12px;">
        Paiement signal&eacute;
      </h2>
      <p style="font-size: 14px; line-height: 1.7; color: #707070; margin: 0 0 16px;">
        Votre client a indiqu&eacute; avoir effectu&eacute; le paiement de la facture <strong style="color: #171717;">${this.invoiceNumber}</strong> d&rsquo;un montant de <strong style="color: #171717;">${formattedAmount}</strong>.
      </p>
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 24px 0;"><tr>
        <td style="border-radius: 14px; padding: 16px 20px; font-size: 14px; line-height: 1.6; background: #fef2f2; color: #dc2626;">
          &#9888;&#65039; Ce paiement n&rsquo;est pas encore confirm&eacute;. V&eacute;rifiez la r&eacute;ception sur votre compte bancaire puis confirmez le paiement.
        </td>
      </tr></table>
      ${ctaButton(this.invoiceUrl, 'Voir la facture et confirmer')}
    `

    const plainText = `Paiement signalé\n\nVotre client a indiqué avoir effectué le paiement de la facture ${this.invoiceNumber} d'un montant de ${formattedAmount}.\n\nVérifiez la réception sur votre compte bancaire puis confirmez le paiement :\n${this.invoiceUrl}`

    this.message.to(this.email)
    this.message.subject(this.subject)
    this.message.html(wrapHtml(content, this.subject))
    this.message.text(plainText)
  }
}
