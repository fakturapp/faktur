import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'
import { API_PREFIX } from '#start/routes/_prefix'

const ReminderSettingsGet = () => import('#controllers/reminder/settings/get')
const ReminderSettingsUpdate = () => import('#controllers/reminder/settings/update')
const SendReminder = () => import('#controllers/reminder/operations/send_reminder')
const ListReminders = () => import('#controllers/reminder/operations/list_reminders')

router
  .group(() => {
    router.get('/settings', [ReminderSettingsGet, 'handle'])
    router.put('/settings', [ReminderSettingsUpdate, 'handle'])

    router.post('/invoices/:id/send', [SendReminder, 'handle'])
    router.get('/invoices/:id', [ListReminders, 'handle'])
  })
  .prefix(API_PREFIX + '/reminders')
  .use(middleware.auth())
  .use(middleware.vault())
