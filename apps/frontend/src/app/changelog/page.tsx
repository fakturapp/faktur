'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import ReactMarkdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { cn } from '@/lib/utils'
import { useToast } from '@/components/ui/toast'
import { ChevronLeft, Share2, Clock, CalendarDays } from 'lucide-react'
import { ScrollShadow } from '@/components/ui/scroll-shadow'
import {
  CHANGELOG,
  CHANGELOG_META,
  CHANGELOG_SECTION_IDS as SECTION_IDS,
  CHANGELOG_READ_MINUTES as READ_MINUTES,
} from '@/data/changelog'

const mdComponents: Components = {
  p: ({ children }) => (
    <p className="mb-5 text-[18px] leading-[1.85] text-foreground/80">{children}</p>
  ),
  strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
  em: ({ children }) => <em className="italic">{children}</em>,
  a: ({ children, href }) => {
    const external = !!href && /^https?:/.test(href)
    return (
      <a
        href={href}
        target={external ? '_blank' : undefined}
        rel={external ? 'noreferrer' : undefined}
        className="font-medium text-primary underline decoration-primary/40 underline-offset-2 transition-colors hover:decoration-primary"
      >
        {children}
      </a>
    )
  },
  ul: ({ children }) => (
    <ul className="mb-5 space-y-2 text-[18px] leading-[1.85] text-foreground/80">{children}</ul>
  ),
  li: ({ children }) => <li className="ml-5 list-disc">{children}</li>,
  code: ({ children }) => (
    <code className="rounded bg-foreground/[0.06] px-1.5 py-0.5 font-mono text-[15px] text-foreground">
      {children}
    </code>
  ),
}

/** Map every section id (month or entry) back to its month id. */
const MONTH_OF: Record<string, string> = (() => {
  const map: Record<string, string> = {}
  for (const month of CHANGELOG) {
    map[month.id] = month.id
    for (const e of month.entries) map[e.id] = month.id
  }
  return map
})()

export default function ChangelogPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [activeId, setActiveId] = useState<string>(SECTION_IDS[0])
  // The month currently shown in the table of contents. Driven by scroll, but
  // can be set manually by clicking another month tab.
  const [openMonth, setOpenMonth] = useState<string>(CHANGELOG[0].id)

  useEffect(() => {
    function onScroll() {
      let current = SECTION_IDS[0]
      for (const id of SECTION_IDS) {
        const el = document.getElementById(id)
        if (!el) continue
        if (el.getBoundingClientRect().top <= 140) current = id
        else break
      }
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) {
        current = SECTION_IDS[SECTION_IDS.length - 1]
      }
      setActiveId(current)
      const month = MONTH_OF[current]
      if (month) setOpenMonth(month)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])

  const currentMonth = CHANGELOG.find((m) => m.id === openMonth) ?? CHANGELOG[0]

  function goTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  async function share() {
    try {
      await navigator.clipboard.writeText(window.location.href)
      toast('Lien copié dans le presse-papiers', 'success')
    } catch {
      toast('Impossible de copier le lien', 'error')
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-6 py-12 lg:px-10">
        <button
          onClick={() => router.back()}
          className="mb-10 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" /> Retour
        </button>

        <header className="mx-auto max-w-3xl text-center">
          <h1 className="text-5xl font-bold tracking-tight text-foreground sm:text-6xl">
            {CHANGELOG_META.title}
          </h1>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[14px] text-muted-foreground">
            <span className="font-medium text-foreground">{CHANGELOG_META.author}</span>
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="h-4 w-4" /> Mis à jour le{' '}
              <time dateTime={CHANGELOG_META.updatedAtIso}>{CHANGELOG_META.updatedAtLabel}</time>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-4 w-4" /> {READ_MINUTES} min de lecture
            </span>
            <button
              type="button"
              onClick={share}
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-medium text-primary transition-colors hover:bg-primary/10"
            >
              <Share2 className="h-4 w-4" /> Partager
            </button>
          </div>
        </header>

        <div className="mt-16 grid gap-x-16 gap-y-10 lg:grid-cols-[230px_minmax(0,1fr)]">
          <aside className="hidden lg:block">
            <nav className="sticky top-12">
              <p className="mb-4 text-[12px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                Sommaire
              </p>

              {/* Month switcher — always visible, picks which month shows below */}
              <div className="mb-4 flex flex-wrap gap-1.5">
                {CHANGELOG.map((month) => (
                  <button
                    key={month.id}
                    type="button"
                    onClick={() => {
                      setOpenMonth(month.id)
                      goTo(month.id)
                    }}
                    className={cn(
                      'rounded-full px-3 py-1 text-[12.5px] font-semibold transition-colors',
                      openMonth === month.id
                        ? 'bg-primary text-white'
                        : 'bg-foreground/[0.05] text-foreground/70 hover:bg-foreground/[0.1] hover:text-foreground'
                    )}
                  >
                    {month.label}
                  </button>
                ))}
              </div>

              {/* Only the active month's entries, with a blurred scroll edge */}
              <ScrollShadow
                size={48}
                className="max-h-[calc(100vh-12rem)]"
                aria-label={`Sommaire — ${currentMonth.label}`}
              >
                <ul className="space-y-0.5 border-l border-border pr-1">
                  {currentMonth.entries.map((e) => (
                    <li key={e.id}>
                      <button
                        type="button"
                        onClick={() => goTo(e.id)}
                        className={cn(
                          '-ml-px block w-full border-l-2 py-1.5 pl-4 text-left text-[13.5px] leading-snug transition-colors',
                          activeId === e.id
                            ? 'border-primary font-medium text-primary'
                            : 'border-transparent text-muted-foreground hover:text-foreground'
                        )}
                      >
                        {e.title}
                      </button>
                    </li>
                  ))}
                </ul>
              </ScrollShadow>
            </nav>
          </aside>

          <article className="min-w-0 max-w-3xl">
            {CHANGELOG.map((month) => (
              <section key={month.id} className="mb-20 last:mb-0">
                <h2
                  id={month.id}
                  className="mb-10 scroll-mt-16 text-4xl font-bold tracking-tight text-foreground sm:text-5xl"
                >
                  {month.label}
                </h2>
                {month.entries.map((e) => (
                  <section key={e.id} id={e.id} className="mb-14 scroll-mt-16 last:mb-0">
                    <h3 className="mb-4 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                      {e.title}
                    </h3>
                    <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
                      {e.body}
                    </ReactMarkdown>
                  </section>
                ))}
              </section>
            ))}
          </article>
        </div>
      </div>
    </div>
  )
}
