'use client'

interface Props {
  className?: string
}

export function DashboardBackground({ className }: Props) {
  return (
    <>
      <div
        aria-hidden="true"
        className={'pointer-events-none fixed inset-0 -z-20 ' + (className ?? '')}
        style={{
          backgroundImage:
            'radial-gradient(ellipse 80% 60% at 20% 5%, color-mix(in srgb, var(--primary) 9%, transparent) 0%, transparent 55%),' +
            'radial-gradient(ellipse 70% 50% at 85% 95%, color-mix(in srgb, var(--accent) 7%, transparent) 0%, transparent 55%),' +
            'radial-gradient(ellipse 50% 40% at 50% 50%, color-mix(in srgb, var(--primary) 3%, transparent) 0%, transparent 60%)',
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-10 faktur-bg-dots"
      />
      <style jsx global>{`
        .faktur-bg-dots {
          background-image: radial-gradient(
            circle at 1px 1px,
            color-mix(in srgb, var(--foreground) 12%, transparent) 1.2px,
            transparent 1.6px
          );
          background-size: 24px 24px;
          background-position: 0 0;
          animation: fakturDotsDrift 28s linear infinite;
          mask-image: radial-gradient(ellipse 90% 90% at 50% 40%, black 35%, transparent 90%);
          -webkit-mask-image: radial-gradient(ellipse 90% 90% at 50% 40%, black 35%, transparent 90%);
        }
        @keyframes fakturDotsDrift {
          0% { background-position: 0 0; }
          100% { background-position: 48px 24px; }
        }
        @media (prefers-reduced-motion: reduce) {
          .faktur-bg-dots { animation: none; }
        }
      `}</style>
    </>
  )
}
