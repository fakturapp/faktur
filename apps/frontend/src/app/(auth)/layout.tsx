'use client'

import dynamic from 'next/dynamic'

const Iridescence = dynamic(() => import('@/components/ui/iridescence'), { ssr: false })

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen grid md:grid-cols-2">
      {/* Left: Form */}
      <div className="flex items-center justify-center p-6 md:p-12 z-10">{children}</div>

      {/* Right: Iridescence background */}
      <div className="relative hidden md:block overflow-hidden">
        <Iridescence color={[0.4, 0.3, 1]} speed={0.6} amplitude={0.15} />
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="text-center space-y-4 px-8">
            <h2 className="text-4xl font-bold text-white drop-shadow-lg">Faktur</h2>
            <p className="text-lg text-white/80 drop-shadow-md max-w-sm">
              Devis et facturation professionnels. Gratuit, pour toujours.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
