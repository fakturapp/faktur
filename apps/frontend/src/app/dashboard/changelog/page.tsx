'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import ReactMarkdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { cn } from '@/lib/utils'
import { useToast } from '@/components/ui/toast'
import { ChevronLeft, Share2, Clock, CalendarDays, Sparkles } from 'lucide-react'
import {
  CHANGELOG,
  CHANGELOG_META,
  CHANGELOG_SECTION_IDS as SECTION_IDS,
  CHANGELOG_READ_MINUTES as READ_MINUTES,
} from '@/data/changelog'

const mdComponents: Components = {
  p: ({ children }) => <p className="mb-4 text-[15px] leading-7 text-muted-foreground">{children}</p>,
  strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
  ul: ({ children }) => (
    <ul className="mb-4 space-y-2 pl-1 text-[15px] leading-7 text-muted-foreground">{children}</ul>
  ),
  li: ({ children }) => (
    <li className="flex gap-2.5">
      <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/60" />
      <span className="min-w-0">{children}</span>
    </li>
  ),
  a: ({ children, href }) => (
    <a href={href} className="text-primary underline underline-offset-2 hover:opacity-80">
      {children}
    </a>
  ),
  code: ({ children }) => (
    <code className="rounded bg-foreground/[0.06] px-1.5 py-0.5 font-mono text-[13px] text-foreground">
      {children}
    </code>
  ),
}

export default function ChangelogPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [activeId, setActiveId] = useState<string>(SECTION_IDS[0])

  useEffect(() => {
    const els = SECTION_IDS.map((id) => document.getElementById(id)).filter(
      (el): el is HTMLElement => !!el
    )
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible[0]) setActiveId(visible[0].target.id)
      },
      { rootMargin: '-96px 0px -70% 0px', threshold: 0 }
    )
    els.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])

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
    <div className="mx-auto max-w-5xl px-6 py-8">
      <button
        onClick={() => router.push('/dashboard')}
        className="mb-8 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" /> Retour
      </button>

      <header className="flex flex-col items-center gap-4 text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-primary">
          <Sparkles className="h-3 w-3" /> Blog
        </span>
        <h1 className="text-4xl font-bold tracking-tight text-foreground">{CHANGELOG_META.title}</h1>

        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[13px] text-muted-foreground">
          <span className="font-medium text-foreground">{CHANGELOG_META.author}</span>
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays className="h-3.5 w-3.5" /> Mis à jour le{' '}
            <time dateTime={CHANGELOG_META.updatedAtIso}>{CHANGELOG_META.updatedAtLabel}</time>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" /> {READ_MINUTES} min de lecture
          </span>
          <button
            type="button"
            onClick={share}
            className="inline-flex items-center gap-1.5 rounded-full px-2 py-1 font-medium text-primary transition-colors hover:bg-primary/10"
          >
            <Share2 className="h-3.5 w-3.5" /> Partager
          </button>
        </div>

        <span className="rounded-full bg-foreground/[0.06] px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
          Notes de version
        </span>

        <div className="mt-2 flex h-40 w-full items-center justify-center overflow-hidden rounded-3xl bg-gradient-to-br from-primary/15 via-primary/5 to-transparent">
          <Sparkles className="h-10 w-10 text-primary/50" />
        </div>
      </header>

      <div className="mt-12 grid gap-10 md:grid-cols-[200px_1fr]">
        <aside className="hidden md:block">
          <nav className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto pr-2">
            <p className="mb-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Sur cette page
            </p>
            <ul className="space-y-0.5 border-l border-border">
              {CHANGELOG.map((month) => (
                <li key={month.id}>
                  <button
                    type="button"
                    onClick={() => goTo(month.id)}
                    className={cn(
                      '-ml-px block w-full border-l-2 py-1 pl-3 text-left text-[13px] font-semibold transition-colors',
                      activeId === month.id
                        ? 'border-primary text-foreground'
                        : 'border-transparent text-foreground/80 hover:text-foreground'
                    )}
                  >
                    {month.label}
                  </button>
                  <ul className="space-y-0.5">
                    {month.entries.map((e) => (
                      <li key={e.id}>
                        <button
                          type="button"
                          onClick={() => goTo(e.id)}
                          className={cn(
                            '-ml-px block w-full border-l-2 py-1 pl-5 text-left text-[12.5px] leading-snug transition-colors',
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
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        <article className="min-w-0">
          {CHANGELOG.map((month) => (
            <section key={month.id} className="mb-14 last:mb-0">
              <h2
                id={month.id}
                className="scroll-mt-24 border-b border-border pb-3 text-2xl font-bold text-foreground"
              >
                {month.label}
              </h2>
              {month.entries.map((e) => (
                <section key={e.id} id={e.id} className="mt-8 scroll-mt-24">
                  <h3 className="mb-3 text-lg font-semibold text-foreground">{e.title}</h3>
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
  )
}
