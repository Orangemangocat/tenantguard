#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   ./scripts/run-cloudsql-proxy.sh <project:region:instance> [port]
#
# Or:
#   INSTANCE_CONNECTION_NAME="project:region:instance" ./scripts/run-cloudsql-proxy.sh
INSTANCE_CONNECTION_NAME="tenantguard-480405:us-central1:tenantguard-db"

INSTANCE_CONNECTION_NAME="${1:-${INSTANCE_CONNECTION_NAME:-}}"
PORT="${2:-5432}"

if [[ -z "${INSTANCE_CONNECTION_NAME}" ]]; then
  echo "ERROR: Missing instance connection name."
  echo "Usage: $0 <project:region:instance> [port]"
  echo "Example: $0 myproj:us-central1:tenantguard-db 5432"
  exit 1
fi

if ! command -v cloud-sql-proxy >/dev/null 2>&1; then
  echo "ERROR: cloud-sql-proxy not found in PATH."
  echo "Install Cloud SQL Auth Proxy v2 and ensure 'cloud-sql-proxy' is executable."
  exit 1
fi

echo "Starting Cloud SQL Auth Proxy..."
echo "  Instance: ${INSTANCE_CONNECTION_NAME}"
echo "  Listening on: 127.0.0.1:${PORT}"
echo

# Common pitfall: port already in use (local postgres running).
# This script doesn't kill anything; it will fail loudly if the port is taken.
cloud-sql-proxy "${INSTANCE_CONNECTION_NAME}" --port "${PORT}"

