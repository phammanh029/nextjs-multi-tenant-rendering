# Next.js + Puck Multi-Tenant Stateless Demo

This demo shows one stateless Next.js renderer serving two local shops:

- `shop-a.local` uses `ProductGrid` for the product list.
- `shop-b.local` uses `ProductList` for the product list.
- Both shops reuse the same `ProductDetail` layout.
- Tenant state is not stored in process memory. Tenant manifests and page data are read from JSON files per request. In production, replace these JSON files with Redis + DB/config service.

## Architecture

```txt
request Host header
  ↓
resolve tenant from data/tenants/tenants.json
  ↓
load tenant-specific Puck page JSON
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

The repo includes `k8s/hpa.yaml`, but HPA requires metrics-server. For a real HPA test, install metrics-server in k3d first.

Example load test with `hey`:

```sh
hey -z 60s -c 50 -host shop-a.local http://127.0.0.1/
```

Check HPA:

```sh
kubectl -n puck-demo get hpa
kubectl -n puck-demo get pods
```

## Important files

```txt
lib/puck-config.tsx              trusted global Puck component registry
lib/data.ts                      per-request data loading, no process cache
lib/tenant.ts                    tenant resolution from request headers
data/tenants/tenants.json        tenant manifests
data/pages/shop-a/home.json      shop A list page, grid layout
data/pages/shop-b/home.json      shop B list page, list layout
data/pages/*/detail.json         shared detail layout template
app/api/whoami/route.ts          stateless/scaling test endpoint
k8s/deployment.yaml              3 replicas
k8s/ingress.yaml                 shop-a.local and shop-b.local hosts
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
