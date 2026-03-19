import { google } from 'googleapis'
import env from '#start/env'
import EncryptionService from '#services/encryption/encryption_service'

const AUTH_SCOPES = [
  'openid',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
]

const PROFILE_TTL_MS = 5 * 60 * 1000 // 5 minutes

function getOAuth2Client() {
  return new google.auth.OAuth2(
    env.get('GOOGLE_CLIENT_ID'),
    env.get('GOOGLE_CLIENT_SECRET'),
    env.get('GOOGLE_AUTH_REDIRECT_URI')
  )
}

export interface GoogleProfile {
  sub: string
  email: string
  name: string | null
  picture: string | null
}

class GoogleAuthService {
  getAuthUrl(state: string): string {
    const client = getOAuth2Client()
    return client.generateAuthUrl({
      access_type: 'online',
      prompt: 'select_account',
      scope: AUTH_SCOPES,
      state,
    })
  }

  async exchangeCodeForProfile(code: string): Promise<GoogleProfile> {
    const client = getOAuth2Client()
    const { tokens } = await client.getToken(code)

    if (!tokens.access_token) {
      throw new Error('Failed to obtain access token from Google')
    }

    client.setCredentials(tokens)

    const oauth2 = google.oauth2({ version: 'v2', auth: client })
    const { data: userInfo } = await oauth2.userinfo.get()

    if (!userInfo.id || !userInfo.email) {
      throw new Error('Missing required user info from Google')
    }

    return {
      sub: userInfo.id,
      email: userInfo.email,
      name: userInfo.name || null,
      picture: userInfo.picture || null,
    }
  }

  encryptProfileData(profile: GoogleProfile): string {
    const payload = JSON.stringify({
      ...profile,
      ts: Date.now(),
    })
    return EncryptionService.encrypt(payload)
  }

  decryptProfileData(encrypted: string): GoogleProfile {
    const raw = EncryptionService.decrypt(encrypted)
    const data = JSON.parse(raw)

    const age = Date.now() - data.ts
    if (age > PROFILE_TTL_MS) {
      throw new Error('Google profile data has expired')
    }

    return {
      sub: data.sub,
      email: data.email,
      name: data.name,
      picture: data.picture,
    }
  }
}

export default new GoogleAuthService()
