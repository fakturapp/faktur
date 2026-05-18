import Link from 'next/link'
import { DASHBOARD_URL } from '@/lib/config'

export function DocsFooter() {
  return (
    <footer className="mt-24 border-t border-separator">
      <div className="mx-auto flex max-w-[1400px] flex-col gap-8 px-4 py-12 sm:px-6 md:flex-row md:items-start md:justify-between">
        <div className="max-w-sm">
          <p className="text-sm font-semibold text-foreground">Faktur Developers</p>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            API V2 publique pour Faktur, facturation, devis, clients, webhooks. Conçue pour les
            développeurs.
          </p>
          <p className="mt-4 text-[11px] text-muted-foreground">
            © {new Date().getFullYear()} Faktur. Build with confidence.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-8 text-xs sm:grid-cols-4">
          <FooterColumn title="API">
            <FooterLink href="/quickstart">Quickstart</FooterLink>
            <FooterLink href="/resources">Reference</FooterLink>
            <FooterLink href="/concepts/webhooks">Webhooks</FooterLink>
            <FooterLink href="/openapi.json">OpenAPI 3.1</FooterLink>
          </FooterColumn>
          <FooterColumn title="Concepts">
            <FooterLink href="/concepts/authentication">Authentication</FooterLink>
            <FooterLink href="/concepts/errors">Errors</FooterLink>
            <FooterLink href="/concepts/rate-limits">Rate limits</FooterLink>
            <FooterLink href="/concepts/idempotency">Idempotency</FooterLink>
          </FooterColumn>
          <FooterColumn title="Ressources">
            <FooterLink href="/recipes">Recipes</FooterLink>
            <FooterLink href="/changelog">Changelog</FooterLink>
            <FooterLink href="/llms.txt">llms.txt</FooterLink>
          </FooterColumn>
          <FooterColumn title="Faktur">
            <FooterLink href={DASHBOARD_URL}>App principale</FooterLink>
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
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        {title}
      </p>
      <div className="space-y-1.5">{children}</div>
    </div>
  )
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="block text-muted-foreground transition-colors hover:text-foreground"
    >
      {children}
    </Link>
  )
}
