'use client'

export function currencyLocale(language?: string) {
  return language === 'en' ? 'en-GB' : 'fr-FR'
}

export function formatCurrency(amount: number, currency = 'EUR', language?: string) {
  return new Intl.NumberFormat(currencyLocale(language), {
    style: 'currency',
    currency,
  }).format(amount)
}
