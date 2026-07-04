# AWS ICB Infrastructure

This Pulumi project manages AWS CDN infrastructure for ICB.

## Prerequisites

- Node.js and npm installed
- Pulumi CLI installed
- AWS credentials configured

## Setup

```bash
cd pulumi/aws/icb
npm install
```

## Configuration

Configure the following stack values:

```bash
pulumi config set aws:region <region>
pulumi config set aws-native:region <region>
```

## Deployment

```bash
pulumi up
```

## Resources

This project creates:
- CloudFront CDN distribution
- Associated AWS resources for content delivery

## Stack Files

- `Pulumi.icb.yaml` - ICB stack configuration
