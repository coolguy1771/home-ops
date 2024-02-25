import * as aws from "@pulumi/aws";

const siteBucket = new aws.s3.Bucket("cdn", {
  website: {
      indexDocument: "index.html",
      errorDocument: "error.html"
  }
});

// Create an S3 Bucket Policy to allow public read of all objects in bucket
function publicReadPolicyForBucket(bucketName: string): string {
  return JSON.stringify({
      Version: "2012-10-17",
      Statement: [{
          Effect: "Allow",
          Principal: "*",
          Action: [
              "s3:GetObject"
          ],
          Resource: [
              `arn:aws:s3:::${bucketName}/*` // Policy refers to bucket name explicitly
          ]
      }]
  });
}

// Set the access policy for the bucket so all objects are readable
const bucketPolicy = new aws.s3.BucketPolicy("bucketPolicy", {
  bucket: siteBucket.id, // Refer to the bucket created earlier
  policy: siteBucket.bucket.apply(publicReadPolicyForBucket) // Use output property `siteBucket.bucket`
});

// Create a CloudFront distribution to serve the static website
const cdn = new aws.cloudfront.Distribution("cdn", {
  origins: [{
      domainName: siteBucket.websiteEndpoint,
      originId: siteBucket.arn,
      s3OriginConfig: {
          originAccessIdentity: aws.cloudfront.OriginAccessIdentity // CloudFront Origin Access Identity
      }
  }],
  enabled: true,
  isIpv6Enabled: true,
  defaultRootObject: "index.html",
  defaultCacheBehavior: {
      allowedMethods: ["GET", "HEAD"],
      cachedMethods: ["GET", "HEAD"],
      targetOriginId: siteBucket.arn,
      forwardedValues: {
          queryString: false,
          cookies: { forward: "none" }
      },
      viewerProtocolPolicy: "redirect-to-https",
      minTtl: 0,
      defaultTtl: 3600,
      maxTtl: 86400,
  },
  priceClass: "PriceClass_100",
  viewerCertificate: {
      cloudfrontDefaultCertificate: true,
  },
  restrictions: {
      geoRestriction: {
          restrictionType: "none"
      }
  },
  // The `comment` property is a string
  comment: "CDN for static website"
});

export function createCdnBucket(config: any) {
  const bucket = new aws.s3.BucketV2(config.general.bucket_name, {
    // Set all tags for the bucket
    tags: config.tags,
    bucketPrefix: config.general.bucket_name, // a unique bucket name beginning with the specified prefix will be generated
    forceDestroy: false, // This allows pulumi to delete the s3 bucket even if it has contents
  });

  const ownership = new aws.s3.BucketOwnershipControls(
    `${config.general.bucket_name}-ownership`,
    {
      bucket: bucket.id,
      rule: {
        objectOwnership: "BucketOwnerPreferred",
      },
    }
  );
  
}
// Create an S3 bucket that will hold the website files
const siteBucket = new aws.s3.Bucket("cdn", {
    website: {
        indexDocument: "index.html",
        errorDocument: "error.html"
    }
});

// Create an S3 Bucket Policy to allow public read of all objects in bucket
function publicReadPolicyForBucket(bucketName: string): string {
    return JSON.stringify({
        Version: "2012-10-17",
        Statement: [{
            Effect: "Allow",
            Principal: "*",
            Action: [
                "s3:GetObject"
            ],
            Resource: [
                `arn:aws:s3:::${bucketName}/*` // Policy refers to bucket name explicitly
            ]
        }]
    });
}

// Set the access policy for the bucket so all objects are readable
const bucketPolicy = new aws.s3.BucketPolicy("bucketPolicy", {
    bucket: siteBucket.id, // Refer to the bucket created earlier
    policy: siteBucket.bucket.apply(publicReadPolicyForBucket) // Use output property `siteBucket.bucket`
});

// Create a CloudFront distribution to serve the static website
const cdn = new aws.cloudfront.Distribution("cdn", {
    origins: [{
        domainName: siteBucket.websiteEndpoint,
        originId: siteBucket.arn,
        s3OriginConfig: {
            originAccessIdentity: aws.cloudfront.OriginAccessIdentity.getId() // CloudFront Origin Access Identity
        }
    }],
    enabled: true,
    isIpv6Enabled: true,
    defaultRootObject: "index.html",
    defaultCacheBehavior: {
        allowedMethods: ["GET", "HEAD"],
        cachedMethods: ["GET", "HEAD"],
        targetOriginId: siteBucket.arn,
        forwardedValues: {
            queryString: false,
            cookies: { forward: "none" }
        },
        viewerProtocolPolicy: "redirect-to-https",
        minTtl: 0,
        defaultTtl: 3600,
        maxTtl: 86400,
    },
    priceClass: "PriceClass_100",
    viewerCertificate: {
        cloudfrontDefaultCertificate: true,
    },
    restrictions: {
        geoRestriction: {
            restrictionType: "none"
        }
    },
    // The `comment` property is a string
    comment: "CDN for static website"
});

// Export the names of the resources
export const bucketName = siteBucket.bucket;
export const bucketWebsiteEndpoint = siteBucket.websiteEndpoint;
export const cdnDomainName = cdn.domainName;

export function createOidcBucket(config: any) {
  // Create Bucket
  const bucket = new aws.s3.BucketV2(config.general.bucket_name, {
    // Set all tags for the bucket
    tags: config.tags,
    bucketPrefix: config.general.bucket_name, // a unique bucket name beginning with the specified prefix will be generated
    forceDestroy: true, // This allows pulumi to delete the s3 bucket even if it has contents
  });

  const ownership = new aws.s3.BucketOwnershipControls(
    `${config.general.bucket_name}-ownership`,
    {
      bucket: bucket.id,
      rule: {
        objectOwnership: "BucketOwnerPreferred",
      },
    }
  );

  const exampleBucketAclV2 = new aws.s3.BucketAclV2(
    `${config.general.bucket_name}-acl`,
    {
      bucket: bucket.id,
      acl: "public-read",
    },
    {
      dependsOn: [ownership],
    }
  );

  const corsConfig = new aws.s3.BucketCorsConfigurationV2(
    `${config.general.bucket_name}-cors`,
    {
      bucket: bucket.id,
      corsRules: [
        {
          allowedHeaders: ["*"],
          allowedMethods: ["GET", "HEAD"],
          allowedOrigins: ["*"],
          exposeHeaders: ["ETag"],
          maxAgeSeconds: 3000,
        },
        {
          allowedMethods: ["GET"],
          allowedOrigins: ["*"],
        },
      ],
    }
  );
}
