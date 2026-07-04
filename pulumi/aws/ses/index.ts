import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

const config = new pulumi.Config();
const domainName = config.require("domainName");
const configSetName = config.get("configSetName") || "defaultConfigSet";

// const dnsStack = new pulumi.StackReference("acmecorp/infra/other");
// const dnsStackOutput = dnsStack.getOutput("x");
// Create a Route 53 hosted zone
const hostedZone = aws.route53.getZone({
    name: domainName,
    privateZone: false,
});

// Create a domain identity for SES
const emailIdentity = new aws.ses.DomainIdentity("icb-ses-email-domain", {
    domain: hostedZone.then(hostedZone => hostedZone.name),
});

// Verify the domain identity
const domainIdentityVerification = new aws.ses.DomainIdentityVerification("icb-ses-email-domain-verification", {
    domain: emailIdentity.domain,
});

// Create DNS records for SES verification in Route 53
const sesVerificationRecord = new aws.route53.Record("ses-verification-record", {
    zoneId: hostedZone.then(hostedZone => hostedZone.id),
    name: `_amazonses.${hostedZone.then(hostedZone => hostedZone.name)}`,
    type: "TXT",
    ttl: 600,
    records: [emailIdentity.verificationToken],
});

// Optionally, create a configuration set
const configurationSet = new aws.sesv2.ConfigurationSet("configurationSet", {
    configurationSetName: configSetName,
    sendingOptions: {
        sendingEnabled: true,
    },
});

// Export the domain identity verification status and hosted zone details
export const domainIdentityVerificationStatus = domainIdentityVerification.id;
export const hostedZoneNameServers = hostedZone.then(hostedZone => hostedZone.nameServers);
