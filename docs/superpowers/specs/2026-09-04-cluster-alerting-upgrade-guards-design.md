# Cluster Alerting and Upgrade Guards Design

## Summary

This stage improves the cluster's operational safety rails before introducing
network isolation, Pod Security Admission, or workload resilience changes. It
adds alerts only where current coverage is incomplete, verifies the complete
notification path, and prevents unattended or inconsistent Talos and
Kubernetes upgrades.

Existing chart-generated alerts remain the primary source for Kubernetes
workload health, Ceph, Kopiur, and Tuppr. Local rules supplement rather than
duplicate those upstream rules.

## Goals

- Alert when CloudNativePG is unavailable, low on disk, or missing recent
  backups.
- Alert when External Secrets resources are unavailable or stale.
- Establish a metric contract for detecting overdue restore validation.
- Detect failures between `PrometheusRule` discovery and notification delivery.
- Route critical and warning notifications according to urgency.
- Keep `Watchdog` evaluated while routing it to the `null` receiver.
- Prevent Talos and Kubernetes version pins from diverging.
- Require explicit approval for Kubernetes and Talos minor or major upgrades.

## Non-goals

- Replacing chart-generated alert rules with a locally maintained rule catalog.
- Repairing the current PostgreSQL or Kopiur incidents.
- Implementing the restore-validation job. The backup stage will provide the
  metric consumed by the restore-test alert.
- Adding network policies, Pod Security Admission, etcd backups, resource
  requests, replicas, or PDBs.
- Automatically proving that a Kubernetes version is supported by a Talos
  release. Human compatibility approval remains required for minor upgrades.

## Existing Coverage

The following live rules already cover the corresponding failures and will not
be duplicated:

- Kubernetes pod, Deployment, StatefulSet, DaemonSet, Job, PDB, PVC, node,
  kubelet, and API health.
- Ceph cluster, monitor, manager, OSD, placement group, pool, filesystem, and
  capacity health.
- Kopiur repository readiness, stale and failed backups, snapshot failures,
  restore failures, and controller health.
- Tuppr failed, stuck, blocked, and long-running Talos and Kubernetes upgrades.
- Flux, cert-manager, Gatus, smart devices, OOM kills, and selected
  application-specific failures.

## Alert Rules

### CloudNativePG

Extend the existing CloudNativePG `PrometheusRule` with:

- `CNPGClusterNotReady`: fires as a warning after 10 minutes when a cluster has
  fewer ready instances than desired and as critical when no writable primary
  is available.
- `CNPGInsufficientDiskSpace`: fires as warning below 20 percent free and
  critical below 10 percent free on a PostgreSQL data or WAL volume. This rule
  complements the generic PVC prediction alerts with a direct database
  capacity signal.
- `CNPGBackupStale`: fires when a running cluster has no successful backup
  within 36 hours.
- `CNPGLastBackupFailed`: fires when the most recently observed scheduled
  backup failed.

The implementation must confirm the exact metric names and labels exposed by
the deployed CloudNativePG and kube-state-metrics versions before finalizing
the PromQL. Rules must preserve the `cluster`, `namespace`, and instance or pod
labels needed for diagnosis.

### External Secrets

Add an External Secrets `PrometheusRule` beside the operator deployment:

- `ExternalSecretNotReady`: warning after 15 minutes and critical after one
  hour.
- `SecretStoreNotReady`: critical after 15 minutes.
- `ClusterSecretStoreNotReady`: critical after 15 minutes.
- `ExternalSecretStale`: warning when the last successful refresh exceeds
  three times the configured refresh interval, with a minimum allowance of one
  hour.

The implementation may use operator metrics or kube-state-metrics custom
resource metrics. It must choose one authoritative source rather than combine
two competing representations of readiness.

### Restore Validation

Add `BackupRestoreTestStale`, based on a metric with this contract:

```text
cluster_restore_test_last_success_timestamp_seconds{
  cluster="kyak",
  backup_system="kopiur",
  workload="sonarr"
}
```

The alert fires as warning after 8 days and critical after 15 days without a
successful restore test. Until the backup stage publishes this metric, the
rule must not create permanent false positives. The acceptable implementations
are to defer installing the rule or gate it on the presence of the metric.

### Alert Pipeline

The alert path is:

```text
PrometheusRule -> Alloy discovery -> Mimir ruler -> Mimir Alertmanager
-> route and inhibition -> Pushover
```

Add monitoring for Alloy rule synchronization failures and Mimir rule upload
errors using metrics already exposed by Alloy where available.

Add a notification canary separate from `Watchdog`. It fires during a short,
predictable weekly window and resolves automatically. The canary uses an
explicit route to the warning receiver. `Watchdog` continues to route to the
`null` receiver and must never notify.

## Notification Routing

The Alertmanager configuration will define:

- `pushover-critical`: Pushover priority `1`, audible notification, one-minute
  or shorter group wait, resolved notifications enabled.
- `pushover-warning`: Pushover priority `-1`, no sound, five-minute group wait,
  resolved notifications enabled.
- `null`: unchanged, used for `Watchdog`.

Routes match `severity=critical` before `severity=warning`. Alerts without a
recognized severity use the warning receiver so that malformed rules do not
silently disappear. Grouping includes `alertname`, `cluster`, and `namespace`
where those labels exist. Repeat intervals remain long enough to avoid alert
storms.

Existing inhibition rules remain in effect. New alerts must include `severity`
and useful summary and description annotations.

## Renovate Policy

Renovate will treat cluster platform versions as coordinated dependencies:

- Group the Kubernetes release in `talos/topf.yaml` with the kubelet version in
  the Tuppr `KubernetesUpgrade`.
- Group the Talos release in `talos/topf.yaml` with the version in the Tuppr
  `TalosUpgrade`.
- Require Dependency Dashboard approval for Kubernetes and Talos minor or
  major updates.
- Continue allowing normal patch update pull requests.
- Do not automerge platform-version updates.

Kubernetes uses semantic-version minor updates for transitions such as 1.36 to
1.37, so the policy must explicitly gate both `minor` and `major` update types.

## CI Upgrade Guard

Add a pull-request workflow and a small deterministic validation script. The
workflow runs when any of these paths change:

- `talos/**`
- `kubernetes/apps/system-upgrade/tuppr/upgrades/**`
- `.renovate/**`
- `.renovaterc.json5`
- the guard script or workflow itself

The validator fails unless:

1. `talos/topf.yaml` and `KubernetesUpgrade` contain the same Kubernetes
   version.
2. `talos/topf.yaml` and `TalosUpgrade` contain the same Talos version.
3. All four versions use the `vMAJOR.MINOR.PATCH` form.
4. A Kubernetes or Talos minor/major transition carries an explicit
   compatibility-approval marker defined by the workflow.

The approval marker will be a pull-request label, not a string in a manifest.
The workflow receives read-only pull-request metadata permission and does not
grant write access. Patch updates require no compatibility label.

The workflow complements, rather than replaces, Flux-local rendering and
schema validation.

## Failure Handling

- Missing metrics do not silently count as healthy when absence itself is
  actionable.
- Rules that depend on a metric not yet produced, such as restore validation,
  remain gated to avoid permanent noise.
- Notification canary failure is checked independently of `Watchdog`.
- CI emits the mismatched file paths and values so an operator can fix the
  source rather than bypass the guard.
- A compatibility label authorizes a coordinated version transition but does
  not bypass equality or version-format checks.

## Validation

Implementation is complete only after:

1. Existing repository formatting, schema, and Flux-local checks pass.
2. PromQL syntax is validated with a Prometheus-compatible rule checker.
3. New `PrometheusRule` objects reconcile in the live cluster.
4. Alloy confirms successful discovery and upload of the new rule groups.
5. Mimir shows the rules as loaded and evaluating.
6. Test warning and critical alerts reach Pushover with the intended priority,
   grouping, sound, annotations, and resolved notification.
7. `Watchdog` remains active but produces no notification.
8. A deliberate Talos and Kubernetes version mismatch fails CI.
9. A minor-version test fails without the compatibility label and passes with
   it.
10. Patch-only coordinated updates pass without the compatibility label.

## Rollout and Rollback

Deploy alert rules first, inspect their query results, and only then enable
notification routing. This prevents malformed expressions from creating an
alert storm.

Apply the CI guard before changing Renovate grouping so newly generated
platform pull requests are protected immediately.

Rollback consists of reverting the new rules, routing children, Renovate
package rules, and CI workflow. The existing chart-generated alerts and root
Pushover receiver remain intact throughout the rollout.
