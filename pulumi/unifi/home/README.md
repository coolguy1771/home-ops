# Unifi Home Network Configuration

This Pulumi project manages Unifi network infrastructure for home networking setup.

## Prerequisites

- Node.js and npm installed
- Pulumi CLI installed
- Unifi Controller access
- Unifi API credentials

## Setup

```bash
cd pulumi/unifi/home
npm install
```

## Configuration

Configure the following:

```bash
pulumi config set unifi:username <controller-username>
pulumi config set unifi:password <controller-password> --secret
pulumi config set unifi:apiUrl <controller-api-url>
```

## Network Configuration

This project creates the following networks:

| Network   | VLAN ID | Subnet          | Purpose      |
|-----------|---------|-----------------|--------------|
| mgmt      | 1       | 10.1.237.1/24   | Management   |
| lab       | 10      | 10.1.10.1/24    | Lab          |
| wireless  | 20      | 10.1.20.1/24    | Wireless     |
| guest     | 30      | 10.1.30.1/24    | Guest        |
| iot       | 40      | 10.1.40.1/24    | IoT devices  |

All networks have DHCP enabled with appropriate ranges.

## Deployment

```bash
pulumi up
```

## Resources

This project creates:
- Unifi site ("Home")
- Multiple networks with VLAN isolation
- DHCP configuration for each network

## Future Enhancements

The project includes commented-out Dynamic DNS configuration that can be enabled:
- Uncomment the `dynamicDNSResource` section
- Configure with appropriate hostname, service, and credentials

## Best Practices

- Keep guest and IoT networks isolated from management networks
- Regularly review DHCP ranges to avoid conflicts
- Monitor VLAN configuration for security compliance
