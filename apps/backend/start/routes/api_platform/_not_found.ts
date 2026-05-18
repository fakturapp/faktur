import router from '@adonisjs/core/services/router'
import { API_PLATFORM_PREFIX } from '#start/routes/api_platform/_pipeline'

const NotFound = () => import('#controllers/api_platform/not_found')

router.any(`${API_PLATFORM_PREFIX}/*`, [NotFound, 'handle']).as('apiPlatform.notFound')
