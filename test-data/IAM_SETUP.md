# 🔐 IAM Setup for Serverless Framework

## Problem
Your current AWS user `video-genai-s3` doesn't have CloudFormation permissions needed for Serverless Framework.

## Solution: Create Serverless-Specific IAM User


# Create new user with serverless permissions
aws iam create-user --user-name serverless-deploy

# Create and attach policy (see IAM_SETUP.md for details)

### 1. Create New IAM User via AWS Console

1. **Go to AWS IAM Console**: https://console.aws.amazon.com/iam/
2. **Users** → **Create User**
3. **Username**: `serverless-deploy`
4. **Access type**: ✅ Programmatic access
5. **Next: Permissions**

### 2. Attach Required Policies

**Attach these AWS Managed Policies:**
- ✅ `IAMFullAccess`
- ✅ `AWSCloudFormationFullAccess`
- ✅ `AWSLambdaFullAccess`
- ✅ `AmazonAPIGatewayAdministrator`
- ✅ `AmazonS3FullAccess`
- ✅ `CloudWatchLogsFullAccess`

### 3. Alternative: Custom Minimal Policy

If you prefer minimal permissions, create this custom policy:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "cloudformation:*",
                "lambda:*",
                "apigateway:*",
                "iam:*",
                "s3:*",
                "logs:*",
                "events:*"
            ],
            "Resource": "*"
        }
    ]
}
```

### 4. Configure AWS CLI with New User

```bash
# Configure with the new user credentials
aws configure --profile serverless
# Enter the new Access Key ID
# Enter the new Secret Access Key
# Region: us-east-1
# Format: json

# Set as default profile
export AWS_PROFILE=serverless

# Or use the profile for deployment
AWS_PROFILE=serverless npm run deploy
```

### 5. Test Deployment

```bash
# Test AWS connection
aws sts get-caller-identity

# Deploy with serverless
npm run deploy
```

## Quick Fix: Use Your Root Account (Not Recommended for Production)

If you need a quick solution for testing:

```bash
# Use your root AWS account credentials temporarily
aws configure
# Enter your root account credentials
```

⚠️ **Security Note**: Root credentials should not be used for regular deployments.

## Verify Permissions

```bash
# Test CloudFormation access
aws cloudformation describe-stacks --region us-east-1

# Test Lambda access
aws lambda list-functions --region us-east-1
```

Your deployment should work after configuring the proper IAM permissions! 🚀
