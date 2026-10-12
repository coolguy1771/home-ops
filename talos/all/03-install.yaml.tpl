# topf's built-in default selects /dev/sda, which on k8s-4/5/6 is the Ceph OSD
# SSD — always pin the install disk by its by-id symlink.
apiVersion: v1alpha1
kind: UnattendedInstallConfig
provisioning:
  diskSelector:
    match: '"{{ .Node.Data.installDisk }}" in disk.symlinks'
  wipe: false
