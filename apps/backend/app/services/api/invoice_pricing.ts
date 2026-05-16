export interface PricingLineInput {
  quantity: number
  unit_price_cents: number
  vat_rate: number
}

export interface PricingResult {
  subtotal_cents: number
  tax_cents: number
  discount_cents: number
  total_cents: number
  line_totals_cents: number[]
}

export function computePricing(
  lines: PricingLineInput[],
  options: {
    discount_type?: 'none' | 'percentage' | 'fixed'
    discount_value?: number
  } = {}
): PricingResult {
  let subtotalCents = 0
  let taxCents = 0
  const lineTotalsCents: number[] = []

  for (const line of lines) {
    const lineSubtotalCents = Math.round(line.quantity * line.unit_price_cents)
    const lineTaxCents = Math.round(lineSubtotalCents * (line.vat_rate / 100))
    subtotalCents += lineSubtotalCents
    taxCents += lineTaxCents
    lineTotalsCents.push(lineSubtotalCents)
  }

  let discountCents = 0
  if (options.discount_type === 'percentage' && options.discount_value && options.discount_value > 0) {
    discountCents = Math.round(subtotalCents * (options.discount_value / 100))
  } else if (options.discount_type === 'fixed' && options.discount_value && options.discount_value > 0) {
    discountCents = Math.round(options.discount_value * 100)
  }

  const totalCents = subtotalCents + taxCents - discountCents

  return {
    subtotal_cents: subtotalCents,
    tax_cents: taxCents,
    discount_cents: discountCents,
    total_cents: Math.max(0, totalCents),
    line_totals_cents: lineTotalsCents,
  }
}
