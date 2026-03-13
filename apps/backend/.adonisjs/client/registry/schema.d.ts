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
}
