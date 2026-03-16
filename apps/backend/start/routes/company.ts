import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'
import { API_PREFIX } from '#start/routes/_prefix'

const CompanyShow = () => import('#controllers/company/core/show')
const CompanyUpdate = () => import('#controllers/company/core/update')
const CompanyBank = () => import('#controllers/company/finance/bank')
const UploadLogo = () => import('#controllers/company/media/upload_logo')
const ServeLogo = () => import('#controllers/company/media/serve_logo')

// Public route - serve company logos
router.get(API_PREFIX + '/company-logos/:filename', [ServeLogo, 'handle'])

router
  .group(() => {
    router.get('/', [CompanyShow, 'handle'])
    router.put('/', [CompanyUpdate, 'handle'])
    router.put('/bank', [CompanyBank, 'handle'])
    router.post('/logo', [UploadLogo, 'handle'])
  })
  .prefix(API_PREFIX + '/company')
  .use(middleware.auth())
