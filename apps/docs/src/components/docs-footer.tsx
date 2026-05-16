import Link from 'next/link'

export function DocsFooter() {
  return (
    <footer className="mt-20 border-t border-(--border) py-10">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 sm:px-6 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-medium">Faktur API</p>
          <p className="mt-1 text-xs text-(--muted-foreground)">
            © {new Date().getFullYear()} Faktur — Build with confidence.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4 text-xs sm:grid-cols-4 md:gap-8">
          <FooterColumn title="API">
            <FooterLink href="/quickstart">Quickstart</FooterLink>
            <FooterLink href="/resources/invoices">Reference</FooterLink>
            <FooterLink href="/webhooks">Webhooks</FooterLink>
            <FooterLink href="/openapi.json">OpenAPI spec</FooterLink>
          </FooterColumn>
          <FooterColumn title="Concepts">
            <FooterLink href="/concepts/authentication">Authentication</FooterLink>
            <FooterLink href="/concepts/errors">Errors</FooterLink>
            <FooterLink href="/concepts/rate-limits">Rate limits</FooterLink>
            <FooterLink href="/concepts/idempotency">Idempotency</FooterLink>
          </FooterColumn>
          <FooterColumn title="Resources">
            <FooterLink href="/recipes">Recipes</FooterLink>
            <FooterLink href="/changelog">Changelog</FooterLink>
            <FooterLink href="/llms.txt">llms.txt</FooterLink>
          </FooterColumn>
          <FooterColumn title="Faktur">
            <FooterLink href="https://fakturapp.cc">App</FooterLink>
            <FooterLink href="https://github.com/fakturapp">GitHub</FooterLink>
          </FooterColumn>
        </div>
      </div>
    </footer>
  )
}

function FooterColumn({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-(--muted-foreground)">
        {title}
      </p>
      <div className="space-y-1.5">{children}</div>
    </div>
  )
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="block text-(--muted-foreground) hover:text-(--foreground)">
      {children}
    </Link>
  )
}
