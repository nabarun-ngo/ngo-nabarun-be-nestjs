export const config = {
  app: {
    name: process.env.APP_NAME || 'NGO Nabarun',
    port: parseInt(process.env.PORT || '8082'),
    nodeEnv: process.env.NODE_ENV || 'development'
  },
  database: {
    mongodbUrl: process.env.MONGODB_URL || 'mongodb://localhost:27017/ngo-nabarun'
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'your-jwt-secret-key-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h'
  },
  cors: {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
    credentials: true,
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info'
  }
};
