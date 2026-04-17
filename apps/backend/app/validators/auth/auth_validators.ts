import vine from '@vinejs/vine'
import { confirmedPasswordField } from '#validators/shared/password_schema'

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
    password: confirmedPasswordField().maxLength(128),
    turnstileToken: vine.string().optional(),
  })
)

export const loginValidator = vine.compile(
  vine.object({
    email: vine.string().trim().email().normalizeEmail(),
    password: vine.string(),
    turnstileToken: vine.string().optional(),
  })
)

export const checkEmailValidator = vine.compile(
  vine.object({
    email: vine.string().trim().email().normalizeEmail(),
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
    password: confirmedPasswordField().maxLength(128),
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
