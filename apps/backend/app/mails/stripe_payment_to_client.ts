import { BaseMail } from '@adonisjs/mail'
import {
  wrapHtml,
  ctaButton,
  brandBadge,
  amountDisplay,
  detailRows,
  getFrontendUrl,
} from '#mails/helpers/email_template'

export class StripePaymentToClient extends BaseMail {
  subject: string

  constructor(
    private email: string,
    private invoiceNumber: string,
    private amount: number,
    private currency: string,
    private clientName?: string,
    private receiptUrl?: string | null
  ) {
    super()
    this.subject = `Paiement confirmé — Facture ${this.invoiceNumber}`
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
    ]
    if (this.clientName) {
      rows.push({ label: 'Client', value: this.clientName })
    }
    rows.push({ label: 'Montant', value: formattedAmount })

    const content = `
      ${brandBadge('Faktur', `${getFrontendUrl()}/logo.svg`)}
      ${amountDisplay(formattedAmount, 'Paiement confirm&eacute; par carte')}
      ${detailRows(rows)}
      ${this.receiptUrl ? ctaButton(this.receiptUrl, 'Voir le re&ccedil;u Stripe') : ''}
      <p style="margin: 20px 0 0; font-size: 13px; line-height: 1.6; color: #a3a3a3; text-align: center;">
        Merci pour votre paiement. Ce re&ccedil;u fait foi.
      </p>
    `

    const plainText = `Paiement confirmé\n\nBonjour${this.clientName ? ` ${this.clientName}` : ''},\n\nVotre paiement de ${formattedAmount} par carte bancaire pour la facture ${this.invoiceNumber} a été traité avec succès.${this.receiptUrl ? `\n\nVotre reçu Stripe : ${this.receiptUrl}` : ''}\n\nTout est en ordre.`

    this.message.to(this.email)
    this.message.subject(this.subject)
    this.message.html(wrapHtml(content, this.subject))
    this.message.text(plainText)
  }
}
