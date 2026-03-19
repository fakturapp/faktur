/* eslint-disable prettier/prettier */
/// <reference path="../manifest.d.ts" />

import type { ExtractBody, ExtractErrorResponse, ExtractQuery, ExtractQueryForGet, ExtractResponse } from '@tuyau/core/types'
import type { InferInput, SimpleError } from '@vinejs/vine/types'

export type ParamValue = string | number | bigint | boolean

export interface Registry {
  'signup': {
    methods: ["POST"]
    pattern: '/api/v1/auth/sign-up'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/auth/auth_validators').registerValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/auth/auth_validators').registerValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/auth/registration/signup').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/auth/registration/signup').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'verify_email': {
    methods: ["POST"]
    pattern: '/api/v1/auth/verify-email'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/auth/security/email/verify').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/auth/security/email/verify').default['handle']>>>
    }
  }
  'resend_verification': {
    methods: ["POST"]
    pattern: '/api/v1/auth/resend-verification'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/auth/security/email/resend').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/auth/security/email/resend').default['handle']>>>
    }
  }
  'login': {
    methods: ["POST"]
    pattern: '/api/v1/auth/login'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/auth/auth_validators').loginValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/auth/auth_validators').loginValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/auth/session/login').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/auth/session/login').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'two_factor_verify': {
    methods: ["POST"]
    pattern: '/api/v1/auth/login/2fa'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/auth/auth_validators').twoFactorVerifyValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/auth/auth_validators').twoFactorVerifyValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/auth/security/two_factor/verify').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/auth/security/two_factor/verify').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'password_reset_request': {
    methods: ["POST"]
    pattern: '/api/v1/auth/password/forgot'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/auth/auth_validators').passwordResetRequestValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/auth/auth_validators').passwordResetRequestValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/auth/security/password_reset/request').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/auth/security/password_reset/request').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'password_reset': {
    methods: ["POST"]
    pattern: '/api/v1/auth/password/reset'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/auth/security/password_reset/reset').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/auth/security/password_reset/reset').default['handle']>>>
    }
  }
  'google_auth_url': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/auth/oauth/google/url'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/auth/oauth/google_auth_url').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/auth/oauth/google_auth_url').default['handle']>>>
    }
  }
  'google_callback': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/auth/oauth/google/callback'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/auth/oauth/google_callback').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/auth/oauth/google_callback').default['handle']>>>
    }
  }
  'google_decode_profile': {
    methods: ["POST"]
    pattern: '/api/v1/auth/oauth/google/decode'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/auth/oauth/google_decode_profile').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/auth/oauth/google_decode_profile').default['handle']>>>
    }
  }
  'google_register': {
    methods: ["POST"]
    pattern: '/api/v1/auth/oauth/google/register'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/auth/oauth/google_register').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/auth/oauth/google_register').default['handle']>>>
    }
  }
  'logout': {
    methods: ["POST"]
    pattern: '/api/v1/auth/logout'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/auth/session/logout').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/auth/session/logout').default['handle']>>>
    }
  }
  'me': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/auth/me'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/auth/session/me').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/auth/session/me').default['handle']>>>
    }
  }
  'crypto_recover': {
    methods: ["POST"]
    pattern: '/api/v1/auth/crypto/recover'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/auth/security/crypto_recover').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/auth/security/crypto_recover').default['handle']>>>
    }
  }
  'crypto_wipe': {
    methods: ["POST"]
    pattern: '/api/v1/auth/crypto/wipe'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/auth/security/crypto_wipe').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/auth/security/crypto_wipe').default['handle']>>>
    }
  }
  'serve_avatar': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/avatars/:filename'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { filename: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/account/profile/serve_avatar').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/account/profile/serve_avatar').default['handle']>>>
    }
  }
  'profile_show': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/account/profile'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/account/profile/show').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/account/profile/show').default['handle']>>>
    }
  }
  'profile_update': {
    methods: ["PUT"]
    pattern: '/api/v1/account/profile'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/account/profile/update').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/account/profile/update').default['handle']>>>
    }
  }
  'password_change': {
    methods: ["PUT"]
    pattern: '/api/v1/account/password'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/account/security/password').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/account/security/password').default['handle']>>>
    }
  }
  'upload_avatar': {
    methods: ["POST"]
    pattern: '/api/v1/account/avatar'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/account/profile/upload_avatar').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/account/profile/upload_avatar').default['handle']>>>
    }
  }
  'sessions_list': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/account/sessions'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/account/security/sessions').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/account/security/sessions').default['handle']>>>
    }
  }
  'session_revoke': {
    methods: ["DELETE"]
    pattern: '/api/v1/account/sessions/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/account/security/revoke_session').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/account/security/revoke_session').default['handle']>>>
    }
  }
  'account_delete': {
    methods: ["DELETE"]
    pattern: '/api/v1/account'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/account/profile/delete').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/account/profile/delete').default['handle']>>>
    }
  }
  'two_factor_setup': {
    methods: ["POST"]
    pattern: '/api/v1/account/2fa/setup'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/account/two_factor/setup').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/account/two_factor/setup').default['handle']>>>
    }
  }
  'two_factor_enable': {
    methods: ["POST"]
    pattern: '/api/v1/account/2fa/enable'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/auth/auth_validators').twoFactorSetupValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/auth/auth_validators').twoFactorSetupValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/account/two_factor/enable').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/account/two_factor/enable').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'two_factor_disable': {
    methods: ["POST"]
    pattern: '/api/v1/account/2fa/disable'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/account/two_factor/disable').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/account/two_factor/disable').default['handle']>>>
    }
  }
  'security_verify.send_code': {
    methods: ["POST"]
    pattern: '/api/v1/account/security/send-code'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/account/security/security_verify').default['sendCode']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/account/security/security_verify').default['sendCode']>>>
    }
  }
  'security_verify.verify': {
    methods: ["POST"]
    pattern: '/api/v1/account/security/verify'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/account/security/security_verify').default['verify']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/account/security/security_verify').default['verify']>>>
    }
  }
  'email_request_change': {
    methods: ["POST"]
    pattern: '/api/v1/account/email/request-change'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/account/email/email_request_change').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/account/email/email_request_change').default['handle']>>>
    }
  }
  'email_confirm_change': {
    methods: ["POST"]
    pattern: '/api/v1/account/email/confirm-change'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/account/email/email_confirm_change').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/account/email/email_confirm_change').default['handle']>>>
    }
  }
  'list_providers': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/account/providers'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/account/providers/list').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/account/providers/list').default['handle']>>>
    }
  }
  'link_provider': {
    methods: ["POST"]
    pattern: '/api/v1/account/providers/link'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/account/providers/link').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/account/providers/link').default['handle']>>>
    }
  }
  'unlink_provider': {
    methods: ["POST"]
    pattern: '/api/v1/account/providers/unlink'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/account/providers/unlink').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/account/providers/unlink').default['handle']>>>
    }
  }
  'create_team': {
    methods: ["POST"]
    pattern: '/api/v1/onboarding/team'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/auth/onboarding_validators').createTeamValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/auth/onboarding_validators').createTeamValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/onboarding/team/create_team').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/onboarding/team/create_team').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'create_company': {
    methods: ["POST"]
    pattern: '/api/v1/onboarding/company'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/auth/onboarding_validators').createCompanyValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/auth/onboarding_validators').createCompanyValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/onboarding/company/create_company').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/onboarding/company/create_company').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'skip_company': {
    methods: ["POST"]
    pattern: '/api/v1/onboarding/skip'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/onboarding/company/skip_company').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/onboarding/company/skip_company').default['handle']>>>
    }
  }
  'search_company': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/onboarding/company/search'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/onboarding/company/search_company').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/onboarding/company/search_company').default['handle']>>>
    }
  }
  'complete_personalization': {
    methods: ["POST"]
    pattern: '/api/v1/onboarding/personalization'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/onboarding/personalization/complete_personalization').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/onboarding/personalization/complete_personalization').default['handle']>>>
    }
  }
  'dashboard.index': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/dashboard'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/dashboard/stats').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/dashboard/stats').default['handle']>>>
    }
  }
  'dashboard.stats': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/dashboard/stats'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/dashboard/stats').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/dashboard/stats').default['handle']>>>
    }
  }
  'dashboard.sidebarCounts': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/dashboard/sidebar-counts'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/dashboard/sidebar_counts').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/dashboard/sidebar_counts').default['handle']>>>
    }
  }
  'dashboard.charts': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/dashboard/charts'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/dashboard/charts').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/dashboard/charts').default['handle']>>>
    }
  }
  'dashboard.charts.revenue': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/dashboard/charts/revenue'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/dashboard/charts').default['revenue']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/dashboard/charts').default['revenue']>>>
    }
  }
  'dashboard.charts.collected': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/dashboard/charts/collected'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/dashboard/charts').default['collected']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/dashboard/charts').default['collected']>>>
    }
  }
  'dashboard.charts.micro': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/dashboard/charts/micro-thresholds'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/dashboard/charts').default['micro']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/dashboard/charts').default['micro']>>>
    }
  }
  'serve_icon': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/team-icons/:filename'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { filename: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/team/media/serve_icon').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/team/media/serve_icon').default['handle']>>>
    }
  }
  'team_list': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/team/all'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/team/core/list').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/team/core/list').default['handle']>>>
    }
  }
  'team_create': {
    methods: ["POST"]
    pattern: '/api/v1/team/create'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/auth/onboarding_validators').createTeamValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/auth/onboarding_validators').createTeamValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/team/core/create').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/team/core/create').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'team_show': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/team'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/team/core/show').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/team/core/show').default['handle']>>>
    }
  }
  'team_update': {
    methods: ["PUT"]
    pattern: '/api/v1/team'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/team/core/update').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/team/core/update').default['handle']>>>
    }
  }
  'team_delete': {
    methods: ["DELETE"]
    pattern: '/api/v1/team'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/team/core/delete').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/team/core/delete').default['handle']>>>
    }
  }
  'upload_icon': {
    methods: ["POST"]
    pattern: '/api/v1/team/icon'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/team/media/upload_icon').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/team/media/upload_icon').default['handle']>>>
    }
  }
  'team_switch': {
    methods: ["POST"]
    pattern: '/api/v1/team/switch'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/team/core/switch').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/team/core/switch').default['handle']>>>
    }
  }
  'team_export': {
    methods: ["POST"]
    pattern: '/api/v1/team/export'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/team/core/export').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/team/core/export').default['handle']>>>
    }
  }
  'team_import': {
    methods: ["POST"]
    pattern: '/api/v1/team/import'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/team/core/import').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/team/core/import').default['handle']>>>
    }
  }
  'team_members': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/team/members'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/team/members/members').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/team/members/members').default['handle']>>>
    }
  }
  'team_invite': {
    methods: ["POST"]
    pattern: '/api/v1/team/invite'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/team/invitations/invite').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/team/invitations/invite').default['handle']>>>
    }
  }
  'accept_invite': {
    methods: ["POST"]
    pattern: '/api/v1/team/invite/accept'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/team/invitations/accept_invite').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/team/invitations/accept_invite').default['handle']>>>
    }
  }
  'revoke_invite': {
    methods: ["DELETE"]
    pattern: '/api/v1/team/invite/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/team/invitations/revoke_invite').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/team/invitations/revoke_invite').default['handle']>>>
    }
  }
  'update_role': {
    methods: ["PUT"]
    pattern: '/api/v1/team/members/:id/role'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/team/members/update_role').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/team/members/update_role').default['handle']>>>
    }
  }
  'remove_member': {
    methods: ["DELETE"]
    pattern: '/api/v1/team/members/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/team/members/remove_member').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/team/members/remove_member').default['handle']>>>
    }
  }
  'transfer_ownership': {
    methods: ["POST"]
    pattern: '/api/v1/team/transfer-ownership'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/team/members/transfer_ownership').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/team/members/transfer_ownership').default['handle']>>>
    }
  }
  'invite_info': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/invite/:token'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { token: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/team/invitations/invite_info').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/team/invitations/invite_info').default['handle']>>>
    }
  }
  'serve_logo': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/company-logos/:filename'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { filename: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/company/media/serve_logo').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/company/media/serve_logo').default['handle']>>>
    }
  }
  'company_show': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/company'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/company/core/show').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/company/core/show').default['handle']>>>
    }
  }
  'company_update': {
    methods: ["PUT"]
    pattern: '/api/v1/company'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/auth/onboarding_validators').updateCompanyValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/auth/onboarding_validators').updateCompanyValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/company/core/update').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/company/core/update').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'company_bank': {
    methods: ["PUT"]
    pattern: '/api/v1/company/bank'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/auth/onboarding_validators').updateBankValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/auth/onboarding_validators').updateBankValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/company/finance/bank').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/company/finance/bank').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'upload_logo': {
    methods: ["POST"]
    pattern: '/api/v1/company/logo'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/company/media/upload_logo').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/company/media/upload_logo').default['handle']>>>
    }
  }
  'bank_accounts.index': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/company/bank-accounts'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/company/finance/bank_accounts').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/company/finance/bank_accounts').default['index']>>>
    }
  }
  'bank_accounts.show': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/company/bank-accounts/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/company/finance/bank_accounts').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/company/finance/bank_accounts').default['show']>>>
    }
  }
  'bank_accounts.store': {
    methods: ["POST"]
    pattern: '/api/v1/company/bank-accounts'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/company/bank_account_validators').createBankAccountValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/company/bank_account_validators').createBankAccountValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/company/finance/bank_accounts').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/company/finance/bank_accounts').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'bank_accounts.update': {
    methods: ["PUT"]
    pattern: '/api/v1/company/bank-accounts/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/company/bank_account_validators').updateBankAccountValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/company/bank_account_validators').updateBankAccountValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/company/finance/bank_accounts').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/company/finance/bank_accounts').default['update']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'bank_accounts.destroy': {
    methods: ["DELETE"]
    pattern: '/api/v1/company/bank-accounts/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/company/finance/bank_accounts').default['destroy']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/company/finance/bank_accounts').default['destroy']>>>
    }
  }
  'search_siren': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/clients/search-siren'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/client/lookup/search_siren').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/client/lookup/search_siren').default['handle']>>>
    }
  }
  'client_list': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/clients'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/client/crud/list').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/client/crud/list').default['handle']>>>
    }
  }
  'client_show': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/clients/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/client/crud/show').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/client/crud/show').default['handle']>>>
    }
  }
  'client_create': {
    methods: ["POST"]
    pattern: '/api/v1/clients'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/client/crud/create').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/client/crud/create').default['handle']>>>
    }
  }
  'client_update': {
    methods: ["PUT"]
    pattern: '/api/v1/clients/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/client/crud/update').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/client/crud/update').default['handle']>>>
    }
  }
  'client_delete': {
    methods: ["DELETE"]
    pattern: '/api/v1/clients/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/client/crud/delete').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/client/crud/delete').default['handle']>>>
    }
  }
  'serve_invoice_logo': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/invoice-logos/:filename'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { filename: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/settings/invoice/serve_invoice_logo').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/settings/invoice/serve_invoice_logo').default['handle']>>>
    }
  }
  'invoice_settings_show': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/settings/invoices'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/settings/invoice/invoice_settings_show').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/settings/invoice/invoice_settings_show').default['handle']>>>
    }
  }
  'invoice_settings_update': {
    methods: ["PUT"]
    pattern: '/api/v1/settings/invoices'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/invoice_settings_validator').updateInvoiceSettingsValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/invoice_settings_validator').updateInvoiceSettingsValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/settings/invoice/invoice_settings_update').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/settings/invoice/invoice_settings_update').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'invoice_logo_upload': {
    methods: ["POST"]
    pattern: '/api/v1/settings/invoices/logo'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/settings/invoice/invoice_logo_upload').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/settings/invoice/invoice_logo_upload').default['handle']>>>
    }
  }
  'quote_next_number': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/quotes/next-number'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/quote/number/next_number').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/quote/number/next_number').default['handle']>>>
    }
  }
  'quote_document_count': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/quotes/document-count'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/quote/number/document_count').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/quote/number/document_count').default['handle']>>>
    }
  }
  'quote_set_next_number': {
    methods: ["POST"]
    pattern: '/api/v1/quotes/set-next-number'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/quote/number/set_next_number').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/quote/number/set_next_number').default['handle']>>>
    }
  }
  'quote_list': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/quotes'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/quote/crud/list').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/quote/crud/list').default['handle']>>>
    }
  }
  'quote_pdf': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/quotes/:id/pdf'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/quote/export/pdf').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/quote/export/pdf').default['handle']>>>
    }
  }
  'quote_factur_xml': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/quotes/:id/facturx'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/quote/export/pdf').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/quote/export/pdf').default['handle']>>>
    }
  }
  'quote_show': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/quotes/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/quote/crud/show').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/quote/crud/show').default['handle']>>>
    }
  }
  'quote_create': {
    methods: ["POST"]
    pattern: '/api/v1/quotes'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/quote_validator').createQuoteValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/quote_validator').createQuoteValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/quote/crud/create').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/quote/crud/create').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'quote_update_status': {
    methods: ["PATCH"]
    pattern: '/api/v1/quotes/:id/status'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/quote/operations/update_status').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/quote/operations/update_status').default['handle']>>>
    }
  }
  'quote_update_comment': {
    methods: ["PATCH"]
    pattern: '/api/v1/quotes/:id/comment'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/quote/operations/update_comment').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/quote/operations/update_comment').default['handle']>>>
    }
  }
  'quote_duplicate': {
    methods: ["POST"]
    pattern: '/api/v1/quotes/:id/duplicate'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/quote/operations/duplicate').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/quote/operations/duplicate').default['handle']>>>
    }
  }
  'quote_update': {
    methods: ["PUT"]
    pattern: '/api/v1/quotes/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/quote_validator').createQuoteValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/quote_validator').createQuoteValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/quote/crud/update').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/quote/crud/update').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'quote_delete': {
    methods: ["DELETE"]
    pattern: '/api/v1/quotes/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/quote/crud/delete').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/quote/crud/delete').default['handle']>>>
    }
  }
  'invoice_next_number': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/invoices/next-number'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/invoice/number/next_number').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/invoice/number/next_number').default['handle']>>>
    }
  }
  'invoice_document_count': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/invoices/document-count'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/invoice/number/document_count').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/invoice/number/document_count').default['handle']>>>
    }
  }
  'invoice_set_next_number': {
    methods: ["POST"]
    pattern: '/api/v1/invoices/set-next-number'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/invoice/number/set_next_number').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/invoice/number/set_next_number').default['handle']>>>
    }
  }
  'invoice_list': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/invoices'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/invoice/crud/list').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/invoice/crud/list').default['handle']>>>
    }
  }
  'invoice_pdf': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/invoices/:id/pdf'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/invoice/export/pdf').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/invoice/export/pdf').default['handle']>>>
    }
  }
  'invoice_show': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/invoices/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/invoice/crud/show').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/invoice/crud/show').default['handle']>>>
    }
  }
  'invoice_create': {
    methods: ["POST"]
    pattern: '/api/v1/invoices'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/invoice_validator').createInvoiceValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/invoice_validator').createInvoiceValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/invoice/crud/create').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/invoice/crud/create').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'invoice_convert_quote': {
    methods: ["POST"]
    pattern: '/api/v1/invoices/convert-quote/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/invoice/operations/convert_quote').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/invoice/operations/convert_quote').default['handle']>>>
    }
  }
  'invoice_update_status': {
    methods: ["PATCH"]
    pattern: '/api/v1/invoices/:id/status'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/invoice/operations/update_status').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/invoice/operations/update_status').default['handle']>>>
    }
  }
  'invoice_unlink_quote': {
    methods: ["PATCH"]
    pattern: '/api/v1/invoices/:id/unlink-quote'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/invoice/operations/unlink_quote').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/invoice/operations/unlink_quote').default['handle']>>>
    }
  }
  'invoice_update_comment': {
    methods: ["PATCH"]
    pattern: '/api/v1/invoices/:id/comment'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/invoice/operations/update_comment').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/invoice/operations/update_comment').default['handle']>>>
    }
  }
  'invoice_duplicate': {
    methods: ["POST"]
    pattern: '/api/v1/invoices/:id/duplicate'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/invoice/operations/duplicate').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/invoice/operations/duplicate').default['handle']>>>
    }
  }
  'invoice_update': {
    methods: ["PUT"]
    pattern: '/api/v1/invoices/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/invoice_validator').createInvoiceValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/invoice_validator').createInvoiceValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/invoice/crud/update').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/invoice/crud/update').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'invoice_delete': {
    methods: ["DELETE"]
    pattern: '/api/v1/invoices/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/invoice/crud/delete').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/invoice/crud/delete').default['handle']>>>
    }
  }
  'e_invoicing_submit': {
    methods: ["POST"]
    pattern: '/api/v1/einvoicing/submit/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/einvoicing/submit').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/einvoicing/submit').default['handle']>>>
    }
  }
  'validate_connection': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/einvoicing/validate-connection'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/einvoicing/validate_connection').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/einvoicing/validate_connection').default['handle']>>>
    }
  }
  'gmail_callback': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/email/oauth/gmail/callback'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/email/oauth/gmail_callback').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/email/oauth/gmail_callback').default['handle']>>>
    }
  }
  'email_accounts_list': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/email/accounts'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/email/accounts/list').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/email/accounts/list').default['handle']>>>
    }
  }
  'email_accounts_delete': {
    methods: ["DELETE"]
    pattern: '/api/v1/email/accounts/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/email/accounts/delete').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/email/accounts/delete').default['handle']>>>
    }
  }
  'email_accounts_set_default': {
    methods: ["PATCH"]
    pattern: '/api/v1/email/accounts/:id/default'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/email/accounts/set_default').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/email/accounts/set_default').default['handle']>>>
    }
  }
  'gmail_auth_url': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/email/oauth/gmail/url'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/email/oauth/gmail_auth_url').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/email/oauth/gmail_auth_url').default['handle']>>>
    }
  }
  'configure_resend': {
    methods: ["POST"]
    pattern: '/api/v1/email/resend/configure'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/email/resend/configure').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/email/resend/configure').default['handle']>>>
    }
  }
  'configure_smtp': {
    methods: ["POST"]
    pattern: '/api/v1/email/smtp/configure'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/email/smtp/configure').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/email/smtp/configure').default['handle']>>>
    }
  }
  'send_email': {
    methods: ["POST"]
    pattern: '/api/v1/email/send'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/email/send/send_email').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/email/send/send_email').default['handle']>>>
    }
  }
  'send_test_email': {
    methods: ["POST"]
    pattern: '/api/v1/email/test'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/email/send/send_test_email').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/email/send/send_test_email').default['handle']>>>
    }
  }
  'list_email_logs': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/email/logs'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/email/logs/list').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/email/logs/list').default['handle']>>>
    }
  }
}
