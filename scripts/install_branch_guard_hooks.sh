#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
HOOKS_DIR="${REPO_ROOT}/.git/hooks"
GUARD_SCRIPT="${REPO_ROOT}/scripts/guard_dev_branch.sh"
STAMP="$(date +%Y%m%d%H%M%S)"

if [[ ! -d "${HOOKS_DIR}" ]]; then
  echo "ERROR: Could not find git hooks directory at ${HOOKS_DIR}"
  exit 1
fi

if [[ ! -f "${GUARD_SCRIPT}" ]]; then
  echo "ERROR: Missing guard script: ${GUARD_SCRIPT}"
  exit 1
fi

install_hook() {
  local hook_name="$1"
  local hook_path="${HOOKS_DIR}/${hook_name}"
  local marker="# tenantguard-dev-branch-guard"

  if [[ -f "${hook_path}" ]] && ! grep -q "${marker}" "${hook_path}"; then
    cp "${hook_path}" "${hook_path}.backup.${STAMP}"
    echo "Backed up existing ${hook_name} hook to ${hook_path}.backup.${STAMP}"
  fi

  cat > "${hook_path}" <<EOF
#!/usr/bin/env bash
set -euo pipefail
${marker}
"${GUARD_SCRIPT}"
EOF
  chmod +x "${hook_path}"
  echo "Installed ${hook_name} hook"
}

chmod +x "${GUARD_SCRIPT}"
install_hook "pre-commit"
install_hook "pre-push"

echo "Branch guard hooks installed successfully."
echo "Commits/pushes will fail unless current branch is 'dev'."
