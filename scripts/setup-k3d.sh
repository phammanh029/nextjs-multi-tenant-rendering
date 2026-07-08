#!/usr/bin/env bash
set -euo pipefail

cluster_name="puck-demo"

if k3d cluster list "$cluster_name" >/dev/null 2>&1; then
  echo "k3d cluster '$cluster_name' already exists; reusing it."
else
  k3d cluster create "$cluster_name" --agents 2 -p "80:80@loadbalancer" --k3s-arg "--disable=traefik@server:*"
fi

docker build -t nextjs-puck-demo:local .
k3d image import nextjs-puck-demo:local -c "$cluster_name"
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/cloud/deploy.yaml
kubectl -n ingress-nginx rollout status deployment/ingress-nginx-controller --timeout=180s
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml
if ! kubectl -n kube-system get deployment metrics-server -o jsonpath='{.spec.template.spec.containers[0].args}' | grep -q -- "--kubelet-insecure-tls"; then
  kubectl -n kube-system patch deployment metrics-server --type=json -p='[
    {"op":"add","path":"/spec/template/spec/containers/0/args/-","value":"--kubelet-insecure-tls"}
  ]'
fi
kubectl -n kube-system rollout status deployment/metrics-server --timeout=180s
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
kubectl apply -f k8s/ingress.yaml
kubectl apply -f k8s/hpa.yaml
kubectl -n puck-demo rollout restart deployment/nextjs-puck-demo
kubectl -n puck-demo rollout status deployment/nextjs-puck-demo --timeout=180s
