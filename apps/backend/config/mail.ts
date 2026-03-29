import env from '#start/env'
import { defineConfig, transports } from '@adonisjs/mail'

const mailConfig = defineConfig({
  default: 'resend',

  from: {
    address: env.get('MAIL_FROM_ADDRESS', 'noreply@authguard.net'),
    name: env.get('MAIL_FROM_NAME', 'Faktur'),
  },

  mailers: {
    resend: transports.resend({
      key: env.get('RESEND_API_KEY', ''),
      baseUrl: 'https://api.resend.com',
    }),

    smtp: transports.smtp({
      host: env.get('SMTP_HOST', 'localhost'),
      port: Number(env.get('SMTP_PORT', '587')),
    }),
  },
})

export default mailConfig

declare module '@adonisjs/mail/types' {
  export interface MailersList extends InferMailers<typeof mailConfig> {}
}
