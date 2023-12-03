import * as minio from "@pulumi/minio";
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as minioConfig from "../env/minio";


export function setupMinio(config: pulumi.Config) {

  const provider = new minio.Provider("minio", {
    minioServer: minioConfig.minioServer,
    minioSsl: true,
    minioUser: minioConfig.minioUser,
    minioPassword: config.require("minioPassword")
  });

  // Create all minio users
  for (let user of minioConfig.MinioUsers) {
    new minio.IamUser(user.name, {
      name: user.name,
      updateSecret: true,
      secret: config.require("minioPassword"),
    }, { provider: provider });
  }
  // create Minio policies
  for (let policy of minioConfig.MinioPolicies) {
    new minio.IamPolicy(policy.name, {
      name: policy.name,
      policy: JSON.stringify(policy.policy),
    }, { provider: provider });
  }

  // create Minio buckets
  for (let bucket of minioConfig.MinioBuckets) {
      new minio.S3Bucket(bucket.name, {
        acl: bucket.acl,
        forceDestroy: false,
        bucket: bucket.name,
      }, { provider: provider });
  }
}
