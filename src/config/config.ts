export const config = {
  app: {
    name: process.env.APP_NAME,
    port: parseInt(process.env.PORT || '8082'),
    nodeEnv: process.env.NODE_ENV || 'development'
  },
  database: {
    mongodbUrl: process.env.MONGODB_URL,
    postgresUrl: process.env.POSTGRES_URL,
    redisUrl: process.env.REDIS_URL
  },
  cors: {
    origin: process.env.ALLOWED_ORIGINS?.split(','),
    credentials: true,
  },
  logging: {
    level: process.env.LOG_LEVEL || 'log'
  }
};
