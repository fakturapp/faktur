'use client'

import { useAuth } from '@/lib/auth'

export function HiddenUsername() {
  const { user } = useAuth()
  const value = user?.email ?? ''
  return (
    <input
      type="email"
      name="username"
      autoComplete="username"
      value={value}
      readOnly
      tabIndex={-1}
      aria-hidden="true"
      style={{
        position: 'absolute',
        height: 0,
        width: 0,
        opacity: 0,
        pointerEvents: 'none',
        border: 0,
        padding: 0,
        margin: 0,
        overflow: 'hidden',
        clip: 'rect(0 0 0 0)',
      }}
      onChange={() => {}}
    />
  )
}
