#!/usr/bin/env python3
"""Decode base64 1Password Connect credentials when needed."""

import base64
import sys

import yaml


def main() -> None:
    for doc in yaml.safe_load_all(sys.stdin):
        if not doc:
            continue
        name = doc.get("metadata", {}).get("name")
        if name == "onepassword-connect-credentials-secret":
            key = "1password-credentials.json"
            val = doc["stringData"][key]
            if not val.lstrip().startswith("{"):
                doc["stringData"][key] = base64.b64decode(val).decode()
        print("---")
        print(yaml.dump(doc, default_flow_style=False))


if __name__ == "__main__":
    main()
