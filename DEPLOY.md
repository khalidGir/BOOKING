# Deployment Guide

## Overview

This project deploys to **AWS ECS Fargate** using **AWS CDK** (TypeScript) for infrastructure, **Docker** for the application, and **GitHub Actions** for CI/CD.

### Architecture

```
Internet ──► ALB (port 80/443) ──► ECS Fargate (port 3000)
                                        │
                              ┌─────────┴──────────┐
                              ▼                    ▼
                          RDS PostgreSQL    ElastiCache Redis
```

---

## Prerequisites

| Tool | Version | Why |
|---|---|---|
| Node.js | >= 22 | Runtime |
| Docker | >= 24 | Container build |
| AWS CLI | >= 2 | CDK bootstrap + manual checks |
| AWS CDK CLI | >= 2.190 | `npm install -g aws-cdk` |

---

## 1. One-Time AWS Setup

### 1.1 Bootstrap CDK

```bash
cd infra
npm install
cdk bootstrap aws://YOUR_ACCOUNT_ID/us-east-1
```

This creates the CDK toolkit stack (S3 bucket for assets).

### 1.2 Set JWT Secret

After first `cdk deploy`, update the JWT secret in AWS Systems Manager:

```bash
aws ssm put-parameter \
  --name "/booking/JWT_SECRET" \
  --value "$(openssl rand -hex 32)" \
  --type SecureString \
  --overwrite
```

### 1.3 (Optional) Custom Domain

If you want a custom domain instead of the ALB DNS name:

1. Have a Route53 hosted zone (e.g., `booking.example.com`)
2. Deploy with context variables:

```bash
cdk deploy --all \
  -c domainName=booking.example.com \
  -c hostedZoneId=Z1234567890
```

The CDK will provision an ACM certificate and configure HTTPS.

---

## 2. Infrastructure Deployment

### 2.1 Review the stacks

```bash
cd infra
npm run synth    # generates CloudFormation templates in cdk.out/
```

### 2.2 Deploy everything

```bash
npm run deploy   # cdk deploy --all
```

This creates:

| Stack | Resources |
|---|---|
| `BookingNetwork` | VPC (2 AZs), security groups, VPC endpoints (ECR, S3, CloudWatch, Secrets Manager) |
| `BookingDatabase` | RDS PostgreSQL (t4g.micro, 20GB, daily backups), ElastiCache Redis (t4g.micro) |
| `BookingService` | ECR repo, ECS Fargate cluster + service, ALB, auto-scaling (1-3 tasks) |

### 2.3 Outputs

After deployment, CDK prints:

```
Outputs:
BookingService.LoadBalancerDNS = booking-123456.us-east-1.elb.amazonaws.com
BookingService.EcrRepositoryUri = 123456.dkr.ecr.us-east-1.amazonaws.com/booking-app
BookingService.ClusterName = booking-cluster
BookingService.ServiceName = BookingService-Service1234
```

---

## 3. CI/CD (GitHub Actions)

### 3.1 Required GitHub Secrets

| Secret | Value |
|---|---|
| `AWS_DEPLOY_ROLE_ARN` | ARN of IAM role for GitHub OIDC |
| `DATABASE_URL` | Full database URL for migrations |

### 3.2 GitHub OIDC Setup

Create an IAM OIDC identity provider for GitHub:

```bash
aws iam create-open-id-connect-provider \
  --url https://token.actions.githubusercontent.com \
  --client-id-list sts.amazonaws.com

aws iam create-role \
  --role-name github-actions-deploy \
  --assume-role-policy-document file://infra/github-oidc-trust-policy.json
```

Create `infra/github-oidc-trust-policy.json`:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::YOUR_ACCOUNT:oidc-provider/token.actions.githubusercontent.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringLike": {
          "token.actions.githubusercontent.com:sub": "repo:YOUR_GITHUB_ORG/booking:*"
        }
      }
    }
  ]
}
```

Attach these managed policies to the role:
- `AmazonEC2ContainerRegistryPowerUser`
- `AmazonECS_FullAccess`
- `AmazonSSMReadOnlyAccess`

### 3.3 How deploys work

1. Push to `main` (or manually trigger workflow)
2. GitHub Actions:
   - Builds Docker image → pushes to ECR
   - Runs `prisma migrate deploy` against production DB
   - Registers new ECS task definition with the new image
   - Updates ECS service → triggers rolling deployment
   - Waits for deployment to stabilize

---

## 4. Application Configuration

### 4.1 Environment Variables

Configured in the ECS task definition (via CDK):

| Variable | Source | Description |
|---|---|---|
| `DATABASE_URL` | Secrets Manager (auto) | Postgres connection string |
| `REDIS_URL` | CDK parameter | Redis connection string |
| `JWT_SECRET` | SSM Parameter Store | Set manually after deploy |
| `NODE_ENV` | Hardcoded | `production` |
| `PORT` | Hardcoded | `3000` |
| `CACHE_BUILD_HOUR` | Hardcoded | `3` (UTC hour for daily slot rebuild) |

### 4.2 Widget Base URL

The `widget.js` script uses `window._bookingBase` or the `data-base` attribute.
For production, set this to your domain (e.g., `https://booking.example.com`).

---

## 5. First Deploy Workflow

```bash
# 1. Bootstrap CDK (once)
cd infra && cdk bootstrap

# 2. Deploy infrastructure
npm run deploy

# 3. Set JWT secret
aws ssm put-parameter --name "/booking/JWT_SECRET" --value "$(openssl rand -hex 32)" --type SecureString --overwrite

# 4. Push initial image
docker build -t $(aws ecr describe-repositories --query 'repositories[?repositoryName==`booking-app`].repositoryUri' --output text):latest .
docker push $(aws ecr describe-repositories --query 'repositories[?repositoryName==`booking-app`].repositoryUri' --output text):latest

# 5. Force deployment
aws ecs update-service --cluster booking-cluster --service BookingService-Service1234 --force-new-deployment

# 6. Verify health
curl http://<alb-dns>/health
```

---

## 6. Useful Commands

```bash
# View container logs
aws logs tail /ecs/booking-app --follow

# SSH into a running container (via ECS Exec)
aws ecs execute-command \
  --cluster booking-cluster \
  --task $(aws ecs list-tasks --cluster booking-cluster --query 'taskArns[0]' --output text) \
  --container booking-app \
  --interactive \
  --command "/bin/sh"

# Scale service to zero (stop costs)
aws ecs update-service --cluster booking-cluster --service BookingService-Service1234 --desired-count 0

# Destroy everything (careful!)
cd infra && npm run destroy
```

---

## 7. Cost Estimates

| Service | Config | Monthly |
|---|---|---|
| ECS Fargate | 1 task × 0.25 vCPU / 0.5 GB | ~$5 |
| RDS PostgreSQL | db.t4g.micro, 20 GB gp3 | ~$15 |
| ElastiCache Redis | cache.t4g.micro | ~$12 |
| ALB | 1 LCU avg | ~$16 |
| NAT Gateway | 1 × hour | ~$32 |
| **Total** | | **~$80** |

**Cost-saving tips:**
- Replace NAT Gateway with a NAT instance (t4g.nano) → saves ~$25/mo
- Scale to 0 overnight
- Use Graviton (t4g) instances for 20% lower cost
