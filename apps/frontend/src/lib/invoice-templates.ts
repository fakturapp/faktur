export interface TemplateConfig {
  id: string
  name: string
  description: string
  layout: 'standard' | 'banner' | 'lateral'
  // Document
  docBg: string
  // Text
  text: string
  textMuted: string
  textFooter: string
  // Client block
  clientBlockBg: string
  clientBlockBorder: string
  clientEmptyBg: string
  clientEmptyBorder: string
  // Table
  rowEven: string
  rowOdd: string
  rowHover: string
  borderLight: string
  // Totals
  totalBg: string
  totalBorder: string
  // Footer
  footerBorder: string
  // Inputs (edit mode)
  inputBg: string
  inputPlaceholder: string
  editBorderDashed: string
  // Signature
  signatureBorder: string
  // Payment badges
  paymentBadgeBg: string
  paymentBadgeBorder: string
  paymentBadgeText: string
  // Border radius
  borderRadius: string // e.g. '10px', '0px', '6px'
}

const classique: TemplateConfig = {
  id: 'classique',
  name: 'Classique',
  description: 'Blanc epure avec arrondis',
  layout: 'standard',
  docBg: '#ffffff',
  text: '#202124',
  textMuted: '#5f6368',
  textFooter: '#999999',
  clientBlockBg: '#f8f9fa',
  clientBlockBorder: '#eeeeee',
  clientEmptyBg: '#fafafa',
  clientEmptyBorder: '#d0d0d0',
  rowEven: '#ffffff',
  rowOdd: '#fafbfc',
  rowHover: '06',
  borderLight: '#f0f0f0',
  totalBg: '10',
  totalBorder: '25',
  footerBorder: '#f0f0f0',
  inputBg: '#ffffff',
  inputPlaceholder: '#bbbbbb',
  editBorderDashed: '#dddddd',
  signatureBorder: '#e0e0e0',
  paymentBadgeBg: '#f8f9fa',
  paymentBadgeBorder: '#eeeeee',
  paymentBadgeText: '#5f6368',
  borderRadius: '10px',
}

const moderne: TemplateConfig = {
  id: 'moderne',
  name: 'Moderne',
  description: 'Bandeau colore en-tete, corps blanc',
  layout: 'banner',
  docBg: '#ffffff',
  text: '#1a1a2e',
  textMuted: '#6b7280',
  textFooter: '#9ca3af',
  clientBlockBg: '#f3f4f6',
  clientBlockBorder: '#e5e7eb',
  clientEmptyBg: '#f9fafb',
  clientEmptyBorder: '#d1d5db',
  rowEven: '#ffffff',
  rowOdd: '#f9fafb',
  rowHover: '06',
  borderLight: '#e5e7eb',
  totalBg: '08',
  totalBorder: '20',
  footerBorder: '#e5e7eb',
  inputBg: '#ffffff',
  inputPlaceholder: '#9ca3af',
  editBorderDashed: '#d1d5db',
  signatureBorder: '#d1d5db',
  paymentBadgeBg: '#f3f4f6',
  paymentBadgeBorder: '#e5e7eb',
  paymentBadgeText: '#6b7280',
  borderRadius: '8px',
}

const compact: TemplateConfig = {
  id: 'compact',
  name: 'Compact',
  description: 'Dense et sans arrondis',
  layout: 'standard',
  docBg: '#ffffff',
  text: '#111827',
  textMuted: '#4b5563',
  textFooter: '#9ca3af',
  clientBlockBg: '#f9fafb',
  clientBlockBorder: '#e5e7eb',
  clientEmptyBg: '#f9fafb',
  clientEmptyBorder: '#d1d5db',
  rowEven: '#ffffff',
  rowOdd: '#f9fafb',
  rowHover: '05',
  borderLight: '#e5e7eb',
  totalBg: '08',
  totalBorder: '20',
  footerBorder: '#e5e7eb',
  inputBg: '#ffffff',
  inputPlaceholder: '#9ca3af',
  editBorderDashed: '#d1d5db',
  signatureBorder: '#d1d5db',
  paymentBadgeBg: '#f9fafb',
  paymentBadgeBorder: '#e5e7eb',
  paymentBadgeText: '#4b5563',
  borderRadius: '0px',
}

const elegance: TemplateConfig = {
  id: 'elegance',
  name: 'Elegance',
  description: 'Lignes fines, sans fonds, raffine',
  layout: 'standard',
  docBg: '#ffffff',
  text: '#1f2937',
  textMuted: '#6b7280',
  textFooter: '#9ca3af',
  clientBlockBg: 'transparent',
  clientBlockBorder: '#e5e7eb',
  clientEmptyBg: 'transparent',
  clientEmptyBorder: '#d1d5db',
  rowEven: '#ffffff',
  rowOdd: '#ffffff',
  rowHover: '04',
  borderLight: '#e5e7eb',
  totalBg: '06',
  totalBorder: '18',
  footerBorder: '#d1d5db',
  inputBg: '#ffffff',
  inputPlaceholder: '#9ca3af',
  editBorderDashed: '#d1d5db',
  signatureBorder: '#d1d5db',
  paymentBadgeBg: 'transparent',
  paymentBadgeBorder: '#e5e7eb',
  paymentBadgeText: '#6b7280',
  borderRadius: '6px',
}

const audacieux: TemplateConfig = {
  id: 'audacieux',
  name: 'Audacieux',
  description: 'En-tete large avec accent geometrique',
  layout: 'banner',
  docBg: '#ffffff',
  text: '#0f172a',
  textMuted: '#475569',
  textFooter: '#94a3b8',
  clientBlockBg: '#f1f5f9',
  clientBlockBorder: '#e2e8f0',
  clientEmptyBg: '#f8fafc',
  clientEmptyBorder: '#cbd5e1',
  rowEven: '#ffffff',
  rowOdd: '#f8fafc',
  rowHover: '06',
  borderLight: '#e2e8f0',
  totalBg: '10',
  totalBorder: '25',
  footerBorder: '#e2e8f0',
  inputBg: '#ffffff',
  inputPlaceholder: '#94a3b8',
  editBorderDashed: '#cbd5e1',
  signatureBorder: '#cbd5e1',
  paymentBadgeBg: '#f1f5f9',
  paymentBadgeBorder: '#e2e8f0',
  paymentBadgeText: '#475569',
  borderRadius: '12px',
}

const lateral: TemplateConfig = {
  id: 'lateral',
  name: 'Lateral',
  description: 'Barre laterale coloree avec infos societe',
  layout: 'lateral',
  docBg: '#ffffff',
  text: '#1e293b',
  textMuted: '#64748b',
  textFooter: '#94a3b8',
  clientBlockBg: '#f8fafc',
  clientBlockBorder: '#e2e8f0',
  clientEmptyBg: '#f8fafc',
  clientEmptyBorder: '#cbd5e1',
  rowEven: '#ffffff',
  rowOdd: '#f8fafc',
  rowHover: '06',
  borderLight: '#e2e8f0',
  totalBg: '10',
  totalBorder: '25',
  footerBorder: '#e2e8f0',
  inputBg: '#ffffff',
  inputPlaceholder: '#94a3b8',
  editBorderDashed: '#cbd5e1',
  signatureBorder: '#cbd5e1',
  paymentBadgeBg: '#f8fafc',
  paymentBadgeBorder: '#e2e8f0',
  paymentBadgeText: '#64748b',
  borderRadius: '8px',
}

const minimaliste: TemplateConfig = {
  id: 'minimaliste',
  name: 'Minimaliste',
  description: 'Ultra-epure, traits fins, espace genereux',
  layout: 'standard',
  docBg: '#ffffff',
  text: '#18181b',
  textMuted: '#71717a',
  textFooter: '#a1a1aa',
  clientBlockBg: 'transparent',
  clientBlockBorder: '#e4e4e7',
  clientEmptyBg: 'transparent',
  clientEmptyBorder: '#d4d4d8',
  rowEven: '#ffffff',
  rowOdd: '#ffffff',
  rowHover: '03',
  borderLight: '#e4e4e7',
  totalBg: '05',
  totalBorder: '15',
  footerBorder: '#e4e4e7',
  inputBg: '#ffffff',
  inputPlaceholder: '#a1a1aa',
  editBorderDashed: '#d4d4d8',
  signatureBorder: '#d4d4d8',
  paymentBadgeBg: 'transparent',
  paymentBadgeBorder: '#e4e4e7',
  paymentBadgeText: '#71717a',
  borderRadius: '4px',
}

const duo: TemplateConfig = {
  id: 'duo',
  name: 'Duo',
  description: 'En-tete bicolore accent + sombre',
  layout: 'banner',
  docBg: '#ffffff',
  text: '#1e293b',
  textMuted: '#64748b',
  textFooter: '#94a3b8',
  clientBlockBg: '#f1f5f9',
  clientBlockBorder: '#e2e8f0',
  clientEmptyBg: '#f8fafc',
  clientEmptyBorder: '#cbd5e1',
  rowEven: '#ffffff',
  rowOdd: '#f8fafc',
  rowHover: '06',
  borderLight: '#e2e8f0',
  totalBg: '10',
  totalBorder: '25',
  footerBorder: '#e2e8f0',
  inputBg: '#ffffff',
  inputPlaceholder: '#94a3b8',
  editBorderDashed: '#cbd5e1',
  signatureBorder: '#cbd5e1',
  paymentBadgeBg: '#f1f5f9',
  paymentBadgeBorder: '#e2e8f0',
  paymentBadgeText: '#64748b',
  borderRadius: '10px',
}

const ligne: TemplateConfig = {
  id: 'ligne',
  name: 'Ligne',
  description: 'Separateurs horizontaux colores',
  layout: 'standard',
  docBg: '#ffffff',
  text: '#1f2937',
  textMuted: '#6b7280',
  textFooter: '#9ca3af',
  clientBlockBg: 'transparent',
  clientBlockBorder: '#e5e7eb',
  clientEmptyBg: 'transparent',
  clientEmptyBorder: '#d1d5db',
  rowEven: '#ffffff',
  rowOdd: '#ffffff',
  rowHover: '04',
  borderLight: '#e5e7eb',
  totalBg: '06',
  totalBorder: '18',
  footerBorder: '#d1d5db',
  inputBg: '#ffffff',
  inputPlaceholder: '#9ca3af',
  editBorderDashed: '#d1d5db',
  signatureBorder: '#d1d5db',
  paymentBadgeBg: 'transparent',
  paymentBadgeBorder: '#e5e7eb',
  paymentBadgeText: '#6b7280',
  borderRadius: '6px',
}

const tiime: TemplateConfig = {
  id: 'tiime',
  name: 'Tiime',
  description: 'Bordures pointillees, accent violet, style comptable',
  layout: 'standard',
  docBg: '#ffffff',
  text: '#476388',
  textMuted: '#88A0BF',
  textFooter: '#88A0BF',
  clientBlockBg: '#ffffff',
  clientBlockBorder: '#bfcee1',
  clientEmptyBg: '#E5ECF4',
  clientEmptyBorder: '#88A0BF',
  rowEven: '#ffffff',
  rowOdd: '#fafbfd',
  rowHover: '06',
  borderLight: '#bfcee1',
  totalBg: '10',
  totalBorder: '25',
  footerBorder: '#bfcee1',
  inputBg: '#ffffff',
  inputPlaceholder: '#88A0BF',
  editBorderDashed: '#bfcee1',
  signatureBorder: '#bfcee1',
  paymentBadgeBg: '#f0f3f8',
  paymentBadgeBorder: '#bfcee1',
  paymentBadgeText: '#476388',
  borderRadius: '8px',
}

export const TEMPLATES: TemplateConfig[] = [
  classique,
  moderne,
  compact,
  elegance,
  audacieux,
  lateral,
  minimaliste,
  duo,
  ligne,
  tiime,
]

/** Apply dark mode overlay to any template */
export function applyDarkMode(tpl: TemplateConfig): TemplateConfig {
  return {
    ...tpl,
    docBg: '#1c1c21',
    text: '#e4e4e7',
    textMuted: '#a1a1aa',
    textFooter: '#71717a',
    clientBlockBg: '#27272a',
    clientBlockBorder: '#3f3f46',
    clientEmptyBg: '#27272a',
    clientEmptyBorder: '#3f3f46',
    rowEven: '#1c1c21',
    rowOdd: '#222226',
    rowHover: '12',
    borderLight: '#3f3f46',
    totalBg: '15',
    totalBorder: '30',
    footerBorder: '#3f3f46',
    inputBg: '#27272a',
    inputPlaceholder: '#71717a',
    editBorderDashed: '#3f3f46',
    signatureBorder: '#3f3f46',
    paymentBadgeBg: '#27272a',
    paymentBadgeBorder: '#3f3f46',
    paymentBadgeText: '#a1a1aa',
  }
}

export function getTemplate(id?: string, darkMode?: boolean): TemplateConfig {
  if (!id) {
    const base = classique
    return darkMode ? applyDarkMode(base) : base
  }
  const base = TEMPLATES.find((t) => t.id === id) ?? classique
  return darkMode ? applyDarkMode(base) : base
}
