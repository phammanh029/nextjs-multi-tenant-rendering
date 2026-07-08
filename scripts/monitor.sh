#!/usr/bin/env bash
set -euo pipefail

namespace="${NAMESPACE:-puck-demo}"
deployment="${DEPLOYMENT:-nextjs-puck-demo}"
interval="${INTERVAL_SECONDS:-5}"

while true; do
  clear
  date
  echo
  kubectl -n "$namespace" get deployment "$deployment"
  echo
  kubectl -n "$namespace" get hpa "$deployment" || true
  echo
  kubectl -n "$namespace" get pods -l app="$deployment" -o wide
  echo
  kubectl -n "$namespace" top pods -l app="$deployment" || {
    echo
    echo "metrics-server is not ready yet. Run ./scripts/setup-k3d.sh or wait for metrics to appear."
  }
  sleep "$interval"
done
