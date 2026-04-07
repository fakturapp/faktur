import vine from '@vinejs/vine'

const eventSchema = vine.object({
  eventType: vine.string().trim().maxLength(50),
  eventName: vine.string().trim().maxLength(100),
  pagePath: vine.string().trim().maxLength(255).optional(),
  pagePathFull: vine.string().trim().maxLength(2000).optional(),
  metadata: vine.any().optional(),
  metadataSensitive: vine.any().optional(),
  timestamp: vine.string().trim(),
})

const errorSchema = vine.object({
  errorType: vine.string().trim().maxLength(50),
  errorMessage: vine.string().trim().maxLength(255),
  errorMessageFull: vine.string().trim().maxLength(5000).optional(),
  stackTrace: vine.string().trim().maxLength(10000).optional(),
  pagePath: vine.string().trim().maxLength(255).optional(),
  timestamp: vine.string().trim(),
})

const performanceSchema = vine.object({
  metricName: vine.string().trim().maxLength(30),
  metricValue: vine.number().min(0),
  rating: vine.string().trim().maxLength(30),
  pagePath: vine.string().trim().maxLength(255).optional(),
  connectionType: vine.string().trim().maxLength(20).optional(),
  timestamp: vine.string().trim(),
})

export const ingestValidator = vine.compile(
  vine.object({
    sessionId: vine.string().trim().maxLength(64),
    consentAnalytics: vine.boolean(),
    screenWidth: vine.number().min(0).max(10000).optional(),
    screenHeight: vine.number().min(0).max(10000).optional(),
    language: vine.string().trim().maxLength(10).optional(),
    referrer: vine.string().trim().maxLength(2000).optional(),
    events: vine.array(eventSchema).maxLength(100).optional(),
    errors: vine.array(errorSchema).maxLength(50).optional(),
    performance: vine.array(performanceSchema).maxLength(20).optional(),
  })
)

export const consentValidator = vine.compile(
  vine.object({
    consentAnalytics: vine.boolean(),
    consentEssential: vine.boolean(),
    action: vine.string().trim().maxLength(50),
    visitorId: vine.string().trim().maxLength(64),
  })
)
