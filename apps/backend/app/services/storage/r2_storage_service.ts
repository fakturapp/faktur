import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3'
import env from '#start/env'
import app from '@adonisjs/core/services/app'
import { existsSync, mkdirSync, writeFileSync, unlinkSync } from 'node:fs'
import { join } from 'node:path'

class R2StorageService {
  private client: S3Client | null = null
  private bucket: string | null = null
  private publicUrl: string | null = null

  private isConfigured(): boolean {
    const accountId = env.get('R2_ACCOUNT_ID')
    const accessKeyId = env.get('R2_ACCESS_KEY_ID')
    const secretAccessKey = env.get('R2_SECRET_ACCESS_KEY')
    const bucketName = env.get('R2_BUCKET_NAME')
    const publicUrl = env.get('R2_PUBLIC_URL')

    if (!accountId || !accessKeyId || !secretAccessKey || !bucketName || !publicUrl) {
      return false
    }

    if (!this.client) {
      this.client = new S3Client({
        region: 'auto',
        endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
      })
      this.bucket = bucketName
      this.publicUrl = publicUrl.replace(/\/$/, '')
    }

    return true
  }

  async upload(
    folder: string,
    fileName: string,
    buffer: Buffer,
    contentType: string
  ): Promise<string> {
    const key = `${folder}/${fileName}`

    if (this.isConfigured()) {
      await this.client!.send(
        new PutObjectCommand({
          Bucket: this.bucket!,
          Key: key,
          Body: buffer,
          ContentType: contentType,
        })
      )
      return `${this.publicUrl}/${key}`
    }

    // Fallback: local filesystem
    const uploadsDir = join(app.tmpPath(), 'uploads', folder)
    if (!existsSync(uploadsDir)) {
      mkdirSync(uploadsDir, { recursive: true })
    }
    writeFileSync(join(uploadsDir, fileName), buffer)
    return `/${folder}/${fileName}`
  }

  async delete(urlOrKey: string): Promise<void> {
    // Extract key from full URL or relative path
    let key: string
    if (urlOrKey.startsWith('http://') || urlOrKey.startsWith('https://')) {
      const url = new URL(urlOrKey)
      key = url.pathname.replace(/^\//, '')
    } else {
      key = urlOrKey.replace(/^\//, '')
    }

    if (this.isConfigured()) {
      await this.client!.send(
        new DeleteObjectCommand({
          Bucket: this.bucket!,
          Key: key,
        })
      )
      return
    }

    // Fallback: local filesystem
    const filePath = join(app.tmpPath(), 'uploads', key)
    if (existsSync(filePath)) {
      unlinkSync(filePath)
    }
  }

  async listObjects(
    prefix: string
  ): Promise<{ key: string; size: number; contentType?: string }[]> {
    if (!this.isConfigured()) {
      return []
    }

    const objects: { key: string; size: number; contentType?: string }[] = []
    let continuationToken: string | undefined

    do {
      const result = await this.client!.send(
        new ListObjectsV2Command({
          Bucket: this.bucket!,
          Prefix: prefix,
          ContinuationToken: continuationToken,
        })
      )

      for (const item of result.Contents ?? []) {
        if (!item.Key) continue
        objects.push({ key: item.Key, size: Number(item.Size ?? 0) })
      }

      continuationToken = result.IsTruncated ? result.NextContinuationToken : undefined
    } while (continuationToken)

    return objects
  }

  getPublicUrl(key: string): string {
    if (this.isConfigured()) {
      return `${this.publicUrl}/${key}`
    }
    return `/${key}`
  }
}

export default new R2StorageService()
