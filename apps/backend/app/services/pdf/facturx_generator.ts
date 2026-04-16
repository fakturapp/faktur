
interface FacturXSeller {
  name: string
  siren?: string | null
  siret?: string | null
  vatNumber?: string | null
  addressLine1?: string | null
  postalCode?: string | null
  city?: string | null
  country?: string | null
  email?: string | null
  phone?: string | null
}

interface FacturXBuyer {
  name: string
  siren?: string | null
  siret?: string | null
  vatNumber?: string | null
  address?: string | null
  postalCode?: string | null
  city?: string | null
  country?: string | null
  email?: string | null
}

interface FacturXLine {
  position: number
  description: string
  quantity: number
  unitPrice: number
  vatRate: number
  total: number
}

export interface FacturXDocument {
  documentNumber: string
  documentType: 'quote' | 'invoice'
  issueDate: string
  dueDate?: string | null
  currencyCode: string
  seller: FacturXSeller
  buyer: FacturXBuyer | null
  lines: FacturXLine[]
  subtotalHT: number
  totalVAT: number
  totalTTC: number
  vatBreakdown: { rate: number; base: number; amount: number }[]
  notes?: string | null
  language?: string
  operationCategory?: 'service' | 'goods' | 'mixed' | null
  paymentMeansCode?: string | null
  sellerIban?: string | null
  sellerBic?: string | null
  vatExemptReason?: string | null
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function formatDate(dateStr: string): string {
  return dateStr.replace(/-/g, '')
}

function formatAmount(amount: number): string {
  return amount.toFixed(2)
}

function getDocumentTypeCode(type: 'quote' | 'invoice'): string {
  return type === 'invoice' ? '380' : '325'
}

function getCountryCode(country?: string | null): string {
  if (!country) return 'FR'
  const lower = country.toLowerCase().trim()
  if (lower === 'france' || lower === 'fr') return 'FR'
  if (lower === 'belgique' || lower === 'belgium' || lower === 'be') return 'BE'
  if (lower === 'suisse' || lower === 'switzerland' || lower === 'ch') return 'CH'
  if (lower === 'luxembourg' || lower === 'lu') return 'LU'
  if (lower === 'allemagne' || lower === 'germany' || lower === 'de') return 'DE'
  if (lower.length === 2) return lower.toUpperCase()
  return 'FR'
}

function getOperationCategoryLabel(category?: 'service' | 'goods' | 'mixed' | null): string | null {
  switch (category) {
    case 'service':
      return 'Prestation de services'
    case 'goods':
      return 'Livraison de biens'
    case 'mixed':
      return 'Mixte (biens et services)'
    default:
      return null
  }
}

function getPaymentMeansCode(method?: string | null): string {
  switch (method) {
    case 'bank_transfer':
    case 'virement':
      return '30'
    case 'card':
    case 'cb':
      return '48'
    case 'direct_debit':
    case 'prelevement':
      return '49'
    case 'check':
    case 'cheque':
      return '20'
    case 'cash':
    case 'especes':
      return '10'
    default:
      return '30'
  }
}

function getVatCategoryCode(rate: number, exemptReason?: string | null): string {
  if (rate === 0) {
    if (exemptReason === 'not_subject') return 'O'
    if (exemptReason === 'outside_france') return 'G'
    return 'E'
  }
  return 'S'
}

export function generateFacturXXml(doc: FacturXDocument): string {
  const typeCode = getDocumentTypeCode(doc.documentType)
  const sellerCountry = getCountryCode(doc.seller.country)
  const buyerCountry = doc.buyer ? getCountryCode(doc.buyer.country) : 'FR'
  const currencyCode = doc.currencyCode || 'EUR'

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<rsm:CrossIndustryInvoice xmlns:rsm="urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100" xmlns:qdt="urn:un:unece:uncefact:data:standard:QualifiedDataType:100" xmlns:ram="urn:un:unece:uncefact:data:standard:ReusableAggregateBusinessInformationEntity:100" xmlns:udt="urn:un:unece:uncefact:data:standard:UnqualifiedDataType:100">
  <rsm:ExchangedDocumentContext>
    <ram:GuidelineSpecifiedDocumentContextParameter>
      <ram:ID>urn:factur-x.eu:1p0:en16931</ram:ID>
    </ram:GuidelineSpecifiedDocumentContextParameter>
  </rsm:ExchangedDocumentContext>
  <rsm:ExchangedDocument>
    <ram:ID>${escapeXml(doc.documentNumber)}</ram:ID>
    <ram:TypeCode>${typeCode}</ram:TypeCode>
    <ram:IssueDateTime>
      <udt:DateTimeString format="102">${formatDate(doc.issueDate)}</udt:DateTimeString>
    </ram:IssueDateTime>`

  if (doc.notes) {
    xml += `
    <ram:IncludedNote>
      <ram:Content>${escapeXml(doc.notes)}</ram:Content>
    </ram:IncludedNote>`
  }

  const opCatLabel = getOperationCategoryLabel(doc.operationCategory)
  if (opCatLabel) {
    xml += `
    <ram:IncludedNote>
      <ram:Content>${escapeXml(opCatLabel)}</ram:Content>
      <ram:SubjectCode>REG</ram:SubjectCode>
    </ram:IncludedNote>`
  }

  xml += `
  </rsm:ExchangedDocument>
  <rsm:SupplyChainTradeTransaction>`

  for (const line of doc.lines) {
    const lineCatCode = getVatCategoryCode(line.vatRate, doc.vatExemptReason)
    xml += `
    <ram:IncludedSupplyChainTradeLineItem>
      <ram:AssociatedDocumentLineDocument>
        <ram:LineID>${line.position}</ram:LineID>
      </ram:AssociatedDocumentLineDocument>
      <ram:SpecifiedTradeProduct>
        <ram:Name>${escapeXml(line.description)}</ram:Name>
      </ram:SpecifiedTradeProduct>
      <ram:SpecifiedLineTradeAgreement>
        <ram:NetPriceProductTradePrice>
          <ram:ChargeAmount>${formatAmount(line.unitPrice)}</ram:ChargeAmount>
        </ram:NetPriceProductTradePrice>
      </ram:SpecifiedLineTradeAgreement>
      <ram:SpecifiedLineTradeDelivery>
        <ram:BilledQuantity unitCode="C62">${formatAmount(line.quantity)}</ram:BilledQuantity>
      </ram:SpecifiedLineTradeDelivery>
      <ram:SpecifiedLineTradeSettlement>
        <ram:ApplicableTradeTax>
          <ram:TypeCode>VAT</ram:TypeCode>
          <ram:CategoryCode>${lineCatCode}</ram:CategoryCode>
          <ram:RateApplicablePercent>${formatAmount(line.vatRate)}</ram:RateApplicablePercent>
        </ram:ApplicableTradeTax>
        <ram:SpecifiedTradeSettlementLineMonetarySummation>
          <ram:LineTotalAmount>${formatAmount(line.total)}</ram:LineTotalAmount>
        </ram:SpecifiedTradeSettlementLineMonetarySummation>
      </ram:SpecifiedLineTradeSettlement>
    </ram:IncludedSupplyChainTradeLineItem>`
  }

  xml += `
    <ram:ApplicableHeaderTradeAgreement>
      <ram:SellerTradeParty>
        <ram:Name>${escapeXml(doc.seller.name)}</ram:Name>`

  if (doc.seller.siret) {
    xml += `
        <ram:SpecifiedLegalOrganization>
          <ram:ID schemeID="0002">${escapeXml(doc.seller.siret)}</ram:ID>
        </ram:SpecifiedLegalOrganization>`
  } else if (doc.seller.siren) {
    xml += `
        <ram:SpecifiedLegalOrganization>
          <ram:ID schemeID="0002">${escapeXml(doc.seller.siren)}</ram:ID>
        </ram:SpecifiedLegalOrganization>`
  }

  xml += `
        <ram:PostalTradeAddress>`

  if (doc.seller.addressLine1) {
    xml += `
          <ram:LineOne>${escapeXml(doc.seller.addressLine1)}</ram:LineOne>`
  }
  if (doc.seller.postalCode) {
    xml += `
          <ram:PostcodeCode>${escapeXml(doc.seller.postalCode)}</ram:PostcodeCode>`
  }
  if (doc.seller.city) {
    xml += `
          <ram:CityName>${escapeXml(doc.seller.city)}</ram:CityName>`
  }

  xml += `
          <ram:CountryID>${sellerCountry}</ram:CountryID>
        </ram:PostalTradeAddress>`

  if (doc.seller.email) {
    xml += `
        <ram:URIUniversalCommunication>
          <ram:URIID schemeID="EM">${escapeXml(doc.seller.email)}</ram:URIID>
        </ram:URIUniversalCommunication>`
  }

  if (doc.seller.vatNumber) {
    xml += `
        <ram:SpecifiedTaxRegistration>
          <ram:ID schemeID="VA">${escapeXml(doc.seller.vatNumber)}</ram:ID>
        </ram:SpecifiedTaxRegistration>`
  }

  xml += `
      </ram:SellerTradeParty>`

  if (doc.buyer) {
    xml += `
      <ram:BuyerTradeParty>
        <ram:Name>${escapeXml(doc.buyer.name)}</ram:Name>`

    if (doc.buyer.siret) {
      xml += `
        <ram:SpecifiedLegalOrganization>
          <ram:ID schemeID="0002">${escapeXml(doc.buyer.siret)}</ram:ID>
        </ram:SpecifiedLegalOrganization>`
    } else if (doc.buyer.siren) {
      xml += `
        <ram:SpecifiedLegalOrganization>
          <ram:ID schemeID="0002">${escapeXml(doc.buyer.siren)}</ram:ID>
        </ram:SpecifiedLegalOrganization>`
    }

    xml += `
        <ram:PostalTradeAddress>`

    if (doc.buyer.address) {
      xml += `
          <ram:LineOne>${escapeXml(doc.buyer.address)}</ram:LineOne>`
    }
    if (doc.buyer.postalCode) {
      xml += `
          <ram:PostcodeCode>${escapeXml(doc.buyer.postalCode)}</ram:PostcodeCode>`
    }
    if (doc.buyer.city) {
      xml += `
          <ram:CityName>${escapeXml(doc.buyer.city)}</ram:CityName>`
    }

    xml += `
          <ram:CountryID>${buyerCountry}</ram:CountryID>
        </ram:PostalTradeAddress>`

    if (doc.buyer.email) {
      xml += `
        <ram:URIUniversalCommunication>
          <ram:URIID schemeID="EM">${escapeXml(doc.buyer.email)}</ram:URIID>
        </ram:URIUniversalCommunication>`
    }

    if (doc.buyer.vatNumber) {
      xml += `
        <ram:SpecifiedTaxRegistration>
          <ram:ID schemeID="VA">${escapeXml(doc.buyer.vatNumber)}</ram:ID>
        </ram:SpecifiedTaxRegistration>`
    }

    xml += `
      </ram:BuyerTradeParty>`
  }

  xml += `
    </ram:ApplicableHeaderTradeAgreement>
    <ram:ApplicableHeaderTradeDelivery/>
    <ram:ApplicableHeaderTradeSettlement>
      <ram:InvoiceCurrencyCode>${currencyCode}</ram:InvoiceCurrencyCode>`

  const meansCode = getPaymentMeansCode(doc.paymentMeansCode)
  xml += `
      <ram:SpecifiedTradeSettlementPaymentMeans>
        <ram:TypeCode>${meansCode}</ram:TypeCode>`

  if (doc.sellerIban) {
    xml += `
        <ram:PayeePartyCreditorFinancialAccount>
          <ram:IBANID>${escapeXml(doc.sellerIban)}</ram:IBANID>
        </ram:PayeePartyCreditorFinancialAccount>`
    if (doc.sellerBic) {
      xml += `
        <ram:PayeeSpecifiedCreditorFinancialInstitution>
          <ram:BICID>${escapeXml(doc.sellerBic)}</ram:BICID>
        </ram:PayeeSpecifiedCreditorFinancialInstitution>`
    }
  }

  xml += `
      </ram:SpecifiedTradeSettlementPaymentMeans>`

  for (const vat of doc.vatBreakdown) {
    const catCode = getVatCategoryCode(vat.rate, doc.vatExemptReason)
    xml += `
      <ram:ApplicableTradeTax>
        <ram:CalculatedAmount>${formatAmount(vat.amount)}</ram:CalculatedAmount>
        <ram:TypeCode>VAT</ram:TypeCode>
        <ram:BasisAmount>${formatAmount(vat.base)}</ram:BasisAmount>
        <ram:CategoryCode>${catCode}</ram:CategoryCode>
        <ram:RateApplicablePercent>${formatAmount(vat.rate)}</ram:RateApplicablePercent>
      </ram:ApplicableTradeTax>`
  }

  if (doc.dueDate) {
    xml += `
      <ram:SpecifiedTradePaymentTerms>
        <ram:DueDateDateTime>
          <udt:DateTimeString format="102">${formatDate(doc.dueDate)}</udt:DateTimeString>
        </ram:DueDateDateTime>
      </ram:SpecifiedTradePaymentTerms>`
  }

  xml += `
      <ram:SpecifiedTradeSettlementHeaderMonetarySummation>
        <ram:LineTotalAmount>${formatAmount(doc.subtotalHT)}</ram:LineTotalAmount>
        <ram:TaxBasisTotalAmount>${formatAmount(doc.subtotalHT)}</ram:TaxBasisTotalAmount>
        <ram:TaxTotalAmount currencyID="${currencyCode}">${formatAmount(doc.totalVAT)}</ram:TaxTotalAmount>
        <ram:GrandTotalAmount>${formatAmount(doc.totalTTC)}</ram:GrandTotalAmount>
        <ram:DuePayableAmount>${formatAmount(doc.totalTTC)}</ram:DuePayableAmount>
      </ram:SpecifiedTradeSettlementHeaderMonetarySummation>
    </ram:ApplicableHeaderTradeSettlement>
  </rsm:SupplyChainTradeTransaction>
</rsm:CrossIndustryInvoice>`

  return xml
}

export function buildFacturXFromQuote(
  quoteData: any,
  linesData: any[],
  clientData: any | null,
  companyData: any | null
): FacturXDocument {
  const { vatBreakdown, seller, buyer, lines } = buildCommonFacturXParts(
    linesData,
    clientData,
    companyData
  )

  return {
    documentNumber: quoteData.quoteNumber,
    documentType: 'quote',
    issueDate: quoteData.issueDate || new Date().toISOString().slice(0, 10),
    dueDate: quoteData.validityDate,
    currencyCode: quoteData.currency || companyData?.currency || 'EUR',
    seller,
    buyer,
    lines,
    subtotalHT: quoteData.subtotal || 0,
    totalVAT: quoteData.taxAmount || 0,
    totalTTC: quoteData.total || 0,
    vatBreakdown,
    notes: quoteData.notes,
    language: quoteData.language,
  }
}

export function buildFacturXFromInvoice(
  invoiceData: any,
  linesData: any[],
  clientData: any | null,
  companyData: any | null
): FacturXDocument {
  const { vatBreakdown, seller, buyer, lines } = buildCommonFacturXParts(
    linesData,
    clientData,
    companyData
  )

  return {
    documentNumber: invoiceData.invoiceNumber,
    documentType: 'invoice',
    issueDate: invoiceData.issueDate || new Date().toISOString().slice(0, 10),
    dueDate: invoiceData.dueDate,
    currencyCode: invoiceData.currency || companyData?.currency || 'EUR',
    seller,
    buyer,
    lines,
    subtotalHT: invoiceData.subtotal || 0,
    totalVAT: invoiceData.taxAmount || 0,
    totalTTC: invoiceData.total || 0,
    vatBreakdown,
    notes: invoiceData.notes,
    language: invoiceData.language,
    operationCategory: invoiceData.operationCategory || null,
    paymentMeansCode: invoiceData.paymentMethod || null,
    sellerIban: companyData?.iban || null,
    sellerBic: companyData?.bic || null,
    vatExemptReason: invoiceData.vatExemptReason || null,
  }
}

function buildCommonFacturXParts(
  linesData: any[],
  clientData: any | null,
  companyData: any | null
) {
  const vatMap = new Map<number, { base: number; amount: number }>()
  for (const line of linesData) {
    if (line.saleType === 'section') continue
    const ht = line.quantity * line.unitPrice
    const rate = line.vatRate || 0
    const existing = vatMap.get(rate) || { base: 0, amount: 0 }
    existing.base += ht
    existing.amount += ht * (rate / 100)
    vatMap.set(rate, existing)
  }

  const vatBreakdown = Array.from(vatMap.entries()).map(([rate, data]) => ({
    rate,
    base: data.base,
    amount: data.amount,
  }))

  const seller: FacturXSeller = companyData
    ? {
        name: companyData.legalName || 'Entreprise',
        siren: companyData.siren,
        siret: companyData.siret,
        vatNumber: companyData.vatNumber,
        addressLine1: companyData.addressLine1,
        postalCode: companyData.postalCode,
        city: companyData.city,
        country: companyData.country,
        email: companyData.email,
        phone: companyData.phone,
      }
    : { name: 'Entreprise' }

  const buyer: FacturXBuyer | null = clientData
    ? {
        name:
          clientData.displayName ||
          clientData.companyName ||
          `${clientData.firstName} ${clientData.lastName}`,
        siren: clientData.siren,
        siret: clientData.siret,
        vatNumber: clientData.vatNumber,
        address: clientData.address,
        postalCode: clientData.postalCode,
        city: clientData.city,
        country: clientData.country,
        email: clientData.email,
      }
    : null

  const lines: FacturXLine[] = linesData
    .filter((l) => l.saleType !== 'section')
    .map((l, idx) => ({
      position: idx + 1,
      description: l.description || 'Article',
      quantity: l.quantity || 1,
      unitPrice: l.unitPrice || 0,
      vatRate: l.vatRate || 0,
      total: (l.quantity || 1) * (l.unitPrice || 0),
    }))

  return { vatBreakdown, seller, buyer, lines }
}
