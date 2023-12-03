export const minioUser = "twitlin"
export const minioServer = "s3.286k.co"
export const MinioBuckets = [
  {
  name: "volsync",
  acl: "private",
  },
  {
  name: "talos-backup",
  acl: "private",
  }
]

export const MinioUsers = [
  {
    name: "talos-backup",
    policies: ["talos-backup-private"],
    password: "talos-backupPassword"
  },
  {
    name: "volsync",
    policies: ["volsync-private"],
    password: "volsyncPassword"
  },
]

export const MinioPolicies = [
  {
    name: "talos-backup-private",
    policy: {
      "Version": "2012-10-17",
      "Statement": [
        {
          "Effect": "Allow",
          "Action": [
              "s3:PutObject",
              "s3:DeleteObject",
              "s3:GetObject",
              "s3:ListBucket"
          ],
          "Resource": [
              "arn:aws:s3:::talos-backup",
              "arn:aws:s3:::talos-backup/*"
          ]
        }
      ]
    }
  },
  {
    name: "volsync-private",
    policy: {
      "Version": "2012-10-17",
      "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "s3:ListBucket",
                "s3:PutObject",
                "s3:DeleteObject",
                "s3:GetObject"
            ],
            "Resource": [
                "arn:aws:s3:::volsync",
                "arn:aws:s3:::volsync/*"
            ]
        }
      ]
    }
  }
]
