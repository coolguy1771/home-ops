# Cloudflare Infrastructure

This Pulumi project manages Cloudflare DNS, firewall rules, and security configurations for ARPA Home.

## Prerequisites

- Node.js and npm installed
- Pulumi CLI installed
- Cloudflare API token with appropriate permissions

## Setup

```bash
cd pulumi/cloudflare
npm install
```

## Configuration

Configure the following:

```bash
pulumi config set cloudflare:apiToken <your-api-token> --secret
```

## Project Structure

```
cloudflare/
├── index.ts              # Main entry point
├── src/
│   ├── accounts/         # Account management
│   │   └── main.ts
│   ├── blocklists/       # Bot and geo blocklists
│   │   ├── bots.ts
│   │   └── geo.ts
│   ├── domains/          # Domain configurations
│   │   ├── email.ts
│   │   └── master.ts
│   └── firewall/         # Firewall rules
│       ├── github.ts
│       └── uptimerobot.ts
├── env/                  # Environment configurations
└── witl/                 # Custom modules
```

## Deployment

```bash
pulumi up
```

## Resources

This project manages:
- DNS records across multiple domains
- Cloudflare firewall rules
- Bot protection and geo-blocking rules
- GitHub and UptimeRobot integration rules

## Best Practices

- Always test changes in a non-production stack first
- Review firewall rule changes carefully
- Keep API tokens secure and rotate regularly
