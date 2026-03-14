'use client'

import { useEffect, useState, useCallback } from 'react'

export function useUnsavedChanges(isDirty: boolean) {
  const [showModal, setShowModal] = useState(false)

  // Warn on browser/tab close
  useEffect(() => {
    if (!isDirty) return
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault()
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [isDirty])

  const confirmNavigation = useCallback(() => setShowModal(false), [])
  const cancelNavigation = useCallback(() => setShowModal(false), [])
  const promptUnsaved = useCallback(() => {
    if (isDirty) {
      setShowModal(true)
      return true
    }
    return false
  }, [isDirty])

  return { showModal, setShowModal, confirmNavigation, cancelNavigation, promptUnsaved }
}
