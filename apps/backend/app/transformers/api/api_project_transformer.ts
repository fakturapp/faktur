import type ApiProject from '#models/api/api_project'

interface ProjectShape {
  id: string
  name: string
  description: string | null
  color: string | null
  is_default: boolean
  is_archived: boolean
  keys_count?: number
  created_at: string
  updated_at: string | null
}

class ApiProjectTransformer {
  transform(project: ApiProject, keysCount?: number): ProjectShape {
    return {
      id: project.publicId,
      name: project.name,
      description: project.description,
      color: project.color,
      is_default: project.isDefault,
      is_archived: project.isArchived,
      keys_count: keysCount,
      created_at: project.createdAt.toISO()!,
      updated_at: project.updatedAt?.toISO() ?? null,
    }
  }

  transformMany(projects: ApiProject[], counts: Record<string, number> = {}): ProjectShape[] {
    return projects.map((p) => this.transform(p, counts[p.id] ?? 0))
  }
}

export default new ApiProjectTransformer()
