import { cn } from '@/lib/utils'

function Skeleton({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="skeleton"
      className={cn('skeleton-shimmer rounded-md', className)}
      {...props}
    />
  )
}

Skeleton.Text = function SkeletonText({ lines = 3 }: { lines?: number }) {
  return (
    <div className="flex flex-col gap-2.5">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn('h-3.5 rounded-md', i === lines - 1 ? 'w-3/5' : 'w-full')}
        />
      ))}
    </div>
  )
}

Skeleton.Circle = function SkeletonCircle({ size = 48 }: { size?: number }) {
  return <Skeleton className="rounded-full" style={{ width: size, height: size }} />
}

Skeleton.Rect = function SkeletonRect({
  className,
}: {
  className?: string
}) {
  return <Skeleton className={cn('h-30 w-full rounded-xl', className)} />
}

export { Skeleton }
