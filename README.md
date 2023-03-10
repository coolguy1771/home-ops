<div align="center">

<img src="https://camo.githubusercontent.com/5b298bf6b0596795602bd771c5bddbb963e83e0f/68747470733a2f2f692e696d6775722e636f6d2f7031527a586a512e706e67" align="center" width="144px" height="144px"/>

### My home operations repository :octocat:

_... managed with Flux, Renovate and GitHub Actions_ 🤖

</div>

<div align="center">

[![Discord](https://img.shields.io/discord/673534664354430999?style=for-the-badge&label&logo=discord&logoColor=white&color=blue)](https://discord.gg/k8s-at-home)
[![Kubernetes](https://img.shields.io/badge/v1.26-blue?style=for-the-badge&logo=kubernetes&logoColor=white)](https://talos.dev/)
[![Renovate](https://img.shields.io/github/actions/workflow/status/coolguy1771/home-ops/renovate.yaml?branch=main&label=&logo=renovatebot&style=for-the-badge&color=blue)](https://github.com/coolguy1771/home-ops/actions/workflows/renovate.yaml)

</div>

---

## 📖 Overview

This is a mono repository for my home infrastructure and Kubernetes cluster. I try to adhere to Infrastructure as Code (IaC) and GitOps practices using the tools like [Ansible](https://www.ansible.com/), [Terraform](https://www.terraform.io/), [Kubernetes](https://kubernetes.io/), [Flux](https://github.com/fluxcd/flux2), [Renovate](https://github.com/renovatebot/renovate) and [GitHub Actions](https://github.com/features/actions).

---

## ⛵ Kubernetes

There is a template over at [onedr0p/flux-cluster-template](https://github.com/onedr0p/flux-cluster-template) if you wanted to try and follow along with some of the practices I use here.

### Installation

My cluster is [talos](https://talos.dev) provisioned overtop bare-metal. This is a semi hyper-converged cluster, workloads and block storage are sharing the same available resources on my nodes while I have a separate server for (NFS) file storage.

🔸 _[Click here](./ansible/) to see my Ansible playbooks and roles._

### Core Components


- [actions-runner-controller](https://github.com/actions/actions-runner-controller): Self-hosted Github runners.
- [cilium/cilium](https://github.com/cilium/cilium): Internal Kubernetes networking plugin.
- [cert-manager](https://cert-manager.io/docs/): Creates SSL certificates for services in my Kubernetes cluster.
- [external-dns](https://github.com/kubernetes-sigs/external-dns): Automatically manages DNS records from my cluster in a cloud DNS provider.
- [external-secrets](https://github.com/external-secrets/external-secrets/): Managed Kubernetes secrets using [1Password Connect](https://github.com/1Password/connect).
- [ingress-nginx](https://github.com/kubernetes/ingress-nginx/): Ingress controller to expose HTTP traffic to pods over DNS.
- [rook](https://github.com/rook/rook): Distributed block storage for peristent storage.
- [sops](https://toolkit.fluxcd.io/guides/mozilla-sops/): Managed secrets for Kubernetes, Ansible and Terraform which are commited to Git.
- [tf-controller](https://github.com/weaveworks/tf-controller): Additional Flux component used to run Terraform from within a Kubernetes cluster.
- [volsync](https://github.com/backube/volsync) and [snapscheduler](https://github.com/backube/snapscheduler): Backup and recovery of persistent volume claims.

### GitOps

[Flux](https://github.com/fluxcd/flux2) watches my [kubernetes](./kubernetes/) folder (see Directories below) and makes the changes to my cluster based on the YAML manifests.

The way Flux works for me here is it will recursively search the [kubernetes/apps](./kubernetes/apps) folder until it finds the most top level `kustomization.yaml` per directory and then apply all the resources listed in it. That aforementioned `kustomization.yaml` will generally only have a namespace resource and one or many Flux kustomizations. Those Flux kustomizations will generally have a `HelmRelease` or other resources related to the application underneath it which will be applied.

[Renovate](https://github.com/renovatebot/renovate) watches my **entire** repository looking for dependency updates, when they are found a PR is automatically created. When some PRs are merged [Flux](https://github.com/fluxcd/flux2) applies the changes to my cluster.

### Directories

This Git repository contains the following directories under [kubernetes](./kubernetes/).

```sh
📁 kubernetes      # Kubernetes cluster defined as code
├─📁 bootstrap     # Flux installation
├─📁 flux          # Main Flux configuration of repository
└─📁 apps          # Apps deployed into my cluster grouped by namespace (see below)
```

### Cluster layout

Below is a a high level look at the layout of how my directory structure with Flux works. In this brief example you are able to see that `authelia` will not be able to run until `glauth` and  `cloudnative-pg` are running. It also shows that the `Cluster` custom resource depends on the `cloudnative-pg` Helm chart. This is needed because `cloudnative-pg` installs the `Cluster` custom resource definition in the Helm chart.

```python
# Key: <kind> :: <metadata.name>
GitRepository :: home-ops-kubernetes
    Kustomization :: cluster
        Kustomization :: cluster-apps
            Kustomization :: cluster-apps-authelia
                DependsOn:
                    Kustomization :: cluster-apps-glauth
                    Kustomization :: cluster-apps-cloudnative-pg-cluster
                HelmRelease :: authelia
            Kustomization :: cluster-apps-glauth
                HelmRelease :: glauth
            Kustomization :: cluster-apps-cloudnative-pg
                HelmRelease :: cloudnative-pg
            Kustomization :: cluster-apps-cloudnative-pg-cluster
                DependsOn:
                    Kustomization :: cluster-apps-cloudnative-pg
                Cluster :: postgres
```

### Networking

| Name                                          | CIDR              |
|-----------------------------------------------|-------------------|
| Management VLAN                               | `192.168.1.0/24`  |
| Kubernetes Nodes VLAN                         | `10.10.10.0/24` |
| Kubernetes external services (Cilium w/ BGP)  | `10.0.42.0/24` |
| Kubernetes pods                               | `10.42.0.0/16`    |
| Kubernetes services                           | `10.43.0.0/16`    |

- HAProxy configured on my `Opnsense` router for the Kubernetes Control Plane Load Balancer.
- Cilium configured with `loadbalancerIPs` to expose Kubernetes services with their own IP over BGP (w/ECMP) which is configured on my router.

🔸 _[Click here](https://onedr0p.github.io/home-ops/notes/opnsense.html) to review how I configured HAProxy and BGP on Opnsense._

---

## ☁️ Cloud Dependencies

While most of my infrastructure and workloads are selfhosted I do rely upon the cloud for certain key parts of my setup. This saves me from having to worry about two things. (1) Dealing with chicken/egg scenarios and (2) services I critically need whether my cluster is online or not.

The alternative solution to these two problems would be to host a Kubernetes cluster in the cloud and deploy applications like [HCVault](https://www.vaultproject.io/), [Vaultwarden](https://github.com/dani-garcia/vaultwarden), [ntfy](https://ntfy.sh/), and [Gatus](https://gatus.io/). However, maintaining another cluster and monitoring another group of workloads is a lot more time and effort than I am willing to put in.

| Service                                      | Use                                                               | Cost           |
|----------------------------------------------|-------------------------------------------------------------------|----------------|
| [Fastmail](https://fastmail.com/)            | Email hosting                                                     | ~$90/yr        |
| [GitHub](https://github.com/)                | Hosting this repository and continuous integration/deployments    | Free           |
| [Cloudflare](https://www.cloudflare.com/)    | Domain, DNS and proxy management                                  | ~$30/yr        |
| [1Password](https://1password.com/)          | Secrets with [External Secrets](https://external-secrets.io/)     | ~$65/yr        |
| [Terraform Cloud](https://www.terraform.io/) | Storing Terraform state                                           | Free           |
| [B2 Storage](https://www.backblaze.com/b2)   | Offsite application backups                                       | ~$5/mo         |
| [UptimeRobot](https://uptimerobot.com/)      | Monitoring internet connectivity and external facing applications | ~$85/yr        |
| [Pushover](https://pushover.net/)            | Kubernetes Alerts and application notifications                   | Free           |
| [NextDNS](https://nextdns.io/)               | My routers DNS server which includes AdBlocking                   | ~20/yr         |
|                                              |                                                                   | Total: ~$30/mo |

---

## 🌐 DNS

<details>
  <summary>Click to see a diagram of how I conquer DNS!</summary>

  <img src="https://raw.githubusercontent.com/onedr0p/home-ops/main/docs/src/assets/dns.png" align="center" width="600px" alt="dns"/>
</details>

### Ingress Controller

Over WAN, I have port forwarded ports `80` and `443` to the load balancer IP of my ingress controller that's running in my Kubernetes cluster.

[Cloudflare](https://www.cloudflare.com/) works as a proxy to hide my homes WAN IP and also as a firewall. When not on my home network, all the traffic coming into my ingress controller on port `80` and `443` comes from Cloudflare. In `Opnsense` I block all IPs not originating from the [Cloudflares list of IP ranges](https://www.cloudflare.com/ips/).

### Internal DNS

[CoreDNS](https://github.com/coredns/coredns) is deployed on my `Opnsense` router and listening on `:53`. All DNS queries for _**my**_ domains are forwarded to [k8s_gateway](https://github.com/ori-edge/k8s_gateway) that is running in my cluster. With this setup `k8s_gateway` has direct access to my clusters ingresses and services and serves DNS for them in my internal network. One additional thing is that I have `dnsmasq` running on `Opnsense` on port `5353` to only have it provide a host file for `CoreDNS`, this way I can have DNS for devices on my network.

### Ad Blocking

The upstream server in CoreDNS is set to NextDNS which provides me with AdBlocking for all devices on my network.

### External DNS

[external-dns](https://github.com/kubernetes-sigs/external-dns) is deployed in my cluster and configure to sync DNS records to [Cloudflare](https://www.cloudflare.com/). The only ingresses `external-dns` looks at to gather DNS records to put in `Cloudflare` are ones that I explicitly set an annotation of `external-dns.home.arpa/enabled: "true"`

🔸 _[Click here](./terraform/cloudflare) to see how else I manage Cloudflare with Terraform._

### Dynamic DNS

My home IP can change at any given time and in order to keep my WAN IP address up to date on Cloudflare. I have deployed a [CronJob](./kubernetes/apps/networking/ddns) in my cluster, this periodically checks and updates the `A` record `ipv4.domain.tld`.

---

## 🔧 Hardware

| Device                   | Count | OS Disk Size | Data Disk Size          | Ram  | Operating System | Purpose                  |
| ------------------------ | ----- | ------------ | ----------------------- | ---- | ---------------- | ------------------------ |
| Protectli VP2410         | 1     | 120GB NVMe   | N/A                     | 8GB  | Opnsense 23.x    | Router                   |
| Dell Optiplex 3060 Micro | 1     | 240GB SSD    | N/A                     | 32GB | Fedora 37        | Kubernetes (k3s) Master  |
| Dell Optiplex 3080 Micro | 2     | 250GB SSD    | N/A                     | 16GB | Fedora 37        | Kubernetes (k3s) Master  |
| Lenovo M910q Tiny        | 2     | 512GB NVMe   | 500Gb SSD (rook-ceph)   | 16GB | Fedora 37        | Kubernetes (k3s) Worker  |
| HP EliteDesk 800 G4 SFF  | 2     | 240GB NVMe   | 500Gb SSD (rook-ceph)   | 16GB | Fedora 37        | Kubernetes (k3s) Worker  |
| HP DL160 G10             | 1     | 500GB SSD    | 16TB zfs mirror         | 64GB | Ubuntu 22.04     | Shared file storage      |

---

## ⭐ Stargazers

<div align="center">

[![Star History Chart](https://api.star-history.com/svg?repos=onedr0p/home-ops&type=Date)](https://star-history.com/#onedr0p/home-ops&Date)

</div>

---

## 🤝 Gratitude and Thanks

Thanks to all the people who donate their time to the [Kubernetes @Home](https://discord.gg/k8s-at-home) Discord community. A lot of inspiration for my cluster comes from the people that have shared their clusters using the [k8s-at-home](https://github.com/topics/k8s-at-home) GitHub topic. Be sure to check out the [Kubernetes @Home search](https://nanne.dev/k8s-at-home-search/) for ideas on how to deploy applications or get ideas on what you can deploy.

---

## 📜 Changelog

See my _awful_ [commit history](https://github.com/onedr0p/home-ops/commits/main)

---

## 🔏 License

See [LICENSE](./LICENSE)
