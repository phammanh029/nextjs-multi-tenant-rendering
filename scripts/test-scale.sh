#!/usr/bin/env bash
set -euo pipefail

echo "Requests to shop-a.local:"
for i in $(seq 1 20); do
  curl -s -H 'Host: shop-a.local' http://127.0.0.1/api/whoami
  echo
done

echo "Requests to shop-b.local:"
for i in $(seq 1 20); do
  curl -s -H 'Host: shop-b.local' http://127.0.0.1/api/whoami
  echo
done
