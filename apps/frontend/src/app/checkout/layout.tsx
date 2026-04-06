'use client'

import dynamic from 'next/dynamic'

const DarkVeil = dynamic(() => import('@/components/ui/dark-veil'), { ssr: false })

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Shader background */}
      <div className="fixed inset-0 z-0">
        <DarkVeil
          speed={0.3}
          hueShift={200}
          noiseIntensity={0.02}
          scanlineIntensity={0}
          warpAmount={0.3}
          resolutionScale={0.5}
        />
        {/* Dark overlay for readability */}
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]" />
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col text-white">
        {/* Header */}
        <header className="flex items-center justify-center py-6">
          <span className="text-xl font-bold tracking-tight text-white drop-shadow-lg">Faktur</span>
        </header>

        {/* Main */}
        <main className="flex-1 flex items-start justify-center px-4 pb-12">
          {children}
        </main>
      </div>
    </div>
  )
}
