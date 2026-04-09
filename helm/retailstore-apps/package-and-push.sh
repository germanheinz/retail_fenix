#!/bin/bash

set -e

CHART_VERSION="1.0.2"
ECR_REGISTRY="public.ecr.aws/i5b4r2o0/retail-fenix/charts"
CHARTS_DIR="$(cd "$(dirname "$0")/.." && pwd)"

echo "============================================"
echo "Package & Push - Retail Fenix Helm Charts"
echo "Version: $CHART_VERSION"
echo "============================================"

# Step 01 - Package all charts
echo ""
echo "--------------------------------------------"
echo "Packaging all charts..."
echo "--------------------------------------------"

cd "$CHARTS_DIR"

helm package catalog  --destination .
helm package cart     --destination .
helm package checkout --destination .
helm package orders   --destination .
helm package ui       --destination .

echo ""
echo "Charts packaged:"
ls -1 ./*.tgz 2>/dev/null | xargs -n1 basename

# Step 02 - Authenticate to ECR
echo ""
echo "--------------------------------------------"
echo "Authenticating to Amazon Public ECR..."
echo "--------------------------------------------"

ECR_TOKEN=$(aws ecr-public get-login-password --region us-east-1)
docker login public.ecr.aws --username AWS --password "$ECR_TOKEN"

# Step 03 - Push all charts
echo ""
echo "--------------------------------------------"
echo "Pushing charts to ECR..."
echo "--------------------------------------------"

helm push catalog-${CHART_VERSION}.tgz  oci://${ECR_REGISTRY}
helm push cart-${CHART_VERSION}.tgz     oci://${ECR_REGISTRY}
helm push checkout-${CHART_VERSION}.tgz oci://${ECR_REGISTRY}
helm push orders-${CHART_VERSION}.tgz   oci://${ECR_REGISTRY}
helm push ui-${CHART_VERSION}.tgz       oci://${ECR_REGISTRY}

echo ""
echo "============================================"
echo "All charts pushed successfully!"
echo "  oci://${ECR_REGISTRY}/catalog:${CHART_VERSION}"
echo "  oci://${ECR_REGISTRY}/cart:${CHART_VERSION}"
echo "  oci://${ECR_REGISTRY}/checkout:${CHART_VERSION}"
echo "  oci://${ECR_REGISTRY}/orders:${CHART_VERSION}"
echo "  oci://${ECR_REGISTRY}/ui:${CHART_VERSION}"
echo "============================================"
