#!/usr/bin/env bash
set -euo pipefail

APP_PKG_FILE="tenantguard-app_$(date +%F-%H%M%S).tar.xz"

echo "Creating app package @ ${APP_PKG_FILE} ..."
tar Jcvf ../${APP_PKG_FILE} --exclude=**/node_modules --exclude=**/static --exclude=venv \
  --exclude=ssl_certs --exclude=**/dist --exclude=.env --exclude=**/__pycache__ . && echo "Complete ..." && \
  echo "Application packages created sucessfully @ ${APP_PKG_FILE}" && ls -l ../${APP_PKG_FILE}
