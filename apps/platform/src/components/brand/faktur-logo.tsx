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

interface FakturDeveloperLogoProps {
  className?: string
  size?: number
}

/**
 * Variant of the Faktur logo for the developer platform: the mascot
 * holds a tiny laptop in its arms to signal it's the API / dev side.
 */
export function FakturDeveloperLogo({ className, size = 48 }: FakturDeveloperLogoProps) {
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
        {/* Body */}
        <path
          d="M 40 0 H 190 L 280 90 V 320 A 40 40 0 0 1 240 360 H 40 A 40 40 0 0 1 0 320 V 40 A 40 40 0 0 1 40 0 Z"
          fill="#6366f1"
        />
        <path d="M 190 0 V 60 A 30 30 0 0 0 220 90 H 280 Z" fill="#4f46e5" />

        {/* Eyes */}
        <ellipse cx="90" cy="150" rx="30" ry="32" fill="white" />
        <ellipse cx="98" cy="146" rx="15" ry="16" fill="#1e1b4b" />
        <ellipse cx="104" cy="138" rx="5" ry="5" fill="white" />
        <ellipse cx="190" cy="150" rx="30" ry="32" fill="white" />
        <ellipse cx="198" cy="146" rx="15" ry="16" fill="#1e1b4b" />
        <ellipse cx="204" cy="138" rx="5" ry="5" fill="white" />

        {/* Cheeks */}
        <ellipse cx="70" cy="200" rx="20" ry="12" fill="#a5b4fc" opacity="0.5" />
        <ellipse cx="210" cy="200" rx="20" ry="12" fill="#a5b4fc" opacity="0.5" />

        {/* Smile — slightly tighter to leave room for the laptop below */}
        <path
          d="M 110 218 C 124 235 156 235 170 218"
          stroke="white"
          strokeWidth="14"
          strokeLinecap="round"
          fill="none"
        />

        {/* Arms reaching down toward the laptop */}
        <path
          d="M -20 230 C -40 240 -30 280 10 285"
          stroke="#6366f1"
          strokeWidth="20"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M 300 230 C 320 240 310 280 270 285"
          stroke="#6366f1"
          strokeWidth="20"
          strokeLinecap="round"
          fill="none"
        />

        {/* Tiny laptop the mascot is holding — clear API signal */}
        {/* Laptop screen (back) */}
        <rect x="60" y="248" width="160" height="80" rx="10" fill="#0b0a1f" stroke="white" strokeWidth="4" />
        {/* Screen content (chevrons/code) */}
        <path
          d="M 95 280 L 80 290 L 95 300"
          stroke="#a5b4fc"
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <path
          d="M 185 280 L 200 290 L 185 300"
          stroke="#a5b4fc"
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <line
          x1="125"
          y1="280"
          x2="155"
          y2="300"
          stroke="#a5b4fc"
          strokeWidth="6"
          strokeLinecap="round"
        />
        {/* Laptop base */}
        <path
          d="M 30 328 H 250 L 240 348 H 40 Z"
          fill="#1e1b4b"
          stroke="white"
          strokeWidth="4"
          strokeLinejoin="round"
        />
        {/* Trackpad notch */}
        <rect x="120" y="333" width="40" height="6" rx="3" fill="#6366f1" />
      </g>
    </svg>
  )
}
