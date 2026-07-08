# Next.js + Puck Multi-Tenant Stateless Demo

This demo shows one stateless Next.js renderer serving many shops:

- `shop-a.local` uses `ProductGrid` for the product list.
- `shop-b.local` uses `ProductList` for the product list.
- `shop-1.puck.local` through `shop-1000.puck.local` are generated demo tenants served by the same deployment.
- Both shops reuse the same `ProductDetail` layout.
- Tenant state is not stored in React or request globals. Tenant manifests and page data are seeded into a local SQLite store once per Node.js process, then resolved through indexed host and page lookups. In production, replace this local store with Redis + DB/config service.

## Architecture

```txt
request Host header
  ↓
resolve tenant from indexed local SQLite store
  ↓
load tenant-specific Puck page data from local SQLite
  ↓
build runtime Puck config from trusted global registry
  ↓
render with <Render config={config} data={data} />
```

## Local dev without Kubernetes

Add hosts:

```txt
127.0.0.1 shop-a.local
127.0.0.1 shop-b.local
```

On Linux/macOS:

```sh
sudo sh -c 'echo "127.0.0.1 shop-a.local shop-b.local" >> /etc/hosts'
npm install
npm run dev
```

Open:

```txt
http://shop-a.local:3000
http://shop-b.local:3000
http://shop-a.local:3000/products
http://shop-b.local:3000/products
http://shop-a.local:3000/products/keyboard
http://shop-b.local:3000/products/keyboard
```

## k3d demo

Requirements:

- Docker
- k3d
- kubectl

Run:

```sh
./scripts/setup-k3d.sh
```

Open:

```txt
http://shop-a.local
http://shop-b.local
```

## Scaling/stateless test

The deployment starts with 3 replicas.

```sh
kubectl -n puck-demo get pods -o wide
./scripts/test-scale.sh
```

You should see different `pod` values returned by `/api/whoami`. The tenant is resolved from the `Host` header on every request, so any pod can serve either shop.

## Rendered Puck content test

`/api/whoami` is useful for pod routing, but it does not prove the Puck renderer produced tenant-specific UI. Use this script to fetch rendered product-list and product-detail HTML through the ingress load-balancer IP:

```sh
./scripts/test-rendered-content.sh
```

The script reads the load-balancer IP from the `nextjs-puck-demo` ingress. You can also pass it explicitly:

```sh
BASE_URL=http://172.22.0.3 ./scripts/test-rendered-content.sh
```

By default, it checks `shop-a.local`, `shop-b.local`, and the first 10 generated shops. Increase generated shop coverage:

```sh
SHOP_COUNT=1000 ./scripts/test-rendered-content.sh
```

The checks run in parallel. Tune request concurrency with `PARALLELISM`:

```sh
SHOP_COUNT=1000 PARALLELISM=50 ./scripts/test-rendered-content.sh
```

Manual curl tests:

```sh
curl -H 'Host: shop-a.local' http://127.0.0.1/api/whoami
curl -H 'Host: shop-b.local' http://127.0.0.1/api/whoami
```

Scale manually:

```sh
kubectl -n puck-demo scale deployment nextjs-puck-demo --replicas=6
kubectl -n puck-demo rollout status deployment/nextjs-puck-demo
./scripts/test-scale.sh
```

## HPA test

The repo includes `k8s/hpa.yaml`, and `./scripts/setup-k3d.sh` installs metrics-server for k3d. HPA is configured to scale early for demo feedback:

```txt
CPU target:    35% of requested CPU
Memory target: 45% of requested memory
Min pods:      3
Max pods:      20
```

Example load test with `hey`:

```sh
hey -z 60s -c 50 -host shop-a.local http://127.0.0.1/
```

Check HPA:

```sh
kubectl -n puck-demo get hpa
kubectl -n puck-demo get pods
```

Verify that memory metrics are available to HPA:

```sh
./scripts/check-hpa-memory.sh
```

You know memory-based HPA input is working when:

- `kubectl -n puck-demo get hpa nextjs-puck-demo` shows a `memory: current/45%` target.
- `kubectl -n puck-demo top pods -l app=nextjs-puck-demo` shows a non-empty `MEMORY` column.
- `./scripts/check-hpa-memory.sh` exits successfully.

## Important files

```txt
lib/puck-config.tsx              trusted global Puck component registry
lib/data.ts                      public data access functions used by routes
lib/local-store.ts               local SQLite tenant/page lookup store
lib/demo-tenants.ts              deterministic generated tenants for the 1k demo
lib/tenant.ts                    tenant resolution from request headers
data/tenants/tenants.json        tenant manifests
data/pages/shop-a/home.json      shop A list page, grid layout
data/pages/shop-b/home.json      shop B list page, list layout
data/pages/*/detail.json         shared detail layout template
app/api/whoami/route.ts          stateless/scaling test endpoint
k8s/deployment.yaml              3 replicas
k8s/ingress.yaml                 shop-a.local, shop-b.local, and *.puck.local hosts
```

## 1k shared-shop demo

The 1k demo uses one shared Kubernetes deployment. It does not create one deployment, service, ingress, or pod per shop.

Static tenants are still defined in JSON seed files. At process startup, the app seeds a local SQLite store with those static tenants plus generated demo tenants resolved from the host pattern:

```txt
shop-1.puck.local
shop-2.puck.local
...
shop-1000.puck.local
```

Odd-numbered generated shops use `ProductGrid`; even-numbered generated shops use `ProductList`. Themes and Puck page titles are generated deterministically from the tenant id and stored in the local SQLite tables.

Smoke test all generated shops through the same ingress:

```sh
./scripts/test-1k-shops.sh
```

Smoke test generated shop rendered product pages:

```sh
BASE_URL=http://172.22.0.3 SHOP_COUNT=1000 ./scripts/test-rendered-content.sh
```

Run the rendered checks in parallel:

```sh
BASE_URL=http://172.22.0.3 SHOP_COUNT=1000 PARALLELISM=50 ./scripts/test-rendered-content.sh
```

Run fewer shops:

```sh
SHOP_COUNT=25 ./scripts/test-1k-shops.sh
```

Run a single generated shop:

```sh
curl -H 'Host: shop-427.puck.local' http://127.0.0.1/api/whoami
curl -H 'Host: shop-428.puck.local' http://127.0.0.1/
```

## Monitoring pods, CPU, and memory

`./scripts/setup-k3d.sh` installs metrics-server for the local k3d cluster and applies an HPA that watches CPU and memory utilization.

Watch deployment replicas, HPA status, pods, pod CPU, and pod memory:

```sh
./scripts/monitor.sh
```

Check that HPA can read pod memory metrics:

```sh
./scripts/check-hpa-memory.sh
```

Useful one-off commands:

```sh
kubectl -n puck-demo get deployment nextjs-puck-demo
kubectl -n puck-demo get hpa nextjs-puck-demo
kubectl -n puck-demo get pods -l app=nextjs-puck-demo -o wide
kubectl -n puck-demo top pods -l app=nextjs-puck-demo
```

## Production changes

Replace local JSON reads with:

```txt
Redis cache → DB/config service
```

Use tenant-safe keys:

```txt
tenant:{tenantId}:manifest:v{configVersion}
tenant:{tenantId}:page:{slug}:published:v{publishedVersion}
tenant:{tenantId}:products
```

Keep React component implementations in code. Do not allow tenants to provide render functions or arbitrary JavaScript.
