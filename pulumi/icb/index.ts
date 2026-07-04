// Import the necessary modules for creating all the resources
import { createVpc } from "./modules/vpc";
import { iamCreation } from "./modules/iam";
import { securityGroup } from "./modules/security-groups";
import { createInstance } from "./modules/kube-nodes";
import { createBastion } from "./modules/bastion";
import { r53record } from "./modules/dns";
import { createOidcBucket } from "./modules/s3-k8s-oidc";
import * as pulumi from "@pulumi/pulumi";

// Importing Types
import { nodeInfo } from "./types/types";

// Configuration / Environment Variables
import * as config from "./env/values";

// // Define node up front
const nodes: nodeInfo = [];


// // Create a VPC and associated resources
const vpc = createVpc(config); // Create the VPC and associated resources

// // Create the Security Groups for Talos
// const sg_talos_configuration = securityGroup(
//   config.security_groups["talos_configuration"], // Config
//   vpc.id, // VPC ID
//   config.tags // Tags
// );

// // Create the NLB Ingress Security Group
// const sg_nlb_ingress = securityGroup(
//   config.security_groups["nlb_ingress"], // Config
//   vpc.id, // VPC ID
//   config.tags // Tags
// );

// // Create the IAM Role
// const iam_role = iamCreation(config);
// // Create the Kubernetes DNS record

//loop through the dns config array and create the records
config.publicDns.forEach((record) => {
  r53record(
    pulumi.Output.create(config.general.public_hosted_zone), // Zone ID
    record.name, // Name
    record.ttl, // TTL
    record.type, // Type
    record.records // Value
  );
});
// r53record(
//   vpc.privateHostedZone.id, // Zone ID
//   config.dns.kubeControlPlane.kubernetes_endpoint, // Name
//   config.dns.kubeControlPlane.ttl, // TTL
//   config.dns.kubeControlPlane.type, // Type
//   config.dns.kubeControlPlane.values // Value
// );

// // Create the Kubernetes Ingress Load Balancer
// const nlb = createLoadBalancer(
//   config.network.nlb.name, // Name
//   [
//     // Subnets
//     vpc.pubSubnets[config.network.subnets.public[0].name].id,
//     vpc.pubSubnets[config.network.subnets.public[1].name].id,
//   ],
//   [sg_nlb_ingress.id], // Security Groups
//   nodes, // Target Node
//   config.tags // Tags
// );

// // Create an S3 bucket that will hold the website files
// const siteBucket = new aws.s3.Bucket("cdn", {
//     website: {
//         indexDocument: "index.html",
//         errorDocument: "error.html"
//     }
// });

// // Create an S3 Bucket Policy to allow public read of all objects in bucket
// function publicReadPolicyForBucket(bucketName: string): string {
//     return JSON.stringify({
//         Version: "2012-10-17",
//         Statement: [{
//             Effect: "Allow",
//             Principal: "*",
//             Action: [
//                 "s3:GetObject"
//             ],
//             Resource: [
//                 `arn:aws:s3:::${bucketName}/*` // Policy refers to bucket name explicitly
//             ]
//         }]
//     });
// }

// // Set the access policy for the bucket so all objects are readable
// const bucketPolicy = new aws.s3.BucketPolicy("bucketPolicy", {
//     bucket: siteBucket.id, // Refer to the bucket created earlier
//     policy: siteBucket.bucket.apply(publicReadPolicyForBucket) // Use output property `siteBucket.bucket`
// });

// // Create a CloudFront distribution to serve the static website
// const cdn = new aws.cloudfront.Distribution("cdn", {
//     origins: [{
//         domainName: siteBucket.websiteEndpoint,
//         originId: siteBucket.arn,
//         s3OriginConfig: {
//             originAccessIdentity: aws.cloudfront.OriginAccessIdentity // CloudFront Origin Access Identity
//         }
//     }],
//     enabled: true,
//     isIpv6Enabled: true,
//     defaultRootObject: "index.html",
//     defaultCacheBehavior: {
//         allowedMethods: ["GET", "HEAD"],
//         cachedMethods: ["GET", "HEAD"],
//         targetOriginId: siteBucket.arn,
//         forwardedValues: {
//             queryString: false,
//             cookies: { forward: "none" }
//         },
//         viewerProtocolPolicy: "redirect-to-https",
//         minTtl: 0,
//         defaultTtl: 3600,
//         maxTtl: 86400,
//     },
//     priceClass: "PriceClass_100",
//     viewerCertificate: {
//         cloudfrontDefaultCertificate: true,
//     },
//     restrictions: {
//         geoRestriction: {
//             restrictionType: "none"
//         }
//     },
//     // The `comment` property is a string
//     comment: "CDN for static website"
// });

// // Export the names of the resources
// export const bucketName = siteBucket.bucket;
// export const bucketWebsiteEndpoint = siteBucket.websiteEndpoint;
// export const cdnDomainName = cdn.domainName;

//create two ec2 instances using t4g.mediums in different availability zones

