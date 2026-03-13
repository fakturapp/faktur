import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'

const TeamList = () => import('#controllers/team/list')
const TeamCreate = () => import('#controllers/team/create')
const TeamShow = () => import('#controllers/team/show')
const TeamUpdate = () => import('#controllers/team/update')
const TeamSwitch = () => import('#controllers/team/switch')
const TeamMembers = () => import('#controllers/team/members')
const TeamInvite = () => import('#controllers/team/invite')
const AcceptInvite = () => import('#controllers/team/accept_invite')
const RevokeInvite = () => import('#controllers/team/revoke_invite')
const UpdateRole = () => import('#controllers/team/update_role')
const TransferOwnership = () => import('#controllers/team/transfer_ownership')
const RemoveMember = () => import('#controllers/team/remove_member')
const InviteInfo = () => import('#controllers/team/invite_info')
const UploadIcon = () => import('#controllers/team/upload_icon')
const ServeIcon = () => import('#controllers/team/serve_icon')

// Public route - serve team icons
router.get('/team-icons/:filename', [ServeIcon, 'handle'])

router
  .group(() => {
    router.get('/all', [TeamList, 'handle'])
    router.post('/create', [TeamCreate, 'handle'])
    router.get('/', [TeamShow, 'handle'])
    router.put('/', [TeamUpdate, 'handle'])
    router.post('/icon', [UploadIcon, 'handle'])
    router.post('/switch', [TeamSwitch, 'handle'])
    router.get('/members', [TeamMembers, 'handle'])
    router.post('/invite', [TeamInvite, 'handle'])
    router.post('/invite/accept', [AcceptInvite, 'handle'])
    router.delete('/invite/:id', [RevokeInvite, 'handle'])
    router.put('/members/:id/role', [UpdateRole, 'handle'])
    router.delete('/members/:id', [RemoveMember, 'handle'])
    router.post('/transfer-ownership', [TransferOwnership, 'handle'])
  })
  .prefix('/team')
  .use(middleware.auth())

// Public route for invitation info (no auth needed to view)
router.get('/invite/:token', [InviteInfo, 'handle'])
