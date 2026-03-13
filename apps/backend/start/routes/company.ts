import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'

const CompanyShow = () => import('#controllers/company/show')
const CompanyUpdate = () => import('#controllers/company/update')
const CompanyBank = () => import('#controllers/company/bank')

router
  .group(() => {
    router.get('/', [CompanyShow, 'handle'])
    router.put('/', [CompanyUpdate, 'handle'])
    router.put('/bank', [CompanyBank, 'handle'])
  })
  .prefix('/company')
  .use(middleware.auth())
