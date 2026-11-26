#!/usr/bin/env bash
# Runs on the Namecheap server over SSH. Args: $1=app_path $2=backup_file_name
set -euo pipefail
app_path="$1"
backup_file="$2"
backup_dir="$HOME/moneyquest-backups"

tar -xzf "$backup_dir/$backup_file" -C "$(dirname "$app_path")"
mkdir -p "$app_path/tmp"
touch "$app_path/tmp/restart.txt"
echo "Rollback extracted from $backup_file and restart requested."
