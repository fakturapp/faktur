import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'

const CreateTeam = () => import('#controllers/onboarding/create_team')
const CreateCompany = () => import('#controllers/onboarding/create_company')
const SkipCompany = () => import('#controllers/onboarding/skip_company')
const SearchCompany = () => import('#controllers/onboarding/search_company')
const CompletePersonalization = () => import('#controllers/onboarding/complete_personalization')

router
  .group(() => {
    router.post('/team', [CreateTeam, 'handle'])
    router.post('/company', [CreateCompany, 'handle'])
    router.post('/skip', [SkipCompany, 'handle'])
    router.get('/company/search', [SearchCompany, 'handle'])
    router.post('/personalization', [CompletePersonalization, 'handle'])
  })
  .prefix('/onboarding')
  .use(middleware.auth())
