'use client'

import dynamic from 'next/dynamic'

const Iridescence = dynamic(() => import('@/components/ui/iridescence'), { ssr: false })

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen grid md:grid-cols-2 bg-zinc-950">
      {/* Left: Iridescence + branding — fills full height */}
      <div className="relative hidden md:flex overflow-hidden">
        <Iridescence color={[0.4, 0.3, 1]} speed={0.6} amplitude={0.15} />
        <div className="absolute inset-0 flex flex-col items-center justify-center z-10 px-10">
          <div className="text-center space-y-4">
            <h2 className="text-4xl font-bold text-white drop-shadow-lg">Faktur</h2>
            <p className="text-lg text-white/80 drop-shadow-md max-w-sm">
              Devis et facturation professionnels. Gratuit, pour toujours.
            </p>
          </div>
        </div>
      </div>

      {/* Right: Form — fills full height */}
      <div className="flex items-center justify-center p-6 md:p-10 bg-background overflow-y-auto">
        {children}
      </div>
    </div>
  )
}
