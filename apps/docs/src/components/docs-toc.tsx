'use client'

import { useEffect, useRef, useState } from 'react'

interface Heading {
  id: string
  text: string
  level: 2 | 3
}

export function DocsTOC({ contentSelector = '#docs-content' }: { contentSelector?: string }) {
  const [headings, setHeadings] = useState<Heading[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const headingNodesRef = useRef<HTMLElement[]>([])

  useEffect(() => {
    const root = document.querySelector(contentSelector)
    if (!root) return

    const nodes = Array.from(root.querySelectorAll<HTMLElement>('h2, h3')).filter((n) =>
      Boolean(n.textContent?.trim())
    )

    const collected: Heading[] = nodes.map((n, idx) => {
      if (!n.id) {
        n.id = slugify(n.textContent ?? `section-${idx}`)
      }
      return {
        id: n.id,
        text: n.textContent?.trim() ?? '',
        level: (n.tagName === 'H3' ? 3 : 2) as 2 | 3,
      }
    })

    headingNodesRef.current = nodes
    setHeadings(collected)

    if (nodes.length === 0) return

    
    const TRIGGER_OFFSET = 96

    let rafId: number | null = null
    function compute() {
      rafId = null
      const items = headingNodesRef.current
      if (items.length === 0) return

      let currentId = items[0].id
      for (const node of items) {
        const top = node.getBoundingClientRect().top
        if (top - TRIGGER_OFFSET <= 0) {
          currentId = node.id
        } else {
          break
        }
      }
      const scrollBottom = window.innerHeight + window.scrollY
      const docHeight = document.documentElement.scrollHeight
      if (docHeight - scrollBottom < 64) {
        currentId = items[items.length - 1].id
      }

      setActiveId((prev) => (prev === currentId ? prev : currentId))
    }

    function onScroll() {
      if (rafId !== null) return
      rafId = requestAnimationFrame(compute)
    }

    compute()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (rafId !== null) cancelAnimationFrame(rafId)
    }
  }, [contentSelector])

  if (headings.length === 0) return null

  return (
    <aside aria-label="On this page" className="hidden w-60 shrink-0 xl:block">
      <div className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto pl-6">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-(--muted-foreground)">
          On this page
        </p>
        <ul className="relative space-y-px text-[13px]">
          <span
            aria-hidden
            className="absolute left-0 top-0 h-full w-px bg-(--border)"
          />
          {headings.map((h) => {
            const isActive = activeId === h.id
            return (
              <li key={h.id} className={h.level === 3 ? 'pl-3' : ''}>
                <a
                  href={`#${h.id}`}
                  className={
                    'relative block rounded-md px-3 py-1.5 transition-colors ' +
                    (isActive
                      ? 'font-medium text-violet-500'
                      : 'text-(--muted-foreground) hover:text-(--foreground)')
                  }
                >
                  {isActive && (
                    <span
                      aria-hidden
                      className="absolute -left-px top-1/2 h-4 w-px -translate-y-1/2 bg-violet-500"
                    />
                  )}
                  {h.text}
                </a>
              </li>
            )
          })}
        </ul>
      </div>
    </aside>
  )
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 60)
}
