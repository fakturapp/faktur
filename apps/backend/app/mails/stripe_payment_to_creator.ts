import { BaseMail } from '@adonisjs/mail'
import { wrapHtml, ctaButton } from '#mails/helpers/email_template'

export class StripePaymentToCreator extends BaseMail {
  subject: string

  constructor(
    private email: string,
    private invoiceNumber: string,
    private amount: number,
    private currency: string,
    private invoiceUrl: string
  ) {
    super()
    this.subject = `Paiement Stripe reçu — Facture ${this.invoiceNumber}`
  }

  prepare() {
    const formattedAmount = new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: this.currency,
    }).format(this.amount)

    const content = `
      <h2 style="font-size: 20px; font-weight: 600; color: #171717; letter-spacing: -0.02em; margin: 0 0 12px;">
        Paiement re&ccedil;u par Stripe
      </h2>
      <p style="font-size: 14px; line-height: 1.7; color: #707070; margin: 0 0 16px;">
        Un paiement par carte bancaire de <strong style="color: #171717;">${formattedAmount}</strong> a &eacute;t&eacute; re&ccedil;u pour la facture <strong style="color: #171717;">${this.invoiceNumber}</strong>.
      </p>
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 24px 0;"><tr>
        <td style="border-radius: 14px; padding: 16px 20px; font-size: 14px; line-height: 1.6; background: #f0fdf4; color: #16a34a;">
          &#10003; Ce paiement a &eacute;t&eacute; <strong>automatiquement confirm&eacute;</strong> par Stripe. La facture a &eacute;t&eacute; marqu&eacute;e comme pay&eacute;e. Aucune action n&eacute;cessaire de votre part.
        </td>
      </tr></table>
      ${ctaButton(this.invoiceUrl, 'Voir la facture')}
    `

    const plainText = `Paiement Stripe reçu\n\nUn paiement par carte bancaire de ${formattedAmount} a été reçu pour la facture ${this.invoiceNumber}.\n\nCe paiement a été automatiquement confirmé par Stripe. La facture a été marquée comme payée.\n\n${this.invoiceUrl}`

    this.message.to(this.email)
    this.message.subject(this.subject)
    this.message.html(wrapHtml(content, this.subject))
    this.message.text(plainText)
  }
}
