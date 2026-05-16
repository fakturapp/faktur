export const metadata = {
  title: 'Authentication — Faktur Developers',
}

export default function AuthenticationPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-wider text-violet-500">Concept</p>
      <h1 className="mt-2 text-4xl font-semibold tracking-tight">Authentication</h1>
      <p className="mt-4 text-(--muted-foreground)">
        Every Faktur API call is authenticated with a personal API key sent as a Bearer token.
        Keys are team-owned and scoped per <code>resource:action</code>.
      </p>

      <section className="mt-10">
        <h2 className="text-2xl font-semibold">Key format</h2>
        <p className="mt-3 text-sm">
          API keys look like <code>fk_live_&lt;32 chars&gt;</code>. The <code>fk_live_</code>{' '}
          prefix lets secret scanners (GitHub, gitleaks) auto-detect and revoke leaked keys.
        </p>
        <pre className="mt-4 overflow-x-auto rounded-xl border border-(--border) bg-(--code-bg) p-4 text-xs">
          <code>{`fk_live_8KqL2xNvR4mT7pYbA1cE9hZdW6sJfG3u`}</code>
        </pre>
      </section>

      <section className="mt-10">
        <h2 className="text-2xl font-semibold">Sending the token</h2>
        <pre className="mt-3 overflow-x-auto rounded-xl border border-(--border) bg-(--code-bg) p-4 text-xs">
          <code>{`Authorization: Bearer fk_live_8KqL2xNvR4mT7pYbA1cE9hZdW6sJfG3u`}</code>
        </pre>
        <p className="mt-3 text-sm text-(--muted-foreground)">
          The API rejects requests over plain HTTP — always use HTTPS.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="text-2xl font-semibold">Scopes</h2>
        <p className="mt-3 text-sm">
          Every endpoint declares one required scope. Format: <code>resource:action</code>.
          Wildcards <code>invoices:*</code> grant all actions on a resource; <code>*</code> grants
          everything.
        </p>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {[
            ['invoices:read', 'List, show, download PDF'],
            ['invoices:write', 'Create, update, mark paid, duplicate'],
            ['invoices:send', 'Send via email'],
            ['invoices:delete', 'Delete drafts'],
            ['clients:read', 'List, show'],
            ['clients:write', 'Create, update'],
            ['webhooks:manage', 'Configure your webhook endpoint'],
            ['*', 'Full access (use with care)'],
          ].map(([scope, what]) => (
            <div
              key={scope}
              className="flex items-center justify-between rounded-lg border border-(--border) bg-(--muted)/40 px-3 py-2"
            >
              <code className="text-xs">{scope}</code>
              <span className="text-xs text-(--muted-foreground)">{what}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-2xl font-semibold">Encryption mode requirement</h2>
        <p className="mt-3 text-sm">
          The API is only available for teams in <strong>Standard encryption mode</strong>. Teams
          in Private (E2E) mode cannot create or use API keys — the server would have no way to
          decrypt your data without your password.
        </p>
        <p className="mt-3 text-sm">
          Switch encryption mode in <code>Settings → Members → Encryption</code>.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="text-2xl font-semibold">IP allowlist</h2>
        <p className="mt-3 text-sm">
          Restrict a key to specific IPs or CIDR blocks. Requests from other addresses get a 403{' '}
          <code>ip_not_allowed</code> response.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="text-2xl font-semibold">Rotation &amp; revocation</h2>
        <p className="mt-3 text-sm">
          Rotate a key from the dashboard. The old key keeps working for 24 hours so you can
          migrate integrations without downtime.
        </p>
        <p className="mt-3 text-sm">
          Revocation is immediate and irreversible. All subsequent requests return 401{' '}
          <code>token_revoked</code>.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="text-2xl font-semibold">Errors</h2>
        <div className="mt-4 overflow-x-auto rounded-xl border border-(--border)">
          <table className="w-full text-xs">
            <thead className="bg-(--muted)/50">
              <tr className="text-left">
                <th className="px-3 py-2">Code</th>
                <th className="px-3 py-2">HTTP</th>
                <th className="px-3 py-2">Cause</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['invalid_token', 401, 'Missing, malformed, or unknown key'],
                ['token_expired', 401, 'Past expires_at'],
                ['token_revoked', 401, 'Manually revoked'],
                ['ip_not_allowed', 403, 'Source IP not in allowlist'],
                ['insufficient_scope', 403, 'Required scope not granted'],
                ['team_mode_private', 403, 'Team uses Private encryption'],
              ].map(([code, http, why]) => (
                <tr key={code as string} className="border-t border-(--border)">
                  <td className="px-3 py-2 font-mono">{code}</td>
                  <td className="px-3 py-2">{http}</td>
                  <td className="px-3 py-2 text-(--muted-foreground)">{why}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
