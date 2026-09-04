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
