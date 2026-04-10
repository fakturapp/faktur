import { wrapHtml, ctaButton, infoBox, linkFallback } from '#mails/helpers/email_template'

export class PaymentLinkNotification {
  private paymentUrl: string
  private invoiceNumber: string
  private amount: number
  private currency: string
  private clientName: string

  constructor(
    _email: string,
    paymentUrl: string,
    invoiceNumber: string,
    amount: number,
    currency: string,
    clientName: string
  ) {
    this.paymentUrl = paymentUrl
    this.invoiceNumber = invoiceNumber
    this.amount = amount
    this.currency = currency
    this.clientName = clientName
  }

  getSubject(): string {
    return `Facture ${this.invoiceNumber} — Lien de paiement`
  }

  getHtml(): string {
    const formattedAmount = new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: this.currency,
    }).format(this.amount)

    const content = `
      <h2 style="font-size: 20px; font-weight: 600; color: #171717; letter-spacing: -0.02em; margin: 0 0 12px;">
        Paiement de votre facture
      </h2>
      <p style="font-size: 14px; line-height: 1.7; color: #707070; margin: 0 0 16px;">
        Bonjour${this.clientName ? ` ${this.clientName}` : ''},
      </p>
      <p style="font-size: 14px; line-height: 1.7; color: #707070; margin: 0 0 16px;">
        Vous avez re&ccedil;u une facture <strong style="color: #171717;">${this.invoiceNumber}</strong> d&rsquo;un montant de <strong style="color: #171717;">${formattedAmount}</strong>.
      </p>
      <p style="font-size: 14px; line-height: 1.7; color: #707070; margin: 0 0 16px;">
        Cliquez sur le bouton ci-dessous pour acc&eacute;der aux instructions de paiement.
      </p>
      ${ctaButton(this.paymentUrl, 'Payer la facture')}
      ${infoBox('La facture est &eacute;galement jointe &agrave; cet email au format PDF.')}
      ${linkFallback(this.paymentUrl)}
    `

    return wrapHtml(content, this.getSubject())
  }

  getText(): string {
    const formattedAmount = new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: this.currency,
    }).format(this.amount)

    return `Paiement de votre facture\n\nBonjour${this.clientName ? ` ${this.clientName}` : ''},\n\nVous avez reçu une facture ${this.invoiceNumber} d'un montant de ${formattedAmount}.\n\nAccédez aux instructions de paiement :\n${this.paymentUrl}\n\nLa facture est également jointe à cet email au format PDF.`
  }
}
