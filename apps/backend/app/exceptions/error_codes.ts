export type ErrorType =
  | 'authentication_error'
  | 'permission_error'
  | 'not_found_error'
  | 'invalid_request_error'
  | 'validation_error'
  | 'conflict_error'
  | 'rate_limit_error'
  | 'vault_locked_error'
  | 'two_factor_required_error'
  | 'email_verification_required_error'
  | 'onboarding_required_error'
  | 'payment_required_error'
  | 'unprocessable_error'
  | 'api_error'
  | 'service_unavailable_error'

export type ErrorVisibility = 'user_facing' | 'internal'

export interface ErrorDefinition {
  type: ErrorType
  status: number
  visibility: ErrorVisibility
  defaultMessage: string
}

export const ERROR_CODES = {
  account_session_invalid: {
    type: 'authentication_error',
    status: 401,
    visibility: 'user_facing',
    defaultMessage: 'Invalid authorization',
  },
  account_session_expired: {
    type: 'authentication_error',
    status: 401,
    visibility: 'user_facing',
    defaultMessage: 'Session expired, please login again',
  },
  account_credentials_invalid: {
    type: 'authentication_error',
    status: 401,
    visibility: 'user_facing',
    defaultMessage: 'Invalid email or password',
  },
  account_two_factor_required: {
    type: 'two_factor_required_error',
    status: 401,
    visibility: 'user_facing',
    defaultMessage: 'Two-factor authentication required',
  },
  account_two_factor_invalid: {
    type: 'authentication_error',
    status: 401,
    visibility: 'user_facing',
    defaultMessage: 'Invalid two-factor code',
  },
  account_email_not_verified: {
    type: 'email_verification_required_error',
    status: 403,
    visibility: 'user_facing',
    defaultMessage: 'Email verification is required for this action',
  },
  account_onboarding_incomplete: {
    type: 'onboarding_required_error',
    status: 403,
    visibility: 'user_facing',
    defaultMessage: 'Onboarding must be completed first',
  },
  account_locked: {
    type: 'authentication_error',
    status: 423,
    visibility: 'user_facing',
    defaultMessage: 'Account is temporarily locked',
  },

  vault_locked: {
    type: 'vault_locked_error',
    status: 423,
    visibility: 'user_facing',
    defaultMessage: 'Vault is locked. Please provide your password to unlock',
  },
  vault_key_invalid: {
    type: 'vault_locked_error',
    status: 423,
    visibility: 'user_facing',
    defaultMessage: 'Invalid vault key',
  },

  permission_denied: {
    type: 'permission_error',
    status: 403,
    visibility: 'user_facing',
    defaultMessage: "You don't have permission to perform this action",
  },
  permission_team_role_required: {
    type: 'permission_error',
    status: 403,
    visibility: 'user_facing',
    defaultMessage: 'This action requires admin role in the team',
  },
  permission_admin_required: {
    type: 'permission_error',
    status: 403,
    visibility: 'user_facing',
    defaultMessage: 'This action requires platform admin privileges',
  },
  permission_not_team_member: {
    type: 'permission_error',
    status: 403,
    visibility: 'user_facing',
    defaultMessage: 'You are not a member of this team',
  },

  team_not_selected: {
    type: 'invalid_request_error',
    status: 400,
    visibility: 'user_facing',
    defaultMessage: 'No team selected. Please select a team first',
  },
  team_not_found: {
    type: 'not_found_error',
    status: 404,
    visibility: 'user_facing',
    defaultMessage: 'Team not found',
  },

  validation_failed: {
    type: 'validation_error',
    status: 422,
    visibility: 'user_facing',
    defaultMessage: 'Request validation failed',
  },
  invalid_request: {
    type: 'invalid_request_error',
    status: 400,
    visibility: 'user_facing',
    defaultMessage: 'Invalid request',
  },
  invalid_code: {
    type: 'invalid_request_error',
    status: 422,
    visibility: 'user_facing',
    defaultMessage: 'Invalid code',
  },
  invalid_token: {
    type: 'invalid_request_error',
    status: 400,
    visibility: 'user_facing',
    defaultMessage: 'Invalid or expired token',
  },
  invalid_filename: {
    type: 'invalid_request_error',
    status: 400,
    visibility: 'user_facing',
    defaultMessage: 'Invalid filename',
  },

  resource_not_found: {
    type: 'not_found_error',
    status: 404,
    visibility: 'user_facing',
    defaultMessage: 'Resource not found',
  },
  resource_conflict: {
    type: 'conflict_error',
    status: 409,
    visibility: 'user_facing',
    defaultMessage: 'Resource already exists or is in a conflicting state',
  },

  client_not_found: {
    type: 'not_found_error',
    status: 404,
    visibility: 'user_facing',
    defaultMessage: 'Client not found',
  },

  invoice_not_found: {
    type: 'not_found_error',
    status: 404,
    visibility: 'user_facing',
    defaultMessage: 'Invoice not found',
  },
  invoice_already_sent: {
    type: 'conflict_error',
    status: 409,
    visibility: 'user_facing',
    defaultMessage: 'Invoice has already been sent',
  },
  invoice_already_paid: {
    type: 'conflict_error',
    status: 409,
    visibility: 'user_facing',
    defaultMessage: 'Invoice is already marked as paid',
  },
  invoice_payment_method_invalid: {
    type: 'invalid_request_error',
    status: 422,
    visibility: 'user_facing',
    defaultMessage: 'Selected payment method is not configured for this team',
  },

  quote_not_found: {
    type: 'not_found_error',
    status: 404,
    visibility: 'user_facing',
    defaultMessage: 'Quote not found',
  },
  quote_already_converted: {
    type: 'conflict_error',
    status: 409,
    visibility: 'user_facing',
    defaultMessage: 'Quote has already been converted to an invoice',
  },

  credit_note_not_found: {
    type: 'not_found_error',
    status: 404,
    visibility: 'user_facing',
    defaultMessage: 'Credit note not found',
  },

  payment_link_not_found: {
    type: 'not_found_error',
    status: 404,
    visibility: 'user_facing',
    defaultMessage: 'Payment link not found or expired',
  },
  payment_link_already_paid: {
    type: 'conflict_error',
    status: 409,
    visibility: 'user_facing',
    defaultMessage: 'Payment already marked as sent',
  },
  payment_link_password_invalid: {
    type: 'authentication_error',
    status: 401,
    visibility: 'user_facing',
    defaultMessage: 'Invalid password',
  },

  einvoicing_not_configured: {
    type: 'invalid_request_error',
    status: 400,
    visibility: 'user_facing',
    defaultMessage: 'E-invoicing is not configured for this team',
  },
  einvoicing_submission_conflict: {
    type: 'conflict_error',
    status: 409,
    visibility: 'user_facing',
    defaultMessage: 'Document has already been submitted via e-invoicing',
  },
  einvoicing_signature_invalid: {
    type: 'authentication_error',
    status: 401,
    visibility: 'internal',
    defaultMessage: 'Invalid webhook signature',
  },

  rate_limit_exceeded: {
    type: 'rate_limit_error',
    status: 429,
    visibility: 'user_facing',
    defaultMessage: 'Too many requests, please slow down',
  },

  internal_error: {
    type: 'api_error',
    status: 500,
    visibility: 'user_facing',
    defaultMessage: 'An unexpected error occurred',
  },
  service_unavailable: {
    type: 'service_unavailable_error',
    status: 503,
    visibility: 'user_facing',
    defaultMessage: 'Service temporarily unavailable',
  },
} as const satisfies Record<string, ErrorDefinition>

export type ErrorCode = keyof typeof ERROR_CODES

export function getErrorDefinition(code: ErrorCode): ErrorDefinition {
  return ERROR_CODES[code]
}
