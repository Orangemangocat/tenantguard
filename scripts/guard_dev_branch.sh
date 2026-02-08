#!/usr/bin/env bash
set -euo pipefail

REQUIRED_BRANCH="${REQUIRED_BRANCH:-dev}"
CURRENT_BRANCH="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || true)"

if [[ -z "${CURRENT_BRANCH}" || "${CURRENT_BRANCH}" == "HEAD" ]]; then
  echo "ERROR: Could not determine current git branch. Refusing operation."
  exit 1
fi

if [[ "${CURRENT_BRANCH}" != "${REQUIRED_BRANCH}" ]]; then
  echo "ERROR: Current branch is '${CURRENT_BRANCH}'."
  echo "ERROR: Commits/pushes are restricted to '${REQUIRED_BRANCH}' for this repository."
  echo "ACTION: Switch branches first: git checkout ${REQUIRED_BRANCH}"
  exit 1
fi

exit 0
