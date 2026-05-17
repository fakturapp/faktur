import router from '@adonisjs/core/services/router'
import { API_V2_PREFIX } from '#start/routes/api_v2/_pipeline'

const NotFound = () => import('#controllers/api_v2/not_found')

router.any(`${API_V2_PREFIX}/*`, [NotFound, 'handle']).as('apiV2.notFound')
