import mail from '@adonisjs/mail/services/main'
import RecoveryKeyNotification from '#mails/recovery_key_notification'
import type RecoveryKeyGenerated from '#events/recovery_key_generated'

export default class SendRecoveryKeyEmail {
  async handle(event: RecoveryKeyGenerated) {
    await mail.sendLater(new RecoveryKeyNotification(event.email, event.recoveryKey, event.name))
  }
}
