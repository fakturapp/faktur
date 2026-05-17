'use client'

import { useEffect, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { ProjectsProvider } from '@/lib/projects-context'
import { Sidebar } from '@/components/layout/sidebar'
import { DashboardGradient } from '@/components/layout/dashboard-gradient'
import { Spinner } from '@/components/ui/spinner'

export default function AuthedLayout({ children }: { children: ReactNode }) {
  const router = useRouter()
  const { user, loading } = useAuth()

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login')
    }
  }, [loading, user, router])

  if (loading || !user) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Spinner />
      </div>
    )
  }

  return (
    <ProjectsProvider>
      <div className="relative h-screen overflow-hidden bg-background">
        <DashboardGradient />
        <Sidebar />
        <div className="relative z-10 flex h-screen flex-col overflow-hidden pl-(--sidebar-width)">
          <main className="flex-1 overflow-y-auto">{children}</main>
        </div>
      </div>
    </ProjectsProvider>
  )
}
