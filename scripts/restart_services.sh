#!/usr/bin/bash
set -euo pipefail

restart_service () {
  echo -n "Restarting $1 ..."
  sudo systemctl restart "$1"
  echo "success!"
}

restart_service "tenantguard.service"
restart_service "tenantguard-worker.service"
restart_service "tenantguard-blog.service"
restart_service "nginx.service"
