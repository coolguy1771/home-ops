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
