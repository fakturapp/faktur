import { cn } from '@/lib/utils'

interface SpinnerProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-10 h-10',
}

export function Spinner({ className, size = 'sm' }: SpinnerProps) {
  return (
    <svg
      viewBox="25 25 50 50"
      className={cn('animate-spinner-rotate', sizeClasses[size], className)}
    >
      <circle
        r={20}
        cy={50}
        cx={50}
        className="animate-spinner-dash fill-none stroke-current stroke-2"
        strokeLinecap="round"
      />
    </svg>
  )
}
