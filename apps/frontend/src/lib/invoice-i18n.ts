export interface InvoiceTranslations {
  quote: string
  invoice: string
  quoteNumber: string
  date: string
  validity: string
  dueDate: string
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
  invoice: 'Facture',
  quoteNumber: 'N\u00b0',
  date: 'Date',
  validity: 'Validité',
  dueDate: 'Échéance',
  issuer: 'Émetteur',
  recipient: 'Destinataire',
  deliveryAddress: 'Adresse de livraison',
  subject: 'Objet',
  designation: 'Désignation',
  qty: 'Qté',
  unit: 'unité',
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
  signatureIssuer: 'Signature émetteur',
  signatureClient: 'Signature client',
  paymentMethods: 'Moyens de paiement',
  bankTransfer: 'Virement',
  check: 'Chèque',
  cash: 'Espèces',
  clickToSelectClient: 'Cliquez pour sélectionner un client',
  clickToEdit: 'Cliquer pour modifier',
  sectionTitle: 'Titre de section...',
  description: 'Description...',
  addLine: 'Ligne',
  addSection: 'Section',
  na: 'N/A (particulier)',
  notProvided: 'Non renseigné',
  society: 'Société',
  address: 'Adresse',
  phone: 'Téléphone',
  email: 'Email',
  postalCode: 'CP',
  city: 'Ville',
}

const en: InvoiceTranslations = {
  quote: 'Quote',
  invoice: 'Invoice',
  quoteNumber: 'No.',
  date: 'Date',
  validity: 'Valid until',
  dueDate: 'Due date',
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
