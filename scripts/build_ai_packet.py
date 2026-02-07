#!/usr/bin/env python3
"""Build a context packet for external AI chats working on this repository."""

from __future__ import annotations

import argparse
import fnmatch
import subprocess
from datetime import datetime, timezone
from pathlib import Path

BLOCKED_PATTERNS = [
    "**/.env*",
    "**/secrets/**",
    "**/*.pem",
    "**/*id_rsa*",
    "**/__pycache__/**",
    "**/*.pyc",
]


def _run_git(repo_root: Path, *args: str) -> str:
    try:
        completed = subprocess.run(
            ["git", *args],
            cwd=repo_root,
            check=True,
            capture_output=True,
            text=True,
        )
    except (subprocess.CalledProcessError, FileNotFoundError):
        return "unavailable"
    return completed.stdout.strip() or "(clean)"


def _is_blocked(path_value: str) -> bool:
    return any(fnmatch.fnmatch(path_value, pattern) for pattern in BLOCKED_PATTERNS)


def _resolve_repo_file(repo_root: Path, raw_value: str) -> Path:
    candidate = Path(raw_value)
    if not candidate.is_absolute():
        candidate = (repo_root / raw_value).resolve()
    else:
        candidate = candidate.resolve()

    try:
        candidate.relative_to(repo_root)
    except ValueError as exc:
        raise SystemExit(f"Path is outside repo root: {raw_value}") from exc

    if not candidate.exists() or not candidate.is_file():
        raise SystemExit(f"File not found: {raw_value}")

    rel = candidate.relative_to(repo_root).as_posix()
    if _is_blocked(rel):
        raise SystemExit(f"Refusing blocked path in AI packet: {rel}")
    return candidate


def _resolve_workorder_path(repo_root: Path, value: str) -> Path:
    direct = _resolve_repo_file(repo_root, value) if (repo_root / value).exists() else None
    if direct is not None:
        return direct

    by_id = value
    if not by_id.endswith(".json"):
        by_id = f"{by_id}.json"
    candidate = repo_root / "workorders" / by_id
    if candidate.exists():
        return _resolve_repo_file(repo_root, str(candidate.relative_to(repo_root)))

    raise SystemExit(f"Could not resolve workorder: {value}")


def _collect_control_plane_files(repo_root: Path, read_first_only: bool) -> list[Path]:
    base = repo_root / "docs" / "control-plane"
    if not base.exists():
        raise SystemExit("Missing docs/control-plane directory")

    if read_first_only:
        scope = base / "00_READ_FIRST"
        files = sorted(path for path in scope.rglob("*") if path.is_file())
    else:
        files = sorted(path for path in base.rglob("*") if path.is_file())
    return files


def _render_file_block(repo_root: Path, path: Path) -> str:
    rel = path.relative_to(repo_root).as_posix()
    content = path.read_text(encoding="utf-8")
    return f"### {rel}\n```text\n{content}\n```\n"


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--task", required=True, help="Task request for the external AI")
    parser.add_argument("--workorder", help="Workorder id or repo-relative path")
    parser.add_argument(
        "--file",
        action="append",
        default=[],
        help="Additional repo-relative file(s) to include. Repeat --file for more.",
    )
    parser.add_argument(
        "--read-first-only",
        action="store_true",
        help="Include only docs/control-plane/00_READ_FIRST instead of full control-plane.",
    )
    parser.add_argument(
        "--output",
        default="-",
        help="Output path. Use '-' for stdout (default).",
    )
    args = parser.parse_args()

    repo_root = Path(__file__).resolve().parents[1]
    timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    branch = _run_git(repo_root, "rev-parse", "--abbrev-ref", "HEAD")
    status = _run_git(repo_root, "status", "--short")

    packet_files: list[Path] = []
    included = set()

    def include_path(path: Path) -> None:
        key = path.resolve()
        if key in included:
            return
        included.add(key)
        packet_files.append(path)

    include_path(_resolve_repo_file(repo_root, "AGENTS.md"))
    include_path(_resolve_repo_file(repo_root, "README.md"))

    if args.workorder:
        include_path(_resolve_workorder_path(repo_root, args.workorder))

    for control_plane_path in _collect_control_plane_files(repo_root, args.read_first_only):
        include_path(control_plane_path)

    for raw_file in args.file:
        include_path(_resolve_repo_file(repo_root, raw_file))

    lines: list[str] = []
    lines.append("# TenantGuard External AI Task Packet")
    lines.append("")
    lines.append(f"- generated_utc: {timestamp}")
    lines.append(f"- branch: {branch}")
    lines.append("- repository: tenantguard")
    lines.append("")
    lines.append("## Requested task")
    lines.append(args.task.strip())
    lines.append("")
    lines.append("## Git status (short)")
    lines.append("```text")
    lines.append(status)
    lines.append("```")
    lines.append("")
    lines.append("## Required response contract")
    lines.append("Return exactly:")
    lines.append("1) Plan (5-15 bullet lines with exact files to edit)")
    lines.append("2) Unified diff patch inside one fenced ```diff block")
    lines.append("3) Verification commands")
    lines.append("")
    lines.append("Patch constraints:")
    lines.append("- No full-file replacements")
    lines.append("- No blocked paths (.env, secrets, keys, pyc, dist, lockfiles unless required)")
    lines.append("- Respect AGENTS.md and docs/control-plane hierarchy")
    lines.append("")
    lines.append("Before any other response, state this exact sentence:")
    lines.append("I UNDERSTAND THE CONTROL-PLANE DOCUMENTATION!")
    lines.append("")
    lines.append("## Repository context files")
    lines.append("")

    for path in packet_files:
        lines.append(_render_file_block(repo_root, path))

    packet_text = "\n".join(lines)
    if args.output == "-":
        print(packet_text)
        return

    output_path = Path(args.output)
    output_path.write_text(packet_text, encoding="utf-8")
    print(str(output_path))


if __name__ == "__main__":
    main()
