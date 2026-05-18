export interface NavLink {
  label: string
  href: string
  external?: boolean
}

export interface NavSection {
  label: string
  links: NavLink[]
}

export interface PrimaryLink {
  label: string
  href: string
  external?: boolean
}

export const PRIMARY_LINKS: PrimaryLink[] = [
  { label: 'Quickstart', href: '/quickstart' },
  { label: 'Concepts', href: '/concepts/authentication' },
  { label: 'Reference', href: '/resources' },
  { label: 'Recipes', href: '/recipes' },
  { label: 'Changelog', href: '/changelog' },
]

export const SIDEBAR_SECTIONS: NavSection[] = [
  {
    label: 'Getting started',
    links: [
      { label: 'Introduction', href: '/' },
      { label: 'Quickstart', href: '/quickstart' },
      { label: 'Changelog', href: '/changelog' },
    ],
  },
  {
    label: 'Concepts',
    links: [
      { label: 'Authentication', href: '/concepts/authentication' },
      { label: 'Rate limits & quotas', href: '/concepts/rate-limits' },
      { label: 'Errors', href: '/concepts/errors' },
      { label: 'Pagination', href: '/concepts/pagination' },
      { label: 'Idempotency', href: '/concepts/idempotency' },
      { label: 'Webhooks', href: '/concepts/webhooks' },
    ],
  },
  {
    label: 'Resources',
    links: [
      { label: 'Overview', href: '/resources' },
      { label: 'Invoices', href: '/resources/invoices' },
      { label: 'Quotes', href: '/resources/quotes' },
      { label: 'Clients', href: '/resources/clients' },
      { label: 'Products', href: '/resources/products' },
      { label: 'Expenses', href: '/resources/expenses' },
    ],
  },
  {
    label: 'Recipes',
    links: [
      { label: 'Overview', href: '/recipes' },
      { label: 'Auto-invoice from Stripe', href: '/recipes/auto-invoice-from-stripe' },
    ],
  },
  {
    label: 'API spec',
    links: [
      { label: 'OpenAPI JSON', href: '/openapi.json', external: true },
      { label: 'llms.txt', href: '/llms.txt', external: true },
    ],
  },
]
