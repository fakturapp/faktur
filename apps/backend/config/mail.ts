import env from '#start/env'
import { defineConfig, transports } from '@adonisjs/mail'

const mailConfig = defineConfig({
  default: 'resend',

  from: {
    address: 'noreply@authguard.net',
    name: 'Faktur',
  },

  mailers: {
    resend: transports.resend({
      key: env.get('RESEND_API_KEY', ''),
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
