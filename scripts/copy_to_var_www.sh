#!/usr/bin/env bash
sudo rsync -var --copy-as=www-data --exclude=.git --exclude=node_modules --exclude=venv --exclude=ssl_certs --exclude=.env . /var/www/tenantguard
