import vine from '@vinejs/vine'

export const updateInvoiceSettingsValidator = vine.compile(
  vine.object({
    billingType: vine.enum(['quick', 'detailed']),
    accentColor: vine.string().trim().regex(/^#[0-9a-fA-F]{6}$/),
    paymentMethods: vine.array(vine.enum(['bank_transfer', 'cash', 'custom'])),
    customPaymentMethod: vine.string().trim().maxLength(255).optional(),
  })
)
