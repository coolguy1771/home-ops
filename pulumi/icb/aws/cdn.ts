import * as aws from "@pulumi/aws";

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
