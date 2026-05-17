import router from '@adonisjs/core/services/router'
import { API_V2_PREFIX, apiV2Stack } from '#start/routes/api_v2/_pipeline'

const CreditNotesList = () => import('#controllers/api_v2/credit_notes/list')
const CreditNotesShow = () => import('#controllers/api_v2/credit_notes/show')

router
  .group(() => {
    router
      .get('/', [CreditNotesList, 'handle'])
      .as('apiV2.creditNotes.list')
      .use(apiV2Stack(['credit_notes:read']))
    router
      .get('/:id', [CreditNotesShow, 'handle'])
      .as('apiV2.creditNotes.show')
      .use(apiV2Stack(['credit_notes:read']))
  })
  .prefix(API_V2_PREFIX + '/credit-notes')
