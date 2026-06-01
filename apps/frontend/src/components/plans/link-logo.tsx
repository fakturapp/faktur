import { cn } from '@/lib/utils'

export function LinkLogo({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-[6px] bg-[#00d66f] px-1.5 py-[3px] text-[11px] font-bold lowercase leading-none tracking-tight text-black',
        className
      )}
      aria-label="Link by Stripe"
    >
      link
    </span>
  )
}
