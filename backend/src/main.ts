import express, { type Application, type Request, type Response } from 'express';
import cors from 'cors';
import { config } from './config/env.js';
import { connectMongo } from './db/mongo.js';
import { videoRoutes } from './routes/video.router.js';
import { errorHandler } from './middleware/errorHandler.js';
import { type ApiResponse } from './types/index.js';

/**
 * Express application for Video Generation API
 * Handles video generation using Google's Veo API and S3 storage
 */
const app: Application = express();

/**
 * CORS configuration for cross-origin requests
 * Supports multiple origins for different environments
 */
const getAllowedOrigins = (): string[] => {
  const origins = [
    config.corsOrigin, // Primary configured origin
    'http://localhost:3000', // Local development
    'http://localhost:5173', // Vite dev server
    'https://video-genai31.vercel.app', // Production Vercel deployment
  ];

  // Add any additional origins from environment variable
  if (process.env.ADDITIONAL_CORS_ORIGINS) {
    const additionalOrigins = process.env.ADDITIONAL_CORS_ORIGINS.split(',').map(origin => origin.trim());
    origins.push(...additionalOrigins);
  }

  return [...new Set(origins)]; // Remove duplicates
};

app.use(cors({
  origin: (origin, callback) => {
    const allowedOrigins = getAllowedOrigins();

    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);

    // Check if origin is allowed
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    // Log blocked requests for debugging
    console.warn(`🚫 CORS blocked request from origin: ${origin}`);
    console.log(`✅ Allowed origins: ${allowedOrigins.join(', ')}`);

    return callback(new Error('Not allowed by CORS policy'), false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'x-requested-with',
    'Accept',
    'Origin',
    'Cache-Control',
    'X-Requested-With'
  ],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  optionsSuccessStatus: 200, // Support legacy browsers
  preflightContinue: false // Pass control to next handler
}));

/**
 * Explicit OPTIONS handler for preflight requests
 * This ensures CORS preflight requests are handled correctly
 */
app.options('*', (req: Request, res: Response) => {
  const allowedOrigins = getAllowedOrigins();
  const origin = req.headers.origin;

  if (!origin || allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin || '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, HEAD');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-requested-with, Accept, Origin, Cache-Control, X-Requested-With');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Max-Age', '86400'); // 24 hours
  }

  res.sendStatus(200);
});

/**
 * Body parsing middleware
 */
app.use(express.json({
  limit: '10mb', // Allow larger payloads for video metadata
  type: 'application/json'
}));
app.use(express.urlencoded({
  extended: true,
  limit: '10mb'
}));

/**
 * Request logging middleware (development only)
 */
if (config.nodeEnv === 'development') {
  app.use((req: Request, res: Response, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
  });
}

/**
 * API Routes
 */
app.use('/api/videos', videoRoutes);

/**
 * Health check endpoint
 */
app.get('/health', (req: Request, res: Response<ApiResponse>) => {
  res.json({
    success: true,
    message: 'Video Generator API is running!',
    data: {
      timestamp: new Date().toISOString(),
      environment: config.nodeEnv,
      version: process.env.npm_package_version || '1.0.0'
    }
  });
});

/**
 * API documentation endpoint
 */
app.get('/api', (req: Request, res: Response) => {
  res.json({
    name: 'Video Generation API',
    version: '1.0.0',
    description: 'API for generating videos using Google Veo and storing in S3',
    endpoints: {
      'GET /health': 'Health check',
      'POST /api/videos/generate': 'Generate a new video',
      'GET /api/videos/list': 'List all videos',
      'GET /api/videos/:key': 'Get presigned URL for a video'
    },
    documentation: 'See README.md for detailed API documentation'
  });
});

/**
 * 404 handler for unknown routes
 */
// app.all('*', (req: Request, res: Response<ApiResponse>) => {
//   res.status(404).json({
//     success: false,
//     error: `Route ${req.method} ${req.originalUrl} not found`,
//     data: {
//       availableRoutes: [
//         'GET /health',
//         'GET /api',
//         'POST /api/videos/generate',
//         'GET /api/videos/list',
//         'GET /api/videos/:key'
//       ]
//     }
//   });
// });

/**
 * Global error handling middleware
 */
app.use(errorHandler);

/**
 * Start the server and connect to MongoDB
 */
async function startServer(): Promise<void> {
  try {
    // Connect to MongoDB first
    console.log('🔌 Connecting to MongoDB...');
    await connectMongo(config.mongodbUrl);
    console.log('✅ Connected to MongoDB successfully');

    // Start the HTTP server
    const server = app.listen(config.port, () => {
      console.log('🚀 Video Generation API Server Started');
      console.log(`   - Port: ${config.port}`);
      console.log(`   - Environment: ${config.nodeEnv}`);
      console.log(`   - Health check: http://localhost:${config.port}/health`);
      console.log(`   - API docs: http://localhost:${config.port}/api`);

      if (config.nodeEnv === 'development') {
        console.log('📝 Development mode - detailed logging enabled');
      }
    });

    // Graceful shutdown handling
    const gracefulShutdown = (signal: string) => {
      console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);

      server.close((err) => {
        if (err) {
          console.error('❌ Error during server shutdown:', err);
          process.exit(1);
        }

        console.log('✅ Server closed successfully');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Start the application
startServer();