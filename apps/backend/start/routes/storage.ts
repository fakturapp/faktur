import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'
import { API_PREFIX } from '#start/routes/_prefix'

const StorageUsage = () => import('#controllers/storage/usage')
const StorageFiles = () => import('#controllers/storage/files')
const StorageDeleteFile = () => import('#controllers/storage/delete_file')

const storageGroup = router
  .group(() => {
    router.get('/storage/usage', [StorageUsage, 'handle']).as('storage_usage')
    router.get('/storage/files', [StorageFiles, 'handle']).as('storage_files')
    router.delete('/storage/files/:id', [StorageDeleteFile, 'handle']).as('storage_delete_file')
  })
  .use(middleware.auth())

if (API_PREFIX) storageGroup.prefix(API_PREFIX)
