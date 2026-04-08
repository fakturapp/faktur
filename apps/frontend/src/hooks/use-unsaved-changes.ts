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

  useEffect(() => {
    if (!isDirty) return
    const handler = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [isDirty])

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

  const cancelNavigation = useCallback(() => {
    setShowModal(false)
    pendingUrlRef.current = null
  }, [])

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
