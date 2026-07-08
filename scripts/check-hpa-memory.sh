#!/usr/bin/env bash
set -euo pipefail

namespace="${NAMESPACE:-puck-demo}"
deployment="${DEPLOYMENT:-nextjs-puck-demo}"

echo "HPA:"
hpa_output="$(kubectl -n "$namespace" get hpa "$deployment")"
echo "$hpa_output"

if [[ "$hpa_output" != *"memory:"* ]]; then
  echo "HPA output does not include a memory target. Check k8s/hpa.yaml and metrics-server." >&2
  exit 1
fi

echo
echo "Pod resource usage:"
top_output="$(kubectl -n "$namespace" top pods -l app="$deployment")"
echo "$top_output"

if [[ "$top_output" != *"MEMORY"* ]]; then
  echo "kubectl top did not return a MEMORY column. metrics-server may not be ready." >&2
  exit 1
fi

if ! awk 'NR > 1 { found = 1; if ($3 !~ /^[0-9]+Mi$/) exit 2 } END { if (!found) exit 3 }' <<< "$top_output"; then
  echo "Pod memory metrics were missing or not reported in Mi." >&2
  exit 1
fi

echo
echo "Memory metrics are available to HPA. HPA scales when average pod memory exceeds the configured utilization target."
