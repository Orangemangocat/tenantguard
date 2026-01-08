#!/usr/bin/env bash
set -euo pipefail

APP_PKG_FILE="tenantguard-snapshot-$(date +%F-%H%M%S).tar.xz"

echo "Creating app package @ ${APP_PKG_FILE} ..."
tar Jcvf /tmp/${APP_PKG_FILE} --exclude=node_modules --exclude=venv --exclude=dist --exclude=.env --exclude=__pycache__ . && echo "Complete ..." && \
  echo "Application snapshot created sucessfully @ ${APP_PKG_FILE}" && mv /tmp/${APP_PKG_FILE} . && ls -l ${APP_PKG_FILE}
