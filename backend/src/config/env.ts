import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

/**
 * Environment variable validation and type definitions
 */
interface EnvironmentConfig {
  /** Server port number */
  port: number;
  /** Node environment (development, production, test) */
  nodeEnv: string;
  /** Google GenerativeAI API key */
  googleApiKey: string;
  /** MongoDB connection URL */
  mongodbUrl: string;
  /** CORS allowed origin */
  corsOrigin: string;
  /** AWS configuration */
  aws: {
    /** AWS region */
    region: string;
    /** AWS access key ID */
    accessKeyId: string;
    /** AWS secret access key */
    secretAccessKey: string;
    /** S3-specific configuration */
    s3: {
      /** S3 bucket name for video storage */
      bucketName: string;
      /** S3 bucket region (can differ from main AWS region) */
      bucketRegion: string;
    };
  };
}

/**
 * Application configuration loaded from environment variables
 * All values are validated and typed for runtime safety
 */
export const config: EnvironmentConfig = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  googleApiKey: process.env.GOOGLE_API_KEY || '',
  mongodbUrl: process.env.MONGODB_URL || '',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',

  // AWS Configuration
  aws: {
    region: process.env.AWS_REGION || 'us-east-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    s3: {
      bucketName: process.env.S3_BUCKET_NAME || '',
      bucketRegion: process.env.S3_BUCKET_REGION || process.env.AWS_REGION || 'us-east-1'
    }
  }
} as const;

/**
 * Environment variables that are absolutely required for the application to function
 */
const REQUIRED_ENV_VARS = [
  'GOOGLE_API_KEY',
  'MONGODB_URL',
  'AWS_ACCESS_KEY_ID',
  'AWS_SECRET_ACCESS_KEY',
  'S3_BUCKET_NAME'
] as const;

/**
 * Environment variables that are recommended but not strictly required
 */
const RECOMMENDED_ENV_VARS = [
  'AWS_REGION',
  'S3_BUCKET_REGION',
  'CORS_ORIGIN'
] as const;

/**
 * Validates environment variables and throws descriptive errors
 */
function validateEnvironment(): void {
  const missingRequired = REQUIRED_ENV_VARS.filter(envVar => !process.env[envVar]);
  const missingRecommended = RECOMMENDED_ENV_VARS.filter(envVar => !process.env[envVar]);

  if (missingRequired.length > 0) {
    const errorMessage = [
      'Missing required environment variables:',
      ...missingRequired.map(envVar => `  - ${envVar}`),
      '',
      'Please check your .env file or environment configuration.'
    ].join('\n');

    throw new Error(errorMessage);
  }

  if (missingRecommended.length > 0 && config.nodeEnv === 'production') {
    console.warn('⚠️  Missing recommended environment variables for production:');
    missingRecommended.forEach(envVar => {
      console.warn(`   - ${envVar}`);
    });
  }

  // Validate port number
  if (isNaN(config.port) || config.port < 1 || config.port > 65535) {
    throw new Error(`Invalid PORT value: ${process.env.PORT}. Must be a number between 1 and 65535.`);
  }

  // Validate MongoDB URL format
  if (!config.mongodbUrl.startsWith('mongodb://') && !config.mongodbUrl.startsWith('mongodb+srv://')) {
    throw new Error('MONGODB_URL must start with mongodb:// or mongodb+srv://');
  }

  console.log(`✅ Environment configuration loaded for ${config.nodeEnv} environment`);
  if (config.nodeEnv === 'development') {
    console.log(`   - Server will run on port ${config.port}`);
    console.log(`   - CORS origin: ${config.corsOrigin}`);
    console.log(`   - AWS region: ${config.aws.region}`);
    console.log(`   - S3 bucket: ${config.aws.s3.bucketName} (${config.aws.s3.bucketRegion})`);
  }
}

// Validate environment on module load
validateEnvironment();