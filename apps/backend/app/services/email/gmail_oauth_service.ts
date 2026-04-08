import { google } from 'googleapis'
import env from '#start/env'
import EncryptionService from '#services/encryption/encryption_service'

const SCOPES = [
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
]

function getOAuth2Client() {
  return new google.auth.OAuth2(
    env.get('GOOGLE_CLIENT_ID'),
    env.get('GOOGLE_CLIENT_SECRET'),
    env.get('GOOGLE_REDIRECT_URI')
  )
}

export default class GmailOAuthService {
  static getAuthUrl(state: string): string {
    const client = getOAuth2Client()
    return client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: SCOPES,
      state,
    })
  }

  static async exchangeCode(code: string): Promise<{
    accessToken: string
    refreshToken: string
    expiresAt: Date
    email: string
    displayName: string | null
  }> {
    const client = getOAuth2Client()
    const { tokens } = await client.getToken(code)

    if (!tokens.access_token || !tokens.refresh_token) {
      throw new Error('Failed to obtain tokens from Google')
    }

    client.setCredentials(tokens)

    const oauth2 = google.oauth2({ version: 'v2', auth: client })
    const { data: userInfo } = await oauth2.userinfo.get()

    const expiresAt = tokens.expiry_date
      ? new Date(tokens.expiry_date)
      : new Date(Date.now() + 3600 * 1000)

    return {
      accessToken: EncryptionService.encrypt(tokens.access_token),
      refreshToken: EncryptionService.encrypt(tokens.refresh_token),
      expiresAt,
      email: userInfo.email!,
      displayName: userInfo.name || null,
    }
  }

  static async refreshAccessToken(encryptedRefreshToken: string): Promise<{
    accessToken: string
    expiresAt: Date
  }> {
    const refreshToken = EncryptionService.decrypt(encryptedRefreshToken)
    const client = getOAuth2Client()
    client.setCredentials({ refresh_token: refreshToken })

    const { credentials } = await client.refreshAccessToken()

    if (!credentials.access_token) {
      throw new Error('Failed to refresh access token')
    }

    const expiresAt = credentials.expiry_date
      ? new Date(credentials.expiry_date)
      : new Date(Date.now() + 3600 * 1000)

    return {
      accessToken: EncryptionService.encrypt(credentials.access_token),
      expiresAt,
    }
  }

  static async getValidAccessToken(account: {
    accessToken: string | null
    refreshToken: string | null
    tokenExpiresAt: { toJSDate(): Date } | null
  }): Promise<string> {
    if (!account.accessToken || !account.refreshToken) {
      throw new Error('No tokens available')
    }

    const now = new Date()
    const expiresAt = account.tokenExpiresAt?.toJSDate()

    if (expiresAt && expiresAt.getTime() - now.getTime() < 5 * 60 * 1000) {
      const refreshed = await this.refreshAccessToken(account.refreshToken)
      return EncryptionService.decrypt(refreshed.accessToken)
    }

    return EncryptionService.decrypt(account.accessToken)
  }

  static async sendEmail(params: {
    accessToken: string
    from: string
    fromName?: string | null
    to: string
    subject: string
    body: string
    attachments?: { filename: string; content: Buffer; mimeType: string }[]
  }): Promise<void> {
    const client = getOAuth2Client()
    client.setCredentials({ access_token: params.accessToken })

    const gmail = google.gmail({ version: 'v1', auth: client })

    const boundary = 'boundary_' + Date.now().toString(36)
    const fromHeader = params.fromName ? `${params.fromName} <${params.from}>` : params.from

    let rawMessage = [
      `From: ${fromHeader}`,
      `To: ${params.to}`,
      `Subject: =?UTF-8?B?${Buffer.from(params.subject).toString('base64')}?=`,
      `MIME-Version: 1.0`,
    ]

    if (params.attachments && params.attachments.length > 0) {
      rawMessage.push(`Content-Type: multipart/mixed; boundary="${boundary}"`)
      rawMessage.push('')
      rawMessage.push(`--${boundary}`)
      rawMessage.push('Content-Type: text/html; charset="UTF-8"')
      rawMessage.push('')
      rawMessage.push(params.body.replace(/\n/g, '<br>'))

      for (const att of params.attachments) {
        rawMessage.push(`--${boundary}`)
        rawMessage.push(`Content-Type: ${att.mimeType}; name="${att.filename}"`)
        rawMessage.push('Content-Transfer-Encoding: base64')
        rawMessage.push(`Content-Disposition: attachment; filename="${att.filename}"`)
        rawMessage.push('')
        rawMessage.push(att.content.toString('base64'))
      }

      rawMessage.push(`--${boundary}--`)
    } else {
      rawMessage.push('Content-Type: text/html; charset="UTF-8"')
      rawMessage.push('')
      rawMessage.push(params.body.replace(/\n/g, '<br>'))
    }

    const encodedMessage = Buffer.from(rawMessage.join('\r\n'))
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '')

    await gmail.users.messages.send({
      userId: 'me',
      requestBody: { raw: encodedMessage },
    })
  }
}
