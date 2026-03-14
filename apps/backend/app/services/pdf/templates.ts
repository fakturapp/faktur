export interface TemplateConfig {
  id: string
  layout: 'standard' | 'banner' | 'lateral'
  docBg: string
  text: string
  textMuted: string
  textFooter: string
  clientBlockBg: string
  clientBlockBorder: string
  rowEven: string
  rowOdd: string
  borderLight: string
  totalBg: string
  totalBorder: string
  footerBorder: string
  signatureBorder: string
  paymentBadgeBg: string
  paymentBadgeBorder: string
  paymentBadgeText: string
  borderRadius: string
}

const TEMPLATES: Record<string, TemplateConfig> = {
  classique: {
    id: 'classique', layout: 'standard', docBg: '#ffffff', text: '#202124', textMuted: '#5f6368', textFooter: '#999999',
    clientBlockBg: '#f8f9fa', clientBlockBorder: '#eeeeee', rowEven: '#ffffff', rowOdd: '#fafbfc', borderLight: '#f0f0f0',
    totalBg: '10', totalBorder: '25', footerBorder: '#f0f0f0', signatureBorder: '#e0e0e0',
    paymentBadgeBg: '#f8f9fa', paymentBadgeBorder: '#eeeeee', paymentBadgeText: '#5f6368',
    borderRadius: '10px',
  },
  moderne: {
    id: 'moderne', layout: 'banner', docBg: '#ffffff', text: '#1a1a2e', textMuted: '#6b7280', textFooter: '#9ca3af',
    clientBlockBg: '#f3f4f6', clientBlockBorder: '#e5e7eb', rowEven: '#ffffff', rowOdd: '#f9fafb', borderLight: '#e5e7eb',
    totalBg: '08', totalBorder: '20', footerBorder: '#e5e7eb', signatureBorder: '#d1d5db',
    paymentBadgeBg: '#f3f4f6', paymentBadgeBorder: '#e5e7eb', paymentBadgeText: '#6b7280',
    borderRadius: '8px',
  },
  compact: {
    id: 'compact', layout: 'standard', docBg: '#ffffff', text: '#111827', textMuted: '#4b5563', textFooter: '#9ca3af',
    clientBlockBg: '#f9fafb', clientBlockBorder: '#e5e7eb', rowEven: '#ffffff', rowOdd: '#f9fafb', borderLight: '#e5e7eb',
    totalBg: '08', totalBorder: '20', footerBorder: '#e5e7eb', signatureBorder: '#d1d5db',
    paymentBadgeBg: '#f9fafb', paymentBadgeBorder: '#e5e7eb', paymentBadgeText: '#4b5563',
    borderRadius: '0px',
  },
  elegance: {
    id: 'elegance', layout: 'standard', docBg: '#ffffff', text: '#1f2937', textMuted: '#6b7280', textFooter: '#9ca3af',
    clientBlockBg: 'transparent', clientBlockBorder: '#e5e7eb', rowEven: '#ffffff', rowOdd: '#ffffff', borderLight: '#e5e7eb',
    totalBg: '06', totalBorder: '18', footerBorder: '#d1d5db', signatureBorder: '#d1d5db',
    paymentBadgeBg: 'transparent', paymentBadgeBorder: '#e5e7eb', paymentBadgeText: '#6b7280',
    borderRadius: '6px',
  },
  audacieux: {
    id: 'audacieux', layout: 'banner', docBg: '#ffffff', text: '#0f172a', textMuted: '#475569', textFooter: '#94a3b8',
    clientBlockBg: '#f1f5f9', clientBlockBorder: '#e2e8f0', rowEven: '#ffffff', rowOdd: '#f8fafc', borderLight: '#e2e8f0',
    totalBg: '10', totalBorder: '25', footerBorder: '#e2e8f0', signatureBorder: '#cbd5e1',
    paymentBadgeBg: '#f1f5f9', paymentBadgeBorder: '#e2e8f0', paymentBadgeText: '#475569',
    borderRadius: '12px',
  },
  lateral: {
    id: 'lateral', layout: 'lateral', docBg: '#ffffff', text: '#1e293b', textMuted: '#64748b', textFooter: '#94a3b8',
    clientBlockBg: '#f8fafc', clientBlockBorder: '#e2e8f0', rowEven: '#ffffff', rowOdd: '#f8fafc', borderLight: '#e2e8f0',
    totalBg: '10', totalBorder: '25', footerBorder: '#e2e8f0', signatureBorder: '#cbd5e1',
    paymentBadgeBg: '#f8fafc', paymentBadgeBorder: '#e2e8f0', paymentBadgeText: '#64748b',
    borderRadius: '8px',
  },
  minimaliste: {
    id: 'minimaliste', layout: 'standard', docBg: '#ffffff', text: '#18181b', textMuted: '#71717a', textFooter: '#a1a1aa',
    clientBlockBg: 'transparent', clientBlockBorder: '#e4e4e7', rowEven: '#ffffff', rowOdd: '#ffffff', borderLight: '#e4e4e7',
    totalBg: '05', totalBorder: '15', footerBorder: '#e4e4e7', signatureBorder: '#d4d4d8',
    paymentBadgeBg: 'transparent', paymentBadgeBorder: '#e4e4e7', paymentBadgeText: '#71717a',
    borderRadius: '4px',
  },
  duo: {
    id: 'duo', layout: 'banner', docBg: '#ffffff', text: '#1e293b', textMuted: '#64748b', textFooter: '#94a3b8',
    clientBlockBg: '#f1f5f9', clientBlockBorder: '#e2e8f0', rowEven: '#ffffff', rowOdd: '#f8fafc', borderLight: '#e2e8f0',
    totalBg: '10', totalBorder: '25', footerBorder: '#e2e8f0', signatureBorder: '#cbd5e1',
    paymentBadgeBg: '#f1f5f9', paymentBadgeBorder: '#e2e8f0', paymentBadgeText: '#64748b',
    borderRadius: '10px',
  },
  ligne: {
    id: 'ligne', layout: 'standard', docBg: '#ffffff', text: '#1f2937', textMuted: '#6b7280', textFooter: '#9ca3af',
    clientBlockBg: 'transparent', clientBlockBorder: '#e5e7eb', rowEven: '#ffffff', rowOdd: '#ffffff', borderLight: '#e5e7eb',
    totalBg: '06', totalBorder: '18', footerBorder: '#d1d5db', signatureBorder: '#d1d5db',
    paymentBadgeBg: 'transparent', paymentBadgeBorder: '#e5e7eb', paymentBadgeText: '#6b7280',
    borderRadius: '6px',
  },
}

function applyDarkMode(tpl: TemplateConfig): TemplateConfig {
  return {
    ...tpl,
    docBg: '#1c1c21',
    text: '#e4e4e7',
    textMuted: '#a1a1aa',
    textFooter: '#71717a',
    clientBlockBg: '#27272a',
    clientBlockBorder: '#3f3f46',
    rowEven: '#1c1c21',
    rowOdd: '#222226',
    borderLight: '#3f3f46',
    totalBg: '15',
    totalBorder: '30',
    footerBorder: '#3f3f46',
    signatureBorder: '#3f3f46',
    paymentBadgeBg: '#27272a',
    paymentBadgeBorder: '#3f3f46',
    paymentBadgeText: '#a1a1aa',
  }
}

export function getTemplate(id?: string, darkMode?: boolean): TemplateConfig {
  const base = (id && TEMPLATES[id]) ? TEMPLATES[id] : TEMPLATES.classique
  return darkMode ? applyDarkMode(base) : base
}
