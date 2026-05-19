#!/usr/bin/env bash
# Jellyfin SQLite repair for Kubernetes (dump/reimport), adapted from:
# https://github.com/MadGoatHaz/JellyFin-DB-Fix/blob/master/JellyFin%20DB%20Fix/jellyfin_db_fix.sh
#
# Usage:
#   ./jellyfin-db-repair.sh
#   NAMESPACE=media PVC_NAME=jellyfin ./jellyfin-db-repair.sh
#
# Requires: kubectl, cluster access. Stops Jellyfin, mounts the config PVC on a Job,
# rebuilds jellyfin.db, then restarts Jellyfin.

set -euo pipefail

NAMESPACE="${NAMESPACE:-media}"
PVC_NAME="${PVC_NAME:-jellyfin}"
DB_DIR="/config/data"
DB_FILE="jellyfin.db"
RUN_UID="${RUN_UID:-1000}"
RUN_GID="${RUN_GID:-1000}"
JOB_NAME="jellyfin-db-repair-$(date +%s)"

resolve_deploy() {
  local d
  for d in jellyfin jellyfin-jellyfin; do
    if kubectl get deployment "$d" -n "$NAMESPACE" &>/dev/null; then
      echo "$d"
      return 0
    fi
  done
  echo "No Deployment named jellyfin or jellyfin-jellyfin in ns $NAMESPACE" >&2
  echo "Set DEPLOYMENT_NAME explicitly." >&2
  exit 1
}

DEPLOYMENT_NAME="${DEPLOYMENT_NAME:-$(resolve_deploy)}"

echo "Namespace:    $NAMESPACE"
echo "Deployment:   $DEPLOYMENT_NAME"
echo "PVC:          $PVC_NAME"
echo "DB path:      $DB_DIR/$DB_FILE (inside volume)"
echo ""

REPLICAS=$(kubectl get deployment "$DEPLOYMENT_NAME" -n "$NAMESPACE" \
  -o jsonpath='{.spec.replicas}')
REPLICAS="${REPLICAS:-1}"

restore_replicas() {
  kubectl scale deployment "$DEPLOYMENT_NAME" -n "$NAMESPACE" \
    --replicas="${REPLICAS}" || true
  kubectl rollout status deployment "$DEPLOYMENT_NAME" -n "$NAMESPACE" \
    --timeout=300s || true
}

echo "Scaling $DEPLOYMENT_NAME to 0 (was $REPLICAS)..."
kubectl scale deployment "$DEPLOYMENT_NAME" -n "$NAMESPACE" --replicas=0
kubectl rollout status deployment "$DEPLOYMENT_NAME" -n "$NAMESPACE" --timeout=120s

if ! kubectl apply -f - <<EOF
apiVersion: batch/v1
kind: Job
metadata:
  name: ${JOB_NAME}
  namespace: ${NAMESPACE}
spec:
  backoffLimit: 0
  ttlSecondsAfterFinished: 600
  template:
    spec:
      restartPolicy: Never
      containers:
        - name: repair
          image: docker.io/library/alpine:3.20
          command: ["/bin/sh", "-c"]
          args:
            - |
              set -eux
              apk add --no-cache sqlite
              DB="${DB_DIR}/${DB_FILE}"
              TS=\$(date +%Y%m%d_%H%M%S)
              BAK="\${DB}.corrupted.\${TS}.bak"
              if [ ! -f "\$DB" ]; then
                echo "ERROR: missing \$DB"
                exit 1
              fi
              cp -a "\$DB" "\$BAK"
              echo "Backed up to \$BAK"
              sqlite3 "\$DB" ".dump" > /tmp/jellyfin_dump.sql || {
                echo "ERROR: sqlite dump failed (DB may be too corrupt)"
                exit 2
              }
              sqlite3 "\${DB}.new" ".read /tmp/jellyfin_dump.sql"
              mv "\$DB" "\${DB}.corrupted_old"
              mv "\${DB}.new" "\$DB"
              rm -f "\${DB}-shm" "\${DB}-wal"
              chown ${RUN_UID}:${RUN_GID} "\$DB"
              echo "Repair finished."
          securityContext:
            runAsUser: 0
          volumeMounts:
            - name: config
              mountPath: /config
      volumes:
        - name: config
          persistentVolumeClaim:
            claimName: ${PVC_NAME}
EOF
then
  echo "kubectl apply failed."
  restore_replicas
  exit 1
fi

echo "Waiting for job $JOB_NAME..."
if ! kubectl wait --for=condition=complete "job/${JOB_NAME}" -n "$NAMESPACE" \
  --timeout=600s; then
  echo "--- Job did not complete; recent logs: ---"
  kubectl logs "job/${JOB_NAME}" -n "$NAMESPACE" --tail=150 2>/dev/null || true
  echo "--- Restoring Jellyfin replica count ---"
  restore_replicas
  exit 1
fi

kubectl logs "job/${JOB_NAME}" -n "$NAMESPACE"

echo "Scaling $DEPLOYMENT_NAME back to ${REPLICAS}..."
kubectl scale deployment "$DEPLOYMENT_NAME" -n "$NAMESPACE" \
  --replicas="${REPLICAS}"
kubectl rollout status deployment "$DEPLOYMENT_NAME" -n "$NAMESPACE" \
  --timeout=300s

echo "Done. Run a library scan in Jellyfin; check logs for SQLite errors."
