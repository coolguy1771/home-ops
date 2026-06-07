## Learned User Preferences

- Use alphabetical ordering in kustomization.yaml resource lists for easier maintenance

## Learned Workspace Facts

- Cluster runs Talos Linux v1.13.2 on Kubernetes v1.36.1 (kyak); use workspace `kubeconfig` and `talos/clusterconfig/talosconfig` for kubectl/talosctl (set via `.envrc`); do not use repo-root `clusterconfig/talosconfig` (stale CA after regen)
- Media stack apps run under the media namespace; shared media often uses the `smb-media` PVC mounted at `/media`, with app-specific subpaths under `/media/...` for downloads and libraries
- Media file access: SABnzbd and Sonarr run as uid 1000; Jellyfin uses `supplementalGroups: [44]` (`render`) with `gpu.intel.com` ResourceClaimTemplate for Intel QSV/VAAPI transcode
- GitOps layout: Flux reconciles per-app `ks.yaml` paths; most apps deploy via HelmRelease; ExternalSecrets pull from 1Password via ClusterSecretStore `onepassword-connect`; app config files mount from `config/` ConfigMaps
- Flux CD manages the GitOps deployment pipeline for the entire cluster
- The `rook-ceph` namespace requires Pod Security Admission `privileged` labels for Rook/Ceph pods
- The `openebs-system` namespace requires PSA `privileged` labels; `openebs-hostpath` provisioner init pods run there, not in the PVC namespace
- `MutatingAdmissionPolicy` and `MutatingAdmissionPolicyBinding` manifests use `admissionregistration.k8s.io/v1` on this cluster (not `v1beta1`)
- Talos v1.13 kernel hardening uses `machine.install.grubUseUKICmdline: true` with args in Image Factory `schematic.customization.extraKernelArgs`, not `machine.install.extraKernelArgs`
- Workers k8s-7 and k8s-8 use network interface `enp3s0f0` (other workers may use `eno1`, `enp0s31f6`, etc.)
