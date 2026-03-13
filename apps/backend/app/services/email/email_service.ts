import { Resend } from 'resend'
import env from '#start/env'

const resend = new Resend(env.get('RESEND_API_KEY'))

interface EmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

class EmailService {
  private frontendUrl = env.get('FRONTEND_URL') || 'http://localhost:3000'
  private fromEmail = 'noreply@zenvoice.app'
  private fromName = 'ZenVoice'

  private get baseStyle() {
    return `
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background-color: #09090b;
      color: #fafafa;
      margin: 0;
      padding: 0;
      width: 100%;
      -webkit-font-smoothing: antialiased;
    `
  }

  private wrapHtml(content: string, title: string) {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { ${this.baseStyle} }
    .container {
      max-width: 480px;
      margin: 40px auto;
      background: #18181b;
      border: 1px solid #27272a;
      border-radius: 16px;
      overflow: hidden;
    }
    .header {
      padding: 32px;
      text-align: center;
      border-bottom: 1px solid #27272a;
    }
    .logo {
      font-size: 24px;
      font-weight: 700;
      color: #fff;
      text-decoration: none;
      letter-spacing: -0.5px;
    }
    .content { padding: 32px; }
    .h1 {
      margin: 0 0 16px;
      font-size: 20px;
      font-weight: 600;
      color: #fff;
    }
    .text {
      margin: 0 0 24px;
      font-size: 15px;
      line-height: 1.6;
      color: #a1a1aa;
    }
    .button {
      display: block;
      width: 100%;
      padding: 12px;
      background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
      color: #fff;
      text-align: center;
      text-decoration: none;
      font-weight: 500;
      font-size: 15px;
      border-radius: 8px;
      box-sizing: border-box;
    }
    .footer {
      padding: 24px;
      background: #09090b;
      border-top: 1px solid #27272a;
      text-align: center;
    }
    .footer-text {
      margin: 0;
      font-size: 12px;
      color: #52525b;
    }
    .link { color: #6366f1; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <a href="${this.frontendUrl}" class="logo">${this.fromName}</a>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <p class="footer-text">
        &copy; ${new Date().getFullYear()} ${this.fromName}. All rights reserved.<br>
        If you didn't request this email, you can safely ignore it.
      </p>
    </div>
  </div>
</body>
</html>`
  }

  async send(options: EmailOptions): Promise<void> {
    if (!env.get('RESEND_API_KEY')) {
      console.log(`[Email] Would send to ${options.to}: ${options.subject}`)
      return
    }

    const { error } = await resend.emails.send({
      from: `${this.fromName} <${this.fromEmail}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    })

    if (error) {
      console.error('[Email] Send failed:', error)
      throw new Error(`Failed to send email: ${error.message}`)
    }
  }

  async sendVerificationEmail(email: string, token: string, name?: string): Promise<void> {
    const verifyUrl = `${this.frontendUrl}/verify-email?token=${token}`

    const content = `
      <h1 class="h1">Verify your email address</h1>
      <p class="text">
        Hi${name ? ` ${name}` : ''},<br><br>
        Thanks for joining ZenVoice. To complete your account setup, please verify your email address.
      </p>
      <a href="${verifyUrl}" class="button">Verify Email Address</a>
      <p class="text" style="margin-top: 24px; font-size: 13px;">
        This link is valid for <strong>10 minutes</strong> and can only be used once.
      </p>
      <p class="text" style="margin-bottom: 0; font-size: 13px;">
        Or paste this link in your browser:<br>
        <a href="${verifyUrl}" class="link" style="word-break: break-all;">${verifyUrl}</a>
      </p>
    `

    await this.send({
      to: email,
      subject: 'Verify your email address - ZenVoice',
      html: this.wrapHtml(content, 'Verify Email'),
      text: `Verify your email: ${verifyUrl}`,
    })
  }

  async sendPasswordResetEmail(email: string, token: string, name?: string): Promise<void> {
    const resetUrl = `${this.frontendUrl}/reset-password?token=${token}`

    const content = `
      <h1 class="h1">Reset your password</h1>
      <p class="text">
        Hi${name ? ` ${name}` : ''},<br><br>
        We received a request to reset your password. Click the button below to choose a new password.
      </p>
      <a href="${resetUrl}" class="button">Reset Password</a>
      <p class="text" style="margin-top: 24px; font-size: 13px;">
        This link is valid for <strong>10 minutes</strong>. If you didn't request a password reset, you can safely ignore this email.
      </p>
      <p class="text" style="margin-bottom: 0; font-size: 13px;">
        Or paste this link in your browser:<br>
        <a href="${resetUrl}" class="link" style="word-break: break-all;">${resetUrl}</a>
      </p>
    `

    await this.send({
      to: email,
      subject: 'Reset your password - ZenVoice',
      html: this.wrapHtml(content, 'Reset Password'),
      text: `Reset your password: ${resetUrl}`,
    })
  }

  async sendTwoFactorEnabledEmail(email: string, name?: string): Promise<void> {
    const content = `
      <h1 class="h1">Two-Factor Authentication Enabled</h1>
      <p class="text">
        Hi${name ? ` ${name}` : ''},<br><br>
        Two-factor authentication (2FA) has been enabled on your account.
      </p>
      <div style="background: rgba(22, 163, 74, 0.1); border: 1px solid rgba(22, 163, 74, 0.2); border-radius: 8px; padding: 16px; margin-bottom: 24px;">
        <p style="margin: 0; color: #4ade80; font-size: 14px;">
          Your account is now more secure. You will be asked for a verification code when signing in.
        </p>
      </div>
      <p class="text" style="margin-bottom: 0;">
        If you didn't make this change, please contact support immediately.
      </p>
    `

    await this.send({
      to: email,
      subject: '2FA Enabled - ZenVoice',
      html: this.wrapHtml(content, '2FA Enabled'),
      text: '2FA has been enabled on your account.',
    })
  }
}

export default new EmailService()
