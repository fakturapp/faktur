/* eslint-disable prettier/prettier */
import type { routes } from './index.ts'

export interface ApiDefinition {
  signup: typeof routes['signup']
  verifyEmail: typeof routes['verify_email']
  resendVerification: typeof routes['resend_verification']
  login: typeof routes['login']
  twoFactorVerify: typeof routes['two_factor_verify']
  passwordResetRequest: typeof routes['password_reset_request']
  passwordReset: typeof routes['password_reset']
  logout: typeof routes['logout']
  me: typeof routes['me']
  profileShow: typeof routes['profile_show']
  twoFactorSetup: typeof routes['two_factor_setup']
  twoFactorEnable: typeof routes['two_factor_enable']
  twoFactorDisable: typeof routes['two_factor_disable']
}
