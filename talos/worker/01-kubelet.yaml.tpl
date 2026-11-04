# Workers stay on v1alpha1 .machine.kubelet: KubeletConfig has no extraMounts
# equivalent and openebs-hostpath needs /var/openebs/local mounted rshared.
# The generated KubeletConfig (which carries the kubelet image) is deleted, so
# the image is pinned here instead — otherwise kubelet would jump to Talos'
# bundled Kubernetes version.
machine:
  kubelet:
    image: ghcr.io/siderolabs/kubelet:v{{ trimPrefix "v" .KubernetesVersion }}
    defaultRuntimeSeccompProfileEnabled: true
    disableManifestsDirectory: true
    extraArgs:
      rotate-server-certificates: "true"
    extraConfig:
      serializeImagePulls: false
      maxParallelImagePulls: 3
      # Proactive image GC — the age timer resets on every kubelet restart, so
      # threshold-based GC is the real backstop against imagefs filling up.
      imageMaximumGCAge: 168h
      imageGCHighThresholdPercent: 75
      imageGCLowThresholdPercent: 60
      systemReserved:
        cpu: 100m
        memory: 512Mi
        ephemeral-storage: 2Gi
      kubeReserved:
        cpu: 100m
        memory: 512Mi
      evictionHard:
        memory.available: 100Mi
        nodefs.available: 10%
        imagefs.available: 15%
      # Disabled: graceful shutdown waits on Ceph CSI unmounts and
      # deadlocks when OSDs are down (nodes never become Ready again).
      shutdownGracePeriod: 0s
      shutdownGracePeriodCriticalPods: 0s
      crashLoopBackOff:
        maxContainerRestartPeriod: 60s
    extraMounts:
      - destination: /var/openebs/local
        type: bind
        source: /var/openebs/local
        options:
          - bind
          - rshared
          - rw
---
apiVersion: v1alpha1
kind: KubeletConfig
$patch: delete
