#!/bin/bash
# 03-v1.0.0-install-remote-helm-charts.sh
# Installs Retail Fenix services from ECR Public OCI registry
# Helm Charts which doesn't need Secrets from AWS Secrets Manager
set -e

ECR_REGISTRY="public.ecr.aws/retail-fenix/retail-fenix/charts"

# Chart versions per service (update independently as needed)
VERSION_CATALOG="1.0.3"
VERSION_CART="1.0.3"
VERSION_CHECKOUT="1.0.2"
VERSION_ORDERS="1.0.3"
VERSION_UI="1.0.5"

echo "============================================"
echo "Retail Store Sample App - Helm Installation"
echo "Registry: oci://${ECR_REGISTRY}"
echo "Versions:"
echo "  catalog:  ${VERSION_CATALOG}"
echo "  cart:     ${VERSION_CART}"
echo "  checkout: ${VERSION_CHECKOUT}"
echo "  orders:   ${VERSION_ORDERS}"
echo "  ui:       ${VERSION_UI}"
echo "============================================"
echo

echo "--------------------------------------------"
echo "Authenticating to Amazon Public ECR..."
echo "--------------------------------------------"

# Note: using docker login instead of helm registry login due to Windows pipe bug
#       Helm uses Docker's credential store automatically after docker login succeeds
ECR_TOKEN=$(aws ecr-public get-login-password --region us-east-1)
docker login public.ecr.aws --username AWS --password "$ECR_TOKEN"

echo "✅ Authenticated to ECR"
sleep 3

echo
echo "--------------------------------------------"
echo "Pre-requisite: Installing Redis for Checkout..."
echo "--------------------------------------------"
helm repo add bitnami https://charts.bitnami.com/bitnami 2>/dev/null || true
helm repo update
helm upgrade --install checkout-redis bitnami/redis \
  --set auth.enabled=false \
  --set architecture=standalone \
  --set master.persistence.enabled=false \
  --wait \
  --timeout 5m

echo "✅ Redis installed (checkout-redis-master:6379)"
sleep 3

echo
echo "============================================"
echo "Starting Helm Installations..."
echo "============================================"
echo

# Step 01 - Catalog Service
echo "--------------------------------------------"
echo "Step 1/5: Installing Catalog Service..."
echo "--------------------------------------------"
helm upgrade --install catalog \
  oci://${ECR_REGISTRY}/catalog \
  --version ${VERSION_CATALOG} \
  -f values-catalog.yaml \
  --wait \
  --timeout 10m

echo "✅ Catalog service installed successfully"
sleep 5

# Step 02 - Cart Service
# Uses local chart: remote ECR chart missing AWS_ACCESS_KEY_ID/AWS_SECRET_ACCESS_KEY/AWS_REGION
# required by DynamoDB SDK v2 even against DynamoDB Local endpoint
echo
echo "--------------------------------------------"
echo "Step 2/5: Installing Cart Service (local chart)..."
echo "--------------------------------------------"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
helm upgrade --install carts \
  "${SCRIPT_DIR}/../../../helm/cart" \
  -f values-cart.yaml \
  --wait \
  --timeout 5m

echo "✅ Cart service installed successfully"
sleep 5

# Step 03 - Checkout Service
echo
echo "--------------------------------------------"
echo "Step 3/5: Installing Checkout Service..."
echo "--------------------------------------------"
helm upgrade --install checkout \
  oci://${ECR_REGISTRY}/checkout \
  --version ${VERSION_CHECKOUT} \
  -f values-checkout.yaml \
  --wait \
  --timeout 5m

echo "✅ Checkout service installed successfully"
sleep 5

# Step 04 - Orders Service
echo
echo "--------------------------------------------"
echo "Step 4/5: Installing Orders Service..."
echo "--------------------------------------------"
helm upgrade --install orders \
  oci://${ECR_REGISTRY}/orders \
  --version ${VERSION_ORDERS} \
  -f values-orders.yaml \
  --wait \
  --timeout 10m

echo "✅ Orders service installed successfully"
sleep 5

# Step 05 - UI Service
echo
echo "--------------------------------------------"
echo "Step 5/5: Installing UI Service..."
echo "--------------------------------------------"
helm upgrade --install ui \
  oci://${ECR_REGISTRY}/ui \
  --version ${VERSION_UI} \
  -f values-ui.yaml \
  --wait \
  --timeout 5m

echo "✅ UI service installed successfully"
sleep 3

echo
echo "============================================"
echo "Installation Summary"
echo "============================================"

echo
echo "Installed Helm Releases:"
helm list

echo
echo "Deployed Pods:"
kubectl get pods -o wide

echo
echo "Services:"
kubectl get svc

echo
echo "Service Accounts:"
kubectl get sa

echo
echo "ConfigMaps:"
kubectl get cm

echo
echo "Ingress Service:"
kubectl get ingress

echo
echo "============================================"
echo "✅ All services installed successfully!"
echo "============================================"
echo
echo "Next Steps:"
echo "1. Verify all pods are running: kubectl get pods"
echo "2. Check service endpoints: kubectl get svc"
echo "3. Access the Ingress service ADDRESS to test the application"
