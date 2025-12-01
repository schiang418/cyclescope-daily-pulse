import dotenv from 'dotenv';

dotenv.config();

export const config = {
  // Server
  port: process.env.PORT || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Database
  databaseUrl: process.env.DATABASE_URL,
  
  // Gemini API
  geminiApiKey: process.env.GEMINI_API_KEY,
  
  // Storage
  useS3: process.env.USE_S3 === 'true',
  railwayVolumePath: process.env.RAILWAY_VOLUME_MOUNT_PATH || '/data',
  publicUrl: process.env.PUBLIC_URL || 'http://localhost:3001',
  
  // AWS S3 (optional)
  aws: {
    region: process.env.AWS_REGION || 'us-west-2',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    s3BucketName: process.env.S3_BUCKET_NAME,
  },
  
  // CORS
  allowedOrigins: (process.env.ALLOWED_ORIGINS || 'http://localhost:8080')
    .split(',')
    .map(origin => origin.trim()),
  
  // API Authentication
  apiSecretKey: process.env.API_SECRET_KEY,
};

// Validate required config
export function validateConfig() {
  const required = [
    'databaseUrl',
    'geminiApiKey',
    'apiSecretKey',
  ];
  
  const missing = required.filter(key => {
    const value = key.split('.').reduce((obj, k) => obj?.[k], config);
    return !value;
  });
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}
