import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";
import * as random from "@pulumi/random";

const env = new random.RandomPet("env", {
  length: 2,
  separator: "_",
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


