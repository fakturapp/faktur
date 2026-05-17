import router from '@adonisjs/core/services/router'
import { API_V2_PREFIX, apiV2Stack } from '#start/routes/api_v2/_pipeline'

const BankAccountsList = () => import('#controllers/api_v2/bank_accounts/list')
const BankAccountsShow = () => import('#controllers/api_v2/bank_accounts/show')

router
  .group(() => {
    router
      .get('/', [BankAccountsList, 'handle'])
      .as('apiV2.bankAccounts.list')
      .use(apiV2Stack(['bank_accounts:read']))
    router
      .get('/:id', [BankAccountsShow, 'handle'])
      .as('apiV2.bankAccounts.show')
      .use(apiV2Stack(['bank_accounts:read']))
  })
  .prefix(API_V2_PREFIX + '/bank-accounts')
