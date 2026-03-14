export interface InvoiceTranslations {
  quote: string
  quoteNumber: string
  date: string
  validity: string
  issuer: string
  recipient: string
  deliveryAddress: string
  subject: string
  designation: string
  qty: string
  unit: string
  unitPriceHT: string
  vat: string
  amountHT: string
  totalHT: string
  totalTTC: string
  discount: string
  discountPercent: (v: number) => string
  vatRate: (r: number) => string
  vatBase: (base: string) => string
  conditionsAndNotes: string
  noNotes: string
  acceptanceConditions: string
  signatureIssuer: string
  signatureClient: string
  paymentMethods: string
  bankTransfer: string
  check: string
  cash: string
  clickToSelectClient: string
  clickToEdit: string
  sectionTitle: string
  description: string
  addLine: string
  addSection: string
  na: string
  notProvided: string
  society: string
  address: string
  phone: string
  email: string
  postalCode: string
  city: string
}

const fr: InvoiceTranslations = {
  quote: 'Devis',
  quoteNumber: 'N\u00b0',
  date: 'Date',
  validity: 'Validite',
  issuer: 'Emetteur',
  recipient: 'Destinataire',
  deliveryAddress: 'Adresse de livraison',
  subject: 'Objet',
  designation: 'Designation',
  qty: 'Qte',
  unit: 'unite',
  unitPriceHT: 'P.U. HT',
  vat: 'TVA',
  amountHT: 'Montant HT',
  totalHT: 'Total HT',
  totalTTC: 'Total TTC',
  discount: 'Remise',
  discountPercent: (v) => `Remise (${v}%)`,
  vatRate: (r) => `TVA ${r}%`,
  vatBase: (base) => `(base : ${base})`,
  conditionsAndNotes: 'Conditions et notes',
  noNotes: 'Aucune note',
  acceptanceConditions: "Conditions d'acceptation",
  signatureIssuer: 'Signature emetteur',
  signatureClient: 'Signature client',
  paymentMethods: 'Moyens de paiement',
  bankTransfer: 'Virement',
  check: 'Cheque',
  cash: 'Especes',
  clickToSelectClient: 'Cliquez pour selectionner un client',
  clickToEdit: 'Cliquer pour modifier',
  sectionTitle: 'Titre de section...',
  description: 'Description...',
  addLine: 'Ligne',
  addSection: 'Section',
  na: 'N/A (particulier)',
  notProvided: 'Non renseigne',
  society: 'Societe',
  address: 'Adresse',
  phone: 'Telephone',
  email: 'Email',
  postalCode: 'CP',
  city: 'Ville',
}

const en: InvoiceTranslations = {
  quote: 'Quote',
  quoteNumber: 'No.',
  date: 'Date',
  validity: 'Valid until',
  issuer: 'From',
  recipient: 'To',
  deliveryAddress: 'Delivery address',
  subject: 'Subject',
  designation: 'Description',
  qty: 'Qty',
  unit: 'unit',
  unitPriceHT: 'Unit price',
  vat: 'VAT',
  amountHT: 'Amount',
  totalHT: 'Subtotal',
  totalTTC: 'Total incl. tax',
  discount: 'Discount',
  discountPercent: (v) => `Discount (${v}%)`,
  vatRate: (r) => `VAT ${r}%`,
  vatBase: (base) => `(base: ${base})`,
  conditionsAndNotes: 'Terms and notes',
  noNotes: 'No notes',
  acceptanceConditions: 'Acceptance conditions',
  signatureIssuer: 'Issuer signature',
  signatureClient: 'Client signature',
  paymentMethods: 'Payment methods',
  bankTransfer: 'Bank transfer',
  check: 'Check',
  cash: 'Cash',
  clickToSelectClient: 'Click to select a client',
  clickToEdit: 'Click to edit',
  sectionTitle: 'Section title...',
  description: 'Description...',
  addLine: 'Line',
  addSection: 'Section',
  na: 'N/A (individual)',
  notProvided: 'Not provided',
  society: 'Company',
  address: 'Address',
  phone: 'Phone',
  email: 'Email',
  postalCode: 'Zip',
  city: 'City',
}

const translations: Record<string, InvoiceTranslations> = { fr, en }

export function getTranslations(lang?: string): InvoiceTranslations {
  return translations[lang || 'fr'] || fr
}
