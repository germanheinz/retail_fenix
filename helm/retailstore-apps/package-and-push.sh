#!/bin/bash
set -e

ECR_REGISTRY="public.ecr.aws/i5b4r2o0/retail-fenix/charts"
CHARTS_DIR="$(cd "$(dirname "$0")/.." && pwd)"

# Read version from each chart's Chart.yaml
VERSION_CATALOG=$(grep '^version:' "$CHARTS_DIR/catalog/Chart.yaml" | awk '{print $2}')
VERSION_CART=$(grep    '^version:' "$CHARTS_DIR/cart/Chart.yaml"    | awk '{print $2}')
VERSION_CHECKOUT=$(grep '^version:' "$CHARTS_DIR/checkout/Chart.yaml" | awk '{print $2}')
VERSION_ORDERS=$(grep  '^version:' "$CHARTS_DIR/orders/Chart.yaml"  | awk '{print $2}')
VERSION_UI=$(grep      '^version:' "$CHARTS_DIR/ui/Chart.yaml"      | awk '{print $2}')

echo "============================================"
echo "Package & Push - Retail Fenix Helm Charts"
echo "Registry: oci://${ECR_REGISTRY}"
echo "Versions:"
echo "  catalog:  ${VERSION_CATALOG}"
echo "  cart:     ${VERSION_CART}"
echo "  checkout: ${VERSION_CHECKOUT}"
echo "  orders:   ${VERSION_ORDERS}"
echo "  ui:       ${VERSION_UI}"
echo "============================================"

# Step 01 - Clean previous .tgz files
echo ""
echo "--------------------------------------------"
echo "Cleaning previous packages..."
echo "--------------------------------------------"
rm -f "$CHARTS_DIR"/*.tgz
echo "Clean done."

# Step 02 - Package all charts
echo ""
echo "--------------------------------------------"
echo "Packaging charts..."
echo "--------------------------------------------"
cd "$CHARTS_DIR"
helm package catalog  --destination .
helm package cart     --destination .
helm package checkout --destination .
helm package orders   --destination .
helm package ui       --destination .

echo ""
echo "Packaged:"
ls -1 ./*.tgz | xargs -n1 basename

# Step 03 - Authenticate to ECR
echo ""
echo "--------------------------------------------"
echo "Authenticating to Amazon Public ECR..."
echo "--------------------------------------------"
ECR_TOKEN=$(aws ecr-public get-login-password --region us-east-1)
docker login public.ecr.aws --username AWS --password "$ECR_TOKEN"
echo "Authenticated."

# Step 04 - Push all charts
echo ""
echo "--------------------------------------------"
echo "Pushing charts to ECR..."
echo "--------------------------------------------"
helm push "catalog-${VERSION_CATALOG}.tgz"   oci://${ECR_REGISTRY}
helm push "cart-${VERSION_CART}.tgz"         oci://${ECR_REGISTRY}
helm push "checkout-${VERSION_CHECKOUT}.tgz" oci://${ECR_REGISTRY}
helm push "orders-${VERSION_ORDERS}.tgz"     oci://${ECR_REGISTRY}
helm push "ui-${VERSION_UI}.tgz"             oci://${ECR_REGISTRY}

echo ""
echo "============================================"
echo "All charts pushed successfully!"
echo "  oci://${ECR_REGISTRY}/catalog:${VERSION_CATALOG}"
echo "  oci://${ECR_REGISTRY}/cart:${VERSION_CART}"
echo "  oci://${ECR_REGISTRY}/checkout:${VERSION_CHECKOUT}"
echo "  oci://${ECR_REGISTRY}/orders:${VERSION_ORDERS}"
echo "  oci://${ECR_REGISTRY}/ui:${VERSION_UI}"
echo "============================================"
