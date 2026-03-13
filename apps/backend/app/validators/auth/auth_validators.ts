import vine from '@vinejs/vine'
import securityConfig from '#config/security'

export const registerValidator = vine.compile(
  vine.object({
    fullName: vine.string().trim().minLength(2).maxLength(255),
    email: vine
      .string()
      .trim()
      .email()
      .normalizeEmail()
      .unique(async (db, value) => {
        const user = await db.from('users').where('email', value).first()
        return !user
      }),
    password: vine.string().minLength(securityConfig.password.minLength).maxLength(128).confirmed(),
  })
)

export const loginValidator = vine.compile(
  vine.object({
    email: vine.string().trim().email().normalizeEmail(),
    password: vine.string(),
  })
)

export const passwordResetRequestValidator = vine.compile(
  vine.object({
    email: vine.string().trim().email().normalizeEmail(),
  })
)

export const passwordResetValidator = vine.compile(
  vine.object({
    token: vine.string(),
    password: vine.string().minLength(securityConfig.password.minLength).maxLength(128).confirmed(),
  })
)

export const twoFactorSetupValidator = vine.compile(
  vine.object({
    code: vine
      .string()
      .fixedLength(6)
      .regex(/^\d{6}$/),
  })
)

export const twoFactorVerifyValidator = vine.compile(
  vine.object({
    code: vine.string().minLength(6).maxLength(11),
    userId: vine.string(),
  })
)
