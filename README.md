<div align="center">

<img src="https://camo.githubusercontent.com/5b298bf6b0596795602bd771c5bddbb963e83e0f/68747470733a2f2f692e696d6775722e636f6d2f7031527a586a512e706e67" align="center" width="144px" height="144px"/>

### My home operations repository :octocat:

_... managed with Flux, Renovate and GitHub Actions_ 🤖

</div>

<br/>

<div align="center">

[![Discord](https://img.shields.io/discord/673534664354430999?style=for-the-badge&label=discord&logo=discord&logoColor=white)](https://discord.gg/k8s-at-home)
[![k3s](https://img.shields.io/badge/k3s-v1.23.1-brightgreen?style=for-the-badge&logo=kubernetes&logoColor=white)](https://k3s.io/)
[![pre-commit](https://img.shields.io/badge/pre--commit-enabled-brightgreen?logo=pre-commit&logoColor=white&style=for-the-badge)](https://github.com/pre-commit/pre-commit)
[![GitHub Workflow Status](https://img.shields.io/github/workflow/status/coolguy1771/home-ops/Schedule%20-%20Renovate?label=renovate&logo=renovatebot&style=for-the-badge)](https://github.com/coolguy1771/home-ops/actions/workflows/schedule-renovate.yaml)
[![Lines of code](https://img.shields.io/tokei/lines/github/coolguy1771/home-ops?style=for-the-badge&color=brightgreen&label=lines&logo=codefactor&logoColor=white)](https://github.com/coolguy1771/home-ops/graphs/contributors)

</div>

---

## 📖 Overview

This is a mono repository for my home infrastructure and Kubernetes cluster. I try to adhere to Infrastructure as Code (IaC) and GitOps practices using the tools like [Ansible](https://www.ansible.com/), [Terraform](https://www.terraform.io/), [Kubernetes](https://kubernetes.io/), [Flux](https://github.com/fluxcd/flux2), [Renovate](https://github.com/renovatebot/renovate) and [GitHub Actions](https://github.com/features/actions).

---

## ⛵ Kubernetes

There's an excellent template over at [k8s-at-home/template-cluster-k3s](https://github.com/k8s-at-home/template-cluster-k3s) if you wanted to try and follow along with some of the practices I use here.

### Installation

My cluster is [k3s](https://k3s.io/) provisioned overtop bare-metal Ubuntu 20.04 using the [Ansible](https://www.ansible.com/) galaxy role [ansible-role-k3s](https://github.com/PyratLabs/ansible-role-k3s). This is a semi hyper-converged cluster, workloads and block storage are sharing the same available resources on my nodes while I have a separate server for (NFS) file storage.

🔸 _[Click here](./ansible/) to see my Ansible playbooks and roles._

### Core Components

- [projectcalico/calico](https://github.com/projectcalico/calico): Internal Kubernetes networking plugin.
- [rook/rook](https://github.com/rook/rook): Distributed block storage for peristent storage.
- [mozilla/sops](https://toolkit.fluxcd.io/guides/mozilla-sops/): Manages secrets for Kubernetes, Ansible and Terraform.
- [kubernetes-sigs/external-dns](https://github.com/kubernetes-sigs/external-dns): Automatically manages DNS records from my cluster in a cloud DNS provider.
- [jetstack/cert-manager](https://cert-manager.io/docs/): Creates SSL certificates for services in my Kubernetes cluster.
- [kubernetes/ingress-nginx](https://github.com/kubernetes/ingress-nginx/): Ingress controller to expose HTTP traffic to pods over DNS.

### GitOps

[Flux](https://github.com/fluxcd/flux2) watches my [cluster](./cluster/) folder (see Directories below) and makes the changes to my cluster based on the YAML manifests.

[Renovate](https://github.com/renovatebot/renovate) watches my **entire** repository looking for dependency updates, when they are found a PR is automatically created. When some PRs are merged [Flux](https://github.com/fluxcd/flux2) applies the changes to my cluster.

### Directories

The Git repository contains the following directories under [cluster](./cluster/) and are ordered below by how [Flux](https://github.com/fluxcd/flux2) will apply them.

- **base**: directory is the entrypoint to [Flux](https://github.com/fluxcd/flux2).
- **crds**: directory contains custom resource definitions (CRDs) that need to exist globally in your cluster before anything else exists.
- **core**: directory (depends on **crds**) are important infrastructure applications (grouped by namespace) that should never be pruned by [Flux](https://github.com/fluxcd/flux2).
- **apps**: directory (depends on **core**) is where your common applications (grouped by namespace) could be placed, [Flux](https://github.com/fluxcd/flux2) will prune resources here if they are not tracked by Git anymore.

### Networking

| Name                                         | CIDR            |
| -------------------------------------------- | --------------- |
| Kubernetes Nodes                             | `10.10.10.0/24` |
| Kubernetes external services (Calico w/ BGP) | `10.0.42.0/24`  |
| Kubernetes pods                              | `10.69.0.0/16`  |
| Kubernetes services                          | `10.96.0.0/16`  |

- HAProxy configured on Opnsense for the Kubernetes Control Plane Load Balancer.
- Calico configured with `externalIPs` to expose Kubernetes services with their own IP over BGP which is configured on my router.

### Persistent Volume Data Backup and Recovery

This is a hard topic to explain because there isn't a single great tool to work with rook-ceph. There's [Velero](https://github.com/vmware-tanzu/velero), [Benji](https://github.com/elemental-lf/benji), [Gemini](https://github.com/FairwindsOps/gemini), and others but they all have different amount of issues or nuances which makes them unsable for me.

Currently I am leveraging [Kasten K10 by Veeam](https://www.kasten.io/product/) which does a good job of snapshotting Ceph block volumes and the exports the data in the snapshot to durable storage (S3 / NFS).

There is also the manual method of scaling down the application and using the rook-ceph toolbox to mount the PV which allows you to tar up the volume data and send it to a NFS server. This method works great if all other options do not work.

---

## 🌐 DNS

### Ingress Controller

Over WAN, I have port forwarded ports `80` and `443` to the load balancer IP of my ingress controller that's running in my Kubernetes cluster.

[Cloudflare](https://www.cloudflare.com/) works as a proxy to hide my homes WAN IP and also as a firewall. When not on my home network, all the traffic coming into my ingress controller on port `80` and `443` comes from Cloudflare. In `Opnsense` I block all IPs not originating from the [Cloudflares list of IP ranges](https://www.cloudflare.com/ips/).

🔸 _Cloudflare is also configured to GeoIP block all countries except a few I have whitelisted_

### Internal DNS

[CoreDNS](https://github.com/coredns/coredns) is deployed on `Opnsense` with the [k8s_gateway](https://github.com/ori-edge/k8s_gateway) external plugin. With this setup, `CoreDNS` has direct access to my clusters ingress records and serves DNS for them in my internal network. `CoreDNS` is only listening on `127.0.0.1` on port `53`.

For adblocking, I have [AdGuard Home](https://github.com/AdguardTeam/AdGuardHome) also deployed on `Opnsense` which has a upstream server pointing the `CoreDNS` I mentioned above. `Adguard Home` listens on my `MANAGEMENT`, `SERVER`, `IOT` and `GUEST` networks on port `53`. In my firewall rules I have NAT port redirection forcing the `IOT` and `GUEST` networks to use the `Adguard Home` DNS server.

Without much engineering of DNS @home, these options have made my `Opnsense` router a single point of failure for DNS. I believe this is ok though because my router _should_ have the most uptime of all my systems.

🔸 _I maintain a build of `CoreDNS` for FreeBSD over at [onedr0p/opnsense-coredns](https://github.com/onedr0p/opnsense-coredns) that includes the `k8s_gateway` plugin._

### External DNS

[external-dns](https://github.com/kubernetes-sigs/external-dns) is deployed in my cluster and configure to sync DNS records to [Cloudflare](https://www.cloudflare.com/). The only ingresses `external-dns` looks at to gather DNS records to put in `Cloudflare` are ones that I explicitly set an annotation of `external-dns/is-public: "true"`

🔸 _[Click here](./terraform/cloudflare) to see how else I manage Cloudflare._

### Dynamic DNS

My home IP can change at any given time and in order to keep my WAN IP address up to date on Cloudflare I have deployed a [CronJob](./cluster/apps/networking/ddns) in my cluster. This periodically checks and updates the `A` record `ipv4.domain.tld`.

---

## ⚡ Network Attached Storage

:construction: Work in Progress :construction:

---

## 🔧 Hardware

| Device                   | Count | OS Disk Size | Data Disk Size          | Ram  | Operating System | Purpose                  |
| ------------------------ | ----- | ------------ | ----------------------- | ---- | ---------------- | ------------------------ |
| Protectli VP2410         | 1     | 120GB NVMe   | N/A                     | 8GB  | Opnsense 22.x    | Router                   |
| VMWare VM                | 2     | 100GB VDisk  | N/A                     | 16GB | Ubuntu 20.04     | Kubernetes (k3s) Masters |
| Dell Optiplex 3060 Micro | 1     | 240GB SSD    | N/A                     | 32GB | Ubuntu 20.04     | Kubernetes (k3s) Master  |
| VMWare VM                | 3     | 100GB VDisk  | 600GB VDisk (rook-ceph) | 16GB | Ubuntu 20.04     | Kubernetes (k3s) Workers |
| SuperMicro 6027R         | 1     | 500GB SSD    | 4x4TB RAIDz1            | 32GB | Ubuntu 21.10     | Shared file storage      |

---

## 🤝 Graditude and Thanks

Thanks to all the people who donate their time to the [Kubernetes @Home](https://github.com/k8s-at-home/) community. A lot of inspiration for my cluster came from the people that have shared their clusters over at [awesome-home-kubernetes](https://github.com/k8s-at-home/awesome-home-kubernetes).

---

## 📜 Changelog

See [commit history](https://github.com/coolguy1771/home-ops/commits/main)

---

## 🔏 License

See [LICENSE](./LICENSE)
