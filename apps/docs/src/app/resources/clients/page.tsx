import { EndpointBlock } from '@/components/endpoint-block'
import { API_PLATFORM_BASE_URL } from '@/lib/config'

export const metadata = { title: 'Clients · Faktur API V2' }

export default function ClientsReference() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-wider text-violet-500">
        Reference / Resources
      </p>
      <h1 className="mt-2 text-4xl font-semibold tracking-tight">Clients</h1>
      <p className="mt-4 text-(--muted-foreground)">
        Clients are companies or individuals you bill. They&apos;re referenced by invoices,
        quotes, and credit notes via <code>client_id</code>.
      </p>

      <section className="mt-10">
        <h2 className="text-2xl font-semibold">Object shape</h2>
        <pre className="mt-3 overflow-x-auto rounded-xl border border-(--border) bg-(--code-bg) p-4 text-xs leading-relaxed">
          <code>{`{
  "id": "clt_8KqL2x...",
  "type": "company",
  "civility": null,
  "display_name": "ACME SAS",
  "company_name": "ACME SAS",
  "first_name": null,
  "last_name": null,
  "email": "contact@acme.com",
  "phone": "+33 1 23 45 67 89",
  "siren": "123456789",
  "siret": null,
  "vat_number": "FR12345678901",
  "address": "1 rue de la Paix",
  "address_complement": null,
  "postal_code": "75001",
  "city": "Paris",
  "country": "FR",
  "include_in_emails": true,
  "notes": null,
  "created_at": "2026-05-16T14:32:11Z",
  "updated_at": "2026-05-16T14:32:11Z"
}`}</code>
        </pre>
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-semibold">Endpoints</h2>

        <EndpointBlock
          method="GET"
          path="/api/platform/clients"
          scope="clients:read"
          description="List clients for the authenticated team."
          example={`curl ${API_PLATFORM_BASE_URL}/clients?limit=50 \\
  -H "Authorization: Bearer fk_live_..."`}
        />

        <EndpointBlock
          method="GET"
          path="/api/platform/clients/:id"
          scope="clients:read"
          description="Retrieve a single client."
        />

        <EndpointBlock
          method="POST"
          path="/api/platform/clients"
          scope="clients:write"
          description="Create a new client. Triggers client.created webhook."
          example={`curl ${API_PLATFORM_BASE_URL}/clients \\
  -X POST \\
  -H "Authorization: Bearer fk_live_..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "type": "company",
    "company_name": "ACME SAS",
    "email": "contact@acme.com",
    "siren": "123456789",
    "address": "1 rue de la Paix",
    "postal_code": "75001",
    "city": "Paris",
    "country": "FR"
  }'`}
        />

        <EndpointBlock
          method="PATCH"
          path="/api/platform/clients/:id"
          scope="clients:write"
          description="Update fields on an existing client. Send only the fields you want to change. Triggers client.updated webhook."
        />

        <EndpointBlock
          method="DELETE"
          path="/api/platform/clients/:id"
          scope="clients:delete"
          description="Delete a client. Triggers client.deleted webhook. Returns 204 No Content."
        />
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-semibold">Related webhooks</h2>
        <ul className="mt-3 space-y-1.5 text-sm text-(--muted-foreground)">
          <li>
            <code>client.created</code>. POST /api/platform/clients
          </li>
          <li>
            <code>client.updated</code>. PATCH /api/platform/clients/:id (includes{' '}
            <code>previous_data</code>)
          </li>
          <li>
            <code>client.deleted</code>. DELETE /api/platform/clients/:id
          </li>
        </ul>
      </section>
    </div>
  )
}
