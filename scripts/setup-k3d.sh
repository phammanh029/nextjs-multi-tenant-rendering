#!/usr/bin/env bash
set -euo pipefail

k3d cluster create puck-demo --agents 2 -p "80:80@loadbalancer" --k3s-arg "--disable=traefik@server:*"
docker build -t nextjs-puck-demo:local .
k3d image import nextjs-puck-demo:local -c puck-demo
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/cloud/deploy.yaml
kubectl -n ingress-nginx rollout status deployment/ingress-nginx-controller --timeout=180s
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
kubectl apply -f k8s/ingress.yaml
kubectl apply -f k8s/hpa.yaml
kubectl -n puck-demo rollout status deployment/nextjs-puck-demo --timeout=180s
