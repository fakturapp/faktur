import nodemailer from 'nodemailer'
import EncryptionService from '#services/encryption/encryption_service'

class SmtpService {
  /**
   * Validate SMTP credentials by attempting a connection.
   */
  async validateConnection(params: {
    host: string
    port: number
    username: string
    password: string
    secure?: boolean
  }): Promise<boolean> {
    try {
      const transporter = nodemailer.createTransport({
        host: params.host,
        port: params.port,
        secure: params.secure ?? params.port === 465,
        auth: { user: params.username, pass: params.password },
        connectionTimeout: 10_000,
      })
      await transporter.verify()
      return true
    } catch {
      return false
    }
  }

  /**
   * Send an email via SMTP using stored (encrypted) credentials.
   */
  async sendEmail(params: {
    host: string
    port: number
    encryptedUsername: string
    encryptedPassword: string
    from: string
    fromName?: string | null
    to: string
    subject: string
    body: string
    attachments?: { filename: string; content: Buffer; mimeType: string }[]
  }): Promise<void> {
    const username = EncryptionService.decrypt(params.encryptedUsername)
    const password = EncryptionService.decrypt(params.encryptedPassword)

    const transporter = nodemailer.createTransport({
      host: params.host,
      port: params.port,
      secure: params.port === 465,
      auth: { user: username, pass: password },
      connectionTimeout: 15_000,
    })

    const fromHeader = params.fromName
      ? `${params.fromName} <${params.from}>`
      : params.from

    const mailAttachments = params.attachments?.map((att) => ({
      filename: att.filename,
      content: att.content,
      contentType: att.mimeType,
    }))

    await transporter.sendMail({
      from: fromHeader,
      to: params.to,
      subject: params.subject,
      html: params.body,
      attachments: mailAttachments,
    })
  }
}

export default new SmtpService()
