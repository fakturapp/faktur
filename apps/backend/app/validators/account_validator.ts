import vine from '@vinejs/vine'
import { confirmedPasswordField } from '#validators/shared/password_schema'

export const emailChangeValidator = vine.compile(
  vine.object({
    newEmail: vine.string().email().trim().maxLength(254),
  })
)

export const securityVerifyValidator = vine.compile(
  vine.object({
    code: vine.string().trim(),
    method: vine.string().trim().maxLength(30).optional(),
  })
)

export const deleteAccountValidator = vine.compile(
  vine.object({
    password: vine.string(),
  })
)

export const deletionVerifyNameValidator = vine.compile(
  vine.object({
    fullName: vine.string().trim(),
  })
)

export const deletionVerifyCodeValidator = vine.compile(
  vine.object({
    code: vine.string().trim(),
  })
)

export const deletionVerifyPasswordValidator = vine.compile(
  vine.object({
    password: vine.string(),
  })
)

export const deletionConfirmValidator = vine.compile(
  vine.object({
    confirmText: vine.string().trim(),
  })
)

export const deletionResolveTeamValidator = vine.compile(
  vine.object({
    teamId: vine.string().uuid(),
    action: vine.string().trim().maxLength(30),
    password: vine.string().optional(),
    transferToUserId: vine.string().uuid().optional(),
  })
)

export const updateProfileValidator = vine.compile(
  vine.object({
    fullName: vine.string().trim().minLength(2).maxLength(255).optional(),
    avatarUrl: vine.string().trim().maxLength(500).optional(),
  })
)

export const changePasswordValidator = vine.compile(
  vine.object({
    currentPassword: vine.string(),
    password: confirmedPasswordField(),
  })
)
