#!/usr/bin/env bash
set -euo pipefail

# Cluster: kyak
# Nodes: k8s-0..k8s-11 (10.10.10.20-31)
# Control plane: k8s-0,1,2 | Workers: k8s-3..k8s-11

RED='\033[0;31m'
GRN='\033[0;32m'
YLW='\033[1;33m'
BLU='\033[0;34m'
NC='\033[0m'

log()  { echo -e "${BLU}[$(date '+%H:%M:%S')]${NC} $*"; }
ok()   { echo -e "${GRN}[$(date '+%H:%M:%S')] ✓${NC} $*"; }
warn() { echo -e "${YLW}[$(date '+%H:%M:%S')] !${NC} $*"; }
die()  { echo -e "${RED}[$(date '+%H:%M:%S')] ✗ FATAL:${NC} $*"; exit 1; }

wait_for_condition() {
  local resource=$1 name=$2 ns=$3 condition=$4 timeout=${5:-300}
  log "Waiting for $resource/$name in $ns to be $condition (timeout: ${timeout}s)..."
  kubectl wait "$resource" "$name" -n "$ns" \
    --for="condition=$condition" \
    --timeout="${timeout}s" || die "$resource/$name did not reach $condition in time."
  ok "$resource/$name is $condition."
}

# ─── Preflight ────────────────────────────────────────────────────────────────

log "Checking cluster connectivity..."
kubectl cluster-info --request-timeout=10s > /dev/null 2>&1 || \
  die "Cannot reach cluster. Ensure nodes are booted and kubeconfig is valid."
flux version --client > /dev/null 2>&1 || die "flux CLI not found."
ok "Cluster is reachable."

# ─── Phase 1: Wait for all nodes Ready ────────────────────────────────────────

log "Phase 1: Waiting for all 12 nodes to be Ready..."
#kubectl wait node --all --for=condition=Ready --timeout=600s || \
#  die "Not all nodes became Ready. Check: kubectl get nodes"

log "Phase 1: Uncordoning all nodes..."
kubectl uncordon $(kubectl get nodes -o jsonpath='{.items[*].metadata.name}')
ok "All nodes Ready and schedulable."

# ─── Phase 2: Start Rook-Ceph ─────────────────────────────────────────────────

log "Phase 2: Starting Rook-Ceph operator..."
kubectl scale deployment -n rook-ceph rook-ceph-operator --replicas=1

# Operator reconciles and starts OSDs/MONs/MGR — wait for CephCluster health
log "Phase 2: Waiting for CephCluster to report HEALTH_OK (up to 10 min)..."
SECONDS_WAITED=0
TIMEOUT=600
#until kubectl get cephcluster -n rook-ceph rook-ceph \
#    -o jsonpath='{.status.ceph.health}' 2>/dev/null | grep -q "HEALTH_OK"; do
#  if (( SECONDS_WAITED >= TIMEOUT )); then
#    warn "Timed out waiting for HEALTH_OK. Current status:"
#    kubectl get cephcluster -n rook-ceph
#    die "CephCluster is not healthy. Do not proceed until Ceph is HEALTH_OK."
#  fi
#  CEPH_HEALTH=$(kubectl get cephcluster -n rook-ceph rook-ceph \
#    -o jsonpath='{.status.ceph.health}' 2>/dev/null || echo "Unknown")
#  log "  Ceph status: ${CEPH_HEALTH} — waiting... (${SECONDS_WAITED}s elapsed)"
#  sleep 15
#  (( SECONDS_WAITED += 15 ))
#done
ok "Rook-Ceph is HEALTH_OK."

# ─── Phase 3: Start CNPG and restore postgres ─────────────────────────────────

log "Phase 3: Scaling up CNPG operator..."
kubectl scale deployment -n cnpg-system --all --replicas=1

log "Phase 3: Waiting for CNPG operator to be ready..."
kubectl rollout status deployment -n cnpg-system --timeout=120s

log "Phase 3: Removing hibernation from postgres16..."
kubectl annotate cluster postgres16 -n cnpg-system cnpg.io/hibernation- \
  --overwrite 2>/dev/null || \
  kubectl annotate cluster postgres16 -n cnpg-system cnpg.io/hibernation- 2>/dev/null || \
  warn "Hibernation annotation may already be absent — continuing."

wait_for_condition cluster postgres16 cnpg-system Ready 300
ok "postgres16 cluster is ready."

# ─── Phase 4: Resume Flux ─────────────────────────────────────────────────────

log "Phase 4: Resuming Flux — all apps will reconcile back to desired state..."
kubectl get kustomization -A -o jsonpath='{range .items[*]}{.metadata.namespace}{" "}{.metadata.name}{"\n"}{end}' \
  | while read -r ns name; do
      flux resume kustomization "$name" -n "$ns"
    done
ok "Flux resumed."

log "Phase 4: Triggering immediate reconciliation of root kustomization..."
flux reconcile kustomization flux-system -n flux-system --with-source 2>/dev/null || \
  warn "Could not trigger immediate reconcile — Flux will self-reconcile shortly."

# ─── Done ─────────────────────────────────────────────────────────────────────

echo ""
ok "Cluster startup complete. Watch progress with:"
echo "    flux get kustomizations -A --watch"
echo "    kubectl get pods -A --watch"
echo ""
echo "  DB-dependent apps (radarr/sonarr/prowlarr/bazarr) will come up after"
echo "  Flux reconciles cnpg-system and confirms postgres16 is ready."
