#!/bin/bash
# 03-v1.0.0-install-local-helm-charts.sh
# Installs Retail Fenix services using LOCAL Helm charts from this repository
set -e

# Resolve path to project root helm/ directory relative to this script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CHART_DIR="$SCRIPT_DIR/../../../helm"

echo "============================================"
echo "Retail Fenix - Local Helm Installation"
echo "============================================"
echo "Charts directory: $CHART_DIR"
echo

# Step 01 - Catalog Service
echo "--------------------------------------------"
echo "Step 1/5: Installing Catalog Service..."
echo "--------------------------------------------"
helm upgrade --install catalog "$CHART_DIR/catalog" \
  -f values-catalog.yaml \
  --wait \
  --timeout 5m

echo "✅ Catalog service installed successfully"
sleep 5

# Step 02 - Cart Service
echo
echo "--------------------------------------------"
echo "Step 2/5: Installing Cart Service..."
echo "--------------------------------------------"
helm upgrade --install carts "$CHART_DIR/cart" \
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
helm upgrade --install checkout "$CHART_DIR/checkout" \
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
helm upgrade --install orders "$CHART_DIR/orders" \
  -f values-orders.yaml \
  --wait \
  --timeout 5m

echo "✅ Orders service installed successfully"
sleep 5

# Step 05 - UI Service
echo
echo "--------------------------------------------"
echo "Step 5/5: Installing UI Service..."
echo "--------------------------------------------"
helm upgrade --install ui "$CHART_DIR/ui" \
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
echo "HPA:"
kubectl get hpa

echo
echo "Ingress:"
kubectl get ingress

echo
echo "============================================"
echo "✅ All services installed successfully!"
echo "============================================"
echo
echo "Next Steps:"
echo "1. Verify all pods are running: kubectl get pods"
echo "2. Check HPA status:            kubectl get hpa"
echo "3. Check ingress address:       kubectl get ingress"
