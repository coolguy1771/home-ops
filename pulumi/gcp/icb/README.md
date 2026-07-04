# GCP ICB Organization Setup

This Pulumi project sets up Google Cloud Platform organization structure, security, and foundational infrastructure.

## Prerequisites

- Node.js and npm installed
- Pulumi CLI installed
- GCP credentials with organization admin access
- Billing account access

## Setup

```bash
cd pulumi/gcp/icb
npm install
```

## Configuration

Configure the following stack values:

```bash
pulumi config set gcp:project <project-id>
pulumi config set icb:orgId <organization-id>
pulumi config set icb:billingAccount <billing-account-id>
pulumi config set icb:billingProject <billing-project-id>
```

Optional configurations:

```bash
pulumi config set icb:folders '{"Production": {}, "Non-Production": {}, "Development": {}}'
pulumi config set icb:cmekAutokeyFolders '[{"folder_path": "Production", "key_project_name": "kms-key-project"}]'
```

## Resources

This comprehensive project creates:

### Organization Structure
- Organization folders (Production, Non-Production, Development)
- Common folder for shared services

### Projects
- VPC host projects (prod-vpc-host, nonprod-vpc-host)
- Service projects for each environment
- Logging and monitoring project

### Networking
- Shared VPC configuration
- VPC networks with subnets
- Firewall rules for network security

### Security & IAM
- Cloud Identity groups
- IAM bindings and roles
- CMEK (Customer-Managed Encryption Keys) setup with Autokey

### Monitoring
- Cloud logging configuration
- Organizational policies

## Deployment

```bash
pulumi up
```

## Important Notes

- This project manages critical organization-level resources
- Requires high-level permissions in GCP
- Changes can affect multiple projects and environments
- Always review changes carefully before applying

## Stack Files

- `Pulumi.icb.yaml` - ICB stack configuration
