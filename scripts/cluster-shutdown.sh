#!/usr/bin/env bash
set -euo pipefail

# Cluster: kyak
# Nodes: k8s-0..k8s-11 (10.10.10.20-31)
# Control plane: k8s-0,1,2 | Workers: k8s-3..k8s-11

CONTROL_PLANE_NODES="10.10.10.20,10.10.10.21,10.10.10.22"
WORKER_NODES="10.10.10.23,10.10.10.24,10.10.10.25,10.10.10.26,10.10.10.27,10.10.10.28,10.10.10.29,10.10.10.30,10.10.10.31"
ALL_NODES="${CONTROL_PLANE_NODES},${WORKER_NODES}"

RED='\033[0;31m'
GRN='\033[0;32m'
YLW='\033[1;33m'
BLU='\033[0;34m'
NC='\033[0m'

log()  { echo -e "${BLU}[$(date '+%H:%M:%S')]${NC} $*"; }
ok()   { echo -e "${GRN}[$(date '+%H:%M:%S')] ✓${NC} $*"; }
warn() { echo -e "${YLW}[$(date '+%H:%M:%S')] !${NC} $*"; }
die()  { echo -e "${RED}[$(date '+%H:%M:%S')] ✗ FATAL:${NC} $*"; exit 1; }

confirm() {
  echo -e "${YLW}$*${NC}"
  read -r -p "Continue? [y/N] " reply
  [[ "$reply" =~ ^[Yy]$ ]] || { echo "Aborted."; exit 0; }
}

wait_for_pods_gone() {
  local ns=$1 selector=$2 timeout=${3:-120}
  log "Waiting for pods to terminate in $ns (selector: $selector)..."
  if kubectl wait pod -n "$ns" -l "$selector" --for=delete --timeout="${timeout}s" 2>/dev/null; then
    ok "All pods gone in $ns"
  else
    warn "Timed out waiting — some pods may still be terminating in $ns"
    kubectl get pods -n "$ns" -l "$selector" 2>/dev/null || true
  fi
}

# ─── Preflight ────────────────────────────────────────────────────────────────

log "Checking cluster connectivity..."
kubectl cluster-info --request-timeout=10s > /dev/null 2>&1 || die "Cannot reach cluster. Check kubeconfig."
flux version --client > /dev/null 2>&1 || die "flux CLI not found."
talosctl version --client > /dev/null 2>&1 || die "talosctl CLI not found."
ok "Preflight checks passed."

confirm "This will shut down the entire kyak cluster. All nodes will be powered off."

# ─── Phase 1: Suspend Flux ────────────────────────────────────────────────────

log "Phase 1: Suspending Flux kustomizations..."
kubectl get kustomization -A -o jsonpath='{range .items[*]}{.metadata.namespace}{" "}{.metadata.name}{"\n"}{end}' \
  | while read -r ns name; do
      flux suspend kustomization "$name" -n "$ns"
    done
ok "Flux suspended."

# ─── Phase 2: Stop DB-dependent apps ─────────────────────────────────────────

log "Phase 2: Stopping DB-dependent apps (radarr, sonarr, prowlarr, bazarr)..."
kubectl scale deployment -n media radarr sonarr prowlarr bazarr --replicas=0 2>/dev/null || \
  warn "One or more media DB deployments not found — skipping."

wait_for_pods_gone media \
  "app.kubernetes.io/name in (radarr,sonarr,prowlarr,bazarr)" 120

# ─── Phase 3: Stop remaining apps with PVCs ───────────────────────────────────

log "Phase 3: Stopping remaining media apps..."
kubectl scale deployment -n media \
  jellyfin jellyseerr autobrr brrpolice \
  nzbget notifier qbittorrent recyclarr \
  sabnzbd deduparr seasonpackerr --replicas=0 2>/dev/null || \
  warn "Some media deployments not found — skipping missing ones."

log "Phase 3: Stopping foundryvtt..."
kubectl scale deployment -n foundryvtt --all --replicas=0 2>/dev/null || \
  warn "foundryvtt deployments not found."

log "Phase 3: Stopping monitoring..."
kubectl scale deployment  -n monitoring --all --replicas=0 2>/dev/null || true
kubectl scale statefulset -n monitoring --all --replicas=0 2>/dev/null || true

wait_for_pods_gone media "app.kubernetes.io/part-of=media" 120

# ─── Phase 4: Stop remaining app namespaces ───────────────────────────────────

log "Phase 4: Stopping remaining app namespaces..."
for ns in discord network cert-manager external-secrets volsync-system \
          actions-runner-system system-upgrade; do
  kubectl scale deployment  -n "$ns" --all --replicas=0 2>/dev/null || true
  kubectl scale statefulset -n "$ns" --all --replicas=0 2>/dev/null || true
done
ok "App namespaces scaled down."

# ─── Phase 5: Hibernate CNPG postgres ────────────────────────────────────────

log "Phase 5: Hibernating CNPG postgres16 cluster..."
kubectl annotate cluster postgres16 -n cnpg-system cnpg.io/hibernation=on \
  --overwrite || die "Failed to annotate postgres16 cluster."

wait_for_pods_gone cnpg-system "cnpg.io/cluster=postgres16" 120

log "Phase 5: Scaling down CNPG operator..."
kubectl scale deployment -n cnpg-system --all --replicas=0
ok "CNPG shut down."

# ─── Phase 6: Shut down Rook-Ceph ─────────────────────────────────────────────

log "Phase 6: Scaling down Rook-Ceph operator..."
kubectl scale deployment -n rook-ceph rook-ceph-operator --replicas=0

log "Phase 6: Scaling down all Ceph components..."
kubectl scale deployment  -n rook-ceph --all --replicas=0 2>/dev/null || true
kubectl scale statefulset -n rook-ceph --all --replicas=0 2>/dev/null || true

log "Phase 6: Waiting for Ceph pods to terminate (up to 5 min)..."
kubectl wait pod -n rook-ceph --all --for=delete --timeout=300s 2>/dev/null || \
  warn "Some Ceph pods still terminating — check 'kubectl get pods -n rook-ceph' after."
ok "Rook-Ceph shut down."

# ─── Phase 7: Drain and power off nodes ───────────────────────────────────────

log "Phase 7: Cordoning all nodes..."
kubectl cordon $(kubectl get nodes -o jsonpath='{.items[*].metadata.name}')

log "Phase 7: Draining workers first, then control plane..."
WORKERS=$(kubectl get nodes -l '!node-role.kubernetes.io/control-plane' \
  -o jsonpath='{.items[*].metadata.name}')
CONTROL=$(kubectl get nodes -l 'node-role.kubernetes.io/control-plane' \
  -o jsonpath='{.items[*].metadata.name}')

for node in $WORKERS $CONTROL; do
  log "Draining $node..."
  kubectl drain "$node" \
    --ignore-daemonsets \
    --delete-emptydir-data \
    --force \
    --timeout=60s 2>/dev/null || warn "Drain of $node completed with warnings."
done

ok "All nodes drained."

confirm "Ready to power off all nodes via talosctl. This is the point of no return."

log "Phase 7: Shutting down worker nodes..."
talosctl shutdown --nodes "$WORKER_NODES"

log "Waiting 15s before shutting down control plane..."
sleep 15

log "Phase 7: Shutting down control plane nodes..."
talosctl shutdown --nodes "$CONTROL_PLANE_NODES"

ok "Shutdown complete. All nodes powering off."
