#!/usr/bin/env python3
"""Create a work order JSON file with the next daily sequence ID."""

from __future__ import annotations

import argparse
import json
import re
from datetime import date
from pathlib import Path

DEFAULT_ALLOWED_PATHS = [
    "src/**",
    "frontend/**",
    "frontend-next/**",
    "docs/**",
    "scripts/**",
    ".github/**",
    "workorders/**",
    "README.md",
    "CHANGELOG.md",
]

DEFAULT_BLOCKED_PATHS = [
    "**/.env*",
    "**/secrets/**",
    "**/*.pem",
    "**/*id_rsa*",
    "**/__pycache__/**",
    "**/*.pyc",
    "src/database/*.db",
    "frontend/pnpm-lock.yaml",
]


def _next_workorder_id(workorders_dir: Path, day_key: str) -> str:
    pattern = re.compile(rf"^WO-{re.escape(day_key)}-(\d{{3}})\.json$")
    sequence = 0
    for file_path in workorders_dir.iterdir():
        if not file_path.is_file():
            continue
        match = pattern.match(file_path.name)
        if not match:
            continue
        sequence = max(sequence, int(match.group(1)))
    return f"WO-{day_key}-{sequence + 1:03d}"


def _build_payload(workorder_id: str, title: str, scope: list[str]) -> dict:
    return {
        "id": workorder_id,
        "title": title.strip(),
        "scope": scope if scope else ["Describe the work and affected components"],
        "allowed_paths": DEFAULT_ALLOWED_PATHS,
        "blocked_paths": DEFAULT_BLOCKED_PATHS,
        "acceptance_criteria": [
            "All requested behavior is implemented",
            "CHANGELOG.md includes an entry for this work order",
        ],
        "risk_notes": ["Describe known risks before merge"],
        "rollback_plan": ["Revert commits associated with this work order"],
    }


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--title", required=True, help="Work order title")
    parser.add_argument(
        "--scope",
        action="append",
        default=[],
        help="Scope item. Repeat --scope for multiple items.",
    )
    parser.add_argument(
        "--date",
        dest="date_override",
        help="Override date in YYYYMMDD format. Default: today",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Print JSON instead of writing a file.",
    )
    args = parser.parse_args()

    repo_root = Path(__file__).resolve().parents[1]
    workorders_dir = repo_root / "workorders"
    if not workorders_dir.exists():
        raise SystemExit(f"Missing workorders directory: {workorders_dir}")

    day_key = args.date_override or date.today().strftime("%Y%m%d")
    if not re.fullmatch(r"\d{8}", day_key):
        raise SystemExit("--date must be in YYYYMMDD format")

    workorder_id = _next_workorder_id(workorders_dir, day_key)
    payload = _build_payload(workorder_id=workorder_id, title=args.title, scope=args.scope)
    output_path = workorders_dir / f"{workorder_id}.json"

    if args.dry_run:
        print(json.dumps(payload, indent=2))
        return

    if output_path.exists():
        raise SystemExit(f"Refusing to overwrite existing file: {output_path}")

    output_path.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
    print(output_path.relative_to(repo_root))


if __name__ == "__main__":
    main()
