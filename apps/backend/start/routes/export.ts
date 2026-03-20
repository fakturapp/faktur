import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'
import { API_PREFIX } from '#start/routes/_prefix'

const FecExport = () => import('#controllers/export/fec_export')

router
  .group(() => {
    router.get('/fec', [FecExport, 'handle'])
  })
  .prefix(API_PREFIX + '/export')
  .use(middleware.auth())
  .use(middleware.vault())
