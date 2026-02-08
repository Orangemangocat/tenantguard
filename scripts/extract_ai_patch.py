#!/usr/bin/env python3
"""Extract a unified diff patch from an AI markdown response."""

from __future__ import annotations

import argparse
import re
from pathlib import Path

CODE_BLOCK_RE = re.compile(r"```(?P<lang>[A-Za-z0-9_-]*)\n(?P<body>.*?)```", re.DOTALL)


def _looks_like_patch(content: str) -> bool:
    if "diff --git " in content:
        return True
    return "--- " in content and "+++ " in content and "@@" in content


def _extract_patch_from_markdown(markdown: str) -> str:
    blocks = CODE_BLOCK_RE.finditer(markdown)
    diff_block = None
    fallback_block = None

    for block in blocks:
        language = (block.group("lang") or "").strip().lower()
        body = block.group("body")
        if language in {"diff", "patch"} and _looks_like_patch(body):
            diff_block = body
            break
        if fallback_block is None and _looks_like_patch(body):
            fallback_block = body

    candidate = diff_block or fallback_block
    if candidate is None:
        raise SystemExit(
            "Could not find a fenced diff patch block. Ensure the AI response includes ```diff ... ```."
        )

    return candidate.rstrip() + "\n"


def _changed_files_from_patch(patch_text: str) -> list[str]:
    changed_files = []
    for line in patch_text.splitlines():
        if not line.startswith("diff --git "):
            continue
        parts = line.split()
        if len(parts) < 4 or not parts[3].startswith("b/"):
            continue
        changed_files.append(parts[3][2:])
    return sorted(set(changed_files))


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--response", required=True, help="Path to markdown/text AI response")
    parser.add_argument("--output", required=True, help="Path to write extracted patch file")
    args = parser.parse_args()

    response_path = Path(args.response)
    if not response_path.exists() or not response_path.is_file():
        raise SystemExit(f"Response file not found: {response_path}")

    markdown = response_path.read_text(encoding="utf-8")
    patch_text = _extract_patch_from_markdown(markdown)

    output_path = Path(args.output)
    output_path.write_text(patch_text, encoding="utf-8")

    changed_files = _changed_files_from_patch(patch_text)
    print(f"patch_file={output_path}")
    if changed_files:
        print("changed_files=" + ",".join(changed_files))
    else:
        print("changed_files=(none detected from diff --git headers)")


if __name__ == "__main__":
    main()
