import type { ReactNode } from 'react'
import { DocsShell } from '@/components/docs-shell'

export default function ChangelogLayout({ children }: { children: ReactNode }) {
  return <DocsShell showToc={false}>{children}</DocsShell>
}
