#!/usr/bin/env bash
# Runs on the Namecheap server over SSH, after the new release has already
# been rsynced into app_path. Args: $1=app_path $2=activate_cmd (optional)
set -euo pipefail
app_path="$1"
activate_cmd="${2:-}"

if [ -n "$activate_cmd" ]; then
  # cPanel's nodevenv activate script references variables (e.g.
  # CL_VIRTUAL_ENV) without a default, assuming non-strict mode. It is
  # third-party-ish, system-generated content we don't control, so relax
  # -u only for the duration of sourcing it (a real production failure,
  # 2026-11-26: "CL_VIRTUAL_ENV: unbound variable" aborted the deploy here).
  set +u
  eval "$activate_cmd"
  set -u
fi

cd "$app_path"
npm ci --omit=dev
mkdir -p tmp
touch tmp/restart.txt
echo "Dependencies installed and Passenger restart requested."
