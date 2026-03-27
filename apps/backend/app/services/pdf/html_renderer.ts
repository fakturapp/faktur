import { getTemplate, type TemplateConfig } from './templates.js'

interface QuoteData {
  quoteNumber: string
  status: string
  subject: string | null
  issueDate: string | Date
  validityDate: string | Date | null
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
  language: string
  vatExemptReason?: 'none' | 'not_subject' | 'france_no_vat' | 'outside_france'
  footerText?: string | null
  logoBorderRadius?: number
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
  documentFont: string
  documentType?: 'quote' | 'invoice' | 'credit_note'
  footerMode?: 'company_info' | 'vat_exempt' | 'custom'
}

/* ═══════════════════════════════════════════════════════════
   Utility helpers
   ═══════════════════════════════════════════════════════════ */

function esc(str: string | null | undefined): string {
  if (!str) return ''
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** Escape HTML then convert markdown formatting → HTML tags + newlines → <br> */
function formatText(str: string | null | undefined): string {
  if (!str) return ''

  const lines = esc(str).split('\n')
  const parts: string[] = []
  let inList = false

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i]
    // Inline formatting
    line = line.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    line = line.replace(/__(.+?)__/g, '<u>$1</u>')
    line = line.replace(/\*(.+?)\*/g, '<em>$1</em>')
    line = line.replace(/~~(.+?)~~/g, '<s>$1</s>')
    line = line.replace(/\{color:([^}]+)\}(.+?)\{\/color\}/g, '<span style="color:$1">$2</span>')
    line = line.replace(
      /\{bg:([^}]+)\}(.+?)\{\/bg\}/g,
      '<span style="background-color:$1;border-radius:2px;padding:0 2px">$2</span>'
    )
    line = line.replace(/\{size:sm\}(.+?)\{\/size\}/g, '<span style="font-size:0.85em">$1</span>')
    line = line.replace(/\{size:lg\}(.+?)\{\/size\}/g, '<span style="font-size:1.3em">$1</span>')
    line = line.replace(/\{font:([^}]+)\}(.+?)\{\/font\}/g, '<span style="font-family:$1">$2</span>')
    line = line.replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      '<a href="$2" style="color:inherit;text-decoration:underline">$1</a>'
    )

    // Heading
    if (line.startsWith('## ')) {
      if (inList) { parts.push('</ul>'); inList = false }
      parts.push(`<strong style="font-size:1.3em">${line.slice(3)}</strong>`)
      if (i < lines.length - 1) parts.push('<br>')
      continue
    }

    // List item
    if (line.startsWith('- ')) {
      if (!inList) { parts.push('<ul style="margin:0;padding-left:1.2em">'); inList = true }
      parts.push(`<li>${line.slice(2)}</li>`)
      continue
    }

    // Normal
    if (inList) { parts.push('</ul>'); inList = false }
    parts.push(line)
    if (i < lines.length - 1) parts.push('<br>')
  }

  if (inList) parts.push('</ul>')
  return parts.join('')
}

function formatIban(iban: string): string {
  const clean = iban.replace(/\s/g, '')
  // Format in groups of 4
  return clean.match(/.{1,4}/g)?.join(' ') || clean
}

function fmtC(n: number, lang: string): string {
  const locale = lang === 'en' ? 'en-GB' : 'fr-FR'
  return (
    n.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' \u20ac'
  )
}

function fmtD(dateStr: string | Date, lang: string): string {
  if (!dateStr) return ''
  const str =
    typeof dateStr === 'object' && dateStr instanceof Date
      ? dateStr.toISOString().split('T')[0]
      : String(dateStr)
  const parts = str.split('-')
  if (parts.length !== 3) return str
  const [y, m, d] = parts
  return lang === 'en' ? `${d}/${m}/${y}` : `${d}/${m}/${y}`
}

function contrastText(hex: string): string {
  const r = Number.parseInt(hex.slice(1, 3), 16)
  const g = Number.parseInt(hex.slice(3, 5), 16)
  const b = Number.parseInt(hex.slice(5, 7), 16)
  return (r * 299 + g * 587 + b * 114) / 1000 > 128 ? '#000' : '#fff'
}

/* ═══════════════════════════════════════════════════════════
   i18n
   ═══════════════════════════════════════════════════════════ */

interface I18n {
  quote: string
  date: string
  validity: string
  issuer: string
  recipient: string
  deliveryAddress: string
  subject: string
  description: string
  qty: string
  unitPrice: string
  vat: string
  amount: string
  subtotalHT: string
  totalHT: string
  totalTVA: string
  totalTTC: string
  discount: string
  notes: string
  acceptanceConditions: string
  signatureIssuer: string
  signatureClient: string
  paymentMethods: string
  bankTransfer: string
  cash: string
  vatNo: string
  company: string
  vatBreakRate: string
  vatBreakBase: string
  vatBreakAmount: string
  bankLabel: string
  conditionsAndNotes: string
  freeField: string
  unit: string
  quoteNumber: string
  vatExemptNotSubject: string
  vatExemptFranceNoVat: string
  vatExemptOutsideFrance: string
}

function getI18n(lang: string): I18n {
  if (lang === 'en')
    return {
      quote: 'QUOTE',
      date: 'Date',
      validity: 'Valid until',
      issuer: 'From',
      recipient: 'To',
      deliveryAddress: 'Delivery address',
      subject: 'Subject',
      description: 'Description',
      qty: 'Qty',
      unitPrice: 'Unit price',
      vat: 'VAT',
      amount: 'Amount',
      subtotalHT: 'Subtotal excl. tax',
      totalHT: 'Total excl. tax',
      totalTVA: 'Total VAT',
      totalTTC: 'Total incl. tax',
      discount: 'Discount',
      notes: 'Notes',
      acceptanceConditions: 'Acceptance conditions',
      signatureIssuer: 'Issuer signature',
      signatureClient: 'Client signature (preceded by "Approved")',
      paymentMethods: 'Accepted payment methods',
      bankTransfer: 'Bank transfer',
      cash: 'Cash',
      vatNo: 'VAT No.',
      company: 'Company',
      vatBreakRate: 'VAT rate',
      vatBreakBase: 'Base',
      vatBreakAmount: 'VAT amount',
      bankLabel: 'Bank',
      conditionsAndNotes: 'Conditions & notes',
      freeField: 'Additional information',
      unit: 'Unit',
      quoteNumber: 'Quote #',
      vatExemptNotSubject: 'VAT not applicable, article 293 B of the CGI',
      vatExemptFranceNoVat: 'VAT exemption, article 261 of the CGI',
      vatExemptOutsideFrance:
        'VAT not applicable — service performed outside France, article 259-1 of the CGI',
    }
  return {
    quote: 'DEVIS',
    date: 'Date',
    validity: 'Validite',
    issuer: 'Emetteur',
    recipient: 'Destinataire',
    deliveryAddress: 'Adresse de livraison',
    subject: 'Objet',
    description: 'Designation',
    qty: 'Qte',
    unitPrice: 'P.U. HT',
    vat: 'TVA',
    amount: 'Montant HT',
    subtotalHT: 'Sous-total HT',
    totalHT: 'Total HT',
    totalTVA: 'Total TVA',
    totalTTC: 'Total TTC',
    discount: 'Remise',
    notes: 'Notes',
    acceptanceConditions: "Conditions d'acceptation",
    signatureIssuer: 'Signature emetteur',
    signatureClient: 'Signature du client (precedee de la mention "Bon pour accord")',
    paymentMethods: 'Moyens de paiement acceptes',
    bankTransfer: 'Virement bancaire',
    cash: 'Especes',
    vatNo: 'N\u00b0 TVA',
    company: 'Societe',
    vatBreakRate: 'Taux TVA',
    vatBreakBase: 'Base HT',
    vatBreakAmount: 'Montant TVA',
    bankLabel: 'Banque',
    conditionsAndNotes: 'Conditions et notes',
    freeField: 'Champ libre',
    unit: 'Unite',
    quoteNumber: 'Devis n\u00b0',
    vatExemptNotSubject: 'TVA non applicable, article 293 B du CGI',
    vatExemptFranceNoVat: 'Exon\u00e9ration de TVA, article 261 du CGI',
    vatExemptOutsideFrance:
      'TVA non applicable \u2014 prestation de services r\u00e9alis\u00e9e hors de France, article 259-1 du CGI',
  }
}

function getVatExemptText(reason: string | undefined, i: I18n): string | null {
  if (!reason || reason === 'none') return null
  if (reason === 'not_subject') return i.vatExemptNotSubject
  if (reason === 'france_no_vat') return i.vatExemptFranceNoVat
  if (reason === 'outside_france') return i.vatExemptOutsideFrance
  return null
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

/* ═══════════════════════════════════════════════════════════
   Main render
   ═══════════════════════════════════════════════════════════ */

export function renderQuoteHtml(
  quote: QuoteData,
  lines: LineData[],
  client: ClientData | null,
  company: CompanyData | null,
  settings: SettingsData
): string {
  const T = getTemplate(settings.template, settings.darkMode)
  const ac = quote.accentColor || '#6366f1'
  const lang = quote.language || 'fr'
  const i = getI18n(lang)
  const docTitle = quote.documentTitle || i.quote
  const tva = buildTvaBreakdown(lines, quote.billingType)
  const isClassique = T.id === 'classique'

  let discountAmount = 0
  if (quote.globalDiscountType === 'percentage' && quote.globalDiscountValue > 0) {
    discountAmount = quote.subtotal * (quote.globalDiscountValue / 100)
  } else if (quote.globalDiscountType === 'fixed' && quote.globalDiscountValue > 0) {
    discountAmount = quote.globalDiscountValue
  }
  discountAmount = Math.round(discountAmount * 100) / 100

  // Font: template-specific font takes priority, then user setting
  const fontName = T.font || settings.documentFont || 'Lexend'
  const fontImport = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontName)}:wght@300;400;500;600;700;800&display=swap`

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="${fontImport}">
<style>
  @page { size: A4; margin: 0; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: '${fontName}', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    font-size: 11px;
    color: ${T.text};
    background: ${T.docBg};
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  /* ── Page container ── */
  .page {
    width: 210mm;
    min-height: 297mm;
    position: relative;
    background: ${T.docBg};
    ${
      isClassique
        ? `background: linear-gradient(270deg, ${T.docBg}, ${settings.darkMode ? '#161618' : '#fff'} 23.44%, ${settings.darkMode ? '#161618' : '#fff'} 77.6%, ${T.docBg});`
        : ''
    }
    ${T.layout === 'lateral' ? 'display: flex;' : 'padding: 32px 40px 28px 40px; display: flex; flex-direction: column;'}
  }

  ${
    isClassique
      ? `
  .page { letter-spacing: 0.5px; }
  `
      : ''
  }

  /* ── Lateral sidebar ── */
  ${
    T.layout === 'lateral'
      ? `
  .sidebar { width: 22%; background: ${ac}; padding: 28px 16px; color: #fff; }
  .sidebar h3 { font-size: 9px; text-transform: uppercase; letter-spacing: 1px; opacity: 0.7; margin-bottom: 6px; }
  .sidebar p { font-size: 10px; margin-bottom: 3px; line-height: 1.4; }
  .sidebar .section { margin-bottom: 20px; }
  .main-content { flex: 1; padding: 32px 28px 28px 24px; display: flex; flex-direction: column; }
  `
      : ''
  }

  /* ── Header ── */
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
  .logo img { max-height: 80px; max-width: 160px; object-fit: contain; }
  .logo-placeholder {
    width: 64px; height: 64px; display: flex; align-items: center; justify-content: center;
    background: ${ac}15; border: 2px dashed ${ac}66; border-radius: ${T.borderRadius};
  }
  .logo-placeholder span { font-size: 10px; font-weight: 500; color: ${ac}; }

  /* Standard header (non-banner, non-classique) */
  .doc-badge {
    display: inline-block; padding: 10px 20px; margin-bottom: 8px;
    background: ${ac}12; border: 1px solid ${ac}33; border-radius: ${T.borderRadius};
  }
  .doc-badge-title { font-size: 20px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; color: ${ac}; }

  /* Classique header */
  .classique-title { font-size: 14px; font-weight: 600; color: ${T.text}; margin-bottom: 4px; }
  .classique-number { font-size: 12px; color: ${T.text}; line-height: 1.8; }

  .doc-number { font-size: 12px; color: ${T.text}; line-height: 1.8; }

  /* Banner header */
  .banner {
    padding: 16px 24px; border-radius: ${T.borderRadius}; margin: -8px -16px 24px -16px;
    background: ${ac}; display: flex; align-items: center; justify-content: space-between;
  }
  .banner .banner-title { font-size: 18px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; color: ${contrastText(ac)}; }
  .banner .banner-number { font-size: 11px; margin-top: 2px; color: ${contrastText(ac)}; opacity: 0.8; }
  .banner .logo img { max-height: 64px; }
  .banner-company { font-size: 18px; font-weight: 700; color: ${contrastText(ac)}; }

  /* ── Subject ── */
  ${
    isClassique
      ? `
  .subject-block {
    border: 1px dashed ${T.borderLight}; background: ${T.docBg}; padding: 7px; margin-bottom: 16px;
  }
  .subject-block .subject-text { font-size: 16px; font-weight: 800; letter-spacing: 0.5px; color: ${ac}; }
  `
      : `
  .subject-block { margin-bottom: 16px; font-size: 13px; color: ${T.text}; }
  .subject-label { font-weight: 600; }
  `
  }

  /* ── Date bar ── */
  ${
    isClassique
      ? `
  .date-bar { display: flex; align-items: flex-end; gap: 12px; margin-bottom: 16px; }
  .date-bar .date-title { flex: 1; font-size: 14px; font-weight: 600; color: ${T.text}; padding: 8px; }
  .date-bar .date-group { display: flex; flex-direction: column; }
  .date-bar .date-label { font-size: 12px; color: ${T.textMuted}; letter-spacing: 0.4px; margin-bottom: 2px; }
  .date-bar .date-value {
    border: 1px solid ${T.borderLight}; border-radius: 6px; height: 36px;
    min-width: 140px; padding: 0 10px; display: flex; align-items: center;
    font-size: 14px; color: ${T.text}; background: ${T.docBg};
  }
  .date-bar .date-value.dashed { border-style: dashed; }
  `
      : `
  .date-bar {
    display: flex; gap: 16px; margin-bottom: 16px; padding: 10px 12px;
    background: ${ac}08; border: 1px solid ${ac}20; border-radius: ${T.borderRadius};
  }
  .date-bar .date-item { font-size: 11px; color: ${T.textMuted}; }
  .date-bar .date-item strong { font-weight: 600; color: ${T.text}; }
  `
  }

  /* ── Client block ── */
  .client-block { display: flex; justify-content: flex-end; margin-bottom: 20px; }
  .client-card { width: 50%; }
  .client-name { font-size: 13px; font-weight: 600; color: ${T.text}; margin-bottom: 4px; }
  .client-line { font-size: 12px; color: ${T.textMuted}; line-height: 1.5; }
  .client-info { font-size: 10px; color: ${T.textMuted}; margin-top: 2px; }

  /* ── Addresses (lateral) ── */
  .addresses { display: flex; gap: 24px; margin-bottom: 20px; }
  .address-block { flex: 1; }
  .address-label { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: ${ac}; margin-bottom: 6px; }
  .address-content { padding: 10px; border-radius: ${T.borderRadius}; background: ${T.clientBlockBg}; border: 1px solid ${T.clientBlockBorder}; }
  .address-name { font-size: 12px; font-weight: 700; color: ${T.text}; margin-bottom: 4px; }
  .address-line { font-size: 10px; color: ${T.textMuted}; line-height: 1.5; }

  /* ── Lines table ── */
  .lines-table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
  .lines-table thead th {
    padding: 8px 12px; font-size: 10px; font-weight: 600; text-transform: uppercase;
    letter-spacing: 0.5px; background: ${ac}; color: ${contrastText(ac)}; text-align: left;
  }
  .lines-table thead th:first-child { border-top-left-radius: ${T.borderRadius}; }
  .lines-table thead th:last-child { border-top-right-radius: ${T.borderRadius}; text-align: right; }
  .lines-table thead th.center { text-align: center; }
  .lines-table thead th.right { text-align: right; }
  .lines-table tbody td {
    padding: 8px 12px; font-size: 12px; border-bottom: 1px solid ${T.borderLight}; color: ${T.text};
  }
  .lines-table tbody td.center { text-align: center; }
  .lines-table tbody td.right { text-align: right; }
  .lines-table tbody td.amount { font-weight: 600; text-align: right; }
  .lines-table tbody td.unit-col { font-size: 11px; color: ${T.textMuted}; text-align: center; }
  .lines-table tbody td.vat-col { font-size: 11px; color: ${T.textMuted}; text-align: center; }
  .lines-table tbody tr.even { background: ${T.rowEven}; }
  .lines-table tbody tr.odd { background: ${T.rowOdd}; }
  .lines-table tbody tr.section-row td {
    font-weight: 700; color: ${ac}; background: ${ac}06;
    border-bottom: 2px solid ${ac}15; padding: 6px 12px;
  }

  /* ── Totals ── */
  .totals-wrap { display: flex; justify-content: flex-end; margin-bottom: 20px; }

  ${
    isClassique
      ? `
  .totals-box { width: 280px; color: ${ac}; }
  .totals-rows { padding: 0 8px; display: flex; flex-direction: column; gap: 12px; }
  .total-row { display: flex; justify-content: space-between; align-items: center; }
  .total-row .label { font-size: 14px; font-weight: 600; }
  .total-row .value { font-size: 14px; font-weight: 600; }
  .total-row.sub .label, .total-row.sub .value { font-size: 12px; font-weight: 600; }
  .total-row.discount .label, .total-row.discount .value { font-size: 12px; font-weight: 600; }
  .total-final {
    display: flex; justify-content: space-between; align-items: center;
    padding: 0 8px; margin-top: 20px;
  }
  .total-final .label { font-size: 20px; font-weight: 800; letter-spacing: 0.5px; }
  .total-final .value {
    font-size: 20px; font-weight: 800; letter-spacing: 0.5px;
    padding: 4px 12px; border-radius: 100px; background: ${ac}15;
  }
  `
      : `
  .totals-box { width: 260px; }
  .total-row {
    display: flex; justify-content: space-between; padding: 6px 0;
    border-bottom: 1px solid ${T.borderLight}; font-size: 12px;
  }
  .total-row .label { color: ${T.textMuted}; }
  .total-row .value { font-weight: 600; color: ${T.text}; }
  .total-row.sub .label, .total-row.sub .value { font-size: 10px; color: ${T.textMuted}; }
  .total-row.discount .value { color: #e53935; font-size: 10px; }
  .total-row.discount .label { font-size: 10px; color: ${T.textMuted}; }
  .total-final {
    display: flex; justify-content: space-between; padding: 10px 14px; margin-top: 6px;
    background: ${ac}${T.totalBg}; border: 1px solid ${ac}${T.totalBorder};
    border-radius: ${T.borderRadius};
  }
  .total-final .label { font-size: 13px; font-weight: 700; color: ${T.text}; }
  .total-final .value { font-size: 15px; font-weight: 700; color: ${ac}; }
  `
  }

  /* ── TVA breakdown ── */
  .tva-table { margin-bottom: 16px; width: auto; border-collapse: collapse; }
  .tva-table th { font-size: 8px; padding: 5px 8px; background: ${ac}08; color: ${ac}; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; }
  .tva-table td { font-size: 9.5px; padding: 5px 8px; border-bottom: 1px solid ${T.borderLight}; }
  .tva-table td.right { text-align: right; }

  /* ── VAT exempt ── */
  .vat-exempt { font-size: 10px; font-style: italic; color: ${T.textMuted}; margin-bottom: 12px; }

  /* ── Notes ── */
  .notes-section { padding-top: 12px; border-top: 1px solid ${T.borderLight}; margin-bottom: 12px; }
  .section-label { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: ${T.textMuted}; margin-bottom: 4px; }
  .notes-text { font-size: 11px; color: ${T.textMuted}; line-height: 1.6; white-space: pre-wrap; }

  /* ── Acceptance conditions ── */
  .conditions-section { margin-bottom: 10px; }
  .conditions-text { font-size: 11px; color: ${T.textMuted}; line-height: 1.6; white-space: pre-wrap; }

  /* ── Free field ── */
  .free-field-section { margin-bottom: 10px; }
  .free-field-text { font-size: 11px; color: ${T.textMuted}; white-space: pre-wrap; }

  /* ── Signature ── */
  .signature-row { display: flex; gap: 20px; margin-bottom: 12px; }
  .signature-box { flex: 1; }
  .signature-area { height: 56px; border: 2px dashed ${T.signatureBorder}; border-radius: ${T.borderRadius}; }

  /* ── Payment methods ── */
  .payment-section { margin-bottom: 12px; }
  .payment-badges { display: flex; gap: 6px; flex-wrap: wrap; }
  .payment-badge {
    font-size: 9px; padding: 3px 8px; border-radius: 6px;
    background: ${T.paymentBadgeBg}; border: 1px solid ${T.paymentBadgeBorder};
    color: ${T.paymentBadgeText};
  }
  .bank-info { display: flex; gap: 20px; margin-top: 6px; }
  .bank-item { font-size: 9px; color: ${T.textFooter}; }
  .bank-item strong { color: ${T.textMuted}; }

  /* ── Footer ── */
  ${
    isClassique
      ? `
  .legal-footer {
    margin-top: 16px; padding-top: 12px; text-align: center;
    border: 1px dashed ${T.borderLight}; background: ${T.docBg}; padding: 6px 7px;
  }
  .legal-footer-text { font-size: 11px; color: ${T.textFooter}; line-height: 1.6; }
  `
      : `
  .legal-footer {
    margin-top: 16px; padding-top: 12px; text-align: center;
    border-top: 2px solid ${T.footerBorder};
  }
  .legal-footer-text { font-size: 9px; color: ${T.textFooter}; line-height: 1.6; }
  `
  }

  /* ── Grow top, pin bottom ── */
  .top-section { flex: 1; }
  .bottom-section { margin-top: auto; }
</style>
</head>
<body>
<div class="page">
${
  T.layout === 'lateral'
    ? renderLateral(
        quote,
        lines,
        client,
        company,
        settings,
        T,
        ac,
        docTitle,
        tva,
        discountAmount,
        lang,
        i
      )
    : renderStandardPage(
        quote,
        lines,
        client,
        company,
        settings,
        T,
        ac,
        docTitle,
        tva,
        discountAmount,
        lang,
        i,
        isClassique
      )
}
</div>
</body>
</html>`
}

/* ═══════════════════════════════════════════════════════════
   Standard + Banner layout
   ═══════════════════════════════════════════════════════════ */

function renderStandardPage(
  quote: QuoteData,
  lines: LineData[],
  client: ClientData | null,
  company: CompanyData | null,
  settings: SettingsData,
  T: TemplateConfig,
  ac: string,
  docTitle: string,
  tva: { rate: number; base: number; amount: number }[],
  discountAmount: number,
  lang: string,
  i: I18n,
  isClassique: boolean
): string {
  let html = '<div class="top-section">'

  // Banner header
  if (T.layout === 'banner') {
    html += `<div class="banner">
      <div class="logo">
        ${
          quote.logoUrl
            ? `<img src="${esc(quote.logoUrl)}" alt="Logo" style="border-radius:${quote.logoBorderRadius || 0}px" />`
            : `<div class="banner-company">${esc(company?.tradeName || company?.legalName || '')}</div>`
        }
      </div>
      <div style="text-align:right">
        <div class="banner-title">${esc(docTitle)}</div>
        <div class="banner-number">${i.quoteNumber} ${esc(quote.quoteNumber)}</div>
      </div>
    </div>`
  }

  // Standard/Classique header
  if (T.layout !== 'banner') {
    html += '<div class="header">'
    // Left: logo + company
    html += '<div style="max-width:55%">'
    if (quote.logoUrl) {
      html += `<div class="logo"><img src="${esc(quote.logoUrl)}" alt="Logo" style="border-radius:${quote.logoBorderRadius || 0}px" /></div>`
    }
    if (company) {
      html += `<div style="font-size:12px;line-height:1.6;margin-top:${quote.logoUrl ? '8px' : '0'}">`
      html += `<div style="font-weight:600;font-size:13px;color:${T.text}">${esc(company.tradeName || company.legalName)}</div>`
      if (company.addressLine1)
        html += `<div style="color:${T.textMuted}">${esc(company.addressLine1)}</div>`
      if (company.postalCode || company.city)
        html += `<div style="color:${T.textMuted}">${esc(company.postalCode || '')} ${esc(company.city || '')}</div>`
      if (company.phone) html += `<div style="color:${T.textMuted}">${esc(company.phone)}</div>`
      if (company.email) html += `<div style="color:${T.textMuted}">${esc(company.email)}</div>`
      if (company.siren)
        html += `<div style="font-size:10px;margin-top:2px;color:${T.textMuted}">SIREN : ${esc(company.siren)}</div>`
      if (company.vatNumber)
        html += `<div style="font-size:10px;color:${T.textMuted}">${i.vatNo} : ${esc(company.vatNumber)}</div>`
      html += '</div>'
    }
    html += '</div>'

    // Right: title + quote number
    html += '<div style="text-align:right">'
    if (isClassique) {
      html += `<div class="classique-title">${esc(docTitle)}</div>`
      html += `<div class="classique-number">${i.quoteNumber} <strong>${esc(quote.quoteNumber)}</strong></div>`
    } else {
      html += `<div class="doc-badge"><div class="doc-badge-title">${esc(docTitle)}</div></div>`
      html += `<div class="doc-number">${i.quoteNumber} <strong>${esc(quote.quoteNumber)}</strong></div>`
    }
    html += '</div>'
    html += '</div>'
  }

  // Company info below banner
  if (T.layout === 'banner' && company) {
    html +=
      '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:20px">'
    html += `<div style="font-size:12px;line-height:1.6;color:${T.text}">`
    html += `<div style="font-weight:600;font-size:13px">${esc(company.tradeName || company.legalName)}</div>`
    if (company.addressLine1) html += `<div>${esc(company.addressLine1)}</div>`
    if (company.postalCode || company.city)
      html += `<div>${esc(company.postalCode || '')} ${esc(company.city || '')}</div>`
    if (company.phone) html += `<div>${esc(company.phone)}</div>`
    if (company.email) html += `<div>${esc(company.email)}</div>`
    html += '</div>'
    html += `<div style="font-size:12px;text-align:right;line-height:1.8;color:${T.text}">`
    html += `<div>${i.quoteNumber} <strong>${esc(quote.quoteNumber)}</strong></div>`
    if (company.siren)
      html += `<div style="font-size:10px;margin-top:2px">SIREN : ${esc(company.siren)}</div>`
    if (company.vatNumber)
      html += `<div style="font-size:10px">${i.vatNo} : ${esc(company.vatNumber)}</div>`
    html += '</div></div>'
  }

  // Subject
  if (quote.subject) {
    if (isClassique) {
      html += `<div class="subject-block"><div class="subject-text">${esc(quote.subject)}</div></div>`
    } else {
      html += `<div class="subject-block"><span class="subject-label">${i.subject} : </span>${esc(quote.subject)}</div>`
    }
  }

  // Client block (right-aligned, like frontend)
  html += renderClientBlock(client, quote, T, lang, i)

  // Dates
  html += renderDateBar(quote, docTitle, T, ac, lang, i, isClassique)

  // Lines table
  html += renderTable(lines, quote, T, ac, lang, i)

  html += '</div>' // end top-section

  // Bottom section
  html += '<div class="bottom-section">'

  // Totals
  html += renderTotals(quote, tva, discountAmount, lang, i, isClassique)

  // VAT exempt
  const vatText = getVatExemptText(quote.vatExemptReason, i)
  if (vatText) {
    html += `<div class="vat-exempt">${vatText}</div>`
  }

  // Notes
  if (quote.notes) {
    html += `<div class="notes-section"><div class="section-label">${i.conditionsAndNotes}</div><div class="notes-text">${formatText(quote.notes)}</div></div>`
  }

  // Acceptance conditions
  if (quote.acceptanceConditions) {
    html += `<div class="conditions-section"><div class="section-label">${i.acceptanceConditions}</div><div class="conditions-text">${formatText(quote.acceptanceConditions)}</div></div>`
  }

  // Free field
  if (quote.freeField) {
    html += `<div class="free-field-section"><div class="section-label">${i.freeField}</div><div class="free-field-text">${formatText(quote.freeField)}</div></div>`
  }

  // Signature
  if (quote.signatureField) {
    html += `<div class="signature-row">
      <div class="signature-box"><div class="section-label">${i.signatureIssuer}</div><div class="signature-area"></div></div>
      <div class="signature-box"><div class="section-label">${i.signatureClient}</div><div class="signature-area"></div></div>
    </div>`
  }

  // Payment methods
  html += renderPaymentMethods(company, settings, T, lang, i)

  // Footer
  html += renderLegalFooter(company, quote, settings, T, lang, i, isClassique)

  html += '</div>' // end bottom-section

  return html
}

/* ═══════════════════════════════════════════════════════════
   Client block
   ═══════════════════════════════════════════════════════════ */

function renderClientBlock(
  client: ClientData | null,
  quote: QuoteData,
  T: TemplateConfig,
  _lang: string,
  i: I18n
): string {
  if (!client) return ''

  let html = '<div class="client-block"><div class="client-card">'
  html += `<div class="client-name">${esc(client.displayName)}</div>`
  if (client.address) html += `<div class="client-line">${esc(client.address)}</div>`
  if (client.addressComplement)
    html += `<div class="client-line">${esc(client.addressComplement)}</div>`
  if (client.postalCode || client.city)
    html += `<div class="client-line">${esc(client.postalCode || '')} ${esc(client.city || '')}</div>`
  if (client.country && client.country !== 'FR')
    html += `<div class="client-line">${esc(client.country)}</div>`

  if (quote.clientSiren) html += `<div class="client-info">SIREN : ${esc(quote.clientSiren)}</div>`
  if (quote.clientVatNumber)
    html += `<div class="client-info">${i.vatNo} : ${esc(quote.clientVatNumber)}</div>`

  if (quote.deliveryAddress) {
    html += `<div style="border-top:1px solid ${T.borderLight};margin-top:8px;padding-top:8px">`
    html += `<div class="section-label">${i.deliveryAddress}</div>`
    html += `<div class="client-line" style="white-space:pre-line">${formatText(quote.deliveryAddress)}</div>`
    html += '</div>'
  }

  html += '</div></div>'
  return html
}

/* ═══════════════════════════════════════════════════════════
   Date bar
   ═══════════════════════════════════════════════════════════ */

function renderDateBar(
  quote: QuoteData,
  docTitle: string,
  _T: TemplateConfig,
  _ac: string,
  lang: string,
  i: I18n,
  isClassique: boolean
): string {
  if (isClassique) {
    let html = '<div class="date-bar">'
    html += `<div class="date-title">${esc(docTitle)}</div>`
    html += `<div class="date-group"><span class="date-label">${i.date}</span><div class="date-value">${fmtD(quote.issueDate, lang)}</div></div>`
    if (quote.validityDate) {
      html += `<div class="date-group"><span class="date-label">${i.validity}</span><div class="date-value dashed">${fmtD(quote.validityDate, lang)}</div></div>`
    }
    html += '</div>'
    return html
  }

  let html = '<div class="date-bar">'
  html += `<div class="date-item"><strong>${i.date} :</strong> ${fmtD(quote.issueDate, lang)}</div>`
  if (quote.validityDate) {
    html += `<div class="date-item"><strong>${i.validity} :</strong> ${fmtD(quote.validityDate, lang)}</div>`
  }
  html += '</div>'
  return html
}

/* ═══════════════════════════════════════════════════════════
   Lines table
   ═══════════════════════════════════════════════════════════ */

function renderTable(
  lines: LineData[],
  quote: QuoteData,
  _T: TemplateConfig,
  _ac: string,
  lang: string,
  i: I18n
): string {
  const isDetailed = quote.billingType === 'detailed'

  let headerCols = `<th>${i.description}</th>`
  if (isDetailed) {
    headerCols += `<th class="center">${i.qty}</th>`
    headerCols += `<th class="center">${i.unit}</th>`
    headerCols += `<th class="right">${i.unitPrice}</th>`
    headerCols += `<th class="center">${i.vat}</th>`
  }
  headerCols += `<th class="right">${i.amount}</th>`

  let rows = ''
  lines.forEach((line, idx) => {
    if (line.saleType === 'section') {
      rows += `<tr class="section-row"><td colspan="${isDetailed ? 6 : 2}">${formatText(line.description)}</td></tr>`
      return
    }
    const cls = idx % 2 === 0 ? 'even' : 'odd'
    const lineTotal = isDetailed ? line.quantity * line.unitPrice : line.unitPrice
    rows += `<tr class="${cls}"><td>${formatText(line.description)}</td>`
    if (isDetailed) {
      rows += `<td class="center">${line.quantity}</td>`
      rows += `<td class="unit-col">${esc(line.unit || '')}</td>`
      rows += `<td class="right">${fmtC(line.unitPrice, lang)}</td>`
      rows += `<td class="vat-col">${line.vatRate}%</td>`
    }
    rows += `<td class="amount">${fmtC(lineTotal, lang)}</td></tr>`
  })

  return `<table class="lines-table"><thead><tr>${headerCols}</tr></thead><tbody>${rows}</tbody></table>`
}

/* ═══════════════════════════════════════════════════════════
   Totals
   ═══════════════════════════════════════════════════════════ */

function renderTotals(
  quote: QuoteData,
  tva: { rate: number; base: number; amount: number }[],
  discountAmount: number,
  lang: string,
  i: I18n,
  isClassique: boolean
): string {
  const isDetailed = quote.billingType === 'detailed'
  const totalTax = tva.reduce((s, tv) => s + tv.amount, 0)

  let html = '<div class="totals-wrap"><div class="totals-box">'

  if (isClassique) {
    html += '<div class="totals-rows">'
    html += `<div class="total-row"><span class="label">${i.totalHT}</span><span class="value">${fmtC(quote.subtotal, lang)}</span></div>`
    for (const tv of tva) {
      html += `<div class="total-row sub"><span class="label">${i.vat} ${tv.rate}%</span><span class="value">${fmtC(tv.amount, lang)}</span></div>`
    }
    if (totalTax > 0) {
      html += `<div class="total-row" style="border-top:1px solid ${isClassique ? 'currentColor' : 'inherit'};opacity:0.3;padding-top:4px"><span class="label" style="font-weight:600">${i.totalTVA}</span><span class="value">${fmtC(totalTax, lang)}</span></div>`
    }
    if (discountAmount > 0) {
      html += `<div class="total-row discount"><span class="label">${i.discount}</span><span class="value">-${fmtC(discountAmount, lang)}</span></div>`
    }
    html += '</div>'
    html += `<div class="total-final"><span class="label">${isDetailed ? i.totalTTC : i.totalHT}</span><span class="value">${fmtC(quote.total, lang)}</span></div>`
  } else {
    if (isDetailed) {
      html += `<div class="total-row"><span class="label">${i.totalHT}</span><span class="value">${fmtC(quote.subtotal, lang)}</span></div>`
      for (const tv of tva) {
        html += `<div class="total-row sub"><span class="label">${i.vat} ${tv.rate}% (${fmtC(tv.base, lang)})</span><span class="value">${fmtC(tv.amount, lang)}</span></div>`
      }
      if (totalTax > 0) {
        html += `<div class="total-row"><span class="label" style="font-weight:600">${i.totalTVA}</span><span class="value" style="font-weight:600">${fmtC(totalTax, lang)}</span></div>`
      }
    }
    if (discountAmount > 0) {
      const label =
        quote.globalDiscountType === 'percentage'
          ? `${i.discount} (${quote.globalDiscountValue}%)`
          : i.discount
      html += `<div class="total-row discount"><span class="label">${label}</span><span class="value">-${fmtC(discountAmount, lang)}</span></div>`
    }
    html += `<div class="total-final"><span class="label">${isDetailed ? i.totalTTC : i.totalHT}</span><span class="value">${fmtC(quote.total, lang)}</span></div>`
  }

  html += '</div></div>'
  return html
}

/* ═══════════════════════════════════════════════════════════
   Payment methods
   ═══════════════════════════════════════════════════════════ */

function renderPaymentMethods(
  company: CompanyData | null,
  settings: SettingsData,
  _T: TemplateConfig,
  lang: string,
  i: I18n
): string {
  // Payment methods are only shown on invoices, not on quotes
  if (settings.documentType === 'quote') return ''
  if (!settings.paymentMethods || settings.paymentMethods.length === 0) return ''

  const method = settings.paymentMethods[0]
  let methodLabel = ''
  if (method === 'bank_transfer') methodLabel = i.bankTransfer
  else if (method === 'cash') methodLabel = i.cash
  else if ((method === 'custom' || method === 'other') && settings.customPaymentMethod)
    methodLabel = esc(settings.customPaymentMethod)
  else methodLabel = lang === 'en' ? 'Other' : 'Autre'

  let html = `<div class="payment-section"><div class="section-label">${lang === 'en' ? 'Payment method' : 'Moyen de paiement'}</div>`
  html += `<div style="font-size:11px;line-height:1.7;color:${_T.text}"><div style="font-weight:600">${methodLabel}</div>`

  // Bank details
  if (method === 'bank_transfer' && company && (company.iban || company.bic || company.bankName)) {
    html += '<div style="margin-top:4px">'
    if (company.bankName)
      html += `<div><strong>${i.bankLabel} :</strong> ${esc(company.bankName)}</div>`
    if (company.iban) html += `<div><strong>IBAN :</strong> ${formatIban(company.iban)}</div>`
    if (company.bic) html += `<div><strong>BIC :</strong> ${esc(company.bic)}</div>`
    html += '</div>'
  }

  html += '</div></div>'
  return html
}

/* ═══════════════════════════════════════════════════════════
   Legal footer
   ═══════════════════════════════════════════════════════════ */

function renderLegalFooter(
  company: CompanyData | null,
  quote: QuoteData,
  settings: SettingsData,
  _T: TemplateConfig,
  _lang: string,
  i: I18n,
  isClassique: boolean
): string {
  const footerMode = settings.footerMode === 'custom' ? 'custom' : 'company_info'

  // Custom footer text
  if (footerMode === 'custom') {
    const text = quote.footerText || ''
    if (!text) return ''
    return `<div class="legal-footer"><div class="legal-footer-text">${formatText(text)}</div></div>`
  }

  // Company info
  if (!company) return ''

  let text = esc(company.tradeName || company.legalName)
  if (company.siren) text += ` &mdash; SIREN : ${esc(company.siren)}`
  if (company.vatNumber) text += ` &mdash; ${i.vatNo} : ${esc(company.vatNumber)}`

  if (!isClassique) {
    text += '<br />'
    if (company.addressLine1) text += esc(company.addressLine1) + ', '
    if (company.postalCode) text += esc(company.postalCode) + ' '
    if (company.city) text += esc(company.city)
    if (company.phone) text += ` &mdash; ${esc(company.phone)}`
    if (company.email) text += ` &mdash; ${esc(company.email)}`
  }

  return `<div class="legal-footer"><div class="legal-footer-text">${text}</div></div>`
}

/* ═══════════════════════════════════════════════════════════
   Lateral layout
   ═══════════════════════════════════════════════════════════ */

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
  discountAmount: number,
  lang: string,
  i: I18n
): string {
  // Sidebar with company info
  let sidebar = '<div class="sidebar">'
  if (quote.logoUrl) {
    sidebar += `<div class="section"><img src="${esc(quote.logoUrl)}" alt="Logo" style="max-width:120px;max-height:60px;border-radius:${quote.logoBorderRadius || 0}px" /></div>`
  }
  if (company) {
    sidebar += '<div class="section">'
    sidebar += `<h3>${i.company}</h3>`
    sidebar += `<p style="font-weight:700">${esc(company.tradeName || company.legalName)}</p>`
    if (company.legalForm) sidebar += `<p>${esc(company.legalForm)}</p>`
    if (company.addressLine1) sidebar += `<p>${esc(company.addressLine1)}</p>`
    if (company.postalCode || company.city)
      sidebar += `<p>${esc(company.postalCode || '')} ${esc(company.city || '')}</p>`
    sidebar += '</div>'
    if (company.siren || company.vatNumber) {
      sidebar += '<div class="section"><h3>Informations</h3>'
      if (company.siren) sidebar += `<p>SIREN: ${esc(company.siren)}</p>`
      if (company.vatNumber) sidebar += `<p>${i.vatNo}: ${esc(company.vatNumber)}</p>`
      sidebar += '</div>'
    }
    if (company.phone || company.email) {
      sidebar += '<div class="section"><h3>Contact</h3>'
      if (company.phone) sidebar += `<p>${esc(company.phone)}</p>`
      if (company.email) sidebar += `<p>${esc(company.email)}</p>`
      sidebar += '</div>'
    }
  }
  sidebar += '</div>'

  // Main content area
  let main = '<div class="main-content"><div class="top-section">'
  main += `<div class="header"><div></div><div style="text-align:right">`
  main += `<div class="doc-badge"><div class="doc-badge-title">${esc(docTitle)}</div></div>`
  main += `<div class="doc-number">${i.quoteNumber} <strong>${esc(quote.quoteNumber)}</strong></div>`
  main += `<div style="font-size:11px;color:${T.textMuted}">${i.date} : ${fmtD(quote.issueDate, lang)}</div>`
  main += '</div></div>'

  // Client only
  if (client) {
    main += `<div style="margin-bottom:20px"><div class="address-label">${i.recipient}</div><div class="address-content">`
    main += `<div class="address-name">${esc(client.displayName)}</div>`
    if (client.address) main += `<div class="address-line">${esc(client.address)}</div>`
    if (client.postalCode || client.city)
      main += `<div class="address-line">${esc(client.postalCode || '')} ${esc(client.city || '')}</div>`
    if (quote.deliveryAddress) {
      main += `<div style="border-top:1px solid ${T.clientBlockBorder};margin-top:6px;padding-top:6px">`
      main += `<div class="section-label">${i.deliveryAddress}</div>`
      main += `<div class="address-line">${formatText(quote.deliveryAddress)}</div></div>`
    }
    main += '</div></div>'
  }

  if (quote.subject)
    main += `<div class="subject-block"><span class="subject-label">${i.subject} : </span>${esc(quote.subject)}</div>`

  // Dates
  main += `<div class="date-bar">`
  main += `<div class="date-item"><strong>${i.date} :</strong> ${fmtD(quote.issueDate, lang)}</div>`
  if (quote.validityDate)
    main += `<div class="date-item"><strong>${i.validity} :</strong> ${fmtD(quote.validityDate, lang)}</div>`
  main += '</div>'

  main += renderTable(lines, quote, T, ac, lang, i)
  main += '</div>' // end top-section

  main += '<div class="bottom-section">'
  main += renderTotals(quote, tva, discountAmount, lang, i, false)

  const lateralVatText = getVatExemptText(quote.vatExemptReason, i)
  if (lateralVatText) main += `<div class="vat-exempt">${lateralVatText}</div>`
  if (quote.notes)
    main += `<div class="notes-section"><div class="section-label">${i.conditionsAndNotes}</div><div class="notes-text">${formatText(quote.notes)}</div></div>`
  if (quote.acceptanceConditions)
    main += `<div class="conditions-section"><div class="section-label">${i.acceptanceConditions}</div><div class="conditions-text">${formatText(quote.acceptanceConditions)}</div></div>`
  if (quote.freeField)
    main += `<div class="free-field-section"><div class="section-label">${i.freeField}</div><div class="free-field-text">${formatText(quote.freeField)}</div></div>`
  if (quote.signatureField) {
    main += `<div class="signature-row">
      <div class="signature-box"><div class="section-label">${i.signatureIssuer}</div><div class="signature-area"></div></div>
      <div class="signature-box"><div class="section-label">${i.signatureClient}</div><div class="signature-area"></div></div>
    </div>`
  }
  main += renderPaymentMethods(company, settings, T, lang, i)
  main += renderLegalFooter(company, quote, settings, T, lang, i, false)
  main += '</div>' // end bottom-section
  main += '</div>'

  return sidebar + main
}
