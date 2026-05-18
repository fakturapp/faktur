import { cn } from '@/lib/utils'

interface FakturLogoProps {
  className?: string
  size?: number
}

/**
 * Official Faktur character logo (the friendly folded-page mascot).
 * Sourced from apps/frontend/public/logo.svg.
 */
export function FakturLogo({ className, size = 40 }: FakturLogoProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 400 400"
      width={size}
      height={size}
      className={cn('shrink-0', className)}
      aria-hidden
    >
      <g transform="translate(60, 20)">
        <path
          d="M 40 0 H 190 L 280 90 V 320 A 40 40 0 0 1 240 360 H 40 A 40 40 0 0 1 0 320 V 40 A 40 40 0 0 1 40 0 Z"
          fill="#6366f1"
        />
        <path d="M 190 0 V 60 A 30 30 0 0 0 220 90 H 280 Z" fill="#4f46e5" />
        <ellipse cx="90" cy="150" rx="30" ry="32" fill="white" />
        <ellipse cx="98" cy="146" rx="15" ry="16" fill="#1e1b4b" />
        <ellipse cx="104" cy="138" rx="5" ry="5" fill="white" />
        <ellipse cx="190" cy="150" rx="30" ry="32" fill="white" />
        <ellipse cx="198" cy="146" rx="15" ry="16" fill="#1e1b4b" />
        <ellipse cx="204" cy="138" rx="5" ry="5" fill="white" />
        <path
          d="M 105 220 C 120 245 160 245 175 220"
          stroke="white"
          strokeWidth="15"
          strokeLinecap="round"
          fill="none"
        />
        <ellipse cx="70" cy="200" rx="20" ry="12" fill="#a5b4fc" opacity="0.5" />
        <ellipse cx="210" cy="200" rx="20" ry="12" fill="#a5b4fc" opacity="0.5" />
        <line
          x1="70"
          y1="280"
          x2="210"
          y2="280"
          stroke="#a5b4fc"
          strokeWidth="12"
          strokeLinecap="round"
          opacity="0.6"
        />
        <line
          x1="70"
          y1="310"
          x2="160"
          y2="310"
          stroke="#a5b4fc"
          strokeWidth="12"
          strokeLinecap="round"
          opacity="0.6"
        />
        <path
          d="M -20 200 C -40 200 -50 220 -40 235"
          stroke="#6366f1"
          strokeWidth="20"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M 300 200 C 320 200 330 220 320 235"
          stroke="#6366f1"
          strokeWidth="20"
          strokeLinecap="round"
          fill="none"
        />
      </g>
    </svg>
  )
}

interface FakturLogoMarkProps {
  className?: string
  size?: number
  showApiBadge?: boolean
}

/**
 * Faktur logo lockup with optional "API" badge for the developer platform.
 */
export function FakturLogoMark({
  className,
  size = 48,
  showApiBadge = true,
}: FakturLogoMarkProps) {
  return (
    <div className={cn('inline-flex items-center gap-2', className)}>
      <FakturLogo size={size} />
      {showApiBadge && (
        <span className="inline-flex items-center rounded-md border border-accent/40 bg-accent/10 px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-accent">
          API
        </span>
      )}
    </div>
  )
}
