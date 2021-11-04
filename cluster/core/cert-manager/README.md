# `cert-manager` Namespace

## cert-manager

[cert-manager](https://github.com/jetstack/cert-manager) automatically obtains and renews certificates for the cluster using [Let's Encrypt](https://letsencrypt.org/). This implementation uses cloudflare as a dns01 verification path for Let's Encrypt.

- [cert-manager/helm-release.yaml](cert-manager/helm-release.yaml) - Main HelmRelease for cert-manager
- [cert-manager/letsencrypt-production.yaml](cert-manager/letsencrypt-production.yaml) - ClusterIssuer(s) and Certificate for the cluster
- [cert-manager/secret.sops.yaml](cert-manager/secret.sops.yaml) - My encrypted secret for cloudflare
