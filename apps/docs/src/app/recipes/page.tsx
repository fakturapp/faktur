import Link from 'next/link'
import { ArrowRight, RefreshCw, CreditCard, BarChart3, FileText, Bell, Upload } from 'lucide-react'

export const metadata = { title: 'Recipes — Faktur Developers' }

const recipes = [
  {
    title: 'Sync clients from a CRM',
    description:
      'Pull contacts from HubSpot/Salesforce, upsert with Faktur-Idempotency-Key, keep emails in sync via webhooks.',
    href: '/recipes/sync-clients-from-crm',
    icon: RefreshCw,
    minutes: 25,
  },
  {
    title: 'Auto-create invoices from Stripe',
    description:
      'Listen to Stripe checkout.session.completed, fetch metadata, POST a Faktur invoice, mark it paid in one flow.',
    href: '/recipes/auto-invoice-from-stripe',
    icon: CreditCard,
    minutes: 35,
  },
  {
    title: 'Weekly revenue report by email',
    description:
      'Aggregate paid invoices for the last 7 days, render an HTML table, send through your provider.',
    href: '/recipes/weekly-revenue-report',
    icon: BarChart3,
    minutes: 20,
  },
  {
    title: 'Submit to Chorus Pro automatically',
    description:
      'When an invoice goes to status=sent, push a Factur-X envelope to your PDP. Listen to status updates via webhook.',
    href: '/recipes/factur-x-submission',
    icon: FileText,
    minutes: 40,
  },
  {
    title: 'Late payment reminder workflow',
    description:
      'Find overdue invoices nightly, send a templated reminder email, snooze repeat reminders.',
    href: '/recipes/reminder-automation',
    icon: Bell,
    minutes: 25,
  },
  {
    title: 'Bulk import from CSV',
    description:
      'Read a spreadsheet of clients and invoices, dedupe by external_ref, create everything idempotently.',
    href: '/recipes/bulk-import-csv',
    icon: Upload,
    minutes: 30,
  },
]

export default function RecipesIndex() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-wider text-violet-500">Recipes</p>
      <h1 className="mt-2 text-4xl font-semibold tracking-tight">End-to-end tutorials</h1>
      <p className="mt-4 text-(--muted-foreground)">
        Step-by-step guides that combine multiple endpoints to solve real automation problems.
        Each recipe is copy-paste ready and includes troubleshooting notes.
      </p>

      <div className="mt-10 grid gap-3 sm:grid-cols-2">
        {recipes.map((r) => {
          const Icon = r.icon
          return (
            <Link
              key={r.title}
              href={r.href}
              className="group flex flex-col gap-3 rounded-xl border border-(--border) bg-(--background) p-5 transition-colors hover:bg-(--muted)/40"
            >
              <div className="flex items-center justify-between">
                <Icon className="size-5 text-(--muted-foreground)" />
                <span className="text-xs text-(--muted-foreground)">{r.minutes} min</span>
              </div>
              <div>
                <p className="font-semibold">{r.title}</p>
                <p className="mt-1 text-xs text-(--muted-foreground)">{r.description}</p>
              </div>
              <div className="mt-auto flex items-center gap-1.5 text-xs font-medium text-violet-500">
                Read recipe
                <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" />
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
