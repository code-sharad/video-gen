# 🚀 Quick Serverless Deployment

## Setup Commands (Run Once)

```bash
# 1. Configure AWS CLI (if not done already)
aws configure

# 2. Install Serverless Framework globally
npm install -g serverless

# 3. Install dependencies
cd backend
pnpm install
```

## Deployment Commands

```bash
# Build TypeScript and deploy to dev
npm run deploy

# Deploy to production
npm run deploy:prod

# Test locally with serverless-offline
npm run sls:offline
```

## After Deployment

1. **Get your API URL** from the deployment output
2. **Update your frontend** environment variables:
   ```env
   VITE_API_BASE_URL=https://xxxxxxx.execute-api.us-east-1.amazonaws.com/dev
   ```
3. **Update CORS** in backend .env:
   ```env
   CORS_ORIGIN=https://your-frontend-domain.vercel.app
   ```

## Monitoring

```bash
# View logs
npm run sls:logs

# Get deployment info
serverless info
```

That's it! Your backend will be running on AWS Lambda! 🎉
