#!/usr/bin/env bash
set -euo pipefail

namespace="${NAMESPACE:-puck-demo}"
ingress_name="${INGRESS_NAME:-nextjs-puck-demo}"
base_url="${BASE_URL:-}"
shop_count="${SHOP_COUNT:-10}"
parallelism="${PARALLELISM:-20}"

detect_base_url() {
  local ingress_address

  ingress_address="$(kubectl -n "$namespace" get ingress "$ingress_name" -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>/dev/null || true)"

  if [[ -n "$ingress_address" ]]; then
    echo "http://${ingress_address}"
    return
  fi

  echo "Could not detect ingress load balancer IP. Set BASE_URL explicitly, for example BASE_URL=http://172.22.0.3" >&2
  exit 1
}

if [[ -z "$base_url" ]]; then
  base_url="$(detect_base_url)"
fi

echo "Testing rendered Puck content through ${base_url}"

run_check() {
  local host="$1"
  local expected_title="$2"
  local expected_layout="$3"
  local target_base_url="$4"

  local list_html
  list_html="$(curl -fsS -H "Host: ${host}" "${target_base_url}/products")"

  if [[ "$list_html" != *"$expected_title"* ]]; then
    echo "Expected ${host} product list to contain: ${expected_title}" >&2
    exit 1
  fi

  if [[ "$list_html" != *"$expected_layout"* ]]; then
    echo "Expected ${host} product list to contain: ${expected_layout}" >&2
    exit 1
  fi

  if [[ "$list_html" != *"Mechanical Keyboard"* ]]; then
    echo "Expected ${host} product list to contain: Mechanical Keyboard" >&2
    exit 1
  fi

  local detail_html
  detail_html="$(curl -fsS -H "Host: ${host}" "${target_base_url}/products/keyboard")"

  if [[ "$detail_html" != *"Mechanical Keyboard"* ]]; then
    echo "Expected ${host} product detail to contain: Mechanical Keyboard" >&2
    exit 1
  fi

  if [[ "$detail_html" != *"shared default detail layout"* ]]; then
    echo "Expected ${host} product detail to contain: shared default detail layout" >&2
    exit 1
  fi

  echo "ok ${host}"
}

export -f run_check

queue_check() {
  local host="$1"
  local expected_title="$2"
  local expected_layout="$3"

  printf '%s\0%s\0%s\0%s\0' "$host" "$expected_title" "$expected_layout" "$base_url"
}

checks_file="$(mktemp)"
trap 'rm -f "$checks_file"' EXIT

queue_check "shop-a.local" "Shop A Products" "grid layout" >> "$checks_file"
queue_check "shop-b.local" "Shop B Products" "list layout" >> "$checks_file"

for i in $(seq 1 "$shop_count"); do
  if (( i % 2 == 1 )); then
    queue_check "shop-${i}.puck.local" "Shop ${i} Products" "grid layout" >> "$checks_file"
  else
    queue_check "shop-${i}.puck.local" "Shop ${i} Products" "list layout" >> "$checks_file"
  fi
done

xargs -0 -P "$parallelism" -n 4 bash -c 'run_check "$1" "$2" "$3" "$4"' _ < "$checks_file"

echo "Rendered content checks passed for $((shop_count + 2)) shops with parallelism ${parallelism}."
