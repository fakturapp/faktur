import router from '@adonisjs/core/services/router'
import { API_V2_PREFIX, apiV2Stack } from '#start/routes/api_v2/_pipeline'

const TeamShow = () => import('#controllers/api_v2/team/show')

router
  .group(() => {
    router
      .get('/', [TeamShow, 'handle'])
      .as('apiV2.team.show')
      .use(apiV2Stack(['team:read']))
  })
  .prefix(API_V2_PREFIX + '/team')
