import {
  wrapHtml,
  ctaButton,
  infoBox,
  linkFallback,
  brandBadge,
  amountDisplay,
  detailRows,
  getFrontendUrl,
} from '#mails/helpers/email_template'

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
      rows.push({ label: 'Destinataire', value: this.clientName })
    }
    rows.push({ label: 'Montant d&ucirc;', value: formattedAmount })

    const content = `
      ${brandBadge('Faktur', `${getFrontendUrl()}/logo.svg`)}
      ${amountDisplay(formattedAmount, 'Montant &agrave; r&eacute;gler')}
      ${detailRows(rows)}
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
