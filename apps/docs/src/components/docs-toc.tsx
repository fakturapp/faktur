'use client'

import { useEffect, useState } from 'react'

interface Heading {
  id: string
  text: string
  level: 2 | 3
}

export function DocsTOC({ contentSelector = '#docs-content' }: { contentSelector?: string }) {
  const [headings, setHeadings] = useState<Heading[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)

  useEffect(() => {
    const root = document.querySelector(contentSelector)
    if (!root) return

    const nodes = Array.from(root.querySelectorAll<HTMLElement>('h2, h3'))
    const collected: Heading[] = nodes
      .filter((n) => Boolean(n.textContent?.trim()))
      .map((n, idx) => {
        if (!n.id) {
          n.id = slugify(n.textContent ?? `section-${idx}`)
        }
        return {
          id: n.id,
          text: n.textContent?.trim() ?? '',
          level: (n.tagName === 'H3' ? 3 : 2) as 2 | 3,
        }
      })
    setHeadings(collected)

    if (collected.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => (a.target as HTMLElement).offsetTop - (b.target as HTMLElement).offsetTop)
        if (visible.length > 0) {
          setActiveId(visible[0].target.id)
        }
      },
      { rootMargin: '-80px 0px -65% 0px', threshold: [0, 1] }
    )

    nodes.forEach((n) => observer.observe(n))
    return () => observer.disconnect()
  }, [contentSelector])

  if (headings.length === 0) return null

  return (
    <aside
      aria-label="On this page"
      className="hidden w-60 shrink-0 xl:block"
    >
      <div className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto pl-6">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          On this page
        </p>
        <ul className="space-y-px text-[13px]">
          {headings.map((h) => (
            <li
              key={h.id}
              className={h.level === 3 ? 'pl-3' : ''}
            >
              <a
                href={`#${h.id}`}
                className={
                  activeId === h.id
                    ? 'block rounded-md px-2 py-1 font-medium text-foreground'
                    : 'block rounded-md px-2 py-1 text-muted-foreground transition-colors hover:text-foreground'
                }
              >
                {h.text}
              </a>
            </li>
          ))}
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
