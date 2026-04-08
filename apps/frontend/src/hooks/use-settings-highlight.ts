'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'

export function useSettingsHighlight(): string | null {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const [query, setQuery] = useState<string | null>(null)

  useEffect(() => {
    const highlight = searchParams.get('highlight')
    if (highlight) {
      setQuery(highlight)
      const params = new URLSearchParams(searchParams.toString())
      params.delete('highlight')
      const newUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname
      router.replace(newUrl, { scroll: false })
      // Clear after 4 seconds
      const timer = setTimeout(() => setQuery(null), 4000)
      return () => clearTimeout(timer)
    }
  }, [searchParams, router, pathname])

  return query
}
