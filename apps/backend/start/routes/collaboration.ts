import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'
import { API_PREFIX } from '#start/routes/_prefix'
import { collaborationShareLimiter, shareLinkValidationLimiter } from '#start/limiter'

// Share controllers
const ShareList = () => import('#controllers/collaboration/shares/list')
const ShareCreate = () => import('#controllers/collaboration/shares/create')
const ShareUpdate = () => import('#controllers/collaboration/shares/update')
const ShareRevoke = () => import('#controllers/collaboration/shares/revoke')

// Share link controllers
const LinkCreate = () => import('#controllers/collaboration/links/create')
const LinkList = () => import('#controllers/collaboration/links/list')
const LinkUpdate = () => import('#controllers/collaboration/links/update')
const LinkDestroy = () => import('#controllers/collaboration/links/destroy')

// Access controllers
const ValidateLink = () => import('#controllers/collaboration/access/validate_link')
const CheckAccess = () => import('#controllers/collaboration/access/check_access')

// ── Authenticated routes (require team context) ──────────────────────────

router
  .group(() => {
    // Document shares (invite by email)
    router.get('/shares/:documentType/:documentId', [ShareList, 'handle'])
    router.post('/shares', [ShareCreate, 'handle']).use(collaborationShareLimiter)
    router.patch('/shares/:shareId', [ShareUpdate, 'handle'])
    router.delete('/shares/:shareId', [ShareRevoke, 'handle'])

    // Share links
    router.get('/share-links/:documentType/:documentId', [LinkList, 'handle'])
    router.post('/share-links', [LinkCreate, 'handle']).use(collaborationShareLimiter)
    router.patch('/share-links/:linkId', [LinkUpdate, 'handle'])
    router.delete('/share-links/:linkId', [LinkDestroy, 'handle'])

    // Access check
    router.get('/access/:documentType/:documentId', [CheckAccess, 'handle'])
  })
  .prefix(API_PREFIX + '/collaboration')
  .use(middleware.auth())

// ── Share link validation (auth only, no vault needed) ───────────────────

router
  .group(() => {
    router.get('/share/validate/:token', [ValidateLink, 'handle']).use(shareLinkValidationLimiter)
  })
  .prefix(API_PREFIX)
  .use(middleware.auth())
