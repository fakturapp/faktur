import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'

const EInvoicingSubmit = () => import('#controllers/einvoicing/submit')
const ValidateConnection = () => import('#controllers/einvoicing/validate_connection')

router
  .group(() => {
    router.post('/submit/:id', [EInvoicingSubmit, 'handle'])
    router.get('/validate-connection', [ValidateConnection, 'handle'])
  })
  .prefix('/einvoicing')
  .use(middleware.auth())
