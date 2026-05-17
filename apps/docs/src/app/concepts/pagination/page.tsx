import { API_V2_BASE_URL } from '@/lib/config'

export const metadata = { title: 'Pagination — Faktur Developers' }

export default function PaginationPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-wider text-violet-500">Concept</p>
      <h1 className="mt-2 text-4xl font-semibold tracking-tight">Pagination</h1>
      <p className="mt-4 text-(--muted-foreground)">
        All collection endpoints use cursor-based pagination. It&apos;s stable under concurrent
        writes and avoids the missing-row problems of offset pagination.
      </p>

      <section className="mt-10">
        <h2 className="text-2xl font-semibold">Query parameters</h2>
        <pre className="mt-3 overflow-x-auto rounded-xl border border-(--border) bg-(--code-bg) p-4 text-xs">
          <code>{`GET /api/v2/invoices?limit=50&cursor=eyJpZCI6Imludl8uLi4iLCJjcmVhdGVkX2F0IjoiMjAyNi0wNS0xNlQxNDozMjoxMVoifQ`}</code>
        </pre>
        <ul className="mt-4 space-y-1.5 text-sm text-(--muted-foreground)">
          <li>
            <code>limit</code> — items per page, 1–200, default 50.
          </li>
          <li>
            <code>cursor</code> — opaque base64url token from a previous response. Omit to start
            from the beginning.
          </li>
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="text-2xl font-semibold">Response shape</h2>
        <pre className="mt-3 overflow-x-auto rounded-xl border border-(--border) bg-(--code-bg) p-4 text-xs leading-relaxed">
          <code>{`{
  "data": [ ... ],
  "pagination": {
    "has_more": true,
    "next_cursor": "eyJpZCI6Ii4uLiJ9",
    "limit": 50
  }
}`}</code>
        </pre>
      </section>

      <section className="mt-10">
        <h2 className="text-2xl font-semibold">Iterating all pages</h2>
        <pre className="mt-3 overflow-x-auto rounded-xl border border-(--border) bg-(--code-bg) p-4 text-xs leading-relaxed">
          <code>{`let cursor = undefined
do {
  const url = new URL('${API_V2_BASE_URL}/invoices')
  url.searchParams.set('limit', '100')
  if (cursor) url.searchParams.set('cursor', cursor)

  const res = await fetch(url, { headers: { Authorization: \`Bearer \${KEY}\` } })
  const { data, pagination } = await res.json()

  for (const invoice of data) {
    // process
  }

  cursor = pagination.next_cursor
} while (cursor)`}</code>
        </pre>
      </section>

      <section className="mt-10">
        <h2 className="text-2xl font-semibold">Sorting and filters</h2>
        <p className="mt-3 text-sm text-(--muted-foreground)">
          Filters and sorting compose freely with pagination — the cursor encodes whatever order
          you requested:
        </p>
        <pre className="mt-3 overflow-x-auto rounded-xl border border-(--border) bg-(--code-bg) p-4 text-xs">
          <code>{`GET /api/v2/invoices?status=paid,partial&sort=-issue_date&limit=100`}</code>
        </pre>
      </section>
    </div>
  )
}
