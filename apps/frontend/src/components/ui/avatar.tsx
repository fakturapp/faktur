'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333'

function resolveUrl(url: string | null | undefined): string | null {
  if (!url) return null
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) return url
  return `${API_URL}${url}`
}

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string | null
  alt?: string
  fallback?: string
  size?: 'sm' | 'md' | 'lg'
}

const sizeClasses = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
}

const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, src, alt, fallback, size = 'md', ...props }, ref) => {
    const [imgError, setImgError] = React.useState(false)
    const initials = fallback || alt?.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase() || '?'
    const showImg = src && !imgError

    return (
      <div
        ref={ref}
        className={cn(
          'relative flex shrink-0 items-center justify-center rounded-full bg-muted overflow-hidden',
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {showImg ? (
          <img src={resolveUrl(src) || ''} alt={alt || ''} className="h-full w-full object-cover" onError={() => setImgError(true)} />
        ) : (
          <span className="font-medium text-muted-foreground">{initials}</span>
        )}
      </div>
    )
  }
)
Avatar.displayName = 'Avatar'

export { Avatar }
