# Video Generator AI 🎬

A modern web application that generates videos using Google's Veo AI model, with a beautiful dark mode interface and cloud storage integration.

## 🌟 Features

- **AI Video Generation**: Powered by Google's Veo 3.0 model
- **Beautiful UI**: Modern dark mode interface with responsive design
- **Cloud Storage**: Videos stored securely in AWS S3
- **Database**: MongoDB for metadata and video tracking
- **Real-time Updates**: Live progress tracking during generation
- **Responsive Design**: Works perfectly on desktop and mobile
- **Theme System**: Light/Dark/System theme switching

## 🏗️ Architecture
<img width="725" height="247" alt="image" src="https://github.com/user-attachments/assets/94853d3c-9d59-4ff4-8423-f1ba1d689124" />



## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and pnpm
- MongoDB database
- AWS S3 bucket
- Google AI Studio API key

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd video-gen

# Install dependencies for both frontend and backend
pnpm install
cd frontend && pnpm install
cd ../backend && pnpm install
```

### 2. Environment Configuration

**Backend** (`backend/.env`):
```env
# Server Configuration
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173

# Google AI
GOOGLE_API_KEY=your_google_ai_api_key

# MongoDB
MONGODB_URL=mongodb+srv://user:pass@cluster.mongodb.net/videogen

# AWS S3
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=us-east-1
S3_BUCKET_NAME=your-bucket-name
S3_BUCKET_REGION=us-east-1
```

**Frontend** (`frontend/.env.development`):
```env
VITE_API_BASE_URL=http://localhost:5000
VITE_ENABLE_LOGGING=true
APP_ENV=development
```

### 3. Development

```bash
# Start backend (from backend/)
cd backend
pnpm dev

# Start frontend (from frontend/)
cd frontend
pnpm dev
```

Visit http://localhost:5173 to see the application.

## 📱 API Documentation

### Generate Video
```http
POST /api/videos/generate
Content-Type: application/json

{
  "prompt": "A cinematic drone shot over mountains at sunrise"
}
```

### List Videos
```http
GET /api/videos/list?expiresIn=3600
```

### Health Check
```http
GET /health
```

## 🐳 Docker Deployment

### Backend Dockerfile

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package.json  ./

# Install pnpm globally
RUN npm install -g pnpm

# Install dependencies
RUN pnpm install

# Copy source code
COPY . .

# Build the TypeScript code
RUN pnpm build

# Expose the port
EXPOSE 5000

# Start the application
CMD ["node", "dist/main.js"]

```

### Build and Run

```bash
# Backend
cd backend
docker build -t video-gen-backend .
docker run -p 5000:5000 --env-file .env video-gen-backend

# Frontend
cd frontend
docker build -t video-gen-frontend .
docker run -p 3000:3000 video-gen-frontend
```

## ☁️ Cloud Deployment

### Google Cloud Run (Backend)

### Vercel (Frontend)



## 🔧 Configuration

### AWS S3 Setup

1. Create S3 bucket with private access
2. Create IAM user with permissions:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::your-bucket-name",
        "arn:aws:s3:::your-bucket-name/*"
      ]
    }
  ]
}
```

### MongoDB Setup

Option 1: **MongoDB Atlas** (Recommended)
```bash
# Create cluster at https://cloud.mongodb.com
# Get connection string and add to MONGODB_URL
```

Option 2: **Local MongoDB**
```bash
# Install MongoDB locally
mongod --dbpath ./data
# Use: mongodb://localhost:27017/videogen
```

### Google AI Studio

1. Visit https://ai.google.dev/
2. Create project and get API key
3. Enable Generative Language API
4. Add key to `GOOGLE_API_KEY`

## 📊 Monitoring

### Health Checks

```bash
# Backend health
curl https://your-backend-url.com/health

# Response
{
  "status": "healthy",
  "timestamp": "2025-01-20T10:30:00Z",
  "database": "connected",
  "storage": "accessible"
}
```


## 🧪 Development

### Project Structure

```
video-gen/
├── backend/                 # Node.js API server
│   ├── src/
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic
│   │   ├── models/         # Database models
│   │   ├── middleware/     # Express middleware
│   │   └── config/         # Configuration
│   ├── Dockerfile
│   └── package.json
├── frontend/               # React application
│   ├── src/
│   │   ├── components/     # UI components
│   │   ├── lib/           # Utilities and API
│   │   └── App.tsx        # Main component
│   ├── Dockerfile
│   └── package.json
└── README.md
```

### Code Quality

```bash
# Type checking
pnpm tsc --noEmit

# Linting
pnpm lint

# Formatting
pnpm format
```

## 🔒 Security

- **CORS**: Configured for specific origins
- **Environment Variables**: Sensitive data in env files
- **IAM**: Least privilege AWS permissions
- **Input Validation**: Request sanitization
- **Rate Limiting**: API endpoint protection

## 🐛 Troubleshooting

### Common Issues

**CORS Errors**:
```bash
# Update CORS_ORIGIN in backend .env
CORS_ORIGIN=https://your-frontend-domain.com
```

**Video Generation Fails**:
```bash
# Check Google AI API key and quota
# Verify Generative Language API is enabled
# Check backend logs for detailed errors
```

**S3 Upload Errors**:
```bash
# Verify AWS credentials and permissions
# Check bucket region matches S3_BUCKET_REGION
# Ensure bucket exists and is accessible
```

**Database Connection Issues**:
```bash
# Verify MongoDB URL format
# Check network connectivity
# Ensure database user has correct permissions
```

## 📝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open Pull Request



## 🙏 Acknowledgments

- [Google AI Studio](https://ai.google.dev/) for Veo video generation
- [shadcn/ui](https://ui.shadcn.com/) for beautiful UI components
- [Lucide React](https://lucide.dev/) for consistent icons
- [Tailwind CSS](https://tailwindcss.com/) for utility-first styling

