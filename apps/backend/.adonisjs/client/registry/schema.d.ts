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
  'check_email': {
    methods: ["POST"]
    pattern: '/api/v1/auth/check-email'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/auth/auth_validators').checkEmailValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/auth/auth_validators').checkEmailValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/auth/session/check_email').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/auth/session/check_email').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'passkey_login_options': {
    methods: ["POST"]
    pattern: '/api/v1/auth/passkey/login-options'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/auth/passkey/login_options').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/auth/passkey/login_options').default['handle']>>>
    }
  }
  'passkey_login_verify': {
    methods: ["POST"]
    pattern: '/api/v1/auth/passkey/login-verify'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/auth/passkey/login_verify').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/auth/passkey/login_verify').default['handle']>>>
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
  'setup_recovery_key': {
    methods: ["POST"]
    pattern: '/api/v1/auth/crypto/setup-recovery-key'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/auth/security/setup_recovery_key').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/auth/security/setup_recovery_key').default['handle']>>>
    }
  }
  'vault_unlock': {
    methods: ["POST"]
    pattern: '/api/v1/auth/vault/unlock'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/auth/vault/unlock').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/auth/vault/unlock').default['handle']>>>
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
      body: ExtractBody<InferInput<(typeof import('#validators/account_validator').updateProfileValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/account_validator').updateProfileValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/account/profile/update').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/account/profile/update').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'password_change': {
    methods: ["PUT"]
    pattern: '/api/v1/account/password'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/account_validator').changePasswordValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/account_validator').changePasswordValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/account/security/password').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/account/security/password').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
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
  'session_revoke_all': {
    methods: ["DELETE"]
    pattern: '/api/v1/account/sessions'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/account/security/revoke_all_sessions').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/account/security/revoke_all_sessions').default['handle']>>>
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
      body: ExtractBody<InferInput<(typeof import('#validators/account_validator').deleteAccountValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/account_validator').deleteAccountValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/account/profile/delete').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/account/profile/delete').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'deletion_start': {
    methods: ["POST"]
    pattern: '/api/v1/account/delete/start'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/account/delete/start').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/account/delete/start').default['handle']>>>
    }
  }
  'deletion_teams': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/account/delete/teams'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/account/delete/teams').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/account/delete/teams').default['handle']>>>
    }
  }
  'deletion_resolve_team': {
    methods: ["POST"]
    pattern: '/api/v1/account/delete/resolve-team'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/account/delete/resolve_team').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/account/delete/resolve_team').default['handle']>>>
    }
  }
  'deletion_verify_name': {
    methods: ["POST"]
    pattern: '/api/v1/account/delete/verify-name'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/account/delete/verify_name').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/account/delete/verify_name').default['handle']>>>
    }
  }
  'deletion_send_code': {
    methods: ["POST"]
    pattern: '/api/v1/account/delete/send-code'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/account/delete/send_code').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/account/delete/send_code').default['handle']>>>
    }
  }
  'deletion_verify_code': {
    methods: ["POST"]
    pattern: '/api/v1/account/delete/verify-code'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/account/delete/verify_code').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/account/delete/verify_code').default['handle']>>>
    }
  }
  'deletion_verify_password': {
    methods: ["POST"]
    pattern: '/api/v1/account/delete/verify-password'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/account/delete/verify_password').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/account/delete/verify_password').default['handle']>>>
    }
  }
  'deletion_confirm': {
    methods: ["DELETE"]
    pattern: '/api/v1/account/delete/confirm'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/account/delete/confirm').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/account/delete/confirm').default['handle']>>>
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
      body: ExtractBody<InferInput<(typeof import('#validators/account_validator').securityVerifyValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/account_validator').securityVerifyValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/account/security/security_verify').default['verify']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/account/security/security_verify').default['verify']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'email_request_change': {
    methods: ["POST"]
    pattern: '/api/v1/account/email/request-change'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/account_validator').emailChangeValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/account_validator').emailChangeValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/account/email/email_request_change').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/account/email/email_request_change').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
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
  'passkey_register_options': {
    methods: ["POST"]
    pattern: '/api/v1/account/passkeys/register-options'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/account/passkeys/register_options').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/account/passkeys/register_options').default['handle']>>>
    }
  }
  'passkey_register_verify': {
    methods: ["POST"]
    pattern: '/api/v1/account/passkeys/register-verify'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/account/passkeys/register_verify').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/account/passkeys/register_verify').default['handle']>>>
    }
  }
  'passkey_list': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/account/passkeys'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/account/passkeys/list').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/account/passkeys/list').default['handle']>>>
    }
  }
  'passkey_delete': {
    methods: ["DELETE"]
    pattern: '/api/v1/account/passkeys/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/account/passkeys/delete').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/account/passkeys/delete').default['handle']>>>
    }
  }
  'list_user_oauth_apps': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/account/oauth-apps'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/account/oauth_apps/list').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/account/oauth_apps/list').default['handle']>>>
    }
  }
  'revoke_user_oauth_app': {
    methods: ["POST"]
    pattern: '/api/v1/account/oauth-apps/:authorizationId/revoke'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { authorizationId: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/account/oauth_apps/revoke_app').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/account/oauth_apps/revoke_app').default['handle']>>>
    }
  }
  'revoke_user_oauth_session': {
    methods: ["POST"]
    pattern: '/api/v1/account/oauth-apps/sessions/:tokenId/revoke'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { tokenId: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/account/oauth_apps/revoke_session').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/account/oauth_apps/revoke_session').default['handle']>>>
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
  'dashboard.cashFlow': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/dashboard/cash-flow'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/dashboard/cash_flow').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/dashboard/cash_flow').default['handle']>>>
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
  'team_leave': {
    methods: ["POST"]
    pattern: '/api/v1/team/leave'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/team/core/leave').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/team/core/leave').default['handle']>>>
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
  'search_users': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/team/search-users'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/team/members/search_users').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/team/members/search_users').default['handle']>>>
    }
  }
  'team_invite': {
    methods: ["POST"]
    pattern: '/api/v1/team/invite'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/team_validator').inviteValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/team_validator').inviteValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/team/invitations/invite').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/team/invitations/invite').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
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
  'client_contact_index': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/clients/:clientId/contacts'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { clientId: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/client/contacts/index').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/client/contacts/index').default['handle']>>>
    }
  }
  'client_contact_store': {
    methods: ["POST"]
    pattern: '/api/v1/clients/:clientId/contacts'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { clientId: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/client/contacts/store').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/client/contacts/store').default['handle']>>>
    }
  }
  'client_contact_update': {
    methods: ["PUT"]
    pattern: '/api/v1/clients/:clientId/contacts/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue, ParamValue]
      params: { clientId: ParamValue; id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/client/contacts/update').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/client/contacts/update').default['handle']>>>
    }
  }
  'client_contact_destroy': {
    methods: ["DELETE"]
    pattern: '/api/v1/clients/:clientId/contacts/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue, ParamValue]
      params: { clientId: ParamValue; id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/client/contacts/destroy').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/client/contacts/destroy').default['handle']>>>
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
  'stripe_settings_show': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/settings/stripe'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/settings/stripe/stripe_settings_show').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/settings/stripe/stripe_settings_show').default['handle']>>>
    }
  }
  'stripe_settings_save': {
    methods: ["PUT"]
    pattern: '/api/v1/settings/stripe'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/stripe_settings_validator').saveStripeSettingsValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/stripe_settings_validator').saveStripeSettingsValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/settings/stripe/stripe_settings_save').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/settings/stripe/stripe_settings_save').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'stripe_settings_delete': {
    methods: ["DELETE"]
    pattern: '/api/v1/settings/stripe'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/settings/stripe/stripe_settings_delete').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/settings/stripe/stripe_settings_delete').default['handle']>>>
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
  'invoice_payment_index': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/invoices/:invoiceId/payments'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { invoiceId: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/invoice/payments/index').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/invoice/payments/index').default['handle']>>>
    }
  }
  'invoice_payment_store': {
    methods: ["POST"]
    pattern: '/api/v1/invoices/:invoiceId/payments'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { invoiceId: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/invoice/payments/store').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/invoice/payments/store').default['handle']>>>
    }
  }
  'invoice_payment_destroy': {
    methods: ["DELETE"]
    pattern: '/api/v1/invoices/:invoiceId/payments/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue, ParamValue]
      params: { invoiceId: ParamValue; id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/invoice/payments/destroy').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/invoice/payments/destroy').default['handle']>>>
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
  'submit_invoice': {
    methods: ["POST"]
    pattern: '/api/v1/einvoicing/submit-invoice/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/einvoicing/submit_invoice').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/einvoicing/submit_invoice').default['handle']>>>
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
  'check_status': {
    methods: ["POST"]
    pattern: '/api/v1/einvoicing/status/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/einvoicing/check_status').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/einvoicing/check_status').default['handle']>>>
    }
  }
  'list_submissions': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/einvoicing/submissions'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/einvoicing/list_submissions').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/einvoicing/list_submissions').default['handle']>>>
    }
  }
  'directory_lookup': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/einvoicing/directory'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/einvoicing/directory_lookup').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/einvoicing/directory_lookup').default['handle']>>>
    }
  }
  'setup_e_reporting': {
    methods: ["POST"]
    pattern: '/api/v1/einvoicing/ereporting/setup'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/einvoicing/setup_ereporting').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/einvoicing/setup_ereporting').default['handle']>>>
    }
  }
  'get_e_reporting_status': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/einvoicing/ereporting/status'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/einvoicing/get_ereporting_status').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/einvoicing/get_ereporting_status').default['handle']>>>
    }
  }
  'b_2_b_router_webhook': {
    methods: ["POST"]
    pattern: '/api/v1/webhooks/b2brouter'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/einvoicing/webhook').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/einvoicing/webhook').default['handle']>>>
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
      body: ExtractBody<InferInput<(typeof import('#validators/email_validator').configureResendValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/email_validator').configureResendValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/email/resend/configure').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/email/resend/configure').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'configure_smtp': {
    methods: ["POST"]
    pattern: '/api/v1/email/smtp/configure'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/email_validator').configureSmtpValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/email_validator').configureSmtpValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/email/smtp/configure').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/email/smtp/configure').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'send_email': {
    methods: ["POST"]
    pattern: '/api/v1/email/send'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/email_validator').sendEmailValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/email_validator').sendEmailValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/email/send/send_email').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/email/send/send_email').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'send_test_email': {
    methods: ["POST"]
    pattern: '/api/v1/email/test'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/email_validator').testEmailValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/email_validator').testEmailValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/email/send/send_test_email').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/email/send/send_test_email').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'email_template_list': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/email/templates'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/email/templates/list').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/email/templates/list').default['handle']>>>
    }
  }
  'email_template_update': {
    methods: ["PUT"]
    pattern: '/api/v1/email/templates'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/email_validator').updateTemplateValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/email_validator').updateTemplateValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/email/templates/update').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/email/templates/update').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
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
  'product_list': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/products'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/product/list').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/product/list').default['handle']>>>
    }
  }
  'product_show': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/products/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/product/show').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/product/show').default['handle']>>>
    }
  }
  'product_create': {
    methods: ["POST"]
    pattern: '/api/v1/products'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/product_validator').createProductValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/product_validator').createProductValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/product/create').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/product/create').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'product_update': {
    methods: ["PUT"]
    pattern: '/api/v1/products/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/product_validator').updateProductValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/product_validator').updateProductValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/product/update').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/product/update').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'product_delete': {
    methods: ["DELETE"]
    pattern: '/api/v1/products/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/product/delete').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/product/delete').default['handle']>>>
    }
  }
  'credit_note_next_number': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/credit-notes/next-number'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/credit_note/number/next_number').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/credit_note/number/next_number').default['handle']>>>
    }
  }
  'credit_note_list': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/credit-notes'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/credit_note/crud/list').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/credit_note/crud/list').default['handle']>>>
    }
  }
  'credit_note_show': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/credit-notes/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/credit_note/crud/show').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/credit_note/crud/show').default['handle']>>>
    }
  }
  'credit_note_create': {
    methods: ["POST"]
    pattern: '/api/v1/credit-notes'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/credit_note_validator').createCreditNoteValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/credit_note_validator').createCreditNoteValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/credit_note/crud/create').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/credit_note/crud/create').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'credit_note_convert_invoice': {
    methods: ["POST"]
    pattern: '/api/v1/credit-notes/convert-invoice/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/credit_note/operations/convert_invoice').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/credit_note/operations/convert_invoice').default['handle']>>>
    }
  }
  'credit_note_update_status': {
    methods: ["PATCH"]
    pattern: '/api/v1/credit-notes/:id/status'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/credit_note/operations/update_status').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/credit_note/operations/update_status').default['handle']>>>
    }
  }
  'credit_note_update_comment': {
    methods: ["PATCH"]
    pattern: '/api/v1/credit-notes/:id/comment'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/credit_note/operations/update_comment').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/credit_note/operations/update_comment').default['handle']>>>
    }
  }
  'credit_note_download_pdf': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/credit-notes/:id/pdf'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/credit_note/operations/download_pdf').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/credit_note/operations/download_pdf').default['handle']>>>
    }
  }
  'credit_note_duplicate': {
    methods: ["POST"]
    pattern: '/api/v1/credit-notes/:id/duplicate'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/credit_note/operations/duplicate').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/credit_note/operations/duplicate').default['handle']>>>
    }
  }
  'credit_note_update': {
    methods: ["PUT"]
    pattern: '/api/v1/credit-notes/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/credit_note_validator').createCreditNoteValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/credit_note_validator').createCreditNoteValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/credit_note/crud/update').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/credit_note/crud/update').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'credit_note_delete': {
    methods: ["DELETE"]
    pattern: '/api/v1/credit-notes/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/credit_note/crud/delete').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/credit_note/crud/delete').default['handle']>>>
    }
  }
  'recurring_invoice_list': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/recurring-invoices'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/recurring_invoice/crud/list').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/recurring_invoice/crud/list').default['handle']>>>
    }
  }
  'recurring_invoice_show': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/recurring-invoices/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/recurring_invoice/crud/show').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/recurring_invoice/crud/show').default['handle']>>>
    }
  }
  'recurring_invoice_create': {
    methods: ["POST"]
    pattern: '/api/v1/recurring-invoices'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/recurring_invoice_validator').createRecurringInvoiceValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/recurring_invoice_validator').createRecurringInvoiceValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/recurring_invoice/crud/create').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/recurring_invoice/crud/create').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'recurring_invoice_update': {
    methods: ["PUT"]
    pattern: '/api/v1/recurring-invoices/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/recurring_invoice_validator').createRecurringInvoiceValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/recurring_invoice_validator').createRecurringInvoiceValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/recurring_invoice/crud/update').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/recurring_invoice/crud/update').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'recurring_invoice_delete': {
    methods: ["DELETE"]
    pattern: '/api/v1/recurring-invoices/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/recurring_invoice/crud/delete').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/recurring_invoice/crud/delete').default['handle']>>>
    }
  }
  'recurring_invoice_generate': {
    methods: ["POST"]
    pattern: '/api/v1/recurring-invoices/:id/generate'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/recurring_invoice/operations/generate').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/recurring_invoice/operations/generate').default['handle']>>>
    }
  }
  'recurring_invoice_toggle_active': {
    methods: ["PATCH"]
    pattern: '/api/v1/recurring-invoices/:id/toggle-active'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/recurring_invoice/operations/toggle_active').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/recurring_invoice/operations/toggle_active').default['handle']>>>
    }
  }
  'reminder_settings_get': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/reminders/settings'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/reminder/settings/get').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/reminder/settings/get').default['handle']>>>
    }
  }
  'reminder_settings_update': {
    methods: ["PUT"]
    pattern: '/api/v1/reminders/settings'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/reminder/settings/update').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/reminder/settings/update').default['handle']>>>
    }
  }
  'send_reminder': {
    methods: ["POST"]
    pattern: '/api/v1/reminders/invoices/:id/send'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/reminder/operations/send_reminder').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/reminder/operations/send_reminder').default['handle']>>>
    }
  }
  'list_reminders': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/reminders/invoices/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/reminder/operations/list_reminders').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/reminder/operations/list_reminders').default['handle']>>>
    }
  }
  'expense_list': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/expenses'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/expense/crud/list').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/expense/crud/list').default['handle']>>>
    }
  }
  'expense_create': {
    methods: ["POST"]
    pattern: '/api/v1/expenses'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/expense_validator').createExpenseValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/expense_validator').createExpenseValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/expense/crud/create').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/expense/crud/create').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'expense_update': {
    methods: ["PUT"]
    pattern: '/api/v1/expenses/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/expense_validator').createExpenseValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/expense_validator').createExpenseValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/expense/crud/update').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/expense/crud/update').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'expense_delete': {
    methods: ["DELETE"]
    pattern: '/api/v1/expenses/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/expense/crud/delete').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/expense/crud/delete').default['handle']>>>
    }
  }
  'expense_category_list': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/expenses/categories'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/expense/categories/list').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/expense/categories/list').default['handle']>>>
    }
  }
  'expense_category_create': {
    methods: ["POST"]
    pattern: '/api/v1/expenses/categories'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/expense_validator').createExpenseCategoryValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/expense_validator').createExpenseCategoryValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/expense/categories/create').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/expense/categories/create').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'expense_category_delete': {
    methods: ["DELETE"]
    pattern: '/api/v1/expenses/categories/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/expense/categories/delete').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/expense/categories/delete').default['handle']>>>
    }
  }
  'parse_receipt': {
    methods: ["POST"]
    pattern: '/api/v1/expenses/parse-receipt'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/expense/ocr/parse_receipt').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/expense/ocr/parse_receipt').default['handle']>>>
    }
  }
  'vat_report': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/tax/vat-report'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/tax/vat_report').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/tax/vat_report').default['handle']>>>
    }
  }
  'fec_export': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/export/fec'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/export/fec_export').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/export/fec_export').default['handle']>>>
    }
  }
  'generate_text': {
    methods: ["POST"]
    pattern: '/api/v1/ai/generate-text'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/ai/generate_text').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/ai/generate_text').default['handle']>>>
    }
  }
  'suggest_invoice_lines': {
    methods: ["POST"]
    pattern: '/api/v1/ai/suggest-invoice-lines'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/ai/suggest_invoice_lines').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/ai/suggest_invoice_lines').default['handle']>>>
    }
  }
  'dashboard_summary': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/ai/dashboard-summary'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/ai/dashboard_summary').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/ai/dashboard_summary').default['handle']>>>
    }
  }
  'generate_reminder': {
    methods: ["POST"]
    pattern: '/api/v1/ai/generate-reminder'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/ai/generate_reminder').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/ai/generate_reminder').default['handle']>>>
    }
  }
  'generate_document': {
    methods: ["POST"]
    pattern: '/api/v1/ai/generate-document'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/ai/generate_document').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/ai/generate_document').default['handle']>>>
    }
  }
  'chat_document': {
    methods: ["POST"]
    pattern: '/api/v1/ai/chat-document'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/ai/chat_document').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/ai/chat_document').default['handle']>>>
    }
  }
  'check_providers': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/ai/providers'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/ai/check_providers').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/ai/check_providers').default['handle']>>>
    }
  }
  'ai_quota': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/ai/quota'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/ai/ai_quota').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/ai/ai_quota').default['handle']>>>
    }
  }
  'admin_feedbacks': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/admin/feedbacks'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/feedbacks').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/feedbacks').default['handle']>>>
    }
  }
  'admin_bug_reports.index': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/admin/bug-reports'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/bug_reports').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/bug_reports').default['index']>>>
    }
  }
  'admin_bug_reports.update': {
    methods: ["PATCH"]
    pattern: '/api/v1/admin/bug-reports/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/bug_reports').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/bug_reports').default['update']>>>
    }
  }
  'list_oauth_apps': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/admin/oauth-apps'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/oauth_apps/list').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/oauth_apps/list').default['handle']>>>
    }
  }
  'create_oauth_app': {
    methods: ["POST"]
    pattern: '/api/v1/admin/oauth-apps'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/oauth_validator').createOauthAppValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/oauth_validator').createOauthAppValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/oauth_apps/create').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/oauth_apps/create').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'update_oauth_app': {
    methods: ["PUT"]
    pattern: '/api/v1/admin/oauth-apps/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/oauth_validator').updateOauthAppValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/oauth_validator').updateOauthAppValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/oauth_apps/update').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/oauth_apps/update').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'destroy_oauth_app': {
    methods: ["DELETE"]
    pattern: '/api/v1/admin/oauth-apps/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/oauth_apps/destroy').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/oauth_apps/destroy').default['handle']>>>
    }
  }
  'rotate_oauth_app_secrets': {
    methods: ["POST"]
    pattern: '/api/v1/admin/oauth-apps/:id/rotate-secrets'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/oauth_apps/rotate_secrets').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/oauth_apps/rotate_secrets').default['handle']>>>
    }
  }
  'revoke_oauth_app_sessions': {
    methods: ["POST"]
    pattern: '/api/v1/admin/oauth-apps/:id/revoke-sessions'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/oauth_apps/revoke_sessions').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/oauth_apps/revoke_sessions').default['handle']>>>
    }
  }
  'analytics_ingest': {
    methods: ["POST"]
    pattern: '/api/v1/analytics/ingest'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/analytics_validator').ingestValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/analytics_validator').ingestValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/analytics/ingest').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/analytics/ingest').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'analytics_consent': {
    methods: ["POST"]
    pattern: '/api/v1/analytics/consent'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/analytics_validator').consentValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/analytics_validator').consentValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/analytics/consent').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/analytics/consent').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'analytics_overview': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/admin/analytics/overview'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/analytics/overview').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/analytics/overview').default['handle']>>>
    }
  }
  'analytics_pages': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/admin/analytics/pages'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/analytics/pages').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/analytics/pages').default['handle']>>>
    }
  }
  'analytics_features': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/admin/analytics/features'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/analytics/features').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/analytics/features').default['handle']>>>
    }
  }
  'analytics_errors': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/admin/analytics/errors'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/analytics/errors').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/analytics/errors').default['handle']>>>
    }
  }
  'analytics_errors.resolve': {
    methods: ["PATCH"]
    pattern: '/api/v1/admin/analytics/errors/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/analytics/errors').default['resolve']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/analytics/errors').default['resolve']>>>
    }
  }
  'analytics_performance': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/admin/analytics/performance'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/analytics/performance').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/analytics/performance').default['handle']>>>
    }
  }
  'analytics_users': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/admin/analytics/users'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/analytics/users').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/analytics/users').default['handle']>>>
    }
  }
  'share_list': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/collaboration/shares/:documentType/:documentId'
    types: {
      body: {}
      paramsTuple: [ParamValue, ParamValue]
      params: { documentType: ParamValue; documentId: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/collaboration/shares/list').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/collaboration/shares/list').default['handle']>>>
    }
  }
  'share_create': {
    methods: ["POST"]
    pattern: '/api/v1/collaboration/shares'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/collaboration_validator').createShareValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/collaboration_validator').createShareValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/collaboration/shares/create').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/collaboration/shares/create').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'share_update': {
    methods: ["PATCH"]
    pattern: '/api/v1/collaboration/shares/:shareId'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/collaboration_validator').updateShareValidator)>>
      paramsTuple: [ParamValue]
      params: { shareId: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/collaboration_validator').updateShareValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/collaboration/shares/update').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/collaboration/shares/update').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'share_revoke': {
    methods: ["DELETE"]
    pattern: '/api/v1/collaboration/shares/:shareId'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { shareId: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/collaboration/shares/revoke').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/collaboration/shares/revoke').default['handle']>>>
    }
  }
  'link_list': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/collaboration/share-links/:documentType/:documentId'
    types: {
      body: {}
      paramsTuple: [ParamValue, ParamValue]
      params: { documentType: ParamValue; documentId: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/collaboration/links/list').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/collaboration/links/list').default['handle']>>>
    }
  }
  'link_create': {
    methods: ["POST"]
    pattern: '/api/v1/collaboration/share-links'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/collaboration_validator').createShareLinkValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/collaboration_validator').createShareLinkValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/collaboration/links/create').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/collaboration/links/create').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'link_update': {
    methods: ["PATCH"]
    pattern: '/api/v1/collaboration/share-links/:linkId'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/collaboration_validator').updateShareLinkValidator)>>
      paramsTuple: [ParamValue]
      params: { linkId: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/collaboration_validator').updateShareLinkValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/collaboration/links/update').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/collaboration/links/update').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'link_destroy': {
    methods: ["DELETE"]
    pattern: '/api/v1/collaboration/share-links/:linkId'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { linkId: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/collaboration/links/destroy').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/collaboration/links/destroy').default['handle']>>>
    }
  }
  'check_access': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/collaboration/access/:documentType/:documentId'
    types: {
      body: {}
      paramsTuple: [ParamValue, ParamValue]
      params: { documentType: ParamValue; documentId: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/collaboration/access/check_access').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/collaboration/access/check_access').default['handle']>>>
    }
  }
  'active_editors': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/collaboration/active-editors/:documentType'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { documentType: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/collaboration/access/active_editors').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/collaboration/access/active_editors').default['handle']>>>
    }
  }
  'validate_link': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/share/validate/:token'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { token: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/collaboration/access/validate_link').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/collaboration/access/validate_link').default['handle']>>>
    }
  }
  'payment_link_show': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/invoices/:invoiceId/payment-link'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { invoiceId: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/invoice/payment_link/show').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/invoice/payment_link/show').default['handle']>>>
    }
  }
  'payment_link_create': {
    methods: ["POST"]
    pattern: '/api/v1/invoices/:invoiceId/payment-link'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/payment_link_validator').createPaymentLinkValidator)>>
      paramsTuple: [ParamValue]
      params: { invoiceId: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/payment_link_validator').createPaymentLinkValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/invoice/payment_link/create').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/invoice/payment_link/create').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'payment_link_delete': {
    methods: ["DELETE"]
    pattern: '/api/v1/invoices/:invoiceId/payment-link'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { invoiceId: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/invoice/payment_link/delete').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/invoice/payment_link/delete').default['handle']>>>
    }
  }
  'payment_link_confirm': {
    methods: ["POST"]
    pattern: '/api/v1/invoices/:invoiceId/payment-link/confirm'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/payment_link_validator').confirmPaymentValidator)>>
      paramsTuple: [ParamValue]
      params: { invoiceId: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/payment_link_validator').confirmPaymentValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/invoice/payment_link/confirm_payment').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/invoice/payment_link/confirm_payment').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'payment_link_send_email': {
    methods: ["POST"]
    pattern: '/api/v1/invoices/:invoiceId/payment-link/send-email'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { invoiceId: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/invoice/payment_link/send_link_email').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/invoice/payment_link/send_link_email').default['handle']>>>
    }
  }
  'checkout_show': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/checkout/:token'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { token: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/invoice/payment_link/checkout_show').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/invoice/payment_link/checkout_show').default['handle']>>>
    }
  }
  'checkout_verify_password': {
    methods: ["POST"]
    pattern: '/api/v1/checkout/:token/verify-password'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { token: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/invoice/payment_link/checkout_verify_password').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/invoice/payment_link/checkout_verify_password').default['handle']>>>
    }
  }
  'checkout_get_iban': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/checkout/:token/iban'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { token: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/invoice/payment_link/checkout_get_iban').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/invoice/payment_link/checkout_get_iban').default['handle']>>>
    }
  }
  'checkout_mark_paid': {
    methods: ["POST"]
    pattern: '/api/v1/checkout/:token/mark-paid'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { token: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/invoice/payment_link/checkout_mark_paid').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/invoice/payment_link/checkout_mark_paid').default['handle']>>>
    }
  }
  'checkout_download_pdf': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/checkout/:token/pdf'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { token: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/invoice/payment_link/checkout_download_pdf').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/invoice/payment_link/checkout_download_pdf').default['handle']>>>
    }
  }
  'checkout_create_intent': {
    methods: ["POST"]
    pattern: '/api/v1/checkout/:token/create-stripe-intent'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { token: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/invoice/payment_link/checkout_create_intent').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/invoice/payment_link/checkout_create_intent').default['handle']>>>
    }
  }
  'stripe_webhook': {
    methods: ["POST"]
    pattern: '/webhooks/stripe'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/webhooks/stripe_webhook').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/webhooks/stripe_webhook').default['handle']>>>
    }
  }
  'authorize.show': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/oauth/authorize'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/oauth_validator').authorizeRequestValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/oauth/authorize').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/oauth/authorize').default['show']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'authorize.consent': {
    methods: ["POST"]
    pattern: '/api/v1/oauth/authorize/consent'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/oauth_validator').consentSubmitValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/oauth_validator').consentSubmitValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/oauth/authorize').default['consent']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/oauth/authorize').default['consent']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'token': {
    methods: ["POST"]
    pattern: '/api/v1/oauth/token'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/oauth_validator').tokenRequestValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/oauth_validator').tokenRequestValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/oauth/token').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/oauth/token').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'revoke': {
    methods: ["POST"]
    pattern: '/api/v1/oauth/revoke'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/oauth_validator').revokeRequestValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/oauth_validator').revokeRequestValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/oauth/revoke').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/oauth/revoke').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'exchange_session': {
    methods: ["POST"]
    pattern: '/api/v1/oauth/exchange-session'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/oauth/exchange_session').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/oauth/exchange_session').default['handle']>>>
    }
  }
  'create_feedback': {
    methods: ["POST"]
    pattern: '/api/v1/feedback'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/feedback/create').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/feedback/create').default['handle']>>>
    }
  }
  'my_feedback': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/feedback/mine'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/feedback/mine').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/feedback/mine').default['handle']>>>
    }
  }
  'create_bug_report': {
    methods: ["POST"]
    pattern: '/api/v1/bug-report'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/bug_report/create').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/bug_report/create').default['handle']>>>
    }
  }
}
