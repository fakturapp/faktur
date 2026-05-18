import { cn } from '@/lib/utils'

interface FakturLogoProps {
  className?: string
  size?: number
}

export function FakturLogo({ className, size = 40 }: FakturLogoProps) {
  return (
    <img
      src="/logo.svg"
      alt="Faktur"
      width={size}
      height={size}
      className={cn('shrink-0 select-none', className)}
      style={{ width: size, height: size }}
      draggable={false}
    />
  )
}

interface FakturDeveloperLogoProps {
  className?: string
  size?: number
}

export function FakturDeveloperLogo({ className, size = 48 }: FakturDeveloperLogoProps) {
  return <FakturLogo className={className} size={size} />
}
