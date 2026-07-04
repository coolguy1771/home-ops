import * as gcp from "@pulumi/gcp";
import * as pulumi from "@pulumi/pulumi";

export function createSecurityPolicies(projectId: pulumi.Input<string>) {
    // Organization policy constraints for security
    const orgPolicies = [
        {
            constraint: "constraints/compute.restrictSharedVpcSubnetworks",
            booleanPolicy: { enforced: true }
        },
        {
            constraint: "constraints/compute.restrictVpcPeering", 
            booleanPolicy: { enforced: true }
        },
        {
            constraint: "constraints/compute.requireShieldedVm",
            booleanPolicy: { enforced: true }
        },
        {
            constraint: "constraints/compute.disableSerialPortAccess",
            booleanPolicy: { enforced: true }
        },
        {
            constraint: "constraints/iam.disableServiceAccountKeyCreation",
            booleanPolicy: { enforced: true }
        },
        {
            constraint: "constraints/storage.uniformBucketLevelAccess",
            booleanPolicy: { enforced: true }
        }
    ];

    const policies = orgPolicies.map((policy, index) =>
        new gcp.orgpolicy.Policy(`org-policy-${index}`, {
            name: pulumi.interpolate`projects/${projectId}/policies/${policy.constraint}`,
            spec: {
                rules: [{
                    enforce: policy.booleanPolicy.enforced.toString()
                }]
            }
        })
    );

    // Create Cloud KMS keyring for encryption
    const keyRing = new gcp.kms.KeyRing("security-keyring", {
        project: projectId,
        name: "security-keyring",
        location: "global",
    });

    // Create encryption key
    const cryptoKey = new gcp.kms.CryptoKey("security-key", {
        keyRing: keyRing.id,
        name: "security-encryption-key",
        purpose: "ENCRYPT_DECRYPT",
        rotationPeriod: "7776000s", // 90 days
        versionTemplate: {
            algorithm: "GOOGLE_SYMMETRIC_ENCRYPTION",
            protectionLevel: "SOFTWARE",
        },
    });

    // Create logging configuration
    const auditConfig = new gcp.projects.IAMAuditConfig("audit-config", {
        project: projectId,
        service: "allServices",
        auditLogConfigs: [
            {
                logType: "ADMIN_READ",
            },
            {
                logType: "DATA_READ",
            },
            {
                logType: "DATA_WRITE",
            },
        ],
    });

    // Create log sink for security events
    const securityLogSink = new gcp.logging.ProjectSink("security-log-sink", {
        project: projectId,
        name: "security-events-sink",
        destination: "storage.googleapis.com/security-audit-logs",
        filter: 'protoPayload.serviceName="iam.googleapis.com" OR protoPayload.serviceName="cloudkms.googleapis.com"',
        uniqueWriterIdentity: true,
    });

    return {
        keyRing,
        cryptoKey,
        auditConfig,
        securityLogSink,
        policies
    };
}