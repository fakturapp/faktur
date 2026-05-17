import type { ReactNode } from 'react'
import { DocsSidebar } from '@/components/docs-sidebar'
import { DocsTOC } from '@/components/docs-toc'

interface Props {
  children: ReactNode
  showSidebar?: boolean
  showToc?: boolean
}

export function DocsShell({ children, showSidebar = true, showToc = true }: Props) {
  return (
    <div className="mx-auto flex w-full max-w-[1400px]">
      {showSidebar && <DocsSidebar />}
      <main className="min-w-0 flex-1">
        <div className="flex gap-10 xl:px-6">
          <article id="docs-content" className="prose-doc docs-fade-up min-w-0 flex-1">
            {children}
          </article>
          {showToc && <DocsTOC />}
        </div>
      </main>
    </div>
  )
}
