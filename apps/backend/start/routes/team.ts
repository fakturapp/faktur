import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'

const TeamList = () => import('#controllers/team/core/list')
const TeamCreate = () => import('#controllers/team/core/create')
const TeamShow = () => import('#controllers/team/core/show')
const TeamUpdate = () => import('#controllers/team/core/update')
const TeamSwitch = () => import('#controllers/team/core/switch')
const TeamDelete = () => import('#controllers/team/core/delete')
const TeamExport = () => import('#controllers/team/core/export')
const TeamImport = () => import('#controllers/team/core/import')
const TeamMembers = () => import('#controllers/team/members/members')
const RemoveMember = () => import('#controllers/team/members/remove_member')
const UpdateRole = () => import('#controllers/team/members/update_role')
const TransferOwnership = () => import('#controllers/team/members/transfer_ownership')
const TeamInvite = () => import('#controllers/team/invitations/invite')
const InviteInfo = () => import('#controllers/team/invitations/invite_info')
const AcceptInvite = () => import('#controllers/team/invitations/accept_invite')
const RevokeInvite = () => import('#controllers/team/invitations/revoke_invite')
const UploadIcon = () => import('#controllers/team/media/upload_icon')
const ServeIcon = () => import('#controllers/team/media/serve_icon')

// Public route - serve team icons
router.get('/team-icons/:filename', [ServeIcon, 'handle'])

router
  .group(() => {
    router.get('/all', [TeamList, 'handle'])
    router.post('/create', [TeamCreate, 'handle'])
    router.get('/', [TeamShow, 'handle'])
    router.put('/', [TeamUpdate, 'handle'])
    router.delete('/', [TeamDelete, 'handle'])
    router.post('/icon', [UploadIcon, 'handle'])
    router.post('/switch', [TeamSwitch, 'handle'])
    router.post('/export', [TeamExport, 'handle'])
    router.post('/import', [TeamImport, 'handle'])
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
