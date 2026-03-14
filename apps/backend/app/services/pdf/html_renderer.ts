import { getTemplate, type TemplateConfig } from './templates.js'

interface QuoteData {
  quoteNumber: string
  status: string
  subject: string | null
  issueDate: string
  validityDate: string | null
  billingType: 'quick' | 'detailed'
  accentColor: string
  logoUrl: string | null
  notes: string | null
  acceptanceConditions: string | null
  signatureField: boolean
  documentTitle: string | null
  freeField: string | null
  globalDiscountType: 'none' | 'percentage' | 'fixed'
  globalDiscountValue: number
  deliveryAddress: string | null
  clientSiren: string | null
  clientVatNumber: string | null
  subtotal: number
  taxAmount: number
  total: number
}

interface LineData {
  description: string
  saleType: string | null
  quantity: number
  unit: string | null
  unitPrice: number
  vatRate: number
  total: number
}

interface ClientData {
  type: string
  displayName: string
  companyName: string | null
  firstName: string | null
  lastName: string | null
  email: string | null
  phone: string | null
  address: string | null
  addressComplement: string | null
  postalCode: string | null
  city: string | null
  country: string
  siren: string | null
  vatNumber: string | null
}

interface CompanyData {
  legalName: string
  tradeName: string | null
  siren: string | null
  siret: string | null
  vatNumber: string | null
  legalForm: string | null
  addressLine1: string | null
  addressLine2: string | null
  city: string | null
  postalCode: string | null
  country: string
  phone: string | null
  email: string | null
  website: string | null
  iban: string | null
  bic: string | null
  bankName: string | null
}

interface SettingsData {
  template: string
  darkMode: boolean
  paymentMethods: string[]
  customPaymentMethod: string | null
}

function esc(str: string | null | undefined): string {
  if (!str) return ''
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function formatCurrency(n: number): string {
  return n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €'
}

function formatDate(dateStr: string): string {
  if (!dateStr) return ''
  const [y, m, d] = dateStr.split('-')
  return `${d}/${m}/${y}`
}

function buildTvaBreakdown(lines: LineData[], billingType: string) {
  const map: Record<number, { base: number; amount: number }> = {}
  for (const l of lines) {
    if (l.saleType === 'section') continue
    const lt = billingType === 'quick' ? l.unitPrice : l.quantity * l.unitPrice
    const tax = billingType === 'detailed' ? lt * (l.vatRate / 100) : 0
    if (billingType === 'detailed') {
      if (!map[l.vatRate]) map[l.vatRate] = { base: 0, amount: 0 }
      map[l.vatRate].base += lt
      map[l.vatRate].amount += tax
    }
  }
  return Object.entries(map).map(([rate, data]) => ({
    rate: Number(rate),
    base: Math.round(data.base * 100) / 100,
    amount: Math.round(data.amount * 100) / 100,
  }))
}

export function renderQuoteHtml(
  quote: QuoteData,
  lines: LineData[],
  client: ClientData | null,
  company: CompanyData | null,
  settings: SettingsData
): string {
  const T = getTemplate(settings.template, settings.darkMode)
  const ac = quote.accentColor || '#6366f1'
  const docTitle = quote.documentTitle || 'DEVIS'
  const tva = buildTvaBreakdown(lines, quote.billingType)
  let discountAmount = 0
  if (quote.globalDiscountType === 'percentage' && quote.globalDiscountValue > 0) {
    discountAmount = quote.subtotal * (quote.globalDiscountValue / 100)
  } else if (quote.globalDiscountType === 'fixed' && quote.globalDiscountValue > 0) {
    discountAmount = quote.globalDiscountValue
  }
  discountAmount = Math.round(discountAmount * 100) / 100

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  @page { size: A4; margin: 0; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 11px;
    color: ${T.text};
    background: ${T.docBg};
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .page {
    width: 210mm;
    min-height: 297mm;
    padding: ${T.layout === 'lateral' ? '0' : '28px 32px 24px 32px'};
    position: relative;
    background: ${T.docBg};
    ${T.layout === 'lateral' ? 'display: flex;' : ''}
  }
  ${T.layout === 'lateral' ? `
  .sidebar { width: 22%; background: ${ac}; padding: 28px 16px; color: #fff; }
  .sidebar h3 { font-size: 9px; text-transform: uppercase; letter-spacing: 1px; opacity: 0.7; margin-bottom: 6px; }
  .sidebar p { font-size: 10px; margin-bottom: 3px; line-height: 1.4; }
  .sidebar .section { margin-bottom: 20px; }
  .main-content { flex: 1; padding: 28px 28px 24px 24px; }
  ` : ''}
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
  .logo img { max-height: 50px; max-width: 140px; }
  .doc-info { text-align: right; }
  .doc-title { font-size: 16px; font-weight: 800; letter-spacing: 2px; color: ${ac}; }
  .doc-number { font-size: 11px; font-weight: 600; color: ${T.textMuted}; margin-top: 2px; }
  .doc-date { font-size: 10px; color: ${T.textMuted}; margin-top: 1px; }
  .divider { height: 2px; background: ${ac}; border-radius: 1px; margin: 16px 0; }
  .addresses { display: flex; gap: 24px; margin-bottom: 20px; }
  .address-block { flex: 1; }
  .address-label { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: ${ac}; margin-bottom: 6px; }
  .address-content { padding: 10px; border-radius: ${T.borderRadius}; background: ${T.clientBlockBg}; border: 1px solid ${T.clientBlockBorder}; }
  .address-name { font-size: 12px; font-weight: 700; color: ${T.text}; margin-bottom: 4px; }
  .address-line { font-size: 10px; color: ${T.textMuted}; line-height: 1.5; }
  ${T.layout === 'banner' ? `
  .banner { background: ${ac}; padding: 18px 24px; border-radius: ${T.borderRadius}; margin-bottom: 20px; display: flex; align-items: center; justify-content: space-between; }
  .banner .doc-title { color: #fff; }
  .banner .doc-number, .banner .doc-date { color: rgba(255,255,255,0.75); }
  .banner .logo img { filter: brightness(0) invert(1); }
  ` : ''}
  .subject { font-size: 12px; font-weight: 600; color: ${T.text}; margin-bottom: 14px; padding: 8px 12px; background: ${ac}08; border-left: 3px solid ${ac}; border-radius: 0 ${T.borderRadius} ${T.borderRadius} 0; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
  th { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: ${ac}; padding: 8px 10px; text-align: left; background: ${ac}08; border-bottom: 2px solid ${ac}20; }
  th.right { text-align: right; }
  td { padding: 8px 10px; font-size: 10.5px; border-bottom: 1px solid ${T.borderLight}; }
  td.right { text-align: right; }
  tr.even { background: ${T.rowEven}; }
  tr.odd { background: ${T.rowOdd}; }
  tr.section-row td { font-size: 11px; font-weight: 700; color: ${ac}; background: ${ac}06; border-bottom: 2px solid ${ac}15; padding: 6px 10px; }
  .totals { display: flex; justify-content: flex-end; margin-bottom: 16px; }
  .totals-box { width: 240px; }
  .total-row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 10.5px; color: ${T.textMuted}; }
  .total-row.discount { color: #16a34a; }
  .total-sep { height: 1px; background: ${T.borderLight}; margin: 4px 0; }
  .total-final { display: flex; justify-content: space-between; padding: 8px 12px; border-radius: ${T.borderRadius}; background: ${ac}${T.totalBg}; font-weight: 700; font-size: 13px; color: ${ac}; }
  .tva-table { margin-bottom: 16px; }
  .tva-table th { font-size: 8px; padding: 5px 8px; }
  .tva-table td { font-size: 9.5px; padding: 5px 8px; }
  .notes { font-size: 10px; color: ${T.textMuted}; margin-bottom: 16px; padding: 10px; border-radius: ${T.borderRadius}; background: ${T.clientBlockBg}; border: 1px solid ${T.clientBlockBorder}; white-space: pre-wrap; }
  .notes-label { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: ${T.textMuted}; margin-bottom: 4px; }
  .footer { border-top: 1px solid ${T.footerBorder}; padding-top: 12px; margin-top: auto; }
  .footer-section { margin-bottom: 10px; }
  .footer-label { font-size: 8px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: ${T.textMuted}; margin-bottom: 4px; }
  .footer-text { font-size: 9px; color: ${T.textFooter}; line-height: 1.5; }
  .payment-badges { display: flex; gap: 6px; flex-wrap: wrap; }
  .payment-badge { font-size: 9px; padding: 3px 8px; border-radius: 6px; background: ${T.paymentBadgeBg}; border: 1px solid ${T.paymentBadgeBorder}; color: ${T.paymentBadgeText}; }
  .signature-box { border: 1px dashed ${T.signatureBorder}; border-radius: ${T.borderRadius}; padding: 12px; margin-top: 12px; }
  .signature-label { font-size: 9px; font-weight: 600; color: ${T.textMuted}; margin-bottom: 4px; }
  .signature-area { height: 60px; }
  .bank-info { display: flex; gap: 20px; margin-top: 6px; }
  .bank-item { font-size: 9px; color: ${T.textFooter}; }
  .bank-item strong { color: ${T.textMuted}; }
  .free-field { font-size: 9px; color: ${T.textFooter}; margin-top: 8px; white-space: pre-wrap; }
  .conditions { font-size: 9px; color: ${T.textFooter}; margin-top: 6px; white-space: pre-wrap; }
</style>
</head>
<body>
<div class="page">
${T.layout === 'lateral' ? renderLateral(quote, lines, client, company, settings, T, ac, docTitle, tva, discountAmount) : ''}
${T.layout !== 'lateral' ? `
<div>
${T.layout === 'banner' ? renderBanner(quote, ac, docTitle) : renderStandardHeader(quote, ac, docTitle)}
<div class="divider"></div>
${renderAddresses(company, client, quote, T)}
${quote.subject ? `<div class="subject">Objet : ${esc(quote.subject)}</div>` : ''}
${renderTable(lines, quote, T, ac)}
${renderTotals(quote, tva, discountAmount, ac, T)}
${quote.notes ? `<div class="notes"><div class="notes-label">Notes</div>${esc(quote.notes)}</div>` : ''}
${renderFooter(company, settings, quote, T)}
</div>
` : ''}
</div>
</body>
</html>`
}

function renderStandardHeader(quote: QuoteData, _ac: string, docTitle: string): string {
  return `<div class="header">
  <div class="logo">
    ${quote.logoUrl ? `<img src="${esc(quote.logoUrl)}" alt="Logo" />` : ''}
  </div>
  <div class="doc-info">
    <div class="doc-title">${esc(docTitle)}</div>
    <div class="doc-number">${esc(quote.quoteNumber)}</div>
    <div class="doc-date">${formatDate(quote.issueDate)}</div>
    ${quote.validityDate ? `<div class="doc-date">Valide jusqu'au ${formatDate(quote.validityDate)}</div>` : ''}
  </div>
</div>`
}

function renderBanner(quote: QuoteData, _ac: string, docTitle: string): string {
  return `<div class="banner">
  <div class="logo">
    ${quote.logoUrl ? `<img src="${esc(quote.logoUrl)}" alt="Logo" />` : ''}
  </div>
  <div style="text-align:right">
    <div class="doc-title">${esc(docTitle)}</div>
    <div class="doc-number">${esc(quote.quoteNumber)}</div>
    <div class="doc-date">${formatDate(quote.issueDate)}</div>
  </div>
</div>`
}

function renderAddresses(company: CompanyData | null, client: ClientData | null, quote: QuoteData, T: TemplateConfig): string {
  const companyHtml = company ? `
    <div class="address-name">${esc(company.tradeName || company.legalName)}</div>
    ${company.legalForm ? `<div class="address-line">${esc(company.legalForm)}</div>` : ''}
    ${company.addressLine1 ? `<div class="address-line">${esc(company.addressLine1)}</div>` : ''}
    ${company.addressLine2 ? `<div class="address-line">${esc(company.addressLine2)}</div>` : ''}
    ${company.postalCode || company.city ? `<div class="address-line">${esc(company.postalCode || '')} ${esc(company.city || '')}</div>` : ''}
    ${company.siren ? `<div class="address-line">SIREN : ${esc(company.siren)}</div>` : ''}
    ${company.vatNumber ? `<div class="address-line">TVA : ${esc(company.vatNumber)}</div>` : ''}
  ` : ''

  const clientHtml = client ? `
    <div class="address-name">${esc(client.displayName)}</div>
    ${client.address ? `<div class="address-line">${esc(client.address)}</div>` : ''}
    ${client.addressComplement ? `<div class="address-line">${esc(client.addressComplement)}</div>` : ''}
    ${client.postalCode || client.city ? `<div class="address-line">${esc(client.postalCode || '')} ${esc(client.city || '')}</div>` : ''}
    ${client.country && client.country !== 'FR' ? `<div class="address-line">${esc(client.country)}</div>` : ''}
    ${quote.clientSiren ? `<div class="address-line">SIREN : ${esc(quote.clientSiren)}</div>` : ''}
    ${quote.clientVatNumber ? `<div class="address-line">TVA : ${esc(quote.clientVatNumber)}</div>` : ''}
    ${quote.deliveryAddress ? `<div style="border-top:1px solid ${T.clientBlockBorder};margin-top:6px;padding-top:6px;"><div style="font-size:8px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:${T.textMuted};margin-bottom:3px;">Adresse de livraison</div><div class="address-line">${esc(quote.deliveryAddress)}</div></div>` : ''}
  ` : '<div class="address-line" style="opacity:0.5">Aucun client selectionne</div>'

  return `<div class="addresses">
  <div class="address-block">
    <div class="address-label">Emetteur</div>
    <div class="address-content">${companyHtml}</div>
  </div>
  <div class="address-block">
    <div class="address-label">Destinataire</div>
    <div class="address-content">${clientHtml}</div>
  </div>
</div>`
}

function renderTable(lines: LineData[], quote: QuoteData, T: TemplateConfig, _ac: string): string {
  const isDetailed = quote.billingType === 'detailed'

  let headerCols = '<th>Description</th>'
  if (isDetailed) headerCols += '<th class="right">Qte</th><th class="right">P.U. HT</th><th class="right">TVA</th>'
  headerCols += '<th class="right">Total</th>'

  let rows = ''
  lines.forEach((line, i) => {
    if (line.saleType === 'section') {
      rows += `<tr class="section-row"><td colspan="${isDetailed ? 5 : 2}">${esc(line.description)}</td></tr>`
      return
    }
    const cls = i % 2 === 0 ? 'even' : 'odd'
    const lineTotal = isDetailed ? line.quantity * line.unitPrice : line.unitPrice
    rows += `<tr class="${cls}"><td>${esc(line.description)}${line.unit ? ` <span style="color:${T.textMuted};font-size:9px">(${esc(line.unit)})</span>` : ''}</td>`
    if (isDetailed) {
      rows += `<td class="right">${line.quantity}</td>`
      rows += `<td class="right">${formatCurrency(line.unitPrice)}</td>`
      rows += `<td class="right">${line.vatRate}%</td>`
    }
    rows += `<td class="right" style="font-weight:600">${formatCurrency(lineTotal)}</td></tr>`
  })

  return `<table><thead><tr>${headerCols}</tr></thead><tbody>${rows}</tbody></table>`
}

function renderTotals(quote: QuoteData, tva: { rate: number; base: number; amount: number }[], discountAmount: number, _ac: string, _T: TemplateConfig): string {
  const isDetailed = quote.billingType === 'detailed'

  let html = '<div class="totals"><div class="totals-box">'

  if (isDetailed) {
    html += `<div class="total-row"><span>Sous-total HT</span><span>${formatCurrency(quote.subtotal)}</span></div>`
    for (const t of tva) {
      html += `<div class="total-row"><span>TVA ${t.rate}%</span><span>${formatCurrency(t.amount)}</span></div>`
    }
  }

  if (discountAmount > 0) {
    const label = quote.globalDiscountType === 'percentage'
      ? `Remise (${quote.globalDiscountValue}%)`
      : 'Remise'
    html += `<div class="total-row discount"><span>${label}</span><span>- ${formatCurrency(discountAmount)}</span></div>`
  }

  if (isDetailed || discountAmount > 0) {
    html += '<div class="total-sep"></div>'
  }

  html += `<div class="total-final"><span>Total TTC</span><span>${formatCurrency(quote.total)}</span></div>`
  html += '</div></div>'

  // TVA breakdown table
  if (isDetailed && tva.length > 0) {
    html += '<table class="tva-table"><thead><tr><th>Taux TVA</th><th class="right">Base HT</th><th class="right">Montant TVA</th></tr></thead><tbody>'
    for (const t of tva) {
      html += `<tr class="even"><td>${t.rate}%</td><td class="right">${formatCurrency(t.base)}</td><td class="right">${formatCurrency(t.amount)}</td></tr>`
    }
    html += '</tbody></table>'
  }

  return html
}

function renderFooter(company: CompanyData | null, settings: SettingsData, quote: QuoteData, T: TemplateConfig): string {
  let html = '<div class="footer">'

  // Payment methods
  if (settings.paymentMethods.length > 0) {
    html += '<div class="footer-section"><div class="footer-label">Moyens de paiement acceptes</div><div class="payment-badges">'
    if (settings.paymentMethods.includes('bank_transfer')) html += '<span class="payment-badge">Virement bancaire</span>'
    if (settings.paymentMethods.includes('cash')) html += '<span class="payment-badge">Especes</span>'
    if (settings.paymentMethods.includes('custom') && settings.customPaymentMethod) {
      html += `<span class="payment-badge">${esc(settings.customPaymentMethod)}</span>`
    }
    html += '</div>'

    // Bank details
    if (settings.paymentMethods.includes('bank_transfer') && company) {
      html += '<div class="bank-info">'
      if (company.iban) html += `<div class="bank-item"><strong>IBAN :</strong> ${esc(company.iban)}</div>`
      if (company.bic) html += `<div class="bank-item"><strong>BIC :</strong> ${esc(company.bic)}</div>`
      if (company.bankName) html += `<div class="bank-item"><strong>Banque :</strong> ${esc(company.bankName)}</div>`
      html += '</div>'
    }
    html += '</div>'
  }

  // Acceptance conditions
  if (quote.acceptanceConditions) {
    html += `<div class="footer-section"><div class="footer-label">Conditions d'acceptation</div><div class="conditions">${esc(quote.acceptanceConditions)}</div></div>`
  }

  // Signature
  if (quote.signatureField) {
    html += `<div class="signature-box"><div class="signature-label">Signature du client (precedee de la mention "Bon pour accord")</div><div class="signature-area"></div></div>`
  }

  // Free field
  if (quote.freeField) {
    html += `<div class="free-field">${esc(quote.freeField)}</div>`
  }

  // Legal footer
  if (company) {
    html += `<div style="margin-top:12px;font-size:8px;color:${T.textFooter};text-align:center">`
    html += `${esc(company.tradeName || company.legalName)}`
    if (company.legalForm) html += ` - ${esc(company.legalForm)}`
    if (company.siren) html += ` - SIREN ${esc(company.siren)}`
    if (company.vatNumber) html += ` - TVA ${esc(company.vatNumber)}`
    html += '</div>'
  }

  html += '</div>'
  return html
}

function renderLateral(
  quote: QuoteData,
  lines: LineData[],
  client: ClientData | null,
  company: CompanyData | null,
  settings: SettingsData,
  T: TemplateConfig,
  ac: string,
  docTitle: string,
  tva: { rate: number; base: number; amount: number }[],
  discountAmount: number
): string {
  // Sidebar with company info
  let sidebar = '<div class="sidebar">'
  if (quote.logoUrl) {
    sidebar += `<div class="section"><img src="${esc(quote.logoUrl)}" alt="Logo" style="max-width:80px;max-height:40px;filter:brightness(0) invert(1)" /></div>`
  }
  if (company) {
    sidebar += '<div class="section">'
    sidebar += `<h3>Societe</h3>`
    sidebar += `<p style="font-weight:700">${esc(company.tradeName || company.legalName)}</p>`
    if (company.legalForm) sidebar += `<p>${esc(company.legalForm)}</p>`
    if (company.addressLine1) sidebar += `<p>${esc(company.addressLine1)}</p>`
    if (company.postalCode || company.city) sidebar += `<p>${esc(company.postalCode || '')} ${esc(company.city || '')}</p>`
    sidebar += '</div>'
    if (company.siren || company.vatNumber) {
      sidebar += '<div class="section">'
      sidebar += '<h3>Informations</h3>'
      if (company.siren) sidebar += `<p>SIREN: ${esc(company.siren)}</p>`
      if (company.vatNumber) sidebar += `<p>TVA: ${esc(company.vatNumber)}</p>`
      sidebar += '</div>'
    }
    if (company.phone || company.email) {
      sidebar += '<div class="section">'
      sidebar += '<h3>Contact</h3>'
      if (company.phone) sidebar += `<p>${esc(company.phone)}</p>`
      if (company.email) sidebar += `<p>${esc(company.email)}</p>`
      sidebar += '</div>'
    }
  }
  sidebar += '</div>'

  // Main content area
  let main = '<div class="main-content">'
  main += `<div class="header"><div></div><div class="doc-info"><div class="doc-title">${esc(docTitle)}</div><div class="doc-number">${esc(quote.quoteNumber)}</div><div class="doc-date">${formatDate(quote.issueDate)}</div></div></div>`
  main += `<div class="divider"></div>`

  // Client only (company is in sidebar)
  if (client) {
    main += `<div style="margin-bottom:20px"><div class="address-label">Destinataire</div><div class="address-content">`
    main += `<div class="address-name">${esc(client.displayName)}</div>`
    if (client.address) main += `<div class="address-line">${esc(client.address)}</div>`
    if (client.postalCode || client.city) main += `<div class="address-line">${esc(client.postalCode || '')} ${esc(client.city || '')}</div>`
    if (quote.deliveryAddress) main += `<div style="border-top:1px solid ${T.clientBlockBorder};margin-top:6px;padding-top:6px;"><div style="font-size:8px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:${T.textMuted};margin-bottom:3px;">Adresse de livraison</div><div class="address-line">${esc(quote.deliveryAddress)}</div></div>`
    main += '</div></div>'
  }

  if (quote.subject) main += `<div class="subject">Objet : ${esc(quote.subject)}</div>`
  main += renderTable(lines, quote, T, ac)
  main += renderTotals(quote, tva, discountAmount, ac, T)
  if (quote.notes) main += `<div class="notes"><div class="notes-label">Notes</div>${esc(quote.notes)}</div>`
  main += renderFooter(company, settings, quote, T)
  main += '</div>'

  return sidebar + main
}
