const securityConfig = {
  password: {
    minLength: 8,
    requireUppercase: false,
    requireLowercase: false,
    requireNumbers: false,
    requireSymbols: false,
  },

  twoFactor: {
    issuer: 'Faktur',
    recoveryCodesCount: 10,
    recoveryCodeLength: 10,
    window: 2,
  },

  tokens: {
    passwordResetExpiry: 600,
    emailVerificationExpiry: 600,
    hashAlgorithm: 'sha256' as const,
  },

  rateLimit: {
    login: {
      requests: 5,
      duration: '15 mins',
    },
    register: {
      requests: 3,
      duration: '1 hour',
    },
    passwordReset: {
      requests: 3,
      duration: '1 hour',
    },
    api: {
      requests: 1000,
      duration: '1 hour',
    },
  },

  encryption: {
    algorithm: 'aes-256-gcm' as const,
  },

  webauthn: {
    rpName: 'FakturApp',
    timeout: 60000,
  },
}

export default securityConfig
