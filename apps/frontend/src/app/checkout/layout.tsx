'use client'

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {}
      <header className="py-6 px-6 flex items-center justify-center">
        <div className="flex items-center gap-2.5">
          <img src="/logo.svg" alt="Faktur" className="h-8 w-8 drop-shadow-sm" />
          <span className="text-lg font-semibold tracking-tight text-foreground font-lexend">Faktur</span>
        </div>
      </header>

      {}
      <main className="flex-1 flex items-start justify-center px-4 pb-10">
        <div className="w-full max-w-[480px]">{children}</div>
      </main>

      {}
      <footer className="py-6 text-center border-t border-border/50">
        <p className="text-[11px] text-muted-foreground">
          Propulsé par{' '}
          <a
            href="https://fakturapp.cc"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline font-medium transition-colors"
          >
            Faktur
          </a>
        </p>
      </footer>
    </div>
  )
}
