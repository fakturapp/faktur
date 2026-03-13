import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'

const CompanyShow = () => import('#controllers/company/show')
const CompanyUpdate = () => import('#controllers/company/update')
const CompanyBank = () => import('#controllers/company/bank')
const UploadLogo = () => import('#controllers/company/upload_logo')
const ServeLogo = () => import('#controllers/company/serve_logo')

// Public route - serve company logos
router.get('/company-logos/:filename', [ServeLogo, 'handle'])

router
  .group(() => {
    router.get('/', [CompanyShow, 'handle'])
    router.put('/', [CompanyUpdate, 'handle'])
    router.put('/bank', [CompanyBank, 'handle'])
    router.post('/logo', [UploadLogo, 'handle'])
  })
  .prefix('/company')
  .use(middleware.auth())
