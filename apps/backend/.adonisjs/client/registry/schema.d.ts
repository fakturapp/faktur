/* eslint-disable prettier/prettier */
/// <reference path="../manifest.d.ts" />

import type { ExtractBody, ExtractErrorResponse, ExtractQuery, ExtractQueryForGet, ExtractResponse } from '@tuyau/core/types'
import type { InferInput, SimpleError } from '@vinejs/vine/types'

export type ParamValue = string | number | bigint | boolean

export interface Registry {
  'signup': {
    methods: ["POST"]
    pattern: '/auth/sign-up'
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
    pattern: '/auth/verify-email'
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
    pattern: '/auth/resend-verification'
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
    pattern: '/auth/login'
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
    pattern: '/auth/login/2fa'
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
    pattern: '/auth/password/forgot'
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
    pattern: '/auth/password/reset'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/auth/auth_validators').passwordResetValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/auth/auth_validators').passwordResetValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/auth/security/password_reset/reset').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/auth/security/password_reset/reset').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'logout': {
    methods: ["POST"]
    pattern: '/auth/logout'
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
    pattern: '/auth/me'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/auth/session/me').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/auth/session/me').default['handle']>>>
    }
  }
  'serve_avatar': {
    methods: ["GET","HEAD"]
    pattern: '/avatars/:filename'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { filename: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/account/serve_avatar').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/account/serve_avatar').default['handle']>>>
    }
  }
  'profile_show': {
    methods: ["GET","HEAD"]
    pattern: '/account/profile'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/account/show').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/account/show').default['handle']>>>
    }
  }
  'profile_update': {
    methods: ["PUT"]
    pattern: '/account/profile'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/account/update').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/account/update').default['handle']>>>
    }
  }
  'password_change': {
    methods: ["PUT"]
    pattern: '/account/password'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/account/password').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/account/password').default['handle']>>>
    }
  }
  'upload_avatar': {
    methods: ["POST"]
    pattern: '/account/avatar'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/account/upload_avatar').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/account/upload_avatar').default['handle']>>>
    }
  }
  'sessions_list': {
    methods: ["GET","HEAD"]
    pattern: '/account/sessions'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/account/sessions').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/account/sessions').default['handle']>>>
    }
  }
  'session_revoke': {
    methods: ["DELETE"]
    pattern: '/account/sessions/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/account/revoke_session').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/account/revoke_session').default['handle']>>>
    }
  }
  'account_delete': {
    methods: ["DELETE"]
    pattern: '/account'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/account/delete').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/account/delete').default['handle']>>>
    }
  }
  'two_factor_setup': {
    methods: ["POST"]
    pattern: '/account/2fa/setup'
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
    pattern: '/account/2fa/enable'
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
    pattern: '/account/2fa/disable'
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
    pattern: '/account/security/send-code'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/account/security_verify').default['sendCode']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/account/security_verify').default['sendCode']>>>
    }
  }
  'security_verify.verify': {
    methods: ["POST"]
    pattern: '/account/security/verify'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/account/security_verify').default['verify']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/account/security_verify').default['verify']>>>
    }
  }
  'email_request_change': {
    methods: ["POST"]
    pattern: '/account/email/request-change'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/account/email_request_change').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/account/email_request_change').default['handle']>>>
    }
  }
  'email_confirm_change': {
    methods: ["POST"]
    pattern: '/account/email/confirm-change'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/account/email_confirm_change').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/account/email_confirm_change').default['handle']>>>
    }
  }
  'create_team': {
    methods: ["POST"]
    pattern: '/onboarding/team'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/auth/onboarding_validators').createTeamValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/auth/onboarding_validators').createTeamValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/onboarding/create_team').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/onboarding/create_team').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'create_company': {
    methods: ["POST"]
    pattern: '/onboarding/company'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/auth/onboarding_validators').createCompanyValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/auth/onboarding_validators').createCompanyValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/onboarding/create_company').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/onboarding/create_company').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'skip_company': {
    methods: ["POST"]
    pattern: '/onboarding/skip'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/onboarding/skip_company').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/onboarding/skip_company').default['handle']>>>
    }
  }
  'search_company': {
    methods: ["GET","HEAD"]
    pattern: '/onboarding/company/search'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/onboarding/search_company').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/onboarding/search_company').default['handle']>>>
    }
  }
  'complete_personalization': {
    methods: ["POST"]
    pattern: '/onboarding/personalization'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/onboarding/complete_personalization').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/onboarding/complete_personalization').default['handle']>>>
    }
  }
  'dashboard.index': {
    methods: ["GET","HEAD"]
    pattern: '/dashboard'
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
    pattern: '/dashboard/stats'
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
    pattern: '/dashboard/sidebar-counts'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/dashboard/sidebar_counts').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/dashboard/sidebar_counts').default['handle']>>>
    }
  }
  'serve_icon': {
    methods: ["GET","HEAD"]
    pattern: '/team-icons/:filename'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { filename: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/team/serve_icon').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/team/serve_icon').default['handle']>>>
    }
  }
  'team_list': {
    methods: ["GET","HEAD"]
    pattern: '/team/all'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/team/list').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/team/list').default['handle']>>>
    }
  }
  'team_create': {
    methods: ["POST"]
    pattern: '/team/create'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/auth/onboarding_validators').createTeamValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/auth/onboarding_validators').createTeamValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/team/create').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/team/create').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'team_show': {
    methods: ["GET","HEAD"]
    pattern: '/team'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/team/show').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/team/show').default['handle']>>>
    }
  }
  'team_update': {
    methods: ["PUT"]
    pattern: '/team'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/team/update').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/team/update').default['handle']>>>
    }
  }
  'upload_icon': {
    methods: ["POST"]
    pattern: '/team/icon'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/team/upload_icon').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/team/upload_icon').default['handle']>>>
    }
  }
  'team_switch': {
    methods: ["POST"]
    pattern: '/team/switch'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/team/switch').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/team/switch').default['handle']>>>
    }
  }
  'team_members': {
    methods: ["GET","HEAD"]
    pattern: '/team/members'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/team/members').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/team/members').default['handle']>>>
    }
  }
  'team_invite': {
    methods: ["POST"]
    pattern: '/team/invite'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/team/invite').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/team/invite').default['handle']>>>
    }
  }
  'accept_invite': {
    methods: ["POST"]
    pattern: '/team/invite/accept'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/team/accept_invite').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/team/accept_invite').default['handle']>>>
    }
  }
  'revoke_invite': {
    methods: ["DELETE"]
    pattern: '/team/invite/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/team/revoke_invite').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/team/revoke_invite').default['handle']>>>
    }
  }
  'update_role': {
    methods: ["PUT"]
    pattern: '/team/members/:id/role'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/team/update_role').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/team/update_role').default['handle']>>>
    }
  }
  'remove_member': {
    methods: ["DELETE"]
    pattern: '/team/members/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/team/remove_member').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/team/remove_member').default['handle']>>>
    }
  }
  'transfer_ownership': {
    methods: ["POST"]
    pattern: '/team/transfer-ownership'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/team/transfer_ownership').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/team/transfer_ownership').default['handle']>>>
    }
  }
  'invite_info': {
    methods: ["GET","HEAD"]
    pattern: '/invite/:token'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { token: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/team/invite_info').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/team/invite_info').default['handle']>>>
    }
  }
  'serve_logo': {
    methods: ["GET","HEAD"]
    pattern: '/company-logos/:filename'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { filename: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/company/serve_logo').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/company/serve_logo').default['handle']>>>
    }
  }
  'company_show': {
    methods: ["GET","HEAD"]
    pattern: '/company'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/company/show').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/company/show').default['handle']>>>
    }
  }
  'company_update': {
    methods: ["PUT"]
    pattern: '/company'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/auth/onboarding_validators').updateCompanyValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/auth/onboarding_validators').updateCompanyValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/company/update').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/company/update').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'company_bank': {
    methods: ["PUT"]
    pattern: '/company/bank'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/auth/onboarding_validators').updateBankValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/auth/onboarding_validators').updateBankValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/company/bank').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/company/bank').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'upload_logo': {
    methods: ["POST"]
    pattern: '/company/logo'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/company/upload_logo').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/company/upload_logo').default['handle']>>>
    }
  }
  'search_siren': {
    methods: ["GET","HEAD"]
    pattern: '/clients/search-siren'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/client/search_siren').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/client/search_siren').default['handle']>>>
    }
  }
  'client_list': {
    methods: ["GET","HEAD"]
    pattern: '/clients'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/client/list').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/client/list').default['handle']>>>
    }
  }
  'client_show': {
    methods: ["GET","HEAD"]
    pattern: '/clients/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/client/show').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/client/show').default['handle']>>>
    }
  }
  'client_create': {
    methods: ["POST"]
    pattern: '/clients'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/client/create').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/client/create').default['handle']>>>
    }
  }
  'client_update': {
    methods: ["PUT"]
    pattern: '/clients/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/client/update').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/client/update').default['handle']>>>
    }
  }
  'client_delete': {
    methods: ["DELETE"]
    pattern: '/clients/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/client/delete').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/client/delete').default['handle']>>>
    }
  }
  'serve_invoice_logo': {
    methods: ["GET","HEAD"]
    pattern: '/invoice-logos/:filename'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { filename: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/settings/serve_invoice_logo').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/settings/serve_invoice_logo').default['handle']>>>
    }
  }
  'invoice_settings_show': {
    methods: ["GET","HEAD"]
    pattern: '/settings/invoices'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/settings/invoice_settings_show').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/settings/invoice_settings_show').default['handle']>>>
    }
  }
  'invoice_settings_update': {
    methods: ["PUT"]
    pattern: '/settings/invoices'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/invoice_settings_validator').updateInvoiceSettingsValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/invoice_settings_validator').updateInvoiceSettingsValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/settings/invoice_settings_update').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/settings/invoice_settings_update').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'invoice_logo_upload': {
    methods: ["POST"]
    pattern: '/settings/invoices/logo'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/settings/invoice_logo_upload').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/settings/invoice_logo_upload').default['handle']>>>
    }
  }
  'quote_next_number': {
    methods: ["GET","HEAD"]
    pattern: '/quotes/next-number'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/quote/next_number').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/quote/next_number').default['handle']>>>
    }
  }
  'quote_document_count': {
    methods: ["GET","HEAD"]
    pattern: '/quotes/document-count'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/quote/document_count').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/quote/document_count').default['handle']>>>
    }
  }
  'quote_set_next_number': {
    methods: ["POST"]
    pattern: '/quotes/set-next-number'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/quote/set_next_number').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/quote/set_next_number').default['handle']>>>
    }
  }
  'quote_list': {
    methods: ["GET","HEAD"]
    pattern: '/quotes'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/quote/list').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/quote/list').default['handle']>>>
    }
  }
  'quote_pdf': {
    methods: ["GET","HEAD"]
    pattern: '/quotes/:id/pdf'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/quote/pdf').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/quote/pdf').default['handle']>>>
    }
  }
  'quote_factur_xml': {
    methods: ["GET","HEAD"]
    pattern: '/quotes/:id/facturx'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/quote/pdf').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/quote/pdf').default['handle']>>>
    }
  }
  'quote_show': {
    methods: ["GET","HEAD"]
    pattern: '/quotes/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/quote/show').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/quote/show').default['handle']>>>
    }
  }
  'quote_create': {
    methods: ["POST"]
    pattern: '/quotes'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/quote_validator').createQuoteValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/quote_validator').createQuoteValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/quote/create').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/quote/create').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'quote_update_status': {
    methods: ["PATCH"]
    pattern: '/quotes/:id/status'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/quote/update_status').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/quote/update_status').default['handle']>>>
    }
  }
  'quote_update_comment': {
    methods: ["PATCH"]
    pattern: '/quotes/:id/comment'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/quote/update_comment').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/quote/update_comment').default['handle']>>>
    }
  }
  'quote_duplicate': {
    methods: ["POST"]
    pattern: '/quotes/:id/duplicate'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/quote/duplicate').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/quote/duplicate').default['handle']>>>
    }
  }
  'quote_update': {
    methods: ["PUT"]
    pattern: '/quotes/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/quote_validator').createQuoteValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/quote_validator').createQuoteValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/quote/update').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/quote/update').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'quote_delete': {
    methods: ["DELETE"]
    pattern: '/quotes/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/quote/delete').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/quote/delete').default['handle']>>>
    }
  }
  'invoice_next_number': {
    methods: ["GET","HEAD"]
    pattern: '/invoices/next-number'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/invoice/next_number').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/invoice/next_number').default['handle']>>>
    }
  }
  'invoice_document_count': {
    methods: ["GET","HEAD"]
    pattern: '/invoices/document-count'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/invoice/document_count').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/invoice/document_count').default['handle']>>>
    }
  }
  'invoice_set_next_number': {
    methods: ["POST"]
    pattern: '/invoices/set-next-number'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/invoice/set_next_number').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/invoice/set_next_number').default['handle']>>>
    }
  }
  'invoice_list': {
    methods: ["GET","HEAD"]
    pattern: '/invoices'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/invoice/list').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/invoice/list').default['handle']>>>
    }
  }
  'invoice_pdf': {
    methods: ["GET","HEAD"]
    pattern: '/invoices/:id/pdf'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/invoice/pdf').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/invoice/pdf').default['handle']>>>
    }
  }
  'invoice_show': {
    methods: ["GET","HEAD"]
    pattern: '/invoices/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/invoice/show').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/invoice/show').default['handle']>>>
    }
  }
  'invoice_create': {
    methods: ["POST"]
    pattern: '/invoices'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/invoice_validator').createInvoiceValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/invoice_validator').createInvoiceValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/invoice/create').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/invoice/create').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'invoice_convert_quote': {
    methods: ["POST"]
    pattern: '/invoices/convert-quote/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/invoice/convert_quote').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/invoice/convert_quote').default['handle']>>>
    }
  }
  'invoice_update_status': {
    methods: ["PATCH"]
    pattern: '/invoices/:id/status'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/invoice/update_status').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/invoice/update_status').default['handle']>>>
    }
  }
  'invoice_unlink_quote': {
    methods: ["PATCH"]
    pattern: '/invoices/:id/unlink-quote'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/invoice/unlink_quote').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/invoice/unlink_quote').default['handle']>>>
    }
  }
  'invoice_update_comment': {
    methods: ["PATCH"]
    pattern: '/invoices/:id/comment'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/invoice/update_comment').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/invoice/update_comment').default['handle']>>>
    }
  }
  'invoice_duplicate': {
    methods: ["POST"]
    pattern: '/invoices/:id/duplicate'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/invoice/duplicate').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/invoice/duplicate').default['handle']>>>
    }
  }
  'invoice_update': {
    methods: ["PUT"]
    pattern: '/invoices/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/invoice_validator').createInvoiceValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/invoice_validator').createInvoiceValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/invoice/update').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/invoice/update').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'invoice_delete': {
    methods: ["DELETE"]
    pattern: '/invoices/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/invoice/delete').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/invoice/delete').default['handle']>>>
    }
  }
  'e_invoicing_submit': {
    methods: ["POST"]
    pattern: '/einvoicing/submit/:id'
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
    pattern: '/einvoicing/validate-connection'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/einvoicing/validate_connection').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/einvoicing/validate_connection').default['handle']>>>
    }
  }
}
