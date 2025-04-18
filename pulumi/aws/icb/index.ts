import * as pulumi from "@pulumi/pulumi";
import * as awsNative from "@pulumi/aws-native";
import * as aws from "@pulumi/aws";

// Lookup current account ID
const currentAccountId = aws
  .getCallerIdentity()
  .then((identity) => identity.accountId);
const currentRegion = pulumi.output(aws.getRegion()).name;

// Route 53 Hosted Zone
const icbDomainZone = new awsNative.route53.HostedZone(
  "icbplays-dot-net",
  {
    hostedZoneConfig: {
      comment: "",
    },
    name: "icbplays.net.",
  },
);

// KMS Key
const icbCDNCMKKey = new awsNative.kms.Key("icb-cdn-cmk-key", {
  description: "KMS key for DNSSEC signing in Route 53",
  enableKeyRotation: false,
  enabled: true,
  keyPolicy: {
    id: "dnssec-policy",
    statement: [
      {
        action: "kms:*",
        effect: "Allow",
        principal: {
          aWS: pulumi.interpolate`arn:aws:iam::${currentAccountId}:root`,
        },
        resource: "*",
        sid: "Enable IAM User Permissions",
      },
      {
        action: ["kms:DescribeKey", "kms:GetPublicKey", "kms:Sign"],
        condition: {
          arnLike: {
            "aws:SourceArn": "arn:aws:route53:::hostedzone/*",
          },
          stringEquals: {
            "aws:SourceAccount": currentAccountId,
          },
        },
        effect: "Allow",
        principal: {
          service: "dnssec-route53.amazonaws.com",
        },
        resource: "*",
        sid: "Allow Route 53 DNSSEC Service",
      },
      {
        action: "kms:CreateGrant",
        condition: {
          bool: {
            "kms:GrantIsForAWSResource": "true",
          },
        },
        effect: "Allow",
        principal: {
          service: "dnssec-route53.amazonaws.com",
        },
        resource: "*",
        sid: "Allow Route 53 DNSSEC to CreateGrant",
      },
    ],
    version: "2012-10-17",
  },
  keySpec: awsNative.kms.KeySpec.EccNistP256,
  keyUsage: awsNative.kms.KeyUsage.SignVerify,
  multiRegion: false,
  tags: [],
});

// S3 Bucket
const icbBackupBucket = new awsNative.s3.Bucket(
  "icb-game-server-backup-bucket",
  {
    bucketName: "icb-d9ff5992",
    publicAccessBlockConfiguration: {
      blockPublicAcls: false,
      blockPublicPolicy: false,
      ignorePublicAcls: false,
      restrictPublicBuckets: false,
    },
    corsConfiguration: {
      corsRules: [
        {
          allowedHeaders: ["*"],
          allowedMethods: ["GET"],
          allowedOrigins: [
            "https://cdn.icbplays.net",
            "https://d3vx2p9nwai6e4.cloudfront.net",
          ],
          exposedHeaders: [
            "x-amz-server-side-encryption",
            "x-amz-request-id",
            "x-amz-id-2",
          ],
          maxAge: 3000,
        },
      ],
    },
    ownershipControls: {
      rules: [
        {
          objectOwnership: "BucketOwnerPreferred",
        },
      ],
    },
    bucketEncryption: {
      serverSideEncryptionConfiguration: [
        {
          bucketKeyEnabled: true,
          serverSideEncryptionByDefault: {
            sseAlgorithm:
              awsNative.s3.BucketServerSideEncryptionByDefaultSseAlgorithm
                .Aes256,
          },
        },
      ],
    },
    websiteConfiguration: {
      errorDocument: "error.html",
      indexDocument: "index.html",
    },
  }
);

const icbBackupBucketPolicy = new aws.s3.BucketPolicy(
  "icb-game-server-backup-bucket-policy",
  {
    bucket: icbBackupBucket.bucketName.apply((bucketName) => {
      if (!bucketName) {
        throw new Error("Bucket name is undefined");
      }
      return bucketName;
    }),
    policy: icbBackupBucket.bucketName.apply((bucketName) => {
      if (!bucketName) {
        throw new Error("Bucket name is undefined");
      }
      return JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Sid: "PublicReadGetObject",
            Effect: "Allow",
            Principal: "*",
            Action: "s3:GetObject",
            Resource: `arn:aws:s3:::${bucketName}/*`,
          },
          {
            Sid: "PublicListBucket",
            Effect: "Allow",
            Principal: "*",
            Action: "s3:ListBucket",
            Resource: `arn:aws:s3:::${bucketName}`,
          },
        ],
      });
    }),
  }
);

// ACM Certificate
const cdnTLSCertificate = new aws.acm.Certificate("cdnTLSCertificate", {
  domainName: "cdn.icbplays.net",
  keyAlgorithm: "RSA_2048",
  options: {
    certificateTransparencyLoggingPreference: "ENABLED",
  },
  subjectAlternativeNames: ["cdn.icbplays.net"],
  validationMethod: "DNS",
});



const cloudFrontWebACL = new awsNative.wafv2.WebAcl("icb-cdn-web-acl-cloudfront", {
  description: "Web ACL for CloudFront",
  defaultAction: { allow: {} },
  scope: "CLOUDFRONT",
  visibilityConfig: {
    cloudWatchMetricsEnabled: true,
    metricName: "icb-cdn-waf",
    sampledRequestsEnabled: true,
  },
  rules: [
    {
      name: "AWS-AWSManagedRulesAmazonIpReputationList",
      priority: 0,
      overrideAction: { none: {} },
      statement: {
        managedRuleGroupStatement: {
          vendorName: "AWS",
          name: "AWSManagedRulesAmazonIpReputationList",
        },
      },
      visibilityConfig: {
        cloudWatchMetricsEnabled: true,
        metricName: "AWS-AWSManagedRulesAmazonIpReputationList",
        sampledRequestsEnabled: true,
      },
    },
    {
      name: "AWS-AWSManagedRulesCommonRuleSet",
      priority: 1,
      overrideAction: { none: {} },
      statement: {
        managedRuleGroupStatement: {
          vendorName: "AWS",
          name: "AWSManagedRulesCommonRuleSet",
        },
      },
      visibilityConfig: {
        cloudWatchMetricsEnabled: true,
        metricName: "AWS-AWSManagedRulesCommonRuleSet",
        sampledRequestsEnabled: true,
      },
    },
    {
      name: "AWS-AWSManagedRulesKnownBadInputsRuleSet",
      priority: 2,
      overrideAction: { none: {} },
      statement: {
        managedRuleGroupStatement: {
          vendorName: "AWS",
          name: "AWSManagedRulesKnownBadInputsRuleSet",
        },
      },
      visibilityConfig: {
        cloudWatchMetricsEnabled: true,
        metricName: "AWS-AWSManagedRulesKnownBadInputsRuleSet",
        sampledRequestsEnabled: true,
      },
    },
  ],
  name: "icb-cdn-waf",
});

// CloudFront Distribution
const icbCDN = new awsNative.cloudfront.Distribution("icb-cdn", {
  distributionConfig: {
    enabled: true,
    aliases: ["cdn.icbplays.net"],
    defaultCacheBehavior: {
      targetOriginId: icbBackupBucket.id,
      viewerProtocolPolicy: "redirect-to-https",
      allowedMethods: ["GET", "HEAD", "OPTIONS"],
      cachedMethods: ["GET", "HEAD"],
      compress: true,
      cachePolicyId: "5d342266-0fd7-4f12-b62d-b2da5dc059da",
      functionAssociations: [
        {
          eventType: "viewer-request",
          functionArn: pulumi.interpolate`arn:aws:cloudfront::${currentAccountId}:function/cdn-add-index`,
        },
      ],
    },
    origins: [
      {
        domainName: icbBackupBucket.domainName,
        id: icbBackupBucket.id,
        customOriginConfig: {
          originProtocolPolicy: "http-only",
          httpPort: 80,
          httpsPort: 443,
          originSslProtocols: ["TLSv1.2"],
        },
        originShield: {
          enabled: true,
          originShieldRegion: "us-east-1",
        },
      },
    ],
    priceClass: "PriceClass_100",
    restrictions: {
      geoRestriction: {
        restrictionType: "whitelist",
        locations: ["SE", "US", "IE", "CA", "AU", "GB"],
      },
    },
    viewerCertificate: {
      acmCertificateArn: cdnTLSCertificate.arn,
      sslSupportMethod: "sni-only",
      minimumProtocolVersion: "TLSv1.2_2021",
    },
    webAclId: cloudFrontWebACL.awsId,
  },
});


// Export the hosted zone ID and KMS Key ARN
export const hostedZoneId = icbDomainZone.id;
export const kmsKeyArn = icbCDNCMKKey.arn;
