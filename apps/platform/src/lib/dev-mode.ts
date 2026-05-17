'use client'

import { useEffect, useState } from 'react'

const STORAGE_KEY = 'faktur_dev_mode'
const EVENT_NAME = 'faktur:dev-mode-change'

export function isDevModeEnabled(): boolean {
  if (typeof window === 'undefined') return false
  return localStorage.getItem(STORAGE_KEY) === '1'
}

export function setDevMode(enabled: boolean): void {
  if (typeof window === 'undefined') return
  if (enabled) localStorage.setItem(STORAGE_KEY, '1')
  else localStorage.removeItem(STORAGE_KEY)
  window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: enabled }))
}

export function useDevMode(): [boolean, (enabled: boolean) => void] {
  const [enabled, setEnabled] = useState<boolean>(false)

  useEffect(() => {
    setEnabled(isDevModeEnabled())
    function onChange(e: Event) {
      setEnabled(!!(e as CustomEvent<boolean>).detail)
    }
    function onStorage(e: StorageEvent) {
      if (e.key === STORAGE_KEY) setEnabled(e.newValue === '1')
    }
    window.addEventListener(EVENT_NAME, onChange)
    window.addEventListener('storage', onStorage)
    return () => {
      window.removeEventListener(EVENT_NAME, onChange)
      window.removeEventListener('storage', onStorage)
    }
  }, [])

  return [enabled, setDevMode]
}

export interface CapturedApiError {
  url: string
  method: string
  status: number
  body: unknown
  ts: number
}

declare global {
  interface Window {
    __fakturLastApiError?: CapturedApiError
  }
}

export function captureApiError(err: CapturedApiError): void {
  if (typeof window === 'undefined') return
  window.__fakturLastApiError = err
}

export function getLastApiError(): CapturedApiError | undefined {
  if (typeof window === 'undefined') return undefined
  return window.__fakturLastApiError
}
