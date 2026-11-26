#!/usr/bin/env bash
# Runs on the Namecheap server over SSH. Args: $1=app_path $2=backup_file_name
set -euo pipefail
app_path="$1"
backup_file="$2"
backup_dir="$HOME/moneyquest-backups"

mkdir -p "$backup_dir"
tar --exclude=node_modules -czf "$backup_dir/$backup_file" -C "$(dirname "$app_path")" "$(basename "$app_path")"
tar -tzf "$backup_dir/$backup_file" > /dev/null

size=$(stat -c%s "$backup_dir/$backup_file" 2>/dev/null || stat -f%z "$backup_dir/$backup_file")
if [ "$size" -lt 1024 ]; then
  echo "backup suspiciously small ($size bytes)" >&2
  exit 1
fi
echo "Backup OK: $backup_dir/$backup_file ($size bytes)"
