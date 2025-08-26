# Serverless Framework Deployment Guide

## 🚀 AWS Lambda Deployment with Serverless Framework

### Prerequisites

1. **AWS CLI configured**:
```bash
aws configure
# Enter your AWS Access Key, Secret Key, Region, and Output format
```

2. **Serverless Framework installed**:
```bash
npm install -g serverless
```

3. **Dependencies installed**:
```bash
pnpm install
```

### Environment Setup

1. **Copy environment file**:
```bash
cp .env.example .env
```

2. **Update .env with your values**:
```env
NODE_ENV=production
MONGODB_URL=mongodb+srv://user:pass@cluster.mongodb.net/videogen
GOOGLE_API_KEY=your_google_ai_api_key
CORS_ORIGIN=https://your-frontend-domain.com
AWS_REGION=us-east-1
S3_BUCKET_NAME=your-bucket-name
S3_BUCKET_REGION=ap-south-1
```

### Deployment Commands

#### Development Deployment
```bash
# Build and deploy to development stage
npm run deploy

# Or manually:
npm run build
serverless deploy --stage dev
```

#### Production Deployment
```bash
# Deploy to production
npm run deploy:prod

# Or manually:
npm run build
serverless deploy --stage prod
```

#### Local Testing
```bash
# Test serverless functions locally
npm run sls:offline

# This will start a local server on http://localhost:5000
```

### Monitoring and Logs

#### View Logs
```bash
# View real-time logs
npm run sls:logs

# Or manually:
serverless logs -f app --tail --stage prod
```

#### Function Information
```bash
# Get deployment info
serverless info --stage prod

# List all deployments
serverless deploy list
```

### Environment Variables in AWS

The serverless.yml automatically maps your .env variables to Lambda environment variables:

- `MONGODB_URL` → MongoDB connection string
- `GOOGLE_API_KEY` → Google AI API key
- `CORS_ORIGIN` → Allowed CORS origins
- `S3_BUCKET_NAME` → S3 bucket for video storage
- `S3_BUCKET_REGION` → S3 bucket region

### IAM Permissions

The serverless.yml includes necessary S3 permissions:

```yaml
iam:
  role:
    statements:
      - Effect: Allow
        Action:
          - s3:GetObject
          - s3:PutObject
          - s3:DeleteObject
          - s3:ListBucket
        Resource:
          - arn:aws:s3:::${env:S3_BUCKET_NAME}
          - arn:aws:s3:::${env:S3_BUCKET_NAME}/*
```

### API Gateway Endpoints

After deployment, you'll get:
- **API Gateway URL**: `https://xxxxxxx.execute-api.region.amazonaws.com/dev/`
- **Health Check**: `GET /health`
- **Generate Video**: `POST /api/videos/generate`
- **List Videos**: `GET /api/videos/list`

### Troubleshooting

#### Common Issues:

1. **AWS Credentials**:
```bash
# Check AWS credentials
aws sts get-caller-identity
```

2. **Build Errors**:
```bash
# Clean build
rm -rf dist/
npm run build
```

3. **Environment Variables**:
```bash
# Check environment in Lambda
serverless invoke -f app -l --stage prod
```

4. **S3 Permissions**:
- Ensure your AWS user has S3 permissions
- Check bucket name and region match

### Cost Optimization

Lambda pricing is pay-per-request:
- **Free Tier**: 1M requests/month
- **Memory**: 1024MB (adjustable in serverless.yml)
- **Timeout**: 30 seconds (adjustable)

### Production Considerations

1. **Custom Domain** (optional):
```bash
# Add custom domain plugin
serverless plugin install -n serverless-domain-manager
```

2. **VPC Configuration** (if needed for database):
```yaml
provider:
  vpc:
    securityGroupIds:
      - sg-xxxxxxxxx
    subnetIds:
      - subnet-xxxxxxxxx
```

3. **Environment Stages**:
```bash
# Different stages for different environments
serverless deploy --stage staging
serverless deploy --stage production
```

### Removal

To remove the entire stack:
```bash
serverless remove --stage dev
serverless remove --stage prod
```

---

**Your backend is now ready for serverless deployment! 🎉**
