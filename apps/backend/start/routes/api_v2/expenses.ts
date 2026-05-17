import router from '@adonisjs/core/services/router'
import { API_V2_PREFIX, apiV2Stack } from '#start/routes/api_v2/_pipeline'

const ExpensesList = () => import('#controllers/api_v2/expenses/list')
const ExpensesShow = () => import('#controllers/api_v2/expenses/show')
const ExpensesCreate = () => import('#controllers/api_v2/expenses/create')
const ExpensesDestroy = () => import('#controllers/api_v2/expenses/destroy')

router
  .group(() => {
    router
      .get('/', [ExpensesList, 'handle'])
      .as('apiV2.expenses.list')
      .use(apiV2Stack(['expenses:read']))
    router
      .get('/:id', [ExpensesShow, 'handle'])
      .as('apiV2.expenses.show')
      .use(apiV2Stack(['expenses:read']))
    router
      .post('/', [ExpensesCreate, 'handle'])
      .as('apiV2.expenses.create')
      .use(apiV2Stack(['expenses:write']))
    router
      .delete('/:id', [ExpensesDestroy, 'handle'])
      .as('apiV2.expenses.destroy')
      .use(apiV2Stack(['expenses:delete']))
  })
  .prefix(API_V2_PREFIX + '/expenses')
