import { EndpointBlock } from '@/components/endpoint-block'
import { API_PLATFORM_BASE_URL } from '@/lib/config'

export const metadata = { title: 'Products · Faktur API V2' }

export default function ProductsReference() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-wider text-violet-500">
        Reference / Resources
      </p>
      <h1 className="mt-2 text-4xl font-semibold tracking-tight">Products</h1>
      <p className="mt-4 text-(--muted-foreground)">
        Products are reusable catalog items, services or goods, that can be added to invoices
        and quotes. Prices are stored in cents.
      </p>

      <section className="mt-10">
        <h2 className="text-2xl font-semibold">Object shape</h2>
        <pre className="mt-3 overflow-x-auto rounded-xl border border-(--border) bg-(--code-bg) p-4 text-xs leading-relaxed">
          <code>{`{
  "id": "prd_8KqL2x...",
  "name": "Development consulting",
  "description": "Senior engineer day rate",
  "unit_price_cents": 80000,
  "vat_rate": "20",
  "unit": "day",
  "sale_type": "service",
  "reference": "SVC-001",
  "is_archived": false,
  "created_at": "2026-05-16T14:32:11Z",
  "updated_at": "2026-05-16T14:32:11Z"
}`}</code>
        </pre>
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-semibold">Endpoints</h2>

        <EndpointBlock
          method="GET"
          path="/api/platform/products"
          scope="products:read"
          description="List products. Supports archived filter and full-text search on name/description/reference."
          example={`curl ${API_PLATFORM_BASE_URL}/products?archived=false \\
  -H "Authorization: Bearer fk_live_..."`}
        />

        <EndpointBlock
          method="GET"
          path="/api/platform/products/:id"
          scope="products:read"
          description="Retrieve a single product."
        />

        <EndpointBlock
          method="POST"
          path="/api/platform/products"
          scope="products:write"
          description="Create a new product."
          example={`curl ${API_PLATFORM_BASE_URL}/products \\
  -X POST \\
  -H "Authorization: Bearer fk_live_..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Development consulting",
    "description": "Senior engineer day rate",
    "unit_price_cents": 80000,
    "vat_rate": "20",
    "unit": "day"
  }'`}
        />

        <EndpointBlock
          method="PATCH"
          path="/api/platform/products/:id"
          scope="products:write"
          description="Update fields. Send only the fields you want to change."
        />

        <EndpointBlock
          method="DELETE"
          path="/api/platform/products/:id"
          scope="products:delete"
          description="Delete a product. Existing invoices that referenced it keep their snapshot."
        />
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-semibold">Related webhooks</h2>
        <ul className="mt-3 space-y-1.5 text-sm text-(--muted-foreground)">
          <li>
            <code>product.created</code> · <code>product.updated</code> · <code>product.deleted</code>
          </li>
        </ul>
      </section>
    </div>
  )
}
