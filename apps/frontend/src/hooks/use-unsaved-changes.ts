'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'

export function useUnsavedChanges(isDirty: boolean) {
  const router = useRouter()
  const [showModal, setShowModal] = useState(false)
  const pendingUrlRef = useRef<string | null>(null)
  const isDirtyRef = useRef(isDirty)

  useEffect(() => {
    isDirtyRef.current = isDirty
  }, [isDirty])

  // 1. Browser close / tab close
  useEffect(() => {
    if (!isDirty) return
    const handler = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [isDirty])

  // 2. Browser back / forward (popstate)
  useEffect(() => {
    if (!isDirty) return
    window.history.pushState({ __unsaved: true }, '')

    const handlePopstate = () => {
      if (!isDirtyRef.current) return
      window.history.pushState({ __unsaved: true }, '')
      pendingUrlRef.current = null
      setShowModal(true)
    }

    window.addEventListener('popstate', handlePopstate)
    return () => window.removeEventListener('popstate', handlePopstate)
  }, [isDirty])

  // 3. Client-side link clicks (sidebar, etc.)
  useEffect(() => {
    if (!isDirty) return

    const handleClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest('a[href]')
      if (!anchor) return
      const href = anchor.getAttribute('href')
      if (!href) return
      if (href.startsWith('http') || href.startsWith('#') || href.startsWith('mailto:')) return
      if (href === window.location.pathname) return

      e.preventDefault()
      e.stopPropagation()
      pendingUrlRef.current = href
      setShowModal(true)
    }

    document.addEventListener('click', handleClick, true)
    return () => document.removeEventListener('click', handleClick, true)
  }, [isDirty])

  /** Discard changes and navigate to the pending URL (or fallback). */
  const confirmNavigation = useCallback((fallbackUrl?: string) => {
    isDirtyRef.current = false
    setShowModal(false)
    const url = pendingUrlRef.current || fallbackUrl
    pendingUrlRef.current = null
    if (url) {
      router.push(url)
    } else {
      window.history.go(-2)
    }
  }, [router])

  /** Close the modal without navigating. */
  const cancelNavigation = useCallback(() => {
    setShowModal(false)
    pendingUrlRef.current = null
  }, [])

  /** Programmatically request navigation (e.g. back arrow button). Returns true if blocked. */
  const requestNavigation = useCallback((targetUrl: string) => {
    if (isDirtyRef.current) {
      pendingUrlRef.current = targetUrl
      setShowModal(true)
      return true
    }
    return false
  }, [])

  return { showModal, confirmNavigation, cancelNavigation, requestNavigation }
}
