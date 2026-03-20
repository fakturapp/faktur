import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'
import { API_PREFIX } from '#start/routes/_prefix'

const VatReport = () => import('#controllers/tax/vat_report')

router
  .group(() => {
    router.get('/vat-report', [VatReport, 'handle'])
  })
  .prefix(API_PREFIX + '/tax')
  .use(middleware.auth())
  .use(middleware.vault())
