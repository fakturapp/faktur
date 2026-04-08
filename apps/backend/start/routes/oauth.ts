import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'
import { API_PREFIX } from '#start/routes/_prefix'

const Authorize = () => import('#controllers/oauth/authorize')
const Token = () => import('#controllers/oauth/token')
const Revoke = () => import('#controllers/oauth/revoke')
const ExchangeSession = () => import('#controllers/oauth/exchange_session')

router
  .group(() => {
    router.get('/authorize', [Authorize, 'show']).use(middleware.auth())
    router.post('/authorize/consent', [Authorize, 'consent']).use(middleware.auth())

    router.post('/token', [Token, 'handle'])

    router.post('/revoke', [Revoke, 'handle'])

    router.post('/exchange-session', [ExchangeSession, 'handle'])
  })
  .prefix(API_PREFIX + '/oauth')
