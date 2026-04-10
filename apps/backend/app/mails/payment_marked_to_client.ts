import { BaseMail } from '@adonisjs/mail'
import { wrapHtml, infoBox } from '#mails/helpers/email_template'

export class PaymentMarkedToClient extends BaseMail {
  subject: string

  constructor(
    private email: string,
    private invoiceNumber: string,
    private clientName?: string
  ) {
    super()
    this.subject = `Paiement envoyé — Facture ${this.invoiceNumber}`
  }

  prepare() {
    const content = `
      <h2 style="font-size: 20px; font-weight: 600; color: #171717; letter-spacing: -0.02em; margin: 0 0 12px;">
        Paiement envoy&eacute;
      </h2>
      <p style="font-size: 14px; line-height: 1.7; color: #707070; margin: 0 0 16px;">
        Bonjour${this.clientName ? ` ${this.clientName}` : ''},
      </p>
      <p style="font-size: 14px; line-height: 1.7; color: #707070; margin: 0 0 16px;">
        Votre paiement pour la facture <strong style="color: #171717;">${this.invoiceNumber}</strong> a bien &eacute;t&eacute; signal&eacute;.
      </p>
      ${infoBox('Votre paiement est en attente de confirmation par le destinataire. Vous recevrez un email d&egrave;s que le paiement sera confirm&eacute;.')}
    `

    const plainText = `Paiement envoyé\n\nBonjour${this.clientName ? ` ${this.clientName}` : ''},\n\nVotre paiement pour la facture ${this.invoiceNumber} a bien été signalé.\n\nVotre paiement est en attente de confirmation par le destinataire. Vous recevrez un email dès que le paiement sera confirmé.`

    this.message.to(this.email)
    this.message.subject(this.subject)
    this.message.html(wrapHtml(content, this.subject))
    this.message.text(plainText)
  }
}
