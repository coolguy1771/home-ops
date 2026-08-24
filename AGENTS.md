## Learned User Preferences

- Use alphabetical ordering in kustomization.yaml resource lists for easier maintenance
- Do not use emoji in README or docs section headers
- Keep CoreDNS scheduled only on control plane nodes (`node-role.kubernetes.io/control-plane` affinity)

## Learned Workspace Facts

- Cluster runs Talos Linux v1.13.2 on Kubernetes v1.36.1 (kyak); kernel args via `machine.install.grubUseUKICmdline` and Image Factory `schematic.customization.extraKernelArgs`; use workspace `kubeconfig` and `talos/clusterconfig/talosconfig` for kubectl/talosctl (set via `.envrc`); do not use repo-root `clusterconfig/talosconfig` (stale CA after regen)
- Kubernetes API server endpoint is HAProxy at `10.10.10.201:6443` (`endpoint`/`certSANs` in `talos/talconfig.yaml`)
- Media stack apps run under the media namespace; shared media often uses the `smb-media` PVC mounted at `/media`, with app-specific subpaths under `/media/...` for downloads and libraries
- Media apps use the shared `nfs-scaler` KEDA component (0→1 replica scaling when NFS probe to `osiris:2049` succeeds)
- Media file access: SABnzbd and Sonarr run as uid 1000; Jellyfin uses `supplementalGroups: [44]` (`render`) with `gpu.intel.com` ResourceClaimTemplate for Intel QSV/VAAPI transcode
- GitOps layout: Flux reconciles per-app `ks.yaml` paths; most apps deploy via HelmRelease; ExternalSecrets pull from 1Password via ClusterSecretStore `onepassword-connect`; app config files mount from `config/` ConfigMaps
- Monitoring: k8s-monitoring Alloy scrapes ServiceMonitors/PodMonitors and ships metrics to Mimir (`https://mimir.cloud.witl.xyz/api/v1/push`), logs to Loki (`https://loki.cloud.witl.xyz`), and traces to Tempo (`https://tempo.cloud.witl.xyz/v1/traces`) using Authentik `observability-m2m` OAuth (tenant `witl-xyz`); Grafana runs on cloud-ops (`https://grafana.cloud.witl.xyz`) and home-ops pushes dashboards via grafana-operator external instance + `grafana-cloud-operator` 1Password service account token; disable Rook `PrometheusJobMissing`/`PrometheusJobExporterMissing` rules (synthetic `up{job=...}` unavailable in OTLP pipeline)
- `unifi-dns` runs in the `network` namespace; UniFi controller is at `10.2.0.1`, unpoller at `10.2.237.1`
- The `rook-ceph` namespace requires Pod Security Admission `privileged` labels for Rook/Ceph pods
- The `openebs-system` namespace requires PSA `privileged` labels; `openebs-hostpath` provisioner init pods run there, not in the PVC namespace
- `MutatingAdmissionPolicy` and `MutatingAdmissionPolicyBinding` manifests use `admissionregistration.k8s.io/v1` on this cluster (not `v1beta1`)
- Workers k8s-7 and k8s-8 use network interface `enp3s0f0` (other workers may use `eno1`, `enp0s31f6`, etc.)
- Rook deploys via split Flux kustomizations: `rook-ceph` operator, `ceph-csi-drivers` (Helm chart from ceph-csi-operator repo), then `rook-ceph-cluster`; chart tags track `v1.20.6`
- Bootstrap installs core charts via `bootstrap/helmfile/{crds,apps}.yaml`; chart versions are read from Flux `OCIRepository` manifests (no duplicate pins)
- Media duplicate cleanup runs `cleanrr` (replaced deduparr) in the `media` namespace
- Talos 1.14 upgrade prep: kubelet uses `maxParallelImagePulls: 3`, `imageMaximumGCAge: 168h`, and crash-loop backoff tuning; on 1.14 migrate `machine.features.kubernetesTalosAPIAccess` to `KubeTalosAPIAccessConfig` and add `FilesystemScrubConfig` (168h interval)
