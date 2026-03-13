/* eslint-disable prettier/prettier */
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
  'profile_show': {
    methods: ["GET","HEAD"],
    pattern: '/account/profile',
    tokens: [{"old":"/account/profile","type":0,"val":"account","end":""},{"old":"/account/profile","type":0,"val":"profile","end":""}],
    types: placeholder as Registry['profile_show']['types'],
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
