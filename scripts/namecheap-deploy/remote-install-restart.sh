#!/usr/bin/env bash
# Runs on the Namecheap server over SSH, after the new release has already
# been rsynced into app_path. Args: $1=app_path $2=activate_cmd (optional)
set -euo pipefail
app_path="$1"
activate_cmd="${2:-}"

if [ -n "$activate_cmd" ]; then
  eval "$activate_cmd"
fi

cd "$app_path"
npm ci --omit=dev
mkdir -p tmp
touch tmp/restart.txt
echo "Dependencies installed and Passenger restart requested."
