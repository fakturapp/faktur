import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'
import { API_PREFIX } from '#start/routes/_prefix'

const CreateTeam = () => import('#controllers/onboarding/team/create_team')
const CreateCompany = () => import('#controllers/onboarding/company/create_company')
const SkipCompany = () => import('#controllers/onboarding/company/skip_company')
const SearchCompany = () => import('#controllers/onboarding/company/search_company')
const CompletePersonalization = () => import('#controllers/onboarding/personalization/complete_personalization')

router
  .group(() => {
    router.post('/team', [CreateTeam, 'handle'])
    router.post('/company', [CreateCompany, 'handle'])
    router.post('/skip', [SkipCompany, 'handle'])
    router.get('/company/search', [SearchCompany, 'handle'])
    router.post('/personalization', [CompletePersonalization, 'handle'])
  })
  .prefix(API_PREFIX + '/onboarding')
  .use(middleware.auth())
