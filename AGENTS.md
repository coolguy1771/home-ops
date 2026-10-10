## Learned User Preferences

- Use alphabetical ordering in kustomization.yaml resource lists for easier maintenance
- Do not use emoji in README or docs section headers
- Keep CoreDNS scheduled only on control plane nodes (`node-role.kubernetes.io/control-plane` affinity)
- Prefer force reboot (`talosctl reboot --mode=force` or hard power cycle) over graceful shutdown when Ceph CSI volumes cannot unmount
- Route `alertname=Watchdog` to the Alertmanager `null` receiver (evaluate but do not notify)

## Learned Workspace Facts

- Cluster runs Talos Linux v1.13.2 on Kubernetes v1.36.1 (kyak), managed with [topf](https://github.com/postfinance/topf) (`talos/topf.yaml` + `talos/{all,control-plane,worker,node}/` patches + `talos/schematics/`), not talhelper; apply with `just talos apply`; API via HAProxy `10.10.10.201:6443` (`clusterEndpoint` / `certSANs`); use workspace root `kubeconfig`/`talosconfig` (`.mise.toml`, `just talos kubeconfig`/`talosconfig`); kernel args via `machine.install.grubUseUKICmdline` and Image Factory `extraKernelArgs`
- Media stack in `media` namespace: shared `smb-media` PVC at `/media` with app subpaths; `nfs-scaler` KEDA (0→1 when NFS probe to `osiris:2049` succeeds); SABnzbd/Sonarr uid 1000; Jellyfin `supplementalGroups: [44]` (`render`) with `gpu.intel.com` ResourceClaimTemplate for Intel QSV/VAAPI; duplicate cleanup via `cleanrr` (replaced deduparr)
- GitOps layout: Flux reconciles per-app `ks.yaml` paths; most apps deploy via HelmRelease; ExternalSecrets pull from 1Password via ClusterSecretStore `onepassword-connect`; app config files mount from `config/` ConfigMaps
- Monitoring: k8s-monitoring Alloy scrapes ServiceMonitors/PodMonitors to Mimir (`https://mimir.cloud.witl.xyz/api/v1/push`), Loki (`https://loki.cloud.witl.xyz`), Tempo (`https://tempo.cloud.witl.xyz/v1/traces`) using Authentik `observability-m2m` OAuth (tenant `witl-xyz`); Grafana on cloud-ops (`https://grafana.cloud.witl.xyz`) via grafana-operator + `grafana-cloud-operator` 1Password token; disable Rook `PrometheusJobMissing`/`PrometheusJobExporterMissing`; Watchdog routes to Alertmanager `null`
- Loki app alerts use ConfigMaps labeled `loki_rule: "true"`; host/game logs for `delilah.icbplays.net` use Loki tenant `icbplays-net` (Grafana datasource/alerts on cloud-ops)
- `unifi-dns` runs in the `network` namespace; UniFi controller is at `10.2.0.1`, unpoller at `10.2.237.1`
- `rook-ceph` and `openebs-system` require Pod Security Admission `privileged` labels; `openebs-hostpath` provisioner init pods run in `openebs-system`, not the PVC namespace
- `MutatingAdmissionPolicy` and `MutatingAdmissionPolicyBinding` manifests use `admissionregistration.k8s.io/v1` on this cluster (not `v1beta1`)
- Workers k8s-7 and k8s-8 use network interface `enp3s0f0` (other workers may use `eno1`, `enp0s31f6`, etc.)
- Rook deploys via split Flux kustomizations: `rook-ceph` operator, `ceph-csi-drivers` (Helm chart from ceph-csi-operator repo), then `rook-ceph-cluster`; chart tags track `1.21.0` (no `v` prefix from 1.21)
- Bootstrap installs core charts via `bootstrap/helmfile/{crds,apps}.yaml`; chart versions are read from Flux `OCIRepository` manifests (no duplicate pins)
- Talos 1.14 upgrade prep: kubelet uses `maxParallelImagePulls: 3`, `imageMaximumGCAge: 168h`, and crash-loop backoff tuning; on 1.14 migrate `machine.features.kubernetesTalosAPIAccess` to `KubeTalosAPIAccessConfig` and add `FilesystemScrubConfig` (168h interval)
