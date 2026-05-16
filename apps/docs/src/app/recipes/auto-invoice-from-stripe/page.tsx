import Link from 'next/link'
import { ArrowLeft, CreditCard, Clock } from 'lucide-react'

export const metadata = {
  title: 'Auto-create invoices from Stripe — Faktur Developers',
}

export default function Recipe() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <Link
        href="/recipes"
        className="inline-flex items-center gap-1.5 text-xs text-(--muted-foreground) hover:text-(--foreground)"
      >
        <ArrowLeft className="size-3" />
        Back to recipes
      </Link>

      <div className="mt-6 flex items-center gap-3">
        <CreditCard className="size-6 text-violet-500" />
        <p className="text-xs font-semibold uppercase tracking-wider text-violet-500">Recipe</p>
      </div>
      <h1 className="mt-2 text-4xl font-semibold tracking-tight">
        Auto-create invoices when Stripe is paid
      </h1>
      <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-(--muted-foreground)">
        <Clock className="size-3" /> 35 minutes · Node.js / TypeScript
      </p>
      <p className="mt-5 text-(--muted-foreground)">
        When a customer completes a Stripe checkout, automatically create a Faktur invoice and
        mark it paid. Useful for e-commerce, donations, and any one-shot online purchase that
        also needs a French-compliant invoice.
      </p>

      <Step number={1} title="Set up the Stripe webhook listener">
        <p>
          Create an endpoint at <code>POST /webhooks/stripe</code> on your service. Subscribe to{' '}
          <code>checkout.session.completed</code> events in your Stripe dashboard.
        </p>
        <Code>{`import express from 'express'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET!, { apiVersion: '2024-06-20' })
const app = express()

app.post(
  '/webhooks/stripe',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    const sig = req.headers['stripe-signature'] as string
    let event: Stripe.Event
    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET!
      )
    } catch (err) {
      return res.status(400).send('invalid signature')
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session
      await createInvoiceForSession(session)
    }
    res.json({ received: true })
  }
)`}</Code>
      </Step>

      <Step number={2} title="Resolve or create the Faktur client">
        <p>
          Look up the buyer by email. If they don&apos;t exist, create them with{' '}
          <code>Faktur-Idempotency-Key</code> so retries can&apos;t produce duplicates.
        </p>
        <Code>{`async function resolveClient(email: string, name: string | null) {
  const search = await fetch(
    \`https://api.fakturapp.cc/api/v2/clients?email=\${encodeURIComponent(email)}\`,
    { headers: { Authorization: \`Bearer \${process.env.FAKTUR_KEY}\` } }
  ).then((r) => r.json())

  if (search.data?.[0]) return search.data[0]

  const created = await fetch('https://api.fakturapp.cc/api/v2/clients', {
    method: 'POST',
    headers: {
      Authorization: \`Bearer \${process.env.FAKTUR_KEY}\`,
      'Content-Type': 'application/json',
      'Faktur-Idempotency-Key': \`stripe-client-\${email}\`,
    },
    body: JSON.stringify({
      type: name ? 'individual' : 'company',
      email,
      first_name: name?.split(' ')[0] ?? null,
      last_name: name?.split(' ').slice(1).join(' ') ?? null,
    }),
  }).then((r) => r.json())
  return created.data
}`}</Code>
      </Step>

      <Step number={3} title="Create the invoice and mark it paid">
        <p>
          One POST creates the draft invoice with a single line for the Stripe total. A second
          POST marks it paid with the Stripe payment_intent as <code>reference</code>.
        </p>
        <Code>{`async function createInvoiceForSession(session: Stripe.Checkout.Session) {
  const email = session.customer_details?.email
  const name = session.customer_details?.name ?? null
  if (!email) return

  const client = await resolveClient(email, name)
  const todayIso = new Date().toISOString().slice(0, 10)

  const invoiceResp = await fetch(
    'https://api.fakturapp.cc/api/v2/invoices',
    {
      method: 'POST',
      headers: {
        Authorization: \`Bearer \${process.env.FAKTUR_KEY}\`,
        'Content-Type': 'application/json',
        'Faktur-Idempotency-Key': \`stripe-invoice-\${session.id}\`,
      },
      body: JSON.stringify({
        client_id: client.id,
        issue_date: todayIso,
        due_date: todayIso,
        lines: [
          {
            description: session.metadata?.description ?? 'Online purchase',
            quantity: 1,
            unit_price_cents: session.amount_subtotal ?? session.amount_total,
            vat_rate: 20,
          },
        ],
      }),
    }
  ).then((r) => r.json())

  await fetch(
    \`https://api.fakturapp.cc/api/v2/invoices/\${invoiceResp.data.id}/mark-paid\`,
    {
      method: 'POST',
      headers: {
        Authorization: \`Bearer \${process.env.FAKTUR_KEY}\`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount_cents: session.amount_total,
        paid_at: todayIso,
        payment_method: 'card',
        reference: session.payment_intent as string,
      }),
    }
  )
}`}</Code>
      </Step>

      <Step number={4} title="Test end-to-end">
        <p>
          Use <code>stripe trigger checkout.session.completed</code> to fire a test event. Check
          that:
        </p>
        <ul className="mt-3 space-y-1.5 text-sm text-(--muted-foreground)">
          <li>Your handler responds with 200 and produces no Stripe retry.</li>
          <li>Faktur dashboard shows the new invoice with status <code>paid</code>.</li>
          <li>Re-firing the same event creates no duplicate (idempotency).</li>
          <li>
            The Faktur webhook <code>invoice.paid</code> fires — your own internal systems can
            react.
          </li>
        </ul>
      </Step>

      <Step number={5} title="Production checklist">
        <ul className="mt-3 space-y-1.5 text-sm text-(--muted-foreground)">
          <li>Store <code>FAKTUR_KEY</code> in your secret manager, never in code.</li>
          <li>Enable IP allowlist on the key — only your webhook handler hosts.</li>
          <li>
            Use distinct keys for Stripe / your CRM / scripts so revocations stay surgical.
          </li>
          <li>
            Monitor <code>X-RateLimit-Remaining</code>. Stripe burst events can be heavy on Black
            Friday — request the Pro tier if needed.
          </li>
        </ul>
      </Step>

      <div className="mt-12 rounded-xl border border-(--border) bg-(--muted)/30 p-5">
        <p className="text-sm font-semibold">See also</p>
        <ul className="mt-2 space-y-1 text-sm text-(--muted-foreground)">
          <li>
            →{' '}
            <Link href="/concepts/idempotency" className="text-violet-500 hover:underline">
              Idempotency
            </Link>{' '}
            — never produce duplicate invoices on retries
          </li>
          <li>
            →{' '}
            <Link href="/resources/invoices" className="text-violet-500 hover:underline">
              Invoices reference
            </Link>{' '}
            — full payload shape
          </li>
          <li>
            →{' '}
            <Link href="/concepts/webhooks" className="text-violet-500 hover:underline">
              Webhooks
            </Link>{' '}
            — react to <code>invoice.paid</code> in your other systems
          </li>
        </ul>
      </div>
    </div>
  )
}

function Step({
  number,
  title,
  children,
}: {
  number: number
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="mt-10 border-l-2 border-violet-500/30 pl-6">
      <div className="flex items-center gap-3">
        <span className="inline-flex size-7 items-center justify-center rounded-full bg-violet-500/15 text-xs font-semibold text-violet-500">
          {number}
        </span>
        <h2 className="text-xl font-semibold">{title}</h2>
      </div>
      <div className="mt-3 space-y-3 text-sm leading-relaxed">{children}</div>
    </section>
  )
}

function Code({ children }: { children: string }) {
  return (
    <pre className="mt-3 overflow-x-auto rounded-xl border border-(--border) bg-(--code-bg) p-4 text-xs leading-relaxed">
      <code>{children}</code>
    </pre>
  )
}
