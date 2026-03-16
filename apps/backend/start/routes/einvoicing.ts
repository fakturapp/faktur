import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'
import { API_PREFIX } from '#start/routes/_prefix'

const EInvoicingSubmit = () => import('#controllers/einvoicing/submit')
const ValidateConnection = () => import('#controllers/einvoicing/validate_connection')

router
  .group(() => {
    router.post('/submit/:id', [EInvoicingSubmit, 'handle'])
    router.get('/validate-connection', [ValidateConnection, 'handle'])
  })
  .prefix(API_PREFIX + '/einvoicing')
  .use(middleware.auth())
