'use client'

import { useAuth } from '@/lib/auth'

export function HiddenUsername() {
  const { user } = useAuth()
  const value = user?.email ?? ''
  return (
    <input
      type="text"
      name="username"
      id="faktur-hidden-username"
      autoComplete="username"
      value={value}
      readOnly
      tabIndex={-1}
      aria-hidden="true"
      style={{
        position: 'absolute',
        left: '-10000px',
        top: 'auto',
        width: '1px',
        height: '1px',
        overflow: 'hidden',
        opacity: 0,
      }}
      onChange={() => {}}
    />
  )
}
