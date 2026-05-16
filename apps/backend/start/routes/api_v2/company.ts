import router from '@adonisjs/core/services/router'
import { API_V2_PREFIX, apiV2Stack } from '#start/routes/api_v2/_pipeline'

const CompanyShow = () => import('#controllers/api_v2/company/show')

router
  .group(() => {
    router.get('/', [CompanyShow, 'handle']).use(apiV2Stack(['company:read']))
  })
  .prefix(API_V2_PREFIX + '/company')
