# ICB Infrastructure as Code

This Pulumi project manages core ICB infrastructure including VPC, IAM, security groups, and Kubernetes-related resources.

## Prerequisites

- Node.js and npm installed
- Pulumi CLI installed
- AWS credentials configured

## Setup

```bash
cd pulumi/icb
npm install
```

## Configuration

The project uses configuration from `env/values.ts`. Review and update this file with your environment-specific values.

Stack configuration:
```bash
pulumi config set aws:region <region>
```

## Project Structure

```
icb/
├── index.ts              # Main entry point
├── modules/              # Infrastructure modules
│   ├── vpc.ts           # VPC and networking
│   ├── iam.ts           # IAM roles and policies
│   ├── security-groups.ts
│   ├── bastion.ts       # Bastion host
│   ├── kube-nodes.ts    # Kubernetes nodes
│   ├── s3-k8s-oidc.ts   # S3 OIDC provider
│   ├── dns.ts           # DNS records
│   └── cloudfront.ts    # CloudFront (placeholder)
├── aws/                  # AWS-specific modules
│   ├── cdn.ts           # CDN configuration
│   ├── r53.ts           # Route 53 (placeholder)
│   └── ses.ts           # SES (placeholder)
├── types/               # TypeScript type definitions
│   └── types.ts
└── env/                 # Environment values
    └── values.ts
```

## Deployment

```bash
pulumi up
```

## Current Status

This project is partially implemented:
- ✅ VPC and networking infrastructure
- ✅ DNS record management
- ⚠️ Most infrastructure modules are commented out
- ⚠️ Some placeholder files need implementation (cloudfront.ts, r53.ts, ses.ts)

## Next Steps

1. Review and uncomment infrastructure modules as needed
2. Implement placeholder modules (r53.ts, ses.ts, cloudfront.ts)
3. Remove empty module files or implement functionality
4. Update environment values in `env/values.ts`

## Stack Files

- `Pulumi.aws.yaml` - AWS stack configuration
- `Pulumi.network.yaml` - Network stack configuration
