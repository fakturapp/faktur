import router from '@adonisjs/core/services/router'

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

router.get('/', async () => {
  return {
    name: 'Faktur API',
    version: '1.0.0',
    status: 'healthy',
  }
})

router.get('/health', async () => {
  return { status: 'ok' }
})
