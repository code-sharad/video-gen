#!/bin/bash

echo "🔐 Setting up IAM permissions for Serverless Framework..."

# Create IAM policy for serverless deployment
aws iam create-policy \
  --policy-name ServerlessFrameworkPolicy \
  --policy-document '{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "cloudformation:*",
                "lambda:*",
                "apigateway:*",
                "iam:GetRole",
                "iam:CreateRole",
                "iam:DeleteRole",
                "iam:PutRolePolicy",
                "iam:DeleteRolePolicy",
                "iam:AttachRolePolicy",
                "iam:DetachRolePolicy",
                "iam:PassRole",
                "s3:*",
                "logs:*",
                "events:*"
            ],
            "Resource": "*"
        }
    ]
}' || echo "Policy might already exist"

# Attach policy to current user
USER_NAME=$(aws sts get-caller-identity --query 'Arn' --output text | cut -d'/' -f2)
ACCOUNT_ID=$(aws sts get-caller-identity --query 'Account' --output text)

aws iam attach-user-policy \
  --user-name $USER_NAME \
  --policy-arn arn:aws:iam::$ACCOUNT_ID:policy/ServerlessFrameworkPolicy

echo "✅ IAM permissions configured for user: $USER_NAME"
echo "🚀 You can now run: npm run deploy"
