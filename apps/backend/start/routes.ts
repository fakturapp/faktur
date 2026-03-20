import router from '@adonisjs/core/services/router'
import { API_PREFIX } from '#start/routes/_prefix'

import '#start/routes/auth'
import '#start/routes/account'
import '#start/routes/onboarding'
import '#start/routes/dashboard'
import '#start/routes/team'
import '#start/routes/company'
import '#start/routes/client'
import '#start/routes/settings'
import '#start/routes/quote'
import '#start/routes/invoice'
import '#start/routes/einvoicing'
import '#start/routes/email'
import '#start/routes/product'
import '#start/routes/credit_note'
import '#start/routes/recurring_invoice'
import '#start/routes/reminder'
import '#start/routes/expense'
import '#start/routes/tax'
import '#start/routes/export'

router.get(API_PREFIX + '/', async () => {
  return {
    name: 'Faktur API',
    version: '1.0.0',
    status: 'healthy',
  }
})

router.get(API_PREFIX + '/health', async () => {
  return { status: 'ok' }
})
