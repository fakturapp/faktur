import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'
import { API_PREFIX } from '#start/routes/_prefix'

const CreditNoteList = () => import('#controllers/credit_note/crud/list')
const CreditNoteShow = () => import('#controllers/credit_note/crud/show')
const CreditNoteCreate = () => import('#controllers/credit_note/crud/create')
const CreditNoteUpdate = () => import('#controllers/credit_note/crud/update')
const CreditNoteDelete = () => import('#controllers/credit_note/crud/delete')
const CreditNoteNextNumber = () => import('#controllers/credit_note/number/next_number')
const CreditNoteConvertInvoice = () => import('#controllers/credit_note/operations/convert_invoice')
const CreditNoteUpdateStatus = () => import('#controllers/credit_note/operations/update_status')
const CreditNoteDuplicate = () => import('#controllers/credit_note/operations/duplicate')
const CreditNoteUpdateComment = () => import('#controllers/credit_note/operations/update_comment')
const CreditNoteDownloadPdf = () => import('#controllers/credit_note/operations/download_pdf')

router
  .group(() => {
    router.get('/next-number', [CreditNoteNextNumber, 'handle'])
    router.get('/', [CreditNoteList, 'handle'])
    router.get('/:id', [CreditNoteShow, 'handle'])
    router.post('/', [CreditNoteCreate, 'handle'])
    router.post('/convert-invoice/:id', [CreditNoteConvertInvoice, 'handle'])
    router.patch('/:id/status', [CreditNoteUpdateStatus, 'handle'])
    router.patch('/:id/comment', [CreditNoteUpdateComment, 'handle'])
    router.get('/:id/pdf', [CreditNoteDownloadPdf, 'handle'])
    router.post('/:id/duplicate', [CreditNoteDuplicate, 'handle'])
    router.put('/:id', [CreditNoteUpdate, 'handle'])
    router.delete('/:id', [CreditNoteDelete, 'handle'])
  })
  .prefix(API_PREFIX + '/credit-notes')
  .use(middleware.auth())
  .use(middleware.vault())
