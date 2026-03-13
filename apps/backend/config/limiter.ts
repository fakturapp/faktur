import { defineConfig, stores } from '@adonisjs/limiter'

const limiterConfig = defineConfig({
  default: 'database',
  stores: {
    database: stores.database({
      tableName: 'rate_limits',
      connectionName: 'postgres',
    }),
  },
})

export default limiterConfig

declare module '@adonisjs/limiter/types' {
  interface LimitersList extends InferLimiters<typeof limiterConfig> {}
}
