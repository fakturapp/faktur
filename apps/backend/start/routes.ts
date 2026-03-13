import router from '@adonisjs/core/services/router'

import '#start/routes/auth'
import '#start/routes/account'
import '#start/routes/onboarding'
import '#start/routes/dashboard'
import '#start/routes/team'
import '#start/routes/company'
import '#start/routes/client'

router.get('/', async () => {
  return {
    name: 'ZenVoice API',
    version: '1.0.0',
    status: 'healthy',
  }
})

router.get('/health', async () => {
  return { status: 'ok' }
})
