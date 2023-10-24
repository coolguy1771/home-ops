import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";
import * as random from "@pulumi/random";
import * as kubernetes from "@pulumi/kubernetes";
import * as fs from "fs-extra";
import path = require("path");

const env = new random.RandomPet("env", {
  length: 2,
  separator: "-",
});

const assumeRole = aws.iam.getPolicyDocumentOutput({
  statements: [{
      effect: "Allow",
      actions: ["sts:AssumeRole"],
      principals: [{
          type: "Service",
          identifiers: ["ec2.amazonaws.com"],
      }],
  }],
});

const vaultResource = new aws.kms.Key("vault", {
  description: "Vault unseal key",
  deletionWindowInDays: 10,
  tags: {
      name: pulumi.interpolate`vault-kms-unseal-${env.id}`,
  },
});

const vaultKMSUnseal = aws.iam.getPolicyDocumentOutput({
  statements: [{
      sid: "VaultKMSUnseal",
      effect: "Allow",
      resources: [vaultResource.arn],
      actions: [
          "kms:Encrypt",
          "kms:Decrypt",
          "kms:DescribeKey",
      ],
  }],
});

const vaultKMSUnsealResource = new aws.iam.Role("vault-kms-unseal", {
  name: pulumi.interpolate`vault-kms-role-${env.id}`,
  assumeRolePolicy: assumeRole.apply(assumeRole => assumeRole.json),
});

const vaultKMSUnsealResource2 = new aws.iam.RolePolicy("vault-kms-unseal", {
  name: pulumi.interpolate`Vault-KMS-Unseal-${env.id}`,
  role: vaultKMSUnsealResource.id,
  policy: vaultKMSUnseal.apply(vaultKMSUnseal => vaultKMSUnseal.json),
});

const vaultKMSUnsealResource3 = new aws.iam.InstanceProfile("vault-kms-unseal", {
  name: pulumi.interpolate`vault-kms-unseal-${env.id}`,
  role: vaultKMSUnsealResource.name,
});

const vaultUser = new aws.iam.User("vault", {
  name: pulumi.interpolate`vault-${env.id}`,
  tags: {
      name: pulumi.interpolate`vault-${env.id}`,
  },
});

const vaultGroup = new aws.iam.Group("vault", {
  name: pulumi.interpolate`vault-${env.id}`,
});

const vaultGroupMembership = new aws.iam.GroupMembership("vault", {
  group: vaultGroup.name,
  users: [vaultUser.name],
});


//Create Access Key for Vault User
const vaultAccessKey = new aws.iam.AccessKey("vault", {
  user: vaultUser.name,
});

//write to file for vault user

const currentAwsIdentity = aws.getCallerIdentity();



// Write the smtp username and password out to a local secret file
const apiSecretsDir = path.join(__dirname, "secrets", "vault");
const smtpUsernameFilePath = path.resolve(path.join(".", "SES_USERNAME.secret"));
const smtpPasswordFilePath = path.resolve(path.join(".", "SES_PASSWORD.secret"));

pulumi.all([
  vaultUser.id,
  vaultAccessKey.secret,
]).apply(([accessKeyId, password]) => {
  pulumi.log.info(`Writing SES SMTP username (access key ID) to [${smtpUsernameFilePath}]`);
  fs.writeFileSync(smtpUsernameFilePath, accessKeyId);

  pulumi.log.info(`Writing SES SMTP password to [${smtpPasswordFilePath}]`);
  fs.writeFileSync(smtpPasswordFilePath, password);
});

// const vaultGroupPolicy = new aws.iam.GroupPolicy("vault", {
//   group: vaultGroup.name,

// });

// const k8sSecret = new kubernetes.core.v1.Secret("vault-kms-unseal", {
//   metadata: {
//       name: pulumi.interpolate`vault-kms-unseal`,
//   },
//   stringData: {
//       "AWS_ACCESS_KEY_ID": vaultKMSUnsealResource3.id,
//       "AWS_SECRET_ACCESS_KEY": vaultKMSUnsealResource3.arn,
//       "VAULT_AWSKMS_SEAL_KEY_ID": vaultResource.keyId,
//   },
// });
