# Cluster Alerting and Upgrade Guards Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add actionable cluster alerts, severity-aware Pushover routing, an alert-delivery canary, and CI/Renovate controls that keep Talos and Kubernetes upgrade targets coordinated.

**Architecture:** Retain upstream kube-prometheus-stack, Rook, Kopiur, and Tuppr alerts and add only missing app-local `PrometheusRule` resources. Alloy continues discovering rules and uploading them to Mimir, while Alertmanager routes critical and warning alerts to separate Pushover receivers. A dependency-free Python validator compares the two Talos and Kubernetes sources of truth in CI, and Renovate groups coordinated pins while requiring approval for platform minor upgrades.

**Tech Stack:** Kubernetes, Flux, PrometheusRule, PromQL, Grafana Alloy, Mimir, Alertmanager, Pushover, External Secrets Operator, CloudNativePG, Renovate, GitHub Actions, Python 3 standard library

---

## File Structure

- `.github/scripts/upgrade_guard.py`: parse and compare current/base platform version pins.
- `.github/scripts/test_upgrade_guard.py`: unit tests for equality, version format, patch updates, and compatibility approval.
- `.github/workflows/upgrade-guard.yaml`: run the validator against PR and base checkouts.
- `.renovate/local.json5`: group platform pins and require approval for minor/major updates.
- `kubernetes/apps/cnpg-system/cloudnative-pg/cluster/prometheusrule.yaml`: add CNPG readiness, capacity, and backup alerts.
- `kubernetes/apps/external-secrets/external-secrets/app/prometheusrule.yaml`: add ExternalSecret and store health alerts.
- `kubernetes/apps/external-secrets/external-secrets/app/kustomization.yaml`: deploy the External Secrets rule.
- `kubernetes/apps/monitoring/k8s-monitoring/app/helmrelease.yaml`: retain kube-state-metrics series required by upstream workload alerts.
- `kubernetes/apps/monitoring/k8s-monitoring/app/prometheusrule.yaml`: add Alloy/Mimir health, delivery canary, and restore-test age alerts.
- `kubernetes/apps/monitoring/k8s-monitoring/app/kustomization.yaml`: deploy the monitoring rule.
- `kubernetes/apps/monitoring/k8s-monitoring/app/externalsecret-alertmanager-global.yaml`: define severity-specific Pushover receivers and root routes.
- `kubernetes/apps/monitoring/kube-prometheus-stack/app/alertmanagerconfig.yaml`: align child routing and critical-over-warning inhibition.

### Task 1: Prepare an Isolated Implementation Branch

**Files:**
- Preserve: all current uncommitted files in the attached worktree
- Carry forward: `docs/superpowers/specs/2026-09-04-cluster-alerting-upgrade-guards-design.md`

- [ ] **Step 1: Confirm the current workspace remains dirty but unmodified**

Run:

```bash
git --no-optional-locks status --short
git show --stat --oneline 323aec1f17
```

Expected: the pre-existing Talos and Rook changes remain listed, and commit
`323aec1f17` contains only the design document.

- [ ] **Step 2: Create a clean worktree from deployed upstream**

Run from the repository root:

```bash
git fetch origin main
git worktree add ../home-ops-cluster-safety \
  -b feat/cluster-alerting-upgrade-guards origin/main
cd ../home-ops-cluster-safety
git cherry-pick 323aec1f17
```

Expected: the new worktree is clean and contains the approved design on top of
the current `origin/main`.

- [ ] **Step 3: Verify the clean base**

Run:

```bash
git --no-optional-locks status --short
git log -2 --oneline
```

Expected: no status output; the design commit appears immediately above the
current upstream commit.

### Task 2: Test-Drive the Platform Version Validator

**Files:**
- Create: `.github/scripts/test_upgrade_guard.py`
- Create: `.github/scripts/upgrade_guard.py`

- [ ] **Step 1: Write validator unit tests**

Create `.github/scripts/test_upgrade_guard.py`:

```python
#!/usr/bin/env python3

import tempfile
import unittest
from pathlib import Path

from upgrade_guard import validate


def write_tree(root: Path, talos: str, kubernetes: str) -> None:
    (root / "talos").mkdir(parents=True)
    (root / "kubernetes/apps/system-upgrade/tuppr/upgrades").mkdir(parents=True)
    (root / "talos/topf.yaml").write_text(
        f"talosVersion: {talos}\nkubernetesVersion: {kubernetes}\n",
        encoding="utf-8",
    )
    upgrades = root / "kubernetes/apps/system-upgrade/tuppr/upgrades"
    (upgrades / "talosupgrade.yaml").write_text(
        f"spec:\n  talos:\n    version: {talos}\n", encoding="utf-8"
    )
    (upgrades / "kubernetesupgrade.yaml").write_text(
        f"spec:\n  kubernetes:\n    version: {kubernetes}\n", encoding="utf-8"
    )


class UpgradeGuardTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.current = self.root / "current"
        self.base = self.root / "base"
        write_tree(self.base, "v1.13.9", "v1.36.4")

    def test_matching_patch_updates_pass_without_approval(self) -> None:
        write_tree(self.current, "v1.13.10", "v1.36.5")
        self.assertEqual(validate(self.current, self.base, False), [])

    def test_mismatched_kubernetes_versions_fail(self) -> None:
        write_tree(self.current, "v1.13.9", "v1.36.5")
        path = self.current / "kubernetes/apps/system-upgrade/tuppr/upgrades/kubernetesupgrade.yaml"
        path.write_text(
            "spec:\n  kubernetes:\n    version: v1.36.4\n", encoding="utf-8"
        )
        self.assertIn(
            "Kubernetes versions differ: topf=v1.36.5, tuppr=v1.36.4",
            validate(self.current, self.base, False),
        )

    def test_mismatched_talos_versions_fail(self) -> None:
        write_tree(self.current, "v1.13.10", "v1.36.4")
        path = self.current / "kubernetes/apps/system-upgrade/tuppr/upgrades/talosupgrade.yaml"
        path.write_text("spec:\n  talos:\n    version: v1.13.9\n", encoding="utf-8")
        self.assertIn(
            "Talos versions differ: topf=v1.13.10, tuppr=v1.13.9",
            validate(self.current, self.base, False),
        )

    def test_invalid_version_format_fails(self) -> None:
        write_tree(self.current, "1.13.9", "v1.36.4")
        self.assertTrue(
            any("must match vMAJOR.MINOR.PATCH" in error for error in validate(
                self.current, self.base, False
            ))
        )

    def test_minor_update_requires_approval(self) -> None:
        write_tree(self.current, "v1.14.0", "v1.37.0")
        errors = validate(self.current, self.base, False)
        self.assertIn("Talos minor/major update requires platform-upgrade-approved", errors)
        self.assertIn(
            "Kubernetes minor/major update requires platform-upgrade-approved", errors
        )

    def test_minor_update_with_approval_passes(self) -> None:
        write_tree(self.current, "v1.14.0", "v1.37.0")
        self.assertEqual(validate(self.current, self.base, True), [])


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run the tests to verify they fail**

Run:

```bash
python3 .github/scripts/test_upgrade_guard.py
```

Expected: `ModuleNotFoundError: No module named 'upgrade_guard'`.

- [ ] **Step 3: Implement the validator**

Create `.github/scripts/upgrade_guard.py`:

```python
#!/usr/bin/env python3

import argparse
import re
import sys
from pathlib import Path

VERSION = re.compile(r"^v(\d+)\.(\d+)\.(\d+)$")
UPGRADES = Path("kubernetes/apps/system-upgrade/tuppr/upgrades")


def scalar(path: Path, key: str) -> str:
    pattern = re.compile(rf"^\s*{re.escape(key)}:\s*[\"']?([^\"'#\s]+)")
    for line in path.read_text(encoding="utf-8").splitlines():
        match = pattern.match(line)
        if match:
            return match.group(1)
    raise ValueError(f"{path}: missing {key}")


def versions(root: Path) -> dict[str, str]:
    topf = root / "talos/topf.yaml"
    return {
        "topf_talos": scalar(topf, "talosVersion"),
        "topf_kubernetes": scalar(topf, "kubernetesVersion"),
        "tuppr_talos": scalar(root / UPGRADES / "talosupgrade.yaml", "version"),
        "tuppr_kubernetes": scalar(
            root / UPGRADES / "kubernetesupgrade.yaml", "version"
        ),
    }


def release_line(version: str) -> tuple[int, int, int]:
    match = VERSION.fullmatch(version)
    if not match:
        raise ValueError(f"{version} must match vMAJOR.MINOR.PATCH")
    return tuple(int(part) for part in match.groups())


def validate(current_root: Path, base_root: Path, approved: bool) -> list[str]:
    errors: list[str] = []
    try:
        current = versions(current_root)
        base = versions(base_root)
    except (OSError, ValueError) as error:
        return [str(error)]

    if current["topf_kubernetes"] != current["tuppr_kubernetes"]:
        errors.append(
            "Kubernetes versions differ: "
            f"topf={current['topf_kubernetes']}, "
            f"tuppr={current['tuppr_kubernetes']}"
        )
    if current["topf_talos"] != current["tuppr_talos"]:
        errors.append(
            f"Talos versions differ: topf={current['topf_talos']}, "
            f"tuppr={current['tuppr_talos']}"
        )

    parsed: dict[str, tuple[int, int, int]] = {}
    for name, value in current.items():
        try:
            parsed[name] = release_line(value)
        except ValueError as error:
            errors.append(f"{name}: {error}")

    for platform in ("talos", "kubernetes"):
        current_key = f"topf_{platform}"
        base_key = f"topf_{platform}"
        try:
            current_line = release_line(current[current_key])
            base_line = release_line(base[base_key])
        except ValueError:
            continue
        if current_line[:2] != base_line[:2] and not approved:
            errors.append(
                f"{platform.title()} minor/major update requires "
                "platform-upgrade-approved"
            )
    return errors


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--current-root", type=Path, required=True)
    parser.add_argument("--base-root", type=Path, required=True)
    parser.add_argument("--compatibility-approved", action="store_true")
    args = parser.parse_args()
    errors = validate(
        args.current_root, args.base_root, args.compatibility_approved
    )
    if errors:
        for error in errors:
            print(f"ERROR: {error}", file=sys.stderr)
        return 1
    print("Talos and Kubernetes upgrade pins are coordinated")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
```

- [ ] **Step 4: Run the tests**

Run:

```bash
python3 .github/scripts/test_upgrade_guard.py
```

Expected: `Ran 6 tests` and `OK`.

- [ ] **Step 5: Check the real repository**

Run:

```bash
python3 .github/scripts/upgrade_guard.py \
  --current-root . \
  --base-root .
```

Expected: `Talos and Kubernetes upgrade pins are coordinated`.

- [ ] **Step 6: Commit**

```bash
git add .github/scripts/test_upgrade_guard.py .github/scripts/upgrade_guard.py
git commit -m "feat(ci): validate coordinated platform versions"
```

### Task 3: Run the Upgrade Guard in Pull Requests

**Files:**
- Create: `.github/workflows/upgrade-guard.yaml`

- [ ] **Step 1: Add the workflow**

Create `.github/workflows/upgrade-guard.yaml`:

```yaml
---
name: Platform Upgrade Guard

on:
  pull_request:
    branches:
      - main
    paths:
      - .github/scripts/test_upgrade_guard.py
      - .github/scripts/upgrade_guard.py
      - .github/workflows/upgrade-guard.yaml
      - .renovate/**
      - .renovaterc.json5
      - kubernetes/apps/system-upgrade/tuppr/upgrades/**
      - talos/**

permissions:
  contents: read
  pull-requests: read

jobs:
  validate:
    name: Validate Platform Versions
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Pull Request
        uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1
        with:
          path: pull
          persist-credentials: false

      - name: Checkout Base
        uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1
        with:
          path: base
          persist-credentials: false
          ref: ${{ github.event.pull_request.base.sha }}

      - name: Test Upgrade Guard
        run: python3 pull/.github/scripts/test_upgrade_guard.py

      - name: Validate Platform Versions
        env:
          COMPATIBILITY_APPROVED: ${{ contains(github.event.pull_request.labels.*.name, 'platform-upgrade-approved') }}
        run: |
          args=(
            --current-root pull
            --base-root base
          )
          if [[ "${COMPATIBILITY_APPROVED}" == "true" ]]; then
            args+=(--compatibility-approved)
          fi
          python3 pull/.github/scripts/upgrade_guard.py "${args[@]}"
```

- [ ] **Step 2: Validate workflow syntax**

Run:

```bash
yq --exit-status '.jobs.validate.steps | length == 4' \
  .github/workflows/upgrade-guard.yaml
```

Expected: `true`.

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/upgrade-guard.yaml
git commit -m "ci: guard platform upgrade pull requests"
```

### Task 4: Coordinate Renovate Platform Updates

**Files:**
- Modify: `.renovate/local.json5`

- [ ] **Step 1: Add coordinated platform package rules**

Append these objects to `packageRules`, preserving valid JSON5:

```json5
    {
      description: "Coordinate Kubernetes Version Pins",
      groupName: "kubernetes-platform",
      matchPackageNames: [
        "ghcr.io/siderolabs/kubelet",
        "kubernetes/kubernetes",
      ],
      automerge: false,
    },
    {
      description: "Coordinate Talos Version Pins",
      groupName: "talos-platform",
      matchPackageNames: ["siderolabs/talos"],
      automerge: false,
    },
    {
      description: "Require Approval For Platform Minor Updates",
      matchPackageNames: [
        "ghcr.io/siderolabs/kubelet",
        "kubernetes/kubernetes",
        "siderolabs/talos",
      ],
      matchUpdateTypes: ["major", "minor"],
      dependencyDashboardApproval: true,
      automerge: false,
    },
```

- [ ] **Step 2: Validate Renovate configuration**

Run:

```bash
npx --yes --package renovate renovate-config-validator .renovaterc.json5
```

Expected: configuration is valid with no errors.

- [ ] **Step 3: Re-run validator tests**

Run:

```bash
python3 .github/scripts/test_upgrade_guard.py
```

Expected: `Ran 6 tests` and `OK`.

- [ ] **Step 4: Commit**

```bash
git add .renovate/local.json5
git commit -m "chore(renovate): coordinate platform upgrades"
```

### Task 5: Restore Metrics Required by Existing Workload Alerts

**Files:**
- Modify: `kubernetes/apps/monitoring/k8s-monitoring/app/helmrelease.yaml`

- [ ] **Step 1: Demonstrate the required series are absent**

Query Mimir:

```promql
count({__name__=~"kube_pod_(status_ready|container_status_ready|container_status_waiting_reason)",k8s_cluster_name="kyak"}) by (__name__)
```

Expected before the change: no series. These metrics are excluded by the
k8s-monitoring chart's default kube-state-metrics allowlist even though
kube-prometheus-stack rules reference them.

- [ ] **Step 2: Include the missing kube-state-metrics series**

Under `clusterMetrics`, add:

```yaml
      kube-state-metrics:
        metricsTuning:
          includeMetrics:
            - kube_pod_container_status_ready
            - kube_pod_container_status_waiting_reason
            - kube_pod_status_ready
```

The complete surrounding block becomes:

```yaml
    clusterMetrics:
      enabled: true
      collector: alloy-metrics
      kube-state-metrics:
        metricsTuning:
          includeMetrics:
            - kube_pod_container_status_ready
            - kube_pod_container_status_waiting_reason
            - kube_pod_status_ready
```

- [ ] **Step 3: Render and validate the HelmRelease**

Run:

```bash
flux-local test \
  --all-namespaces \
  --enable-helm \
  --path kubernetes/flux/cluster
```

Expected: all Flux-local tests pass.

- [ ] **Step 4: Commit**

```bash
git add kubernetes/apps/monitoring/k8s-monitoring/app/helmrelease.yaml
git commit -m "fix(monitoring): retain workload readiness metrics"
```

### Task 6: Add CloudNativePG Availability and Backup Alerts

**Files:**
- Modify: `kubernetes/apps/cnpg-system/cloudnative-pg/cluster/prometheusrule.yaml`

- [ ] **Step 1: Add CNPG rules**

Append these rules to the existing `cloudnative-pg.rules` group:

```yaml
        - alert: CNPGClusterNotReady
          annotations:
            description: PostgreSQL container {{ $labels.pod }} has not been ready for 10 minutes.
            summary: CloudNativePG cluster {{ $labels.namespace }}/{{ $labels.pod }} is not ready.
          expr: |-
            kube_pod_container_status_ready{
              k8s_cluster_name="kyak",
              namespace="cnpg-system",
              container="postgres"
            } == 0
          for: 10m
          labels:
            severity: warning
        - alert: CNPGNoWritablePrimary
          annotations:
            description: No CloudNativePG instance reports itself as a writable primary.
            summary: CloudNativePG has no writable primary.
          expr: |-
            absent(
              cnpg_pg_replication_in_recovery{
                k8s_cluster_name="kyak",
                namespace="cnpg-system"
              } == 0
            )
          for: 5m
          labels:
            severity: critical
        - alert: CNPGInsufficientDiskSpace
          annotations:
            description: PostgreSQL volume {{ $labels.persistentvolumeclaim }} has less than 20 percent free space.
            summary: CloudNativePG storage is running low.
          expr: |-
            (
              kubelet_volume_stats_available_bytes{
                k8s_cluster_name="kyak",
                namespace="cnpg-system",
                persistentvolumeclaim=~"postgres16-.*"
              }
              /
              kubelet_volume_stats_capacity_bytes{
                k8s_cluster_name="kyak",
                namespace="cnpg-system",
                persistentvolumeclaim=~"postgres16-.*"
              }
            ) < 0.20
          for: 15m
          labels:
            severity: warning
        - alert: CNPGInsufficientDiskSpace
          annotations:
            description: PostgreSQL volume {{ $labels.persistentvolumeclaim }} has less than 10 percent free space.
            summary: CloudNativePG storage is critically low.
          expr: |-
            (
              kubelet_volume_stats_available_bytes{
                k8s_cluster_name="kyak",
                namespace="cnpg-system",
                persistentvolumeclaim=~"postgres16-.*"
              }
              /
              kubelet_volume_stats_capacity_bytes{
                k8s_cluster_name="kyak",
                namespace="cnpg-system",
                persistentvolumeclaim=~"postgres16-.*"
              }
            ) < 0.10
          for: 5m
          labels:
            severity: critical
        - alert: CNPGBackupStale
          annotations:
            description: CloudNativePG has no successful backup newer than 36 hours.
            summary: CloudNativePG backup is stale.
          expr: |-
            time() - max by (k8s_cluster_name, namespace, job) (
              cnpg_collector_last_available_backup_timestamp{
                k8s_cluster_name="kyak",
                namespace="cnpg-system"
              }
            ) > 129600
          for: 15m
          labels:
            severity: critical
        - alert: CNPGLastBackupFailed
          annotations:
            description: CloudNativePG's latest backup event is a failure.
            summary: The latest CloudNativePG backup failed.
          expr: |-
            max by (k8s_cluster_name, namespace, job) (
              cnpg_collector_last_failed_backup_timestamp{
                k8s_cluster_name="kyak",
                namespace="cnpg-system"
              }
            )
            >
            max by (k8s_cluster_name, namespace, job) (
              cnpg_collector_last_available_backup_timestamp{
                k8s_cluster_name="kyak",
                namespace="cnpg-system"
              }
            )
          for: 15m
          labels:
            severity: critical
```

- [ ] **Step 2: Validate PromQL syntax**

Run:

```bash
tmp=$(mktemp)
yq '{"groups": .spec.groups}' \
  kubernetes/apps/cnpg-system/cloudnative-pg/cluster/prometheusrule.yaml > "${tmp}"
docker run --rm -v "${tmp}:/rules.yaml:ro" \
  quay.io/prometheus/prometheus:v3.7.3 \
  promtool check rules /rules.yaml
rm "${tmp}"
```

Expected: `SUCCESS: 12 rules found`.

- [ ] **Step 3: Validate rendered manifests**

Run:

```bash
flux-local test \
  --all-namespaces \
  --enable-helm \
  --path kubernetes/flux/cluster
```

Expected: all tests pass.

- [ ] **Step 4: Commit**

```bash
git add kubernetes/apps/cnpg-system/cloudnative-pg/cluster/prometheusrule.yaml
git commit -m "feat(monitoring): alert on CNPG availability and backups"
```

### Task 7: Add External Secrets Health Alerts

**Files:**
- Create: `kubernetes/apps/external-secrets/external-secrets/app/prometheusrule.yaml`
- Modify: `kubernetes/apps/external-secrets/external-secrets/app/kustomization.yaml`

- [ ] **Step 1: Create the External Secrets rule**

Create `kubernetes/apps/external-secrets/external-secrets/app/prometheusrule.yaml`:

```yaml
---
# yaml-language-server: $schema=https://k8s-schemas.home-operations.com/monitoring.coreos.com/prometheusrule_v1.json
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: external-secrets-rules
spec:
  groups:
    - name: external-secrets.rules
      rules:
        - alert: ExternalSecretNotReady
          annotations:
            description: ExternalSecret {{ $labels.exported_namespace }}/{{ $labels.name }} has not been Ready for 15 minutes.
            summary: An ExternalSecret is not ready.
          expr: |-
            externalsecret_status_condition{
              k8s_cluster_name="kyak",
              condition="Ready",
              status="False"
            } == 1
          for: 15m
          labels:
            severity: warning
        - alert: ExternalSecretNotReady
          annotations:
            description: ExternalSecret {{ $labels.exported_namespace }}/{{ $labels.name }} has not been Ready for one hour.
            summary: An ExternalSecret is critically unavailable.
          expr: |-
            externalsecret_status_condition{
              k8s_cluster_name="kyak",
              condition="Ready",
              status="False"
            } == 1
          for: 1h
          labels:
            severity: critical
        - alert: SecretStoreNotReady
          annotations:
            description: SecretStore {{ $labels.exported_namespace }}/{{ $labels.name }} is not Ready.
            summary: A SecretStore is unavailable.
          expr: |-
            secretstore_status_condition{
              k8s_cluster_name="kyak",
              condition="Ready",
              status="False"
            } == 1
          for: 15m
          labels:
            severity: critical
        - alert: ClusterSecretStoreNotReady
          annotations:
            description: ClusterSecretStore {{ $labels.name }} is not Ready.
            summary: A ClusterSecretStore is unavailable.
          expr: |-
            clustersecretstore_status_condition{
              k8s_cluster_name="kyak",
              condition="Ready",
              status="False"
            } == 1
          for: 15m
          labels:
            severity: critical
        - alert: ExternalSecretStale
          annotations:
            description: ExternalSecret {{ $labels.exported_namespace }}/{{ $labels.name }} has had no sync attempt for three hours.
            summary: An ExternalSecret is stale.
          expr: |-
            changes(
              externalsecret_sync_calls_total{k8s_cluster_name="kyak"}[3h]
            ) == 0
            and on (exported_namespace, name)
            externalsecret_status_condition{
              k8s_cluster_name="kyak",
              condition="Ready",
              status="True"
            } == 1
          for: 15m
          labels:
            severity: warning
```

- [ ] **Step 2: Register the rule alphabetically**

Update `kubernetes/apps/external-secrets/external-secrets/app/kustomization.yaml`:

```yaml
resources:
  - ./grafanadashboard.yaml
  - ./helmrelease.yaml
  - ./ocirepository.yaml
  - ./prometheusrule.yaml
```

- [ ] **Step 3: Check the rule and rendered manifests**

Run:

```bash
tmp=$(mktemp)
yq '{"groups": .spec.groups}' \
  kubernetes/apps/external-secrets/external-secrets/app/prometheusrule.yaml > "${tmp}"
docker run --rm -v "${tmp}:/rules.yaml:ro" \
  quay.io/prometheus/prometheus:v3.7.3 \
  promtool check rules /rules.yaml
rm "${tmp}"
flux-local test \
  --all-namespaces \
  --enable-helm \
  --path kubernetes/flux/cluster
```

Expected: `SUCCESS: 5 rules found`, followed by passing Flux-local tests.

- [ ] **Step 4: Commit**

```bash
git add \
  kubernetes/apps/external-secrets/external-secrets/app/kustomization.yaml \
  kubernetes/apps/external-secrets/external-secrets/app/prometheusrule.yaml
git commit -m "feat(monitoring): alert on External Secrets health"
```

### Task 8: Add Alert Pipeline, Canary, and Restore-Test Rules

**Files:**
- Create: `kubernetes/apps/monitoring/k8s-monitoring/app/prometheusrule.yaml`
- Modify: `kubernetes/apps/monitoring/k8s-monitoring/app/kustomization.yaml`

- [ ] **Step 1: Create the monitoring rule**

Create `kubernetes/apps/monitoring/k8s-monitoring/app/prometheusrule.yaml`:

```yaml
---
# yaml-language-server: $schema=https://k8s-schemas.home-operations.com/monitoring.coreos.com/prometheusrule_v1.json
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: observability-pipeline-rules
spec:
  groups:
    - name: observability-pipeline.rules
      rules:
        - alert: AlloyComponentUnhealthy
          annotations:
            description: Alloy {{ $labels.app }} has {{ $value }} unhealthy components.
            summary: Alloy has unhealthy components.
          expr: |-
            alloy_component_controller_running_components{
              k8s_cluster_name="kyak",
              health_type="unhealthy"
            } > 0
          for: 15m
          labels:
            severity: critical
        - alert: MimirRuleReloadFailed
          annotations:
            description: A Mimir ruler replica failed to reload rule configuration for tenant {{ $labels.user }}.
            summary: Mimir failed to load alert rules.
          expr: |-
            cortex_ruler_config_last_reload_successful{user="witl-xyz"} == 0
          for: 10m
          labels:
            severity: critical
        - alert: AlertDeliveryCanary
          annotations:
            description: Weekly alert-delivery canary; receipt confirms the Mimir and Pushover path.
            summary: Weekly alert delivery canary.
          expr: |-
            (day_of_week(vector(time())) == 1)
            and (hour(vector(time())) == 15)
            and (minute(vector(time())) < 5)
          for: 1m
          labels:
            severity: warning
        - alert: BackupRestoreTestStale
          annotations:
            description: No successful {{ $labels.backup_system }} restore test for {{ $labels.workload }} in eight days.
            summary: Backup restore validation is stale.
          expr: |-
            time()
            - cluster_restore_test_last_success_timestamp_seconds{
                cluster="kyak"
              }
            > 691200
          for: 15m
          labels:
            severity: warning
        - alert: BackupRestoreTestStale
          annotations:
            description: No successful {{ $labels.backup_system }} restore test for {{ $labels.workload }} in fifteen days.
            summary: Backup restore validation is critically stale.
          expr: |-
            time()
            - cluster_restore_test_last_success_timestamp_seconds{
                cluster="kyak"
              }
            > 1296000
          for: 15m
          labels:
            severity: critical
```

Because the restore metric does not exist yet, both restore rules return an
empty vector and remain inactive until the backup stage publishes the metric.

- [ ] **Step 2: Register the rule alphabetically**

Update the resources in
`kubernetes/apps/monitoring/k8s-monitoring/app/kustomization.yaml`:

```yaml
resources:
  - ./externalsecret-alertmanager-global.yaml
  - ./externalsecret-observability-m2m.yaml
  - ./helmrelease.yaml
  - ./ocirepository.yaml
  - ./prometheusrule.yaml
  - ./rbac-mimir-rules.yaml
```

- [ ] **Step 3: Check the rule and rendered manifests**

Run:

```bash
tmp=$(mktemp)
yq '{"groups": .spec.groups}' \
  kubernetes/apps/monitoring/k8s-monitoring/app/prometheusrule.yaml > "${tmp}"
docker run --rm -v "${tmp}:/rules.yaml:ro" \
  quay.io/prometheus/prometheus:v3.7.3 \
  promtool check rules /rules.yaml
rm "${tmp}"
flux-local test \
  --all-namespaces \
  --enable-helm \
  --path kubernetes/flux/cluster
```

Expected: `SUCCESS: 5 rules found`, followed by passing Flux-local tests.

- [ ] **Step 4: Commit**

```bash
git add \
  kubernetes/apps/monitoring/k8s-monitoring/app/kustomization.yaml \
  kubernetes/apps/monitoring/k8s-monitoring/app/prometheusrule.yaml
git commit -m "feat(monitoring): verify alert and restore pipelines"
```

### Task 9: Route Notifications by Severity

**Files:**
- Modify: `kubernetes/apps/monitoring/k8s-monitoring/app/externalsecret-alertmanager-global.yaml`
- Modify: `kubernetes/apps/monitoring/kube-prometheus-stack/app/alertmanagerconfig.yaml`

- [ ] **Step 1: Define severity-specific global receivers**

Replace the generated Alertmanager `route` and `receivers` in
`externalsecret-alertmanager-global.yaml` with:

```yaml
          route:
            group_by:
              - alertname
              - cluster
              - namespace
            group_interval: 10m
            group_wait: 5m
            receiver: pushover-warning
            repeat_interval: 12h
            routes:
              - receiver: "null"
                matchers:
                  - alertname = "Watchdog"
              - receiver: pushover-critical
                group_wait: 30s
                matchers:
                  - severity = "critical"
              - receiver: pushover-warning
                matchers:
                  - severity = "warning"
          receivers:
            - name: "null"
            - name: pushover-critical
              pushover_configs:
                - token: "{{ .ALERTMANAGER_PUSHOVER_TOKEN }}"
                  user_key: "{{ .PUSHOVER_USER_KEY }}"
                  html: true
                  send_resolved: true
                  sound: gamelan
                  ttl: 86400s
                  url_title: View in Alertmanager
                  priority: "1"
                  title: '{{ "{{ .Status | toUpper }}" }} {{ "{{ .CommonLabels.alertname }}" }}'
                  message: '{{ "{{ range .Alerts }}" }}{{ "{{ .Annotations.summary }}" }}{{ "{{ end }}" }}'
            - name: pushover-warning
              pushover_configs:
                - token: "{{ .ALERTMANAGER_PUSHOVER_TOKEN }}"
                  user_key: "{{ .PUSHOVER_USER_KEY }}"
                  html: true
                  send_resolved: true
                  sound: none
                  ttl: 86400s
                  url_title: View in Alertmanager
                  priority: "-1"
                  title: '{{ "{{ .Status | toUpper }}" }} {{ "{{ .CommonLabels.alertname }}" }}'
                  message: '{{ "{{ range .Alerts }}" }}{{ "{{ .Annotations.summary }}" }}{{ "{{ end }}" }}'
```

- [ ] **Step 2: Align the AlertmanagerConfig child route**

Change `alertmanagerconfig.yaml` to:

```yaml
---
# yaml-language-server: $schema=https://k8s-schemas.home-operations.com/monitoring.coreos.com/alertmanagerconfig_v1alpha1.json
apiVersion: monitoring.coreos.com/v1alpha1
kind: AlertmanagerConfig
metadata:
  name: alertmanager
spec:
  route:
    groupBy:
      - alertname
      - cluster
      - namespace
    groupInterval: 10m
    groupWait: 5m
    receiver: pushover-warning
    repeatInterval: 12h
    routes:
      - receiver: "null"
        matchers:
          - name: alertname
            value: InfoInhibitor
            matchType: =
      - receiver: "null"
        matchers:
          - name: alertname
            value: Watchdog
            matchType: =
      - receiver: pushover-critical
        groupWait: 30s
        matchers:
          - name: severity
            value: critical
            matchType: =
      - receiver: pushover-warning
        matchers:
          - name: severity
            value: warning
            matchType: =
  inhibitRules:
    - equal:
        - alertname
        - cluster
        - namespace
      sourceMatch:
        - name: severity
          value: critical
          matchType: =
      targetMatch:
        - name: severity
          value: warning
          matchType: =
  receivers:
    - name: "null"
    # Pushover receivers are defined in global_config to avoid Alloy's nil
    # StoreBuilder when converting AlertmanagerConfig secret references.
```

- [ ] **Step 3: Validate both configurations**

Run:

```bash
yq --exit-status \
  '.spec.target.template.data.config | contains("pushover-critical") and contains("pushover-warning") and contains("alertname = \"Watchdog\"")' \
  kubernetes/apps/monitoring/k8s-monitoring/app/externalsecret-alertmanager-global.yaml
yq --exit-status \
  '.spec.route.receiver == "pushover-warning" and .spec.inhibitRules[0].equal == ["alertname", "cluster", "namespace"]' \
  kubernetes/apps/monitoring/kube-prometheus-stack/app/alertmanagerconfig.yaml
flux-local test \
  --all-namespaces \
  --enable-helm \
  --path kubernetes/flux/cluster
```

Expected: both `yq` expressions return `true`; Flux-local tests pass.

- [ ] **Step 4: Commit**

```bash
git add \
  kubernetes/apps/monitoring/k8s-monitoring/app/externalsecret-alertmanager-global.yaml \
  kubernetes/apps/monitoring/kube-prometheus-stack/app/alertmanagerconfig.yaml
git commit -m "feat(alertmanager): route notifications by severity"
```

### Task 10: Perform Final Static and Live Validation

**Files:**
- Verify all files changed in Tasks 2-9

- [ ] **Step 1: Run repository checks**

Run:

```bash
python3 .github/scripts/test_upgrade_guard.py
python3 .github/scripts/upgrade_guard.py --current-root . --base-root .
npx --yes --package renovate renovate-config-validator .renovaterc.json5
flux-local test \
  --all-namespaces \
  --enable-helm \
  --path kubernetes/flux/cluster
git diff --check origin/main...HEAD
```

Expected: all commands pass and `git diff --check` prints nothing.

- [ ] **Step 2: Verify every custom PrometheusRule**

Run:

```bash
for rule in \
  kubernetes/apps/cnpg-system/cloudnative-pg/cluster/prometheusrule.yaml \
  kubernetes/apps/external-secrets/external-secrets/app/prometheusrule.yaml \
  kubernetes/apps/monitoring/k8s-monitoring/app/prometheusrule.yaml
do
  tmp=$(mktemp)
  yq '{"groups": .spec.groups}' "${rule}" > "${tmp}"
  docker run --rm -v "${tmp}:/rules.yaml:ro" \
    quay.io/prometheus/prometheus:v3.7.3 \
    promtool check rules /rules.yaml
  rm "${tmp}"
done
```

Expected: all three files report `SUCCESS`.

- [ ] **Step 3: Review the complete change**

Run:

```bash
git diff --stat origin/main...HEAD
git log --oneline origin/main..HEAD
git --no-optional-locks status --short
```

Expected: only the design, validator, workflow, Renovate policy, alert rules,
metrics allowlist, and Alertmanager routing are changed; the worktree is clean.

- [ ] **Step 4: After merge, verify Flux and live rule objects**

Run with the `kyak` kubeconfig:

```bash
flux get kustomizations -A
kubectl get prometheusrules -A
kubectl -n cnpg-system get prometheusrule cloudnative-pg-rules
kubectl -n external-secrets get prometheusrule external-secrets-rules
kubectl -n monitoring get prometheusrule observability-pipeline-rules
```

Expected: Flux resources are Ready and all three rule objects exist.

- [ ] **Step 5: Verify restored kube-state-metrics series**

Query Mimir:

```promql
count({__name__=~"kube_pod_(status_ready|container_status_ready|container_status_waiting_reason)",k8s_cluster_name="kyak"}) by (__name__)
```

Expected: all three metric names return non-zero series counts.

- [ ] **Step 6: Verify rule evaluation and delivery**

In Mimir/Grafana:

1. Confirm all new groups are loaded without evaluation errors.
2. Confirm `AlloyComponentUnhealthy` reflects the live Alloy singleton state.
3. Temporarily evaluate the canary expression without its weekday/hour clauses
   on a review branch or isolated rule name.
4. Confirm a warning arrives silently at priority `-1`.
5. Temporarily set the isolated canary severity to `critical`.
6. Confirm it arrives audibly at priority `1`.
7. Remove the temporary test rule.
8. Confirm `Watchdog` remains active in Alertmanager but sends no notification.

- [ ] **Step 7: Verify CI failure modes in a pull request**

1. Change only one Kubernetes version pin and push.
2. Confirm `Platform Upgrade Guard` fails with both values in its message.
3. Coordinate both pins to a new minor without the label.
4. Confirm the workflow requires `platform-upgrade-approved`.
5. Add the label and rerun.
6. Confirm the workflow passes.
7. Revert the test-only version changes before merge.

