# Pulumi Infrastructure as Code

This directory contains Pulumi projects for managing infrastructure across multiple cloud providers.

## Overview

The infrastructure is organized by cloud provider and service:

```
pulumi/
├── aws/                  # AWS-specific projects
│   ├── icb/             # AWS CDN infrastructure
│   ├── oidc/            # AWS OIDC provider for Pulumi
│   └── ses/             # Simple Email Service configuration
├── cloudflare/          # DNS and security management
├── gcp/                 # Google Cloud Platform
│   └── icb/            # GCP organization and infrastructure
├── icb/                 # Main infrastructure project (AWS-focused)
└── unifi/               # Unifi network management
    └── home/           # Home network configuration
```

## Prerequisites

All projects require:
- [Pulumi CLI](https://www.pulumi.com/docs/get-started/install/) installed
- [Node.js](https://nodejs.org/) (v18 or later) and npm
- Appropriate cloud provider credentials configured

## Quick Start

1. Navigate to the specific project directory
2. Install dependencies: `npm install`
3. Configure stack values: `pulumi config set <key> <value>`
4. Preview changes: `pulumi preview`
5. Deploy: `pulumi up`

## Projects

### AWS Projects

#### aws/icb
Manages AWS CDN (CloudFront) infrastructure for content delivery.
- **Purpose**: Content Delivery Network setup
- **Key Resources**: CloudFront distributions
- [Read more](./aws/icb/README.md)

#### aws/oidc
Sets up AWS OIDC provider for secure Pulumi service authentication.
- **Purpose**: Federated authentication for Pulumi deployments
- **Key Resources**: IAM OIDC Provider, IAM Roles
- **Security**: Uses AdministratorAccess (review for production)
- [Read more](./aws/oidc/README.md)

#### aws/ses
Configures AWS Simple Email Service for domain-based email sending.
- **Purpose**: Email sending infrastructure
- **Key Resources**: SES Domain Identity, DNS verification records
- [Read more](./aws/ses/README.md)

### Cloudflare

#### cloudflare/
Manages DNS records, firewall rules, and security configurations.
- **Purpose**: DNS management and edge security
- **Key Resources**: DNS records, firewall rules, blocklists
- **Structure**: Modular with separate configurations for domains, firewall, and blocklists
- [Read more](./cloudflare/README.md)

### Google Cloud Platform

#### gcp/icb
Comprehensive GCP organization setup including folders, projects, networking, and security.
- **Purpose**: GCP organizational foundation
- **Key Resources**: Organization folders, VPC networks, IAM, CMEK
- **Scope**: Organization-level infrastructure (requires high permissions)
- [Read more](./gcp/icb/README.md)

### Main Infrastructure

#### icb/
Core infrastructure project managing VPC, IAM, security groups, and Kubernetes-related resources.
- **Purpose**: Main AWS infrastructure for ICB
- **Key Resources**: VPC, IAM roles, security groups, bastion hosts
- **Status**: Partially implemented (many modules commented out)
- **Note**: Contains placeholder modules that need implementation
- [Read more](./icb/README.md)

### Network Management

#### unifi/home/
Manages Unifi home network configuration including VLANs and DHCP.
- **Purpose**: Home network infrastructure as code
- **Key Resources**: Unifi networks, VLANs, DHCP configuration
- **Networks**: Management, Lab, Wireless, Guest, IoT
- [Read more](./unifi/home/README.md)

## Best Practices

### Version Management
All projects use consistent versions:
- **Pulumi**: ^3.130.0
- **AWS Provider**: ^7.0.0
- **AWS Native Provider**: ^1.0.0
- **Cloudflare Provider**: ^6.0.0
- **GCP Provider**: ^8.0.0

### Configuration Management
- Use `pulumi config` for environment-specific values
- Store sensitive values with `--secret` flag
- Keep configuration in stack files (Pulumi.*.yaml)
- Document required configuration in project READMEs

### Security
- Never commit secrets or credentials
- Use OIDC for CI/CD authentication when possible
- Follow least privilege principle for IAM roles
- Regularly review and audit access policies
- Enable MFA for cloud provider accounts

### Development Workflow
1. **Plan**: Use `pulumi preview` to see changes before applying
2. **Test**: Test in development/staging stacks first
3. **Review**: Review infrastructure changes in pull requests
4. **Deploy**: Deploy to production only after thorough testing
5. **Monitor**: Monitor deployments and set up alerts

## Common Commands

```bash
# Preview changes
pulumi preview

# Deploy infrastructure
pulumi up

# View current stack configuration
pulumi config

# Set configuration value
pulumi config set <key> <value>

# Set secret configuration value
pulumi config set <key> <value> --secret

# View stack outputs
pulumi stack output

# Destroy infrastructure (be careful!)
pulumi destroy

# View stack history
pulumi stack history
```

## Project Dependencies

Some projects have dependencies on others:
- `icb/` may reference DNS zones managed in other projects
- `aws/ses` requires Route 53 hosted zones
- Stack references can be used to share outputs between projects

## Troubleshooting

### Common Issues

**Issue**: `pulumi up` fails with authentication error
- **Solution**: Ensure cloud provider credentials are configured correctly

**Issue**: Resource already exists error
- **Solution**: Import existing resources with `pulumi import`

**Issue**: State file conflicts
- **Solution**: Ensure you're using the correct stack with `pulumi stack select`

**Issue**: Dependency version conflicts
- **Solution**: Delete `node_modules` and `package-lock.json`, then run `npm install`

## Contributing

When making changes:
1. Create a feature branch
2. Update relevant documentation
3. Test changes in a development stack
4. Create a pull request with clear description
5. Ensure all checks pass

## Support

For issues or questions:
- Check individual project READMEs
- Review [Pulumi documentation](https://www.pulumi.com/docs/)
- Check cloud provider documentation

## Maintenance

Regular maintenance tasks:
- Update dependencies quarterly
- Review and cleanup unused resources
- Audit IAM permissions and access
- Update documentation as infrastructure evolves
- Review cost optimization opportunities
