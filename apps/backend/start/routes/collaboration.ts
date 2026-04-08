import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'
import { API_PREFIX } from '#start/routes/_prefix'
import { collaborationShareLimiter, shareLinkValidationLimiter } from '#start/limiter'

const ShareList = () => import('#controllers/collaboration/shares/list')
const ShareCreate = () => import('#controllers/collaboration/shares/create')
const ShareUpdate = () => import('#controllers/collaboration/shares/update')
const ShareRevoke = () => import('#controllers/collaboration/shares/revoke')

const LinkCreate = () => import('#controllers/collaboration/links/create')
const LinkList = () => import('#controllers/collaboration/links/list')
const LinkUpdate = () => import('#controllers/collaboration/links/update')
const LinkDestroy = () => import('#controllers/collaboration/links/destroy')

const ValidateLink = () => import('#controllers/collaboration/access/validate_link')
const CheckAccess = () => import('#controllers/collaboration/access/check_access')
const ActiveEditors = () => import('#controllers/collaboration/access/active_editors')


const collabGroup = router
  .group(() => {
    router.get('/shares/:documentType/:documentId', [ShareList, 'handle'])
    router.post('/shares', [ShareCreate, 'handle']).use(collaborationShareLimiter)
    router.patch('/shares/:shareId', [ShareUpdate, 'handle'])
    router.delete('/shares/:shareId', [ShareRevoke, 'handle'])

    router.get('/share-links/:documentType/:documentId', [LinkList, 'handle'])
    router.post('/share-links', [LinkCreate, 'handle']).use(collaborationShareLimiter)
    router.patch('/share-links/:linkId', [LinkUpdate, 'handle'])
    router.delete('/share-links/:linkId', [LinkDestroy, 'handle'])

    router.get('/access/:documentType/:documentId', [CheckAccess, 'handle'])

    router.get('/active-editors/:documentType', [ActiveEditors, 'handle'])
  })
  .prefix('/collaboration')
  .use(middleware.auth())
if (API_PREFIX) collabGroup.prefix(API_PREFIX)


const validateGroup = router
  .group(() => {
    router.get('/share/validate/:token', [ValidateLink, 'handle']).use(shareLinkValidationLimiter)
  })
  .use(middleware.auth())
if (API_PREFIX) validateGroup.prefix(API_PREFIX)
