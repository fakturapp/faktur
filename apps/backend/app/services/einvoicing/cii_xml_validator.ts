export interface CiiValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
  profile: string | null
}

const MANDATORY_ELEMENTS = [
  { tag: 'rsm:CrossIndustryInvoice', label: 'Racine CII' },
  { tag: 'rsm:ExchangedDocumentContext', label: 'Contexte du document' },
  { tag: 'ram:GuidelineSpecifiedDocumentContextParameter', label: 'Profil Factur-X' },
  { tag: 'rsm:ExchangedDocument', label: 'Document echange' },
  { tag: 'ram:TypeCode', label: 'Type de document' },
  { tag: 'ram:IssueDateTime', label: "Date d'emission" },
  { tag: 'rsm:SupplyChainTradeTransaction', label: 'Transaction commerciale' },
  { tag: 'ram:ApplicableHeaderTradeAgreement', label: 'Accord commercial' },
  { tag: 'ram:SellerTradeParty', label: 'Vendeur' },
  { tag: 'ram:ApplicableHeaderTradeSettlement', label: 'Reglement' },
  { tag: 'ram:InvoiceCurrencyCode', label: 'Code devise' },
  { tag: 'ram:SpecifiedTradeSettlementHeaderMonetarySummation', label: 'Totaux monetaires' },
  { tag: 'ram:GrandTotalAmount', label: 'Montant total TTC' },
  { tag: 'ram:DuePayableAmount', label: 'Montant a payer' },
  { tag: 'ram:TaxBasisTotalAmount', label: 'Base HT totale' },
]

const VALID_TYPE_CODES = ['380', '381', '384', '389', '325', '326']

const VALID_CURRENCY_CODES = [
  'EUR', 'USD', 'GBP', 'CHF', 'CAD', 'JPY', 'SEK', 'NOK', 'DKK', 'PLN',
  'CZK', 'HUF', 'RON', 'BGN', 'HRK', 'MAD', 'TND', 'XOF', 'XAF',
]

const VALID_COUNTRY_CODES = [
  'FR', 'BE', 'CH', 'LU', 'DE', 'IT', 'ES', 'PT', 'NL', 'AT', 'GB',
  'IE', 'PL', 'CZ', 'SK', 'HU', 'RO', 'BG', 'HR', 'SI', 'LT', 'LV',
  'EE', 'FI', 'SE', 'DK', 'NO', 'GR', 'CY', 'MT', 'US', 'CA', 'MA',
  'TN', 'SN', 'CI',
]

const VALID_VAT_CATEGORIES = ['S', 'Z', 'E', 'AE', 'K', 'G', 'O', 'L', 'M']

function extractTagContent(xml: string, tagName: string): string | null {
  const regex = new RegExp(`<${tagName}[^>]*>([^<]*)</${tagName}>`)
  const match = xml.match(regex)
  return match ? match[1].trim() : null
}

function extractAllTagContents(xml: string, tagName: string): string[] {
  const regex = new RegExp(`<${tagName}[^>]*>([^<]*)</${tagName}>`, 'g')
  const results: string[] = []
  let match
  while ((match = regex.exec(xml)) !== null) {
    results.push(match[1].trim())
  }
  return results
}

function countOccurrences(xml: string, tag: string): number {
  const regex = new RegExp(`<${tag}[\\s>]`, 'g')
  return (xml.match(regex) || []).length
}

export function validateCiiXml(xml: string): CiiValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  let profile: string | null = null

  if (!xml || xml.trim().length === 0) {
    return { valid: false, errors: ['XML vide'], warnings: [], profile: null }
  }

  if (!xml.includes('<?xml')) {
    errors.push('Declaration XML manquante')
  }

  for (const el of MANDATORY_ELEMENTS) {
    if (!xml.includes(`<${el.tag}`)) {
      errors.push(`Element obligatoire manquant: ${el.label} (<${el.tag}>)`)
    }
  }

  const guidelineId = extractTagContent(xml, 'ram:ID')
  if (guidelineId && guidelineId.startsWith('urn:factur-x')) {
    profile = guidelineId
  }

  const typeCode = extractTagContent(xml, 'ram:TypeCode')
  if (typeCode && !VALID_TYPE_CODES.includes(typeCode)) {
    errors.push(`TypeCode invalide: "${typeCode}" (attendu: ${VALID_TYPE_CODES.join(', ')})`)
  }

  const currencyCode = extractTagContent(xml, 'ram:InvoiceCurrencyCode')
  if (currencyCode && !VALID_CURRENCY_CODES.includes(currencyCode)) {
    errors.push(`Code devise invalide: "${currencyCode}"`)
  }

  const countryIds = extractAllTagContents(xml, 'ram:CountryID')
  for (const code of countryIds) {
    if (!VALID_COUNTRY_CODES.includes(code)) {
      warnings.push(`Code pays non reconnu: "${code}"`)
    }
  }

  const vatCategories = extractAllTagContents(xml, 'ram:CategoryCode')
  for (const cat of vatCategories) {
    if (!VALID_VAT_CATEGORIES.includes(cat)) {
      errors.push(`Categorie TVA invalide: "${cat}" (attendu: ${VALID_VAT_CATEGORIES.join(', ')})`)
    }
  }

  const lineCount = countOccurrences(xml, 'ram:IncludedSupplyChainTradeLineItem')
  if (lineCount === 0) {
    errors.push('Aucune ligne de facture presente')
  }

  if (xml.includes('ram:SellerTradeParty')) {
    const sellerBlock = xml.substring(
      xml.indexOf('<ram:SellerTradeParty'),
      xml.indexOf('</ram:SellerTradeParty>') + '</ram:SellerTradeParty>'.length
    )
    if (!sellerBlock.includes('ram:Name')) {
      errors.push('Nom du vendeur manquant')
    }
    if (!sellerBlock.includes('ram:PostalTradeAddress')) {
      errors.push('Adresse du vendeur manquante')
    }
    if (!sellerBlock.includes('ram:CountryID')) {
      errors.push('Pays du vendeur manquant')
    }
    if (!sellerBlock.includes('ram:SpecifiedLegalOrganization')) {
      warnings.push('SIREN/SIRET du vendeur non renseigne')
    }
    if (!sellerBlock.includes('ram:SpecifiedTaxRegistration')) {
      warnings.push('Numero de TVA du vendeur non renseigne')
    }
  }

  if (xml.includes('ram:BuyerTradeParty')) {
    const buyerStart = xml.indexOf('<ram:BuyerTradeParty')
    const buyerEnd = xml.indexOf('</ram:BuyerTradeParty>') + '</ram:BuyerTradeParty>'.length
    const buyerBlock = xml.substring(buyerStart, buyerEnd)
    if (!buyerBlock.includes('ram:Name')) {
      errors.push("Nom de l'acheteur manquant")
    }
    if (!buyerBlock.includes('ram:PostalTradeAddress')) {
      warnings.push("Adresse de l'acheteur non renseignee")
    }
  } else {
    warnings.push('Acheteur non renseigne dans le document')
  }

  const amounts = ['ram:LineTotalAmount', 'ram:TaxBasisTotalAmount', 'ram:GrandTotalAmount', 'ram:DuePayableAmount']
  for (const amountTag of amounts) {
    const val = extractTagContent(xml, amountTag)
    if (val !== null && isNaN(Number(val))) {
      errors.push(`Montant invalide pour ${amountTag}: "${val}"`)
    }
  }

  const rates = extractAllTagContents(xml, 'ram:RateApplicablePercent')
  for (const r of rates) {
    const num = Number(r)
    if (isNaN(num) || num < 0 || num > 100) {
      errors.push(`Taux de TVA invalide: "${r}"`)
    }
  }

  const dateStrings = extractAllTagContents(xml, 'udt:DateTimeString')
  for (const ds of dateStrings) {
    if (!/^\d{8}$/.test(ds)) {
      errors.push(`Format de date invalide: "${ds}" (attendu: AAAAMMJJ)`)
    }
  }

  if (!xml.includes('ram:SpecifiedTradeSettlementPaymentMeans')) {
    warnings.push('Moyen de paiement non renseigne')
  }

  if (!xml.includes('ram:SpecifiedTradePaymentTerms')) {
    warnings.push("Conditions de paiement / date d'echeance non renseignees")
  }

  if (!xml.includes('ram:ApplicableTradeTax')) {
    errors.push('Aucune ventilation TVA presente')
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    profile,
  }
}
