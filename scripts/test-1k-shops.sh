#!/usr/bin/env bash
set -euo pipefail

base_url="${BASE_URL:-http://127.0.0.1/api/whoami}"
shop_count="${SHOP_COUNT:-1000}"

for i in $(seq 1 "$shop_count"); do
  host="shop-${i}.puck.local"
  curl -fsS -H "Host: ${host}" "$base_url"
  echo
done
