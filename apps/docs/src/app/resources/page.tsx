import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export const metadata = { title: 'Resources · Faktur Developers' }

const resources = [
  {
    name: 'invoices',
    title: 'Invoices',
    description: 'Create, list, mark paid, send, and download invoice PDFs.',
    href: '/resources/invoices',
  },
  {
    name: 'quotes',
    title: 'Quotes',
    description: 'List and read quotes. Convert to invoices when accepted.',
    href: '/resources/quotes',
  },
  {
    name: 'credit_notes',
    title: 'Credit notes',
    description: 'Refunds and corrections tied to invoices.',
    href: '/resources/credit-notes',
  },
  {
    name: 'clients',
    title: 'Clients',
    description: 'Manage your contact book, companies, individuals, and their contacts.',
    href: '/resources/clients',
  },
  {
    name: 'products',
    title: 'Products',
    description: 'Catalog of services and goods, reusable across invoices and quotes.',
    href: '/resources/products',
  },
  {
    name: 'expenses',
    title: 'Expenses',
    description: 'Record business expenses with optional receipt uploads.',
    href: '/resources/expenses',
  },
  {
    name: 'recurring_invoices',
    title: 'Recurring invoices',
    description: 'Schedule automatic invoice generation on monthly, quarterly, or yearly cadence.',
    href: '/resources/recurring-invoices',
  },
  {
    name: 'reminders',
    title: 'Reminders',
    description: 'Payment reminders sent automatically or on demand.',
    href: '/resources/reminders',
  },
  {
    name: 'payment_links',
    title: 'Payment links',
    description: 'Stripe-backed payment links attached to invoices.',
    href: '/resources/payment-links',
  },
  {
    name: 'bank_accounts',
    title: 'Bank accounts',
    description: "Your IBANs displayed on invoices for bank transfers.",
    href: '/resources/bank-accounts',
  },
  {
    name: 'company',
    title: 'Company',
    description: 'Your legal entity, name, SIREN, address, logo.',
    href: '/resources/company',
  },
  {
    name: 'team',
    title: 'Team',
    description: 'Read team info and member list.',
    href: '/resources/team',
  },
  {
    name: 'einvoicing',
    title: 'E-invoicing',
    description: 'Submit to Chorus Pro / PDPs with Factur-X.',
    href: '/resources/einvoicing',
  },
  {
    name: 'email',
    title: 'Email',
    description: 'Send custom emails attached to invoices or quotes.',
    href: '/resources/email',
  },
  {
    name: 'webhooks',
    title: 'Webhooks',
    description: 'Manage the webhook configuration of your API key.',
    href: '/resources/webhooks',
  },
]

export default function ResourcesIndex() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-wider text-violet-500">Reference</p>
      <h1 className="mt-2 text-4xl font-semibold tracking-tight">Resources</h1>
      <p className="mt-4 text-(--muted-foreground)">
        Every Faktur resource exposed through the V2 API. Each page lists endpoints with required
        scopes, parameters, and example payloads.
      </p>

      <div className="mt-10 grid gap-3 sm:grid-cols-2">
        {resources.map((r) => (
          <Link
            key={r.name}
            href={r.href}
            className="group flex items-start gap-3 rounded-xl border border-(--border) bg-(--background) p-4 transition-colors hover:bg-(--muted)/40"
          >
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{r.title}</p>
              <p className="mt-1 text-xs text-(--muted-foreground)">{r.description}</p>
            </div>
            <ArrowRight className="size-4 shrink-0 text-(--muted-foreground) transition-transform group-hover:translate-x-0.5" />
          </Link>
        ))}
      </div>
    </div>
  )
}
