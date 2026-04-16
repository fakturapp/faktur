import app from '@adonisjs/core/services/app'
import type { HttpContext } from '@adonisjs/core/http'
import { basename, join, resolve, sep } from 'node:path'
import { existsSync } from 'node:fs'
import { ApiError } from '#exceptions/api_error'

const FILENAME_REGEX = /^[a-zA-Z0-9][a-zA-Z0-9._-]{0,254}$/

const DEFAULT_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg']

export interface SafeServeOptions {
  uploadsSubdir: string
  filename: string
  allowedExtensions?: string[]
}

export async function safeServeFile(ctx: HttpContext, options: SafeServeOptions) {
  const { response } = ctx
  const safeName = basename(options.filename ?? '')

  if (!safeName || !FILENAME_REGEX.test(safeName)) {
    throw new ApiError('invalid_filename')
  }

  const allowed = options.allowedExtensions ?? DEFAULT_EXTENSIONS
  const dotIndex = safeName.lastIndexOf('.')
  const ext = dotIndex === -1 ? '' : safeName.slice(dotIndex + 1).toLowerCase()

  if (!allowed.includes(ext)) {
    throw new ApiError('invalid_filename')
  }

  const baseDir = resolve(join(app.tmpPath(), 'uploads', options.uploadsSubdir))
  const filePath = resolve(join(baseDir, safeName))

  if (!(filePath === baseDir || filePath.startsWith(baseDir + sep))) {
    throw new ApiError('invalid_filename')
  }

  if (!existsSync(filePath)) {
    throw new ApiError('resource_not_found', { message: 'File not found' })
  }

  return response.download(filePath)
}
