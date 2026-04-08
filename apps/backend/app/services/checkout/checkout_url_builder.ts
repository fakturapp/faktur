import env from '#start/env'

export function buildCheckoutUrl(token: string): string {
  const checkoutUrl = env.get('CHECKOUT_URL')
  const frontendUrl = env.get('FRONTEND_URL') || 'http://localhost:3000'
  const base = checkoutUrl || frontendUrl

  const usingDedicatedCheckoutHost = !!checkoutUrl && checkoutUrl !== frontendUrl
  const path = usingDedicatedCheckoutHost ? `/${token}/pay` : `/checkout/${token}/pay`

  return `${base}${path}`
}
