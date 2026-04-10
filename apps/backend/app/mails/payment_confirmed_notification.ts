import { BaseMail } from '@adonisjs/mail'
import { wrapHtml } from '#mails/helpers/email_template'

export class PaymentConfirmedNotification extends BaseMail {
  subject: string

  constructor(
    private email: string,
    private invoiceNumber: string,
    private clientName?: string
  ) {
    super()
    this.subject = `Paiement confirmé — Facture ${this.invoiceNumber}`
  }

  prepare() {
    const content = `
      <h2 style="font-size: 20px; font-weight: 600; color: #171717; letter-spacing: -0.02em; margin: 0 0 12px;">
        Paiement confirm&eacute;
      </h2>
      <p style="font-size: 14px; line-height: 1.7; color: #707070; margin: 0 0 16px;">
        Bonjour${this.clientName ? ` ${this.clientName}` : ''},
      </p>
      <p style="font-size: 14px; line-height: 1.7; color: #707070; margin: 0 0 16px;">
        Le paiement de votre facture <strong style="color: #171717;">${this.invoiceNumber}</strong> a &eacute;t&eacute; confirm&eacute; par le destinataire.
      </p>
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 24px 0;"><tr>
        <td style="border-radius: 14px; padding: 16px 20px; font-size: 14px; line-height: 1.6; background: #f0fdf4; color: #16a34a;">
          &#10003; Tout est en ordre. Aucune action suppl&eacute;mentaire n&rsquo;est n&eacute;cessaire de votre part.
        </td>
      </tr></table>
    `

    const plainText = `Paiement confirmé\n\nBonjour${this.clientName ? ` ${this.clientName}` : ''},\n\nLe paiement de votre facture ${this.invoiceNumber} a été confirmé par le destinataire.\n\nTout est en ordre. Aucune action supplémentaire n'est nécessaire de votre part.`

    this.message.to(this.email)
    this.message.subject(this.subject)
    this.message.html(wrapHtml(content, this.subject))
    this.message.text(plainText)
  }
}
