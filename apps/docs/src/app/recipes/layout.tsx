import type { ReactNode } from 'react'
import { DocsShell } from '@/components/docs-shell'

export default function RecipesLayout({ children }: { children: ReactNode }) {
  return <DocsShell>{children}</DocsShell>
}
