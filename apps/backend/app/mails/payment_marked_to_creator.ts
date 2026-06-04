import { BaseMail } from '@adonisjs/mail'
import {
  wrapHtml,
  ctaButton,
  brandBadge,
  amountDisplay,
  detailRows,
  getFrontendUrl,
} from '#mails/helpers/email_template'

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

    const today = new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }).format(new Date())

    const rows: { label: string; value: string }[] = [
      { label: 'Facture', value: this.invoiceNumber },
      { label: 'Date signal&eacute;', value: today },
      { label: 'Montant', value: formattedAmount },
      { label: 'Statut', value: 'En attente de confirmation' },
    ]

    const content = `
      ${brandBadge('Faktur', `${getFrontendUrl()}/logo.svg`)}
      ${amountDisplay(formattedAmount, 'Paiement signal&eacute; par le client')}
      ${detailRows(rows)}
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 0 0 4px;"><tr>
        <td style="border-radius: 14px; padding: 16px 20px; font-size: 14px; line-height: 1.6; background: #fef2f2; color: #dc2626;">
          Ce paiement n&rsquo;est pas encore confirm&eacute;. V&eacute;rifiez la r&eacute;ception sur votre compte bancaire puis confirmez le paiement.
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
