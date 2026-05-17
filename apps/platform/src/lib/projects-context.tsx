'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { apiProjectsClient, type ApiProjectShape } from './api-projects-client'

interface ProjectsContextValue {
  projects: ApiProjectShape[] | null
  loading: boolean
  reload: () => Promise<void>
}

const ProjectsContext = createContext<ProjectsContextValue | null>(null)

export function ProjectsProvider({ children }: { children: ReactNode }) {
  const [projects, setProjects] = useState<ApiProjectShape[] | null>(null)
  const [loading, setLoading] = useState(true)

  const reload = useCallback(async () => {
    setLoading(true)
    const res = await apiProjectsClient.list()
    setProjects(res.data?.data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => {
    reload()
  }, [reload])

  return (
    <ProjectsContext.Provider value={{ projects, loading, reload }}>
      {children}
    </ProjectsContext.Provider>
  )
}

export function useProjects(): ProjectsContextValue {
  const ctx = useContext(ProjectsContext)
  if (!ctx) {
    throw new Error('useProjects must be used inside <ProjectsProvider>')
  }
  return ctx
}
