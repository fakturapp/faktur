import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'
import { API_PREFIX } from '#start/routes/_prefix'

const Authorize = () => import('#controllers/oauth/authorize')
const Token = () => import('#controllers/oauth/token')
const Revoke = () => import('#controllers/oauth/revoke')

router
  .group(() => {
    // GET /api/v1/oauth/authorize — consent screen metadata.
    // Requires the user to be signed into the dashboard (otherwise the
    // front-end bounces them to /login first and comes back here).
    router.get('/authorize', [Authorize, 'show']).use(middleware.auth())
    router.post('/authorize/consent', [Authorize, 'consent']).use(middleware.auth())

    // POST /api/v1/oauth/token — public, authenticated via client_id +
    // client_secret in the body.
    router.post('/token', [Token, 'handle'])

    // POST /api/v1/oauth/revoke — RFC 7009.
    router.post('/revoke', [Revoke, 'handle'])
  })
  .prefix(API_PREFIX + '/oauth')
