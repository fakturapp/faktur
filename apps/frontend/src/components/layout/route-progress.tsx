'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'

export function RouteProgressBar() {
  const pathname = usePathname()
  const [progress, setProgress] = useState(0)
  const [visible, setVisible] = useState(false)
  const prevPathname = useRef(pathname)
  const tickRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined)
  const hideRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    function start() {
      clearTimeout(hideRef.current)
      clearInterval(tickRef.current)
      setVisible(true)
      setProgress(12)
      tickRef.current = setInterval(() => {
        setProgress((p) => (p < 90 ? p + (94 - p) * 0.1 : p))
      }, 200)
    }
    window.addEventListener('faktur:route-pending', start)
    return () => {
      window.removeEventListener('faktur:route-pending', start)
      clearInterval(tickRef.current)
      clearTimeout(hideRef.current)
    }
  }, [])

  useEffect(() => {
    if (pathname === prevPathname.current) return
    prevPathname.current = pathname
    clearInterval(tickRef.current)
    setVisible(true)
    setProgress(100)
    hideRef.current = setTimeout(() => {
      setVisible(false)
      setProgress(0)
    }, 280)
  }, [pathname])

  if (!visible) return null

  return (
    <div className="absolute inset-x-0 top-0 z-50 h-[3px] pointer-events-none">
      <div
        className="h-full rounded-r-full bg-primary shadow-[0_0_8px_1px_var(--color-primary)] transition-[width,opacity] duration-200 ease-out"
        style={{ width: `${progress}%`, opacity: progress >= 100 ? 0 : 1 }}
      />
    </div>
  )
}
