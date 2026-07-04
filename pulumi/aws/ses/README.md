# AWS SES (Simple Email Service) Configuration

This Pulumi project configures AWS SES for sending emails from a verified domain.

## Prerequisites

- Node.js and npm installed
- Pulumi CLI installed
- AWS credentials configured
- Route 53 hosted zone for your domain

## Setup

```bash
cd pulumi/aws/ses
npm install
```

## Configuration

Configure the following stack values:

```bash
pulumi config set aws:region us-east-1
pulumi config set aws-native:region us-east-1
pulumi config set ses:domainName <your-domain.com.>  # Note: trailing dot required
pulumi config set ses:configSetName <config-set-name>  # Optional, defaults to defaultConfigSet
```

## Deployment

```bash
pulumi up
```

## Resources

This project creates:
- SES Domain Identity
- SES Domain Identity Verification
- Route 53 TXT record for verification
- SES Configuration Set

## Verification

After deployment:
1. Check your domain's DNS records to ensure the verification TXT record is propagated
2. Verify the domain identity in AWS SES console
3. Request production access if needed (SES starts in sandbox mode)

## Exports

- `domainIdentityVerificationStatus` - Domain verification status
- `hostedZoneNameServers` - DNS nameservers for the hosted zone
