# AWS OIDC Provider Setup

This Pulumi project sets up AWS OIDC provider for Pulumi service authentication.

## Prerequisites

- Node.js and npm installed
- Pulumi CLI installed
- AWS credentials configured
- Pulumi organization access

## Setup

```bash
cd pulumi/aws/oidc
npm install
```

## Configuration

Configure the following stack values:

```bash
pulumi config set aws:region <region>
pulumi config set aws-native:region <region>
pulumi config set oidc:escEnv <esc-environment-name>
pulumi config set oidc:oidcIdpUrl https://api.pulumi.com/oidc  # Optional
```

## Deployment

```bash
pulumi up
```

## Resources

This project creates:
- AWS IAM OIDC Identity Provider
- IAM Role with AdministratorAccess policy
- Pulumi ESC Environment (optional, based on `escEnv` config)

## Security Note

This project creates a role with AdministratorAccess. Consider using least privilege principles for production deployments.

## Stack Files

- `Pulumi.prod.yaml` - Production stack configuration
