#!/usr/bin/env bash

set -euo pipefail

sudo -u www-data venv/bin/python -m pip install -r requirements.txt
sudo -u www-data venv/bin/python -m compileall src
sudo -u www-data make frontend-build
bash scripts/restart_services.sh
