'use client'

interface Props {
  className?: string
}

export function DashboardBackground({ className }: Props) {
  return (
    <div
      aria-hidden="true"
      className={
        'pointer-events-none fixed inset-0 -z-10 ' +
        (className ?? '')
      }
      style={{
        backgroundImage:
          'radial-gradient(circle at 20% 10%, color-mix(in srgb, var(--primary) 6%, transparent) 0%, transparent 55%),' +
          'radial-gradient(circle at 80% 95%, color-mix(in srgb, var(--accent) 5%, transparent) 0%, transparent 55%),' +
          'radial-gradient(circle at 1px 1px, color-mix(in srgb, var(--foreground) 9%, transparent) 1px, transparent 0)',
        backgroundSize: '100% 100%, 100% 100%, 22px 22px',
      }}
    />
  )
}
