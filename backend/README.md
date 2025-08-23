# Video Generation API

A robust Node.js/TypeScript API for generating videos using Google's Veo AI model, with automatic S3 storage and MongoDB persistence.

## Features

- 🎥 **AI Video Generation** - Generate videos from text prompts using Google Veo 3.0
- ☁️ **S3 Storage** - Automatic upload to AWS S3 with presigned URLs
- 📊 **MongoDB Persistence** - Store video metadata and generation history
- 🔒 **Type Safety** - Full TypeScript implementation with strict typing
- 🛡️ **Error Handling** - Comprehensive error handling and validation
- 📈 **Monitoring** - Health checks and connection monitoring
- 🚀 **Performance** - Streaming uploads and efficient multipart handling

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │───▶│   Backend API   │───▶│  Google Veo API │
│   (React)       │    │   (Express)     │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │                        │
                                ▼                        ▼
                       ┌─────────────────┐    ┌─────────────────┐
                       │   MongoDB       │    │    AWS S3       │
                       │   (Metadata)    │    │   (Videos)      │
                       └─────────────────┘    └─────────────────┘
```

## Quick Start

### Prerequisites

- Node.js 18+ and pnpm
- MongoDB database
- AWS S3 bucket
- Google GenerativeAI API key

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd video-gen/backend

# Install dependencies
pnpm install

# Copy environment template
cp .env.example .env

# Edit .env with your credentials
nano .env
```

### Environment Configuration

Create a `.env` file with the following variables:

```env
# Server Configuration
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000

# Google GenerativeAI
GOOGLE_API_KEY=your_google_api_key_here

# MongoDB
MONGODB_URL=mongodb://localhost:27017/video-gen
# or for MongoDB Atlas:
# MONGODB_URL=mongodb+srv://username:password@cluster.mongodb.net/video-gen

# AWS S3
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=us-east-1
S3_BUCKET_NAME=your-video-bucket
S3_BUCKET_REGION=us-east-1
```

### Development

```bash
# Start development server with hot reload
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start
```



#### Generate Video
```http
POST /api/videos/generate
Content-Type: application/json

{
  "prompt": "A serene sunset over mountains",
  "duration": 8,
  "quality": "high",
  "userId": "user123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "ACTIVE",
    "s3Key": "videos/1703423400000.mp4",
    "publicUrl": "https://bucket.s3.region.amazonaws.com/...",
    "prompt": "A serene sunset over mountains",
    "name": "files/abc123def456",
    "mimeType": "video/mp4",
    "createTime": "2025-01-24T10:30:00.000Z",
    "durationSec": "8s",
    "uri": "https://generativelanguage.googleapis.com/v1beta/files/abc123def456"
  },
  "message": "Video generated successfully"
}
```

#### List Videos
```http
GET /api/videos/list?expiresIn=3600
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "key": "videos/1703423400000.mp4",
      "url": "https://bucket.s3.amazonaws.com/...",
      "size": 1048576,
      "lastModified": "2025-01-24T10:30:00.000Z"
    }
  ],
  "message": "Retrieved 1 videos successfully"
}
```

#### Get Video URL
```http
GET /api/videos/:key?expiresIn=3600
```

**Response:**
```json
{
  "success": true,
  "data": {
    "publicUrl": "https://bucket.s3.amazonaws.com/..."
  },
  "message": "Video URL retrieved successfully"
}
```



## Project Structure

```
backend/
├── src/
│   ├── config/
│   │   └── env.ts              # Environment configuration
│   ├── db/
│   │   └── mongo.ts            # MongoDB connection
│   ├── middleware/
│   │   └── errorHandler.ts     # Error handling middleware
│   ├── models/
│   │   └── video.model.ts      # MongoDB video schema
│   ├── routes/
│   │   └── video.router.ts     # Video API routes
│   ├── services/
│   │   ├── s3service.ts        # S3 operations
│   │   └── veoService.ts       # Google Veo integration
│   ├── types/
│   │   ├── index.ts            # Common types
│   │   └── video.types.ts      # Video-specific types
│   └── main.ts                 # Application entry point
├── package.json
├── tsconfig.json
└── README.md
```

## Services Overview

### VeoService
Handles Google Veo API integration:
- Video generation with text prompts
- Streaming and disk fallback for uploads
- Metadata extraction and management
- Robust error handling and retries

### S3Service
Manages AWS S3 operations:
- Multipart uploads for large files
- Presigned URL generation
- File listing with metadata
- Stream-to-S3 direct uploads

### Database Models
MongoDB schemas with validation:
- Video metadata storage
- User tracking and analytics
- Expiration handling
- Query optimization with indexes

## Development Guidelines

### Code Style
- Use TypeScript with strict mode
- Follow ESLint configuration
- Document all public APIs
- Use meaningful variable names
- Keep functions small and focused

### Error Handling
- Use custom error classes
- Provide user-friendly messages
- Log errors with appropriate levels
- Include request context in development

## Deployment

### Docker Deployment
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist/ ./dist/
EXPOSE 5000
CMD ["node", "dist/main.js"]
```

### Environment Variables for Production
Ensure all required environment variables are set:
- Database connection strings
- API keys and secrets
- AWS credentials and regions
- CORS origins for security

### Monitoring
- Health check endpoint: `/health`
- MongoDB connection status
- S3 connectivity verification
- Error logging and alerting

## Security Considerations

- ✅ Environment variable validation
- ✅ Input sanitization and validation
- ✅ CORS configuration
- ✅ Error message sanitization
- ✅ MongoDB injection prevention
- ✅ AWS IAM permissions (least privilege)

