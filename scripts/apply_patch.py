#!/usr/bin/env python3
import argparse
import fnmatch
from pathlib import Path
import subprocess
import sys

DISALLOWED_DEFAULT = [
    "**/.env*",
    "**/secrets/**",
    "**/*.pem",
    "**/*id_rsa*",
    "**/__pycache__/**",
    "**/*.pyc",
    "src/database/*.db",
    "frontend/dist/**",
]

def any_match(path: str, patterns: list[str]) -> bool:
    return any(fnmatch.fnmatch(path, pat) for pat in patterns)

def changed_files_from_patch(patch_text: str) -> list[str]:
    files = []
    for line in patch_text.splitlines():
        if line.startswith("diff --git "):
            parts = line.split()
            if len(parts) >= 4 and parts[3].startswith("b/"):
                files.append(parts[3][2:])
    return sorted(set(files))

def run(cmd: list[str]) -> None:
    p = subprocess.run(cmd)
    if p.returncode != 0:
        raise SystemExit(p.returncode)

def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--patch", required=True, help="Path to unified diff patch")
    ap.add_argument("--allowed", nargs="*", default=[], help="Allowed glob patterns")
    ap.add_argument("--disallowed", nargs="*", default=DISALLOWED_DEFAULT, help="Disallowed glob patterns")
    ap.add_argument("--check", action="store_true", help="Check only; do not apply")
    args = ap.parse_args()

    patch_path = Path(args.patch)
    patch_text = patch_path.read_text(encoding="utf-8")

    files = changed_files_from_patch(patch_text)
    if not files:
        print("No changed files detected in patch.", file=sys.stderr)
        raise SystemExit(2)

    for f in files:
        if any_match(f, args.disallowed):
            print(f"ERROR: Patch touches disallowed path: {f}", file=sys.stderr)
            raise SystemExit(3)
        if args.allowed and not any_match(f, args.allowed):
            print(f"ERROR: Patch touches path not in allowed list: {f}", file=sys.stderr)
            raise SystemExit(4)

    if args.check:
        print("Patch check OK. Files:", ", ".join(files))
        return

    run(["git", "apply", "--index", str(patch_path)])
    print("Patch applied and staged:", ", ".join(files))

if __name__ == "__main__":
    main()

