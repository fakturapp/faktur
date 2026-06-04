import { BaseMail } from '@adonisjs/mail'
import {
  wrapHtml,
  ctaButton,
  brandBadge,
  amountDisplay,
  detailRows,
  getFrontendUrl,
} from '#mails/helpers/email_template'

export class StripePaymentToCreator extends BaseMail {
  subject: string

  constructor(
    private email: string,
    private invoiceNumber: string,
    private amount: number,
    private currency: string,
    private invoiceUrl: string,
    private receiptUrl?: string | null
  ) {
    super()
    this.subject = `Paiement Stripe reçu — Facture ${this.invoiceNumber}`
  }

  prepare() {
    const formattedAmount = new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: this.currency,
    }).format(this.amount)

    const today = new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }).format(new Date())

    const rows: { label: string; value: string }[] = [
      { label: 'Facture', value: this.invoiceNumber },
      { label: 'Date', value: today },
      { label: 'Montant', value: formattedAmount },
      { label: 'Source', value: 'Stripe (carte bancaire)' },
    ]

    const content = `
      ${brandBadge('Faktur', `${getFrontendUrl()}/logo.svg`)}
      ${amountDisplay(formattedAmount, 'Re&ccedil;u via Stripe')}
      ${detailRows(rows)}
      ${ctaButton(this.invoiceUrl, 'Voir la facture')}
      ${this.receiptUrl ? `<table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 16px 0 0;"><tr><td align="center"><a href="${this.receiptUrl}" style="color: #5957e8; text-decoration: none; font-size: 13px; font-weight: 500;">Voir le re&ccedil;u Stripe</a></td></tr></table>` : ''}
      <p style="margin: 20px 0 0; font-size: 13px; line-height: 1.6; color: #a3a3a3; text-align: center;">
        Ce paiement a &eacute;t&eacute; <strong style="color: #171717;">automatiquement confirm&eacute;</strong> par Stripe. La facture a &eacute;t&eacute; marqu&eacute;e comme pay&eacute;e.
      </p>
    `

    const plainText = `Paiement Stripe reçu\n\nUn paiement par carte bancaire de ${formattedAmount} a été reçu pour la facture ${this.invoiceNumber}.\n\nCe paiement a été automatiquement confirmé par Stripe. La facture a été marquée comme payée.\n\n${this.invoiceUrl}${this.receiptUrl ? `\n\nReçu Stripe : ${this.receiptUrl}` : ''}`

    this.message.to(this.email)
    this.message.subject(this.subject)
    this.message.html(wrapHtml(content, this.subject))
    this.message.text(plainText)
  }
}
