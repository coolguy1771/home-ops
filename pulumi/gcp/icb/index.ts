import * as pulumi from "@pulumi/pulumi";
import * as gcp from "@pulumi/gcp";

const config = new pulumi.Config();

const orgId = config.get("orgId") || "922939261149";
const billingAccount = config.get("billingAccount") || "01D9C3-5EAFB2-4707ED";
const billingProject = config.get("billingProject") || "cs-host-ae01b4b2d9ba40d89dd53c";

const folders = config.getObject<Record<string, any>>("folders") || {
    "Production": {},
    "Non-Production": {},
    "Development": {}
};

const cmekAutokeyFolders = config.getObject<Array<{folder_path: string, key_project_name: string}>>("cmekAutokeyFolders") || [
    { folder_path: "Production", key_project_name: "kms-key-project" },
    { folder_path: "Non-Production", key_project_name: "kms-key-project" },
    { folder_path: "Development", key_project_name: "kms-key-project" }
];

const org = gcp.organizations.getOrganization({
    organization: `organizations/${orgId}`,
});

const commonFolder = new gcp.organizations.Folder("cs-common", {
    displayName: "Common",
    parent: `organizations/${orgId}`,
});

const folderLevel0Map: { [key: string]: gcp.organizations.Folder } = {};
for (const [folderName] of Object.entries(folders)) {
    folderLevel0Map[folderName] = new gcp.organizations.Folder(`cs-folders-level-0-${folderName}`, {
        displayName: folderName,
        parent: `organizations/${orgId}`,
    });
}

const defaultLabels = {
    "goog-cloudsetup": "downloaded"
};

const prodVpcHostProject = new gcp.organizations.Project("prod-vpc-host", {
    name: "prod-vpc-host",
    projectId: "prod-vpc-host",
    orgId: orgId,
    billingAccount: billingAccount,
    folderId: folderLevel0Map["Production"].name,
    labels: defaultLabels,
});

const nonprodVpcHostProject = new gcp.organizations.Project("nonprod-vpc-host", {
    name: "nonprod-vpc-host",
    projectId: "nonprod-vpc-host",
    orgId: orgId,
    billingAccount: billingAccount,
    folderId: folderLevel0Map["Non-Production"].name,
    labels: defaultLabels,
});

const loggingProject = new gcp.organizations.Project("cs-logging-mon", {
    name: "cs-logging-mon",
    projectId: "cs-logging-mon",
    orgId: orgId,
    billingAccount: billingAccount,
    folderId: commonFolder.name,
    labels: defaultLabels,
});

const prodComputeHostingService = new gcp.compute.SharedVPCHostProject("prod-compute-hosting-service", {
    project: prodVpcHostProject.projectId,
});

const nonprodComputeHostingService = new gcp.compute.SharedVPCHostProject("nonprod-compute-hosting-service", {
    project: nonprodVpcHostProject.projectId,
});

const prod1ServiceProject = new gcp.organizations.Project("prod1-service", {
    name: "prod1-service",
    projectId: "prod1-service",
    orgId: orgId,
    billingAccount: billingAccount,
    folderId: folderLevel0Map["Production"].name,
    labels: defaultLabels,
});

const prod2ServiceProject = new gcp.organizations.Project("prod2-service", {
    name: "prod2-service",
    projectId: "prod2-service",
    orgId: orgId,
    billingAccount: billingAccount,
    folderId: folderLevel0Map["Production"].name,
    labels: defaultLabels,
});

const nonprod1ServiceProject = new gcp.organizations.Project("nonprod1-service", {
    name: "nonprod1-service",
    projectId: "nonprod1-service",
    orgId: orgId,
    billingAccount: billingAccount,
    folderId: folderLevel0Map["Non-Production"].name,
    labels: defaultLabels,
});

const nonprod2ServiceProject = new gcp.organizations.Project("nonprod2-service", {
    name: "nonprod2-service",
    projectId: "nonprod2-service",
    orgId: orgId,
    billingAccount: billingAccount,
    folderId: folderLevel0Map["Non-Production"].name,
    labels: defaultLabels,
});

const prod1SharedVpcService = new gcp.compute.SharedVPCServiceProject("prod1-shared-vpc-service", {
    hostProject: prodVpcHostProject.projectId,
    serviceProject: prod1ServiceProject.projectId,
}, { dependsOn: [prodComputeHostingService] });

const prod2SharedVpcService = new gcp.compute.SharedVPCServiceProject("prod2-shared-vpc-service", {
    hostProject: prodVpcHostProject.projectId,
    serviceProject: prod2ServiceProject.projectId,
}, { dependsOn: [prodComputeHostingService] });

const nonprod1SharedVpcService = new gcp.compute.SharedVPCServiceProject("nonprod1-shared-vpc-service", {
    hostProject: nonprodVpcHostProject.projectId,
    serviceProject: nonprod1ServiceProject.projectId,
}, { dependsOn: [nonprodComputeHostingService] });

const nonprod2SharedVpcService = new gcp.compute.SharedVPCServiceProject("nonprod2-shared-vpc-service", {
    hostProject: nonprodVpcHostProject.projectId,
    serviceProject: nonprod2ServiceProject.projectId,
}, { dependsOn: [nonprodComputeHostingService] });

const prodVpc = new gcp.compute.Network("prod-vpc", {
    name: "prod-vpc",
    project: prodVpcHostProject.projectId,
    autoCreateSubnetworks: false,
    mtu: 1460,
    routingMode: "REGIONAL",
}, { dependsOn: [prodComputeHostingService] });

const nonprodVpc = new gcp.compute.Network("nonprod-vpc", {
    name: "nonprod-vpc",
    project: nonprodVpcHostProject.projectId,
    autoCreateSubnetworks: false,
    mtu: 1460,
    routingMode: "REGIONAL",
}, { dependsOn: [nonprodComputeHostingService] });

const prodUsEast4Subnet = new gcp.compute.Subnetwork("prod-us-east4-subnet", {
    name: "prod-us-east4-subnet",
    project: prodVpcHostProject.projectId,
    network: prodVpc.id,
    ipCidrRange: "10.142.0.0/20",
    region: "us-east4",
    enableFlowLogs: true,
    logConfig: {
        aggregationInterval: "INTERVAL_10_MIN",
        flowSampling: 0.5,
        metadata: "INCLUDE_ALL_METADATA",
    },
});

const prodUsWest2Subnet = new gcp.compute.Subnetwork("prod-us-west2-subnet", {
    name: "prod-us-west2-subnet",
    project: prodVpcHostProject.projectId,
    network: prodVpc.id,
    ipCidrRange: "10.138.0.0/20",
    region: "us-west2",
    enableFlowLogs: true,
    logConfig: {
        aggregationInterval: "INTERVAL_10_MIN",
        flowSampling: 0.5,
        metadata: "INCLUDE_ALL_METADATA",
    },
});

const nonprodUsEast4Subnet = new gcp.compute.Subnetwork("nonprod-us-east4-subnet", {
    name: "nonprod-us-east4-subnet",
    project: nonprodVpcHostProject.projectId,
    network: nonprodVpc.id,
    ipCidrRange: "10.143.0.0/20",
    region: "us-east4",
    enableFlowLogs: true,
    logConfig: {
        aggregationInterval: "INTERVAL_10_MIN",
        flowSampling: 0.5,
        metadata: "INCLUDE_ALL_METADATA",
    },
});

const nonprodUsWest2Subnet = new gcp.compute.Subnetwork("nonprod-us-west2-subnet", {
    name: "nonprod-us-west2-subnet",
    project: nonprodVpcHostProject.projectId,
    network: nonprodVpc.id,
    ipCidrRange: "10.139.0.0/20",
    region: "us-west2",
    enableFlowLogs: true,
    logConfig: {
        aggregationInterval: "INTERVAL_10_MIN",
        flowSampling: 0.5,
        metadata: "INCLUDE_ALL_METADATA",
    },
});

const prodIcmpFirewall = new gcp.compute.Firewall("prod-allow-icmp", {
    name: "prod-allow-icmp",
    project: prodVpcHostProject.projectId,
    network: prodVpc.name,
    allows: [{
        protocol: "icmp",
    }],
    sourceRanges: ["10.128.0.0/9"],
});

const prodSshFirewall = new gcp.compute.Firewall("prod-allow-ssh", {
    name: "prod-allow-ssh",
    project: prodVpcHostProject.projectId,
    network: prodVpc.name,
    allows: [{
        protocol: "tcp",
        ports: ["22"],
    }],
    sourceRanges: ["10.128.0.0/9"],
});

const prodRdpFirewall = new gcp.compute.Firewall("prod-allow-rdp", {
    name: "prod-allow-rdp",
    project: prodVpcHostProject.projectId,
    network: prodVpc.name,
    allows: [{
        protocol: "tcp",
        ports: ["3389"],
    }],
    sourceRanges: ["10.128.0.0/9"],
});

const nonprodIcmpFirewall = new gcp.compute.Firewall("nonprod-allow-icmp", {
    name: "nonprod-allow-icmp",
    project: nonprodVpcHostProject.projectId,
    network: nonprodVpc.name,
    allows: [{
        protocol: "icmp",
    }],
    sourceRanges: ["10.128.0.0/9"],
});

const nonprodSshFirewall = new gcp.compute.Firewall("nonprod-allow-ssh", {
    name: "nonprod-allow-ssh",
    project: nonprodVpcHostProject.projectId,
    network: nonprodVpc.name,
    allows: [{
        protocol: "tcp",
        ports: ["22"],
    }],
    sourceRanges: ["10.128.0.0/9"],
});

const nonprodRdpFirewall = new gcp.compute.Firewall("nonprod-allow-rdp", {
    name: "nonprod-allow-rdp",
    project: nonprodVpcHostProject.projectId,
    network: nonprodVpc.name,
    allows: [{
        protocol: "tcp",
        ports: ["3389"],
    }],
    sourceRanges: ["10.128.0.0/9"],
});

const kmsProjects: { [key: string]: gcp.organizations.Project } = {};
for (const folder of cmekAutokeyFolders) {
    kmsProjects[folder.folder_path] = new gcp.organizations.Project(`kms-proj-${folder.folder_path}`, {
        name: folder.key_project_name,
        projectId: pulumi.interpolate`kms-proj-${Math.random().toString(36).substring(7)}`,
        orgId: orgId,
        billingAccount: billingAccount,
        folderId: folderLevel0Map[folder.folder_path].name,
        labels: defaultLabels,
    });
}

for (const folder of cmekAutokeyFolders) {
    new gcp.projects.Service(`kms-service-${folder.folder_path}`, {
        project: kmsProjects[folder.folder_path].projectId,
        service: "cloudkms.googleapis.com",
    });
}

const prodGroup = new gcp.cloudidentity.Group("prod1-service-group", {
    displayName: "prod1-service",
    description: "prod1-service group",
    parent: "customers/C01l08x4q",
    groupKey: {
        id: "prod1-service@icbplays.net",
    },
    labels: {
        "cloudidentity.googleapis.com/groups.discussion_forum": "",
        "cloudidentity.googleapis.com/groups.security": "",
    },
});

const prod2Group = new gcp.cloudidentity.Group("prod2-service-group", {
    displayName: "prod2-service",
    description: "prod2-service group",
    parent: "customers/C01l08x4q",
    groupKey: {
        id: "prod2-service@icbplays.net",
    },
    labels: {
        "cloudidentity.googleapis.com/groups.discussion_forum": "",
        "cloudidentity.googleapis.com/groups.security": "",
    },
});

const nonprod1Group = new gcp.cloudidentity.Group("nonprod1-service-group", {
    displayName: "nonprod1-service",
    description: "nonprod1-service group",
    parent: "customers/C01l08x4q",
    groupKey: {
        id: "nonprod1-service@icbplays.net",
    },
    labels: {
        "cloudidentity.googleapis.com/groups.discussion_forum": "",
        "cloudidentity.googleapis.com/groups.security": "",
    },
});

const nonprod2Group = new gcp.cloudidentity.Group("nonprod2-service-group", {
    displayName: "nonprod2-service",
    description: "nonprod2-service group",
    parent: "customers/C01l08x4q",
    groupKey: {
        id: "nonprod2-service@icbplays.net",
    },
    labels: {
        "cloudidentity.googleapis.com/groups.discussion_forum": "",
        "cloudidentity.googleapis.com/groups.security": "",
    },
});

new gcp.projects.IAMBinding("nonprod-compute-admin", {
    project: folderLevel0Map["Non-Production"].name,
    role: "roles/compute.instanceAdmin.v1",
    members: ["group:gcp-developers@icbplays.net"],
});

new gcp.projects.IAMBinding("nonprod-container-admin", {
    project: folderLevel0Map["Non-Production"].name,
    role: "roles/container.admin",
    members: ["group:gcp-developers@icbplays.net"],
});

new gcp.projects.IAMBinding("dev-compute-admin", {
    project: folderLevel0Map["Development"].name,
    role: "roles/compute.instanceAdmin.v1",
    members: ["group:gcp-developers@icbplays.net"],
});

new gcp.projects.IAMBinding("dev-container-admin", {
    project: folderLevel0Map["Development"].name,
    role: "roles/container.admin",
    members: ["group:gcp-developers@icbplays.net"],
});

new gcp.projects.IAMBinding("logging-viewer", {
    project: loggingProject.projectId,
    role: "roles/logging.viewer",
    members: ["group:gcp-logging-monitoring-viewers@icbplays.net"],
});

new gcp.projects.IAMBinding("logging-private-viewer", {
    project: loggingProject.projectId,
    role: "roles/logging.privateLogViewer",
    members: ["group:gcp-logging-monitoring-viewers@icbplays.net"],
});

new gcp.projects.IAMBinding("bigquery-viewer", {
    project: loggingProject.projectId,
    role: "roles/bigquery.dataViewer",
    members: ["group:gcp-logging-monitoring-viewers@icbplays.net"],
});

new gcp.projects.IAMBinding("pubsub-viewer", {
    project: loggingProject.projectId,
    role: "roles/pubsub.viewer",
    members: ["group:gcp-logging-monitoring-viewers@icbplays.net"],
});

new gcp.projects.IAMBinding("monitoring-viewer", {
    project: loggingProject.projectId,
    role: "roles/monitoring.viewer",
    members: ["group:gcp-logging-monitoring-viewers@icbplays.net"],
});

new gcp.projects.IAMBinding("prod1-service-compute-admin", {
    project: prod1ServiceProject.projectId,
    role: "roles/compute.instanceAdmin.v1",
    members: [prodGroup.name.apply((name: string) => `group:${name}`)],
});

new gcp.projects.IAMBinding("prod2-service-compute-admin", {
    project: prod2ServiceProject.projectId,
    role: "roles/compute.instanceAdmin.v1",
    members: [prod2Group.name.apply((name: string) => `group:${name}`)],
});

new gcp.projects.IAMBinding("nonprod1-service-compute-admin", {
    project: nonprod1ServiceProject.projectId,
    role: "roles/compute.instanceAdmin.v1",
    members: [nonprod1Group.name.apply((name: string) => `group:${name}`)],
});

new gcp.projects.IAMBinding("nonprod2-service-compute-admin", {
    project: nonprod2ServiceProject.projectId,
    role: "roles/compute.instanceAdmin.v1",
    members: [nonprod2Group.name.apply((name: string) => `group:${name}`)],
});

const orgPolicies = [
    { name: "storage-public-access-prevention", constraint: "storage.publicAccessPrevention", enforcement: true },
    { name: "compute-require-os-login", constraint: "compute.requireOsLogin", enforcement: true },
    { name: "compute-vm-external-ip-access", constraint: "compute.vmExternalIpAccess", enforcement: true },
    { name: "compute-disable-nested-virtualization", constraint: "compute.disableNestedVirtualization", enforcement: true },
    { name: "compute-disable-serial-port-access", constraint: "compute.disableSerialPortAccess", enforcement: true },
    { name: "sql-restrict-authorized-networks", constraint: "sql.restrictAuthorizedNetworks", enforcement: true },
    { name: "sql-restrict-public-ip", constraint: "sql.restrictPublicIp", enforcement: true },
    { name: "compute-restrict-xpn-project-lien-removal", constraint: "compute.restrictXpnProjectLienRemoval", enforcement: true },
    { name: "compute-skip-default-network-creation", constraint: "compute.skipDefaultNetworkCreation", enforcement: true },
    { name: "compute-disable-vpc-external-ipv6", constraint: "compute.disableVpcExternalIpv6", enforcement: true },
];

for (const policy of orgPolicies) {
    new gcp.orgpolicy.Policy(`org-policy-${policy.name}`, {
        name: `organizations/${orgId}/policies/${policy.constraint}`,
        parent: `organizations/${orgId}`,
        spec: {
            rules: [{
                enforce: policy.enforcement ? "TRUE" : "FALSE",
            }],
        },
    });
}

const randomSuffix = Math.random().toString(36).substring(7);

const logBucket = new gcp.logging.ProjectBucketConfig("icbplays-logging", {
    project: loggingProject.projectId,
    location: "global",
    bucketId: "icbplays-logging",
    retentionDays: 30,
});

const logSink = new gcp.logging.OrganizationSink("org-log-sink", {
    name: `${orgId}-logbucketsink-${randomSuffix}`,
    orgId: orgId,
    destination: pulumi.interpolate`logging.googleapis.com/projects/${loggingProject.projectId}/locations/global/buckets/icbplays-logging`,
    includeChildren: true,
    filter: "logName: /logs/cloudaudit.googleapis.com%2Factivity OR logName: /logs/cloudaudit.googleapis.com%2Fsystem_event OR logName: /logs/cloudaudit.googleapis.com%2Fdata_access OR logName: /logs/cloudaudit.googleapis.com%2Faccess_transparency",
}, { dependsOn: [logBucket] });

const monitoredProjects = [
    prodVpcHostProject.projectId,
    nonprodVpcHostProject.projectId,
    prod1ServiceProject.projectId,
    prod2ServiceProject.projectId,
    nonprod1ServiceProject.projectId,
    nonprod2ServiceProject.projectId,
];

for (const [index, projectId] of monitoredProjects.entries()) {
    new gcp.monitoring.MonitoredProject(`monitored-project-${index}`, {
        metricsScope: pulumi.interpolate`locations/global/metricsScopes/${loggingProject.projectId}`,
        name: projectId,
    });
}

for (const [folderPath, kmsProject] of Object.entries(kmsProjects)) {
    new gcp.monitoring.MonitoredProject(`monitored-kms-project-${folderPath}`, {
        metricsScope: pulumi.interpolate`locations/global/metricsScopes/${loggingProject.projectId}`,
        name: kmsProject.projectId,
    });
}

export const organizationId = orgId;
export const commonFolderId = commonFolder.id;
export const productionFolderId = folderLevel0Map["Production"].id;
export const nonProductionFolderId = folderLevel0Map["Non-Production"].id;
export const developmentFolderId = folderLevel0Map["Development"].id;
export const prodVpcHostProjectId = prodVpcHostProject.projectId;
export const nonprodVpcHostProjectId = nonprodVpcHostProject.projectId;
export const loggingProjectId = loggingProject.projectId;
export const kmsProjectIds = Object.fromEntries(Object.entries(kmsProjects).map(([key, project]) => [key, project.projectId]));