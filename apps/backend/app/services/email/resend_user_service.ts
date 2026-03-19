import { Resend } from 'resend'
import EncryptionService from '#services/encryption/encryption_service'

class ResendUserService {
  /**
   * Validate a Resend API key by attempting to list domains.
   * Returns true if the key is valid.
   */
  async validateApiKey(apiKey: string): Promise<boolean> {
    try {
      const resend = new Resend(apiKey)
      const { error } = await resend.domains.list()
      return !error
    } catch {
      return false
    }
  }

  /**
   * Send an email using a user-provided Resend API key.
   */
  async sendEmail(params: {
    encryptedApiKey: string
    from: string
    fromName?: string | null
    to: string
    subject: string
    body: string
    attachments?: { filename: string; content: Buffer; mimeType: string }[]
  }): Promise<void> {
    const apiKey = EncryptionService.decrypt(params.encryptedApiKey)
    const resend = new Resend(apiKey)

    const fromHeader = params.fromName
      ? `${params.fromName} <${params.from}>`
      : params.from

    const resendAttachments = params.attachments?.map((att) => ({
      filename: att.filename,
      content: att.content,
      content_type: att.mimeType,
    }))

    const { error } = await resend.emails.send({
      from: fromHeader,
      to: params.to,
      subject: params.subject,
      html: params.body,
      attachments: resendAttachments,
    })

    if (error) {
      throw new Error(error.message)
    }
  }
}

export default new ResendUserService()
