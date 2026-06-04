import { BaseMail } from '@adonisjs/mail'
import { wrapHtml, infoBox, detailRows } from '#mails/helpers/email_template'

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
    const today = new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }).format(new Date())

    const rows: { label: string; value: string }[] = [
      { label: 'Facture', value: this.invoiceNumber },
      { label: 'Date signal&eacute;', value: today },
    ]
    if (this.clientName) {
      rows.push({ label: 'Client', value: this.clientName })
    }

    const content = `
      <h2 style="font-size: 20px; font-weight: 600; color: #171717; letter-spacing: -0.02em; margin: 0 0 8px; text-align: center;">Paiement signal&eacute;</h2>
      <p style="font-size: 14px; line-height: 1.7; color: #707070; margin: 0 0 24px; text-align: center;">
        ${this.clientName ? `Bonjour <span style="color: #5957e8; font-weight: 600;">${this.clientName}</span>,<br>` : ''}
        Votre paiement pour la facture <strong style="color: #171717;">${this.invoiceNumber}</strong> a bien &eacute;t&eacute; signal&eacute;.
      </p>
      ${detailRows(rows)}
      ${infoBox('Votre paiement est en attente de confirmation par le destinataire. Vous recevrez un email d&egrave;s que le paiement sera confirm&eacute;.')}
    `

    const plainText = `Paiement envoyé\n\nBonjour${this.clientName ? ` ${this.clientName}` : ''},\n\nVotre paiement pour la facture ${this.invoiceNumber} a bien été signalé.\n\nVotre paiement est en attente de confirmation par le destinataire. Vous recevrez un email dès que le paiement sera confirmé.`

    this.message.to(this.email)
    this.message.subject(this.subject)
    this.message.html(wrapHtml(content, this.subject))
    this.message.text(plainText)
  }
}
