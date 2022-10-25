<div align="center">

<img src="https://camo.githubusercontent.com/5b298bf6b0596795602bd771c5bddbb963e83e0f/68747470733a2f2f692e696d6775722e636f6d2f7031527a586a512e706e67" align="center" width="144px" height="144px"/>

### My home operations repository :octocat:

_... managed with Flux, Renovate and GitHub Actions_ 🤖

</div>

<br/>

<div align="center">

[![Discord](https://img.shields.io/discord/673534664354430999?style=for-the-badge&label&logo=discord&logoColor=white&color=blue)](https://discord.gg/k8s-at-home)
[![Kubernetes](https://img.shields.io/badge/v1.25-blue?style=for-the-badge&logo=kubernetes&logoColor=white)](https://k3s.io/)
[![Pre-commit](https://img.shields.io/badge/pre--commit-enabled-blue?logo=pre-commit&logoColor=white&label&style=for-the-badge)](https://github.com/pre-commit/pre-commit)
[![Renovate](https://img.shields.io/github/workflow/status/coolguy1771/home-ops/Schedule%20-%20Renovate?label=&logo=renovatebot&style=for-the-badge&color=blue)](https://github.com/coolguy1771/home-ops/actions/workflows/schedule-renovate.yaml)
[![LoC](https://img.shields.io/tokei/lines/github/coolguy1771/home-ops?style=for-the-badge&color=blue&label&logo=codefactor&logoColor=white)](https://github.com/coolguy1771/home-ops/graphs/contributors)

</div>

---

## 📖 Overview

This is a mono repository for my home infrastructure and Kubernetes cluster. I try to adhere to Infrastructure as Code (IaC) and GitOps practices using the tools like [Ansible](https://www.ansible.com/), [Terraform](https://www.terraform.io/), [Kubernetes](https://kubernetes.io/), [Flux](https://github.com/fluxcd/flux2), [Renovate](https://github.com/renovatebot/renovate) and [GitHub Actions](https://github.com/features/actions).

---

## ⛵ Kubernetes

There's an excellent template over at [onedr0p/flux-cluster-template](https://github.com/onedr0p/flux-cluster-template) if you wanted to try and follow along with some of the practices I use here.

### Installation

My cluster is [k3s](https://k3s.io/) provisioned overtop bare-metal Ubuntu 22.04 using the [Ansible](https://www.ansible.com/) galaxy role [ansible-role-k3s](https://github.com/PyratLabs/ansible-role-k3s). This is a semi hyper-converged cluster, workloads and block storage are sharing the same available resources on my nodes while I have a separate server for (NFS) file storage.

🔸 _[Click here](./ansible/) to see my Ansible playbooks and roles._

### Core Components

- [cilium/cilium](https://github.com/cilium/cilium): Internal Kubernetes networking plugin.
- [rook/rook](https://github.com/rook/rook): Distributed block storage for peristent storage.
- [mozilla/sops](https://toolkit.fluxcd.io/guides/mozilla-sops/): Manages secrets for Kubernetes, Ansible and Terraform.
- [kubernetes-sigs/external-dns](https://github.com/kubernetes-sigs/external-dns): Automatically manages DNS records from my cluster in a cloud DNS provider.
- [jetstack/cert-manager](https://cert-manager.io/docs/): Creates SSL certificates for services in my Kubernetes cluster.
- [kubernetes/ingress-nginx](https://github.com/kubernetes/ingress-nginx/): Ingress controller to expose HTTP traffic to pods over DNS.

### GitOps

[Flux](https://github.com/fluxcd/flux2) watches my [cluster](./cluster/) folder (see Directories below) and makes the changes to my cluster based on the YAML manifests.

[Renovate](https://github.com/renovatebot/renovate) watches my **entire** repository looking for dependency updates, when they are found a PR is automatically created. When some PRs are merged [Flux](https://github.com/fluxcd/flux2) applies the changes to my cluster.

### Directories

This Git repository contains the following directories (_kustomizatons_) under [cluster](./cluster/).

```sh
📁 cluster      # k8s cluster defined as code
├─📁 flux       # flux, gitops operator, loaded before everything
├─📁 charts     # helm repos, loaded before 📁 apps
├─📁 config     # cluster config, loaded before 📁 apps
└─📁 apps       # regular apps, namespaced dir tree, loaded last
```

### Networking

| Name                                         | CIDR            |
| -------------------------------------------- | --------------- |
| Kubernetes Nodes                             | `10.10.10.0/24` |
| Kubernetes external services (Calico w/ BGP) | `10.0.42.0/24`  |
| Kubernetes pods                              | `10.42.0.0/16`  |
| Kubernetes services                          | `10.43.0.0/16`  |

- HAProxy configured on Opnsense for the Kubernetes Control Plane Load Balancer.
- Cilium configured with `externalIPs` to expose Kubernetes services with their own IP over BGP which is configured on my router.

### Data Backup and Recovery

Due to issues, restrictions or nuances with [Velero](https://github.com/vmware-tanzu/velero), [Benji](https://github.com/elemental-lf/benji), [Gemini](https://github.com/FairwindsOps/gemini), [Kasten K10 by Veeam](https://www.kasten.io/product/), [Stash by AppsCode](https://stash.run/) and others I am currently using a DIY _(or more specifically a "Poor Man's Backup")_ solution that is leveraging [Kyverno](https://kyverno.io/), [Kopia](https://kopia.io/) and native Kubernetes `CronJob` and `Job` resources.

At a high level the way this operates is that:

- Kyverno creates a `CronJob` for each `PersistentVolumeClaim` resource that contain a label of `snapshot.home.arpa/enabled: "true"`
- Everyday the `CronJob` creates a `Job` and uses Kopia to connect to a Kopia repository on my NAS over NFS and then snapshots the contents of the app data mount into the Kopia repository
- The snapshots made by Kopia are incremental which makes the `Job` run very quick.
- The app data mount is frozen during backup to prevent writes and unfrozen when the snapshot is complete.
- The `PersistentVolumeClaim` resources must contain the labels `app.kubernetes.io/name`, `app.kubernetes.io/instance`, and `snapshot.home.arpa/enabled`

Some important notes on the implementation of this method:

- Kopia has a Web UI which you can deploy into your cluster to have access to the repository via the UI or by executing into the `Pod` and using the Kopia CLI. This deployment is required if using the [Taskfile](https://taskfile.dev/) `snapshot:create` and `snapshot:restore` tasks I created.
- Recovery is done manually by using a different `Job` which utilizes a task with Taskfile I wrote a task that creates a restore `Job` that shutdowns the app and restores a snapshot from the Kopia repository into the apps' data `PersistentVolumeClaim` and then puts the app back into a running state
- There is another `CronJob` that syncs the Kopia repository to Backblaze B2 everyday.

---

## 🌐 DNS

### Ingress Controller

Over WAN, I have port forwarded ports `80` and `443` to the load balancer IP of my ingress controller that's running in my Kubernetes cluster.

[Cloudflare](https://www.cloudflare.com/) works as a proxy to hide my homes WAN IP and also as a firewall. When not on my home network, all the traffic coming into my ingress controller on port `80` and `443` comes from Cloudflare. In `Opnsense` I block all IPs not originating from the [Cloudflares list of IP ranges](https://www.cloudflare.com/ips/).

🔸 _Cloudflare is also configured to GeoIP block all countries except a few I have whitelisted_

### Internal DNS

[k8s_gateway](https://github.com/ori-edge/k8s_gateway) is deployed on `Opnsense`. With this setup, `k8s_gateway` has direct access to my clusters ingress records and serves DNS for them in my internal network. `k8s_gateway` is only listening on `127.0.0.1` on port `53`.

For adblocking, I have [AdGuard Home](https://github.com/AdguardTeam/AdGuardHome) also deployed on `Opnsense` which has a upstream server pointing the `k8s_gateway` I mentioned above. `Adguard Home` listens on my `LAN`, `HOME_LAB` networks on port `5353`. In my firewall rules I have NAT port redirection forcing all the networks to use the `Adguard Home` DNS server.

Without much engineering of DNS @home, these options have made my `Opnsense` router a single point of failure for DNS. I believe this is ok though because my router _should_ have the most uptime of all my systems.

### External DNS

[external-dns](https://github.com/kubernetes-sigs/external-dns) is deployed in my cluster and configure to sync DNS records to [Cloudflare](https://www.cloudflare.com/). The only ingresses `external-dns` looks at to gather DNS records to put in `Cloudflare` are ones that I explicitly set an annotation of `external-dns.home.arpa/enabled: "true"`

🔸 _[Click here](./terraform/cloudflare) to see how else I manage Cloudflare._

### Dynamic DNS

My home IP can change at any given time and in order to keep my WAN IP address up to date on Cloudflare I have deployed a [CronJob](./cluster/apps/networking/ddns) in my cluster. This periodically checks and updates the `A` record `ipv4.domain.tld`.

---

## 🔧 Hardware

| Device                   | Count | OS Disk Size | Data Disk Size          | Ram  | Operating System | Purpose                  |
| ------------------------ | ----- | ------------ | ----------------------- | ---- | ---------------- | ------------------------ |
| Protectli VP2410         | 1     | 120GB NVMe   | N/A                     | 8GB  | Opnsense 22.x    | Router                   |
| Dell Optiplex 3060 Micro | 1     | 240GB SSD    | N/A                     | 32GB | Fedora 36        | Kubernetes (k3s) Master  |
| Dell Optiplex 3080 Micro | 2     | 250GB SSD    | N/A                     | 16GB | Fedora 36        | Kubernetes (k3s) Master  |
| Lenovo M910q Tiny        | 2     | 512GB NVMe   | N/A                     | 16GB | Fedora 36        | Kubernetes (k3s) Worker  |
| VMWare VM                | 3     | 100GB VDisk  | 400GB VDisk (rook-ceph) | 24GB | Fedora 36        | Kubernetes (k3s) Workers |
| SuperMicro 6027R         | 1     | 500GB SSD    | 16TB zfs mirror         | 64GB | Ubuntu 22.04     | Shared file storage      |

---

## 🤝 Graditude and Thanks

Thanks to all the people who donate their time to the [Kubernetes @Home](https://github.com/k8s-at-home/) community. A lot of inspiration for my cluster comes from the people that have shared their clusters with the [k8s-at-home](https://github.com/topics/k8s-at-home) GitHub topic.

---

## 📜 Changelog

See [commit history](https://github.com/onedr0p/home-ops/commits/main)

---

## 🔏 License

See [LICENSE](./LICENSE)
