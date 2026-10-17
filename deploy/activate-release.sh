#!/usr/bin/env bash
set -euo pipefail
release="${1:?Release identifier required}"
[[ "$release" =~ ^[a-f0-9]{40}$ ]] || { echo 'Invalid release identifier'; exit 1; }
root=/srv/jhb
previous=$(readlink -f "$root/current" || true)
test -f "$root/releases/$release/.output/server/index.mjs"
ln -s "$root/releases/$release" "$root/current.next"
mv -Tf "$root/current.next" "$root/current"
sudo systemctl restart jhb
for attempt in {1..20}; do
  if curl --fail --silent http://127.0.0.1:3000/ >/dev/null; then
    echo 'New website release is healthy'
    exit 0
  fi
  sleep 2
done
if test -n "$previous"; then
  ln -s "$previous" "$root/current.rollback"
  mv -Tf "$root/current.rollback" "$root/current"
  sudo systemctl restart jhb
fi
echo 'Release failed; previous release restored where available'
exit 1