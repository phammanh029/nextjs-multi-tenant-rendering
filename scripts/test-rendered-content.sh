#!/usr/bin/env bash
set -euo pipefail

namespace="${NAMESPACE:-puck-demo}"
ingress_name="${INGRESS_NAME:-nextjs-puck-demo}"
base_url="${BASE_URL:-}"
shop_count="${SHOP_COUNT:-10}"

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

assert_contains() {
  local content="$1"
  local expected="$2"
  local label="$3"

  if [[ "$content" != *"$expected"* ]]; then
    echo "Expected ${label} to contain: ${expected}" >&2
    exit 1
  fi
}

check_shop() {
  local host="$1"
  local expected_title="$2"
  local expected_layout="$3"

  local list_html
  list_html="$(curl -fsS -H "Host: ${host}" "${base_url}/products")"
  assert_contains "$list_html" "$expected_title" "${host} product list"
  assert_contains "$list_html" "$expected_layout" "${host} product list"
  assert_contains "$list_html" "Mechanical Keyboard" "${host} product list"

  local detail_html
  detail_html="$(curl -fsS -H "Host: ${host}" "${base_url}/products/keyboard")"
  assert_contains "$detail_html" "Mechanical Keyboard" "${host} product detail"
  assert_contains "$detail_html" "shared default detail layout" "${host} product detail"

  echo "ok ${host}"
}

check_shop "shop-a.local" "Shop A Products" "grid layout"
check_shop "shop-b.local" "Shop B Products" "list layout"

for i in $(seq 1 "$shop_count"); do
  if (( i % 2 == 1 )); then
    check_shop "shop-${i}.puck.local" "Shop ${i} Products" "grid layout"
  else
    check_shop "shop-${i}.puck.local" "Shop ${i} Products" "list layout"
  fi
done
