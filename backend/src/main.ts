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
export const app: Application = express();

app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
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
}));



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

// Start the application only if not in serverless environment
if (process.env.NODE_ENV !== 'serverless' && !process.env.AWS_LAMBDA_FUNCTION_NAME) {
  startServer();
}