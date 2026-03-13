 
import type { AdonisEndpoint } from '@tuyau/core/types'
import type { Registry } from './schema.d.ts'
import type { ApiDefinition } from './tree.d.ts'

const placeholder: any = {}

const routes = {
  'signup': {
    methods: ["POST"],
    pattern: '/auth/sign-up',
    tokens: [{"old":"/auth/sign-up","type":0,"val":"auth","end":""},{"old":"/auth/sign-up","type":0,"val":"sign-up","end":""}],
    types: placeholder as Registry['signup']['types'],
  },
  'verify_email': {
    methods: ["POST"],
    pattern: '/auth/verify-email',
    tokens: [{"old":"/auth/verify-email","type":0,"val":"auth","end":""},{"old":"/auth/verify-email","type":0,"val":"verify-email","end":""}],
    types: placeholder as Registry['verify_email']['types'],
  },
  'resend_verification': {
    methods: ["POST"],
    pattern: '/auth/resend-verification',
    tokens: [{"old":"/auth/resend-verification","type":0,"val":"auth","end":""},{"old":"/auth/resend-verification","type":0,"val":"resend-verification","end":""}],
    types: placeholder as Registry['resend_verification']['types'],
  },
  'login': {
    methods: ["POST"],
    pattern: '/auth/login',
    tokens: [{"old":"/auth/login","type":0,"val":"auth","end":""},{"old":"/auth/login","type":0,"val":"login","end":""}],
    types: placeholder as Registry['login']['types'],
  },
  'two_factor_verify': {
    methods: ["POST"],
    pattern: '/auth/login/2fa',
    tokens: [{"old":"/auth/login/2fa","type":0,"val":"auth","end":""},{"old":"/auth/login/2fa","type":0,"val":"login","end":""},{"old":"/auth/login/2fa","type":0,"val":"2fa","end":""}],
    types: placeholder as Registry['two_factor_verify']['types'],
  },
  'password_reset_request': {
    methods: ["POST"],
    pattern: '/auth/password/forgot',
    tokens: [{"old":"/auth/password/forgot","type":0,"val":"auth","end":""},{"old":"/auth/password/forgot","type":0,"val":"password","end":""},{"old":"/auth/password/forgot","type":0,"val":"forgot","end":""}],
    types: placeholder as Registry['password_reset_request']['types'],
  },
  'password_reset': {
    methods: ["POST"],
    pattern: '/auth/password/reset',
    tokens: [{"old":"/auth/password/reset","type":0,"val":"auth","end":""},{"old":"/auth/password/reset","type":0,"val":"password","end":""},{"old":"/auth/password/reset","type":0,"val":"reset","end":""}],
    types: placeholder as Registry['password_reset']['types'],
  },
  'logout': {
    methods: ["POST"],
    pattern: '/auth/logout',
    tokens: [{"old":"/auth/logout","type":0,"val":"auth","end":""},{"old":"/auth/logout","type":0,"val":"logout","end":""}],
    types: placeholder as Registry['logout']['types'],
  },
  'me': {
    methods: ["GET","HEAD"],
    pattern: '/auth/me',
    tokens: [{"old":"/auth/me","type":0,"val":"auth","end":""},{"old":"/auth/me","type":0,"val":"me","end":""}],
    types: placeholder as Registry['me']['types'],
  },
  'serve_avatar': {
    methods: ["GET","HEAD"],
    pattern: '/avatars/:filename',
    tokens: [{"old":"/avatars/:filename","type":0,"val":"avatars","end":""},{"old":"/avatars/:filename","type":1,"val":"filename","end":""}],
    types: placeholder as Registry['serve_avatar']['types'],
  },
  'profile_show': {
    methods: ["GET","HEAD"],
    pattern: '/account/profile',
    tokens: [{"old":"/account/profile","type":0,"val":"account","end":""},{"old":"/account/profile","type":0,"val":"profile","end":""}],
    types: placeholder as Registry['profile_show']['types'],
  },
  'profile_update': {
    methods: ["PUT"],
    pattern: '/account/profile',
    tokens: [{"old":"/account/profile","type":0,"val":"account","end":""},{"old":"/account/profile","type":0,"val":"profile","end":""}],
    types: placeholder as Registry['profile_update']['types'],
  },
  'password_change': {
    methods: ["PUT"],
    pattern: '/account/password',
    tokens: [{"old":"/account/password","type":0,"val":"account","end":""},{"old":"/account/password","type":0,"val":"password","end":""}],
    types: placeholder as Registry['password_change']['types'],
  },
  'upload_avatar': {
    methods: ["POST"],
    pattern: '/account/avatar',
    tokens: [{"old":"/account/avatar","type":0,"val":"account","end":""},{"old":"/account/avatar","type":0,"val":"avatar","end":""}],
    types: placeholder as Registry['upload_avatar']['types'],
  },
  'sessions_list': {
    methods: ["GET","HEAD"],
    pattern: '/account/sessions',
    tokens: [{"old":"/account/sessions","type":0,"val":"account","end":""},{"old":"/account/sessions","type":0,"val":"sessions","end":""}],
    types: placeholder as Registry['sessions_list']['types'],
  },
  'session_revoke': {
    methods: ["DELETE"],
    pattern: '/account/sessions/:id',
    tokens: [{"old":"/account/sessions/:id","type":0,"val":"account","end":""},{"old":"/account/sessions/:id","type":0,"val":"sessions","end":""},{"old":"/account/sessions/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['session_revoke']['types'],
  },
  'account_delete': {
    methods: ["DELETE"],
    pattern: '/account',
    tokens: [{"old":"/account","type":0,"val":"account","end":""}],
    types: placeholder as Registry['account_delete']['types'],
  },
  'two_factor_setup': {
    methods: ["POST"],
    pattern: '/account/2fa/setup',
    tokens: [{"old":"/account/2fa/setup","type":0,"val":"account","end":""},{"old":"/account/2fa/setup","type":0,"val":"2fa","end":""},{"old":"/account/2fa/setup","type":0,"val":"setup","end":""}],
    types: placeholder as Registry['two_factor_setup']['types'],
  },
  'two_factor_enable': {
    methods: ["POST"],
    pattern: '/account/2fa/enable',
    tokens: [{"old":"/account/2fa/enable","type":0,"val":"account","end":""},{"old":"/account/2fa/enable","type":0,"val":"2fa","end":""},{"old":"/account/2fa/enable","type":0,"val":"enable","end":""}],
    types: placeholder as Registry['two_factor_enable']['types'],
  },
  'two_factor_disable': {
    methods: ["POST"],
    pattern: '/account/2fa/disable',
    tokens: [{"old":"/account/2fa/disable","type":0,"val":"account","end":""},{"old":"/account/2fa/disable","type":0,"val":"2fa","end":""},{"old":"/account/2fa/disable","type":0,"val":"disable","end":""}],
    types: placeholder as Registry['two_factor_disable']['types'],
  },
  'security_verify.send_code': {
    methods: ["POST"],
    pattern: '/account/security/send-code',
    tokens: [{"old":"/account/security/send-code","type":0,"val":"account","end":""},{"old":"/account/security/send-code","type":0,"val":"security","end":""},{"old":"/account/security/send-code","type":0,"val":"send-code","end":""}],
    types: placeholder as Registry['security_verify.send_code']['types'],
  },
  'security_verify.verify': {
    methods: ["POST"],
    pattern: '/account/security/verify',
    tokens: [{"old":"/account/security/verify","type":0,"val":"account","end":""},{"old":"/account/security/verify","type":0,"val":"security","end":""},{"old":"/account/security/verify","type":0,"val":"verify","end":""}],
    types: placeholder as Registry['security_verify.verify']['types'],
  },
  'create_team': {
    methods: ["POST"],
    pattern: '/onboarding/team',
    tokens: [{"old":"/onboarding/team","type":0,"val":"onboarding","end":""},{"old":"/onboarding/team","type":0,"val":"team","end":""}],
    types: placeholder as Registry['create_team']['types'],
  },
  'create_company': {
    methods: ["POST"],
    pattern: '/onboarding/company',
    tokens: [{"old":"/onboarding/company","type":0,"val":"onboarding","end":""},{"old":"/onboarding/company","type":0,"val":"company","end":""}],
    types: placeholder as Registry['create_company']['types'],
  },
  'skip_company': {
    methods: ["POST"],
    pattern: '/onboarding/skip',
    tokens: [{"old":"/onboarding/skip","type":0,"val":"onboarding","end":""},{"old":"/onboarding/skip","type":0,"val":"skip","end":""}],
    types: placeholder as Registry['skip_company']['types'],
  },
  'search_company': {
    methods: ["GET","HEAD"],
    pattern: '/onboarding/company/search',
    tokens: [{"old":"/onboarding/company/search","type":0,"val":"onboarding","end":""},{"old":"/onboarding/company/search","type":0,"val":"company","end":""},{"old":"/onboarding/company/search","type":0,"val":"search","end":""}],
    types: placeholder as Registry['search_company']['types'],
  },
  'dashboard_stats': {
    methods: ["GET","HEAD"],
    pattern: '/dashboard/stats',
    tokens: [{"old":"/dashboard/stats","type":0,"val":"dashboard","end":""},{"old":"/dashboard/stats","type":0,"val":"stats","end":""}],
    types: placeholder as Registry['dashboard_stats']['types'],
  },
  'team_list': {
    methods: ["GET","HEAD"],
    pattern: '/team/all',
    tokens: [{"old":"/team/all","type":0,"val":"team","end":""},{"old":"/team/all","type":0,"val":"all","end":""}],
    types: placeholder as Registry['team_list']['types'],
  },
  'team_create': {
    methods: ["POST"],
    pattern: '/team/create',
    tokens: [{"old":"/team/create","type":0,"val":"team","end":""},{"old":"/team/create","type":0,"val":"create","end":""}],
    types: placeholder as Registry['team_create']['types'],
  },
  'team_show': {
    methods: ["GET","HEAD"],
    pattern: '/team',
    tokens: [{"old":"/team","type":0,"val":"team","end":""}],
    types: placeholder as Registry['team_show']['types'],
  },
  'team_update': {
    methods: ["PUT"],
    pattern: '/team',
    tokens: [{"old":"/team","type":0,"val":"team","end":""}],
    types: placeholder as Registry['team_update']['types'],
  },
  'team_switch': {
    methods: ["POST"],
    pattern: '/team/switch',
    tokens: [{"old":"/team/switch","type":0,"val":"team","end":""},{"old":"/team/switch","type":0,"val":"switch","end":""}],
    types: placeholder as Registry['team_switch']['types'],
  },
  'team_members': {
    methods: ["GET","HEAD"],
    pattern: '/team/members',
    tokens: [{"old":"/team/members","type":0,"val":"team","end":""},{"old":"/team/members","type":0,"val":"members","end":""}],
    types: placeholder as Registry['team_members']['types'],
  },
  'team_invite': {
    methods: ["POST"],
    pattern: '/team/invite',
    tokens: [{"old":"/team/invite","type":0,"val":"team","end":""},{"old":"/team/invite","type":0,"val":"invite","end":""}],
    types: placeholder as Registry['team_invite']['types'],
  },
  'accept_invite': {
    methods: ["POST"],
    pattern: '/team/invite/accept',
    tokens: [{"old":"/team/invite/accept","type":0,"val":"team","end":""},{"old":"/team/invite/accept","type":0,"val":"invite","end":""},{"old":"/team/invite/accept","type":0,"val":"accept","end":""}],
    types: placeholder as Registry['accept_invite']['types'],
  },
  'revoke_invite': {
    methods: ["DELETE"],
    pattern: '/team/invite/:id',
    tokens: [{"old":"/team/invite/:id","type":0,"val":"team","end":""},{"old":"/team/invite/:id","type":0,"val":"invite","end":""},{"old":"/team/invite/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['revoke_invite']['types'],
  },
  'update_role': {
    methods: ["PUT"],
    pattern: '/team/members/:id/role',
    tokens: [{"old":"/team/members/:id/role","type":0,"val":"team","end":""},{"old":"/team/members/:id/role","type":0,"val":"members","end":""},{"old":"/team/members/:id/role","type":1,"val":"id","end":""},{"old":"/team/members/:id/role","type":0,"val":"role","end":""}],
    types: placeholder as Registry['update_role']['types'],
  },
  'remove_member': {
    methods: ["DELETE"],
    pattern: '/team/members/:id',
    tokens: [{"old":"/team/members/:id","type":0,"val":"team","end":""},{"old":"/team/members/:id","type":0,"val":"members","end":""},{"old":"/team/members/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['remove_member']['types'],
  },
  'transfer_ownership': {
    methods: ["POST"],
    pattern: '/team/transfer-ownership',
    tokens: [{"old":"/team/transfer-ownership","type":0,"val":"team","end":""},{"old":"/team/transfer-ownership","type":0,"val":"transfer-ownership","end":""}],
    types: placeholder as Registry['transfer_ownership']['types'],
  },
  'invite_info': {
    methods: ["GET","HEAD"],
    pattern: '/invite/:token',
    tokens: [{"old":"/invite/:token","type":0,"val":"invite","end":""},{"old":"/invite/:token","type":1,"val":"token","end":""}],
    types: placeholder as Registry['invite_info']['types'],
  },
  'company_show': {
    methods: ["GET","HEAD"],
    pattern: '/company',
    tokens: [{"old":"/company","type":0,"val":"company","end":""}],
    types: placeholder as Registry['company_show']['types'],
  },
  'company_update': {
    methods: ["PUT"],
    pattern: '/company',
    tokens: [{"old":"/company","type":0,"val":"company","end":""}],
    types: placeholder as Registry['company_update']['types'],
  },
  'company_bank': {
    methods: ["PUT"],
    pattern: '/company/bank',
    tokens: [{"old":"/company/bank","type":0,"val":"company","end":""},{"old":"/company/bank","type":0,"val":"bank","end":""}],
    types: placeholder as Registry['company_bank']['types'],
  },
  'search_siren': {
    methods: ["GET","HEAD"],
    pattern: '/clients/search-siren',
    tokens: [{"old":"/clients/search-siren","type":0,"val":"clients","end":""},{"old":"/clients/search-siren","type":0,"val":"search-siren","end":""}],
    types: placeholder as Registry['search_siren']['types'],
  },
  'client_list': {
    methods: ["GET","HEAD"],
    pattern: '/clients',
    tokens: [{"old":"/clients","type":0,"val":"clients","end":""}],
    types: placeholder as Registry['client_list']['types'],
  },
  'client_show': {
    methods: ["GET","HEAD"],
    pattern: '/clients/:id',
    tokens: [{"old":"/clients/:id","type":0,"val":"clients","end":""},{"old":"/clients/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['client_show']['types'],
  },
  'client_create': {
    methods: ["POST"],
    pattern: '/clients',
    tokens: [{"old":"/clients","type":0,"val":"clients","end":""}],
    types: placeholder as Registry['client_create']['types'],
  },
  'client_update': {
    methods: ["PUT"],
    pattern: '/clients/:id',
    tokens: [{"old":"/clients/:id","type":0,"val":"clients","end":""},{"old":"/clients/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['client_update']['types'],
  },
  'client_delete': {
    methods: ["DELETE"],
    pattern: '/clients/:id',
    tokens: [{"old":"/clients/:id","type":0,"val":"clients","end":""},{"old":"/clients/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['client_delete']['types'],
  },
} as const satisfies Record<string, AdonisEndpoint>

export { routes }

export const registry = {
  routes,
  $tree: {} as ApiDefinition,
}

declare module '@tuyau/core/types' {
  export interface UserRegistry {
    routes: typeof routes
    $tree: ApiDefinition
  }
}
