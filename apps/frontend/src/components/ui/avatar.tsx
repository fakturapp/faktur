'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

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
    const initials = fallback || alt?.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase() || '?'

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
        {src ? (
          <img src={src} alt={alt || ''} className="h-full w-full object-cover" />
        ) : (
          <span className="font-medium text-muted-foreground">{initials}</span>
        )}
      </div>
    )
  }
)
Avatar.displayName = 'Avatar'

export { Avatar }
