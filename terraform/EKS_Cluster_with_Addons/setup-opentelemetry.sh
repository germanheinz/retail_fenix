#!/bin/bash
# ============================================================
# Script: setup-opentelemetry.sh
# Purpose: Install ADOT + cert-manager via Terraform,
#          then apply OpenTelemetry Collector and
#          Instrumentation CRs for distributed tracing
# Usage:   ./setup-opentelemetry.sh
# ============================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CLUSTER_NAME="retail-dev-eksdemo1"
AWS_REGION="us-east-1"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

log()   { echo -e "${GREEN}[INFO]${NC} $1"; }
warn()  { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

echo ""
echo "============================================="
echo "  Retail Fenix — OpenTelemetry Setup"
echo "============================================="
echo ""

# ============================================================
# STEP 1: Prerequisites
# ============================================================
echo "============================================="
echo "STEP 1: Checking prerequisites..."
echo "============================================="
echo ""

for cmd in terraform aws kubectl; do
  if ! command -v "$cmd" &>/dev/null; then
    error "'$cmd' not found. Please install it before continuing."
  fi
done

if ! aws sts get-caller-identity &>/dev/null; then
  error "AWS credentials not configured. Run 'aws configure' first."
fi

if ! aws eks describe-cluster --name "$CLUSTER_NAME" --region "$AWS_REGION" &>/dev/null; then
  error "EKS cluster '${CLUSTER_NAME}' not found. Run 'bash create-cluster.sh' first."
fi

if ! kubectl get nodes &>/dev/null; then
  log "Configuring kubectl..."
  aws eks update-kubeconfig --name "$CLUSTER_NAME" --region "$AWS_REGION"
fi

log "Cluster '${CLUSTER_NAME}' reachable."
echo ""

# ============================================================
# STEP 2: Terraform — ADOT addon + cert-manager + IAM + Collector CR
# ============================================================
echo "============================================="
echo "STEP 2: Terraform — ADOT + cert-manager + IAM..."
echo "============================================="
echo ""

cd "${SCRIPT_DIR}/06_OPENTELEMTRY_terraform-manifests"

log "Initializing Terraform..."
terraform init -reconfigure -input=false > /dev/null

log "Applying OpenTelemetry infrastructure..."
terraform apply -auto-approve -input=false

log "Terraform done."
echo ""

# ============================================================
# STEP 3: Wait for OpenTelemetry Operator to be ready
# ============================================================
echo "============================================="
echo "STEP 3: Waiting for OTel Operator..."
echo "============================================="
echo ""

log "Waiting for opentelemetry-operator deployment..."
kubectl wait --for=condition=available \
  deployment/opentelemetry-operator-controller-manager \
  -n opentelemetry-operator-system \
  --timeout=180s

log "OTel Operator is ready."
echo ""

# ============================================================
# STEP 4: Verify mutating webhook is registered
# ============================================================
echo "============================================="
echo "STEP 4: Checking mutating webhook..."
echo "============================================="
echo ""

WEBHOOK=$(kubectl get mutatingwebhookconfiguration 2>/dev/null | grep -i otel || true)

if [ -z "$WEBHOOK" ]; then
  warn "Mutating webhook not yet registered — waiting 30s..."
  sleep 30
  WEBHOOK=$(kubectl get mutatingwebhookconfiguration 2>/dev/null | grep -i otel || true)
  if [ -z "$WEBHOOK" ]; then
    warn "Webhook still not visible. Check operator logs:"
    warn "  kubectl logs -n opentelemetry-operator-system deploy/opentelemetry-operator-controller-manager -c manager"
    warn "Continuing — the webhook may register shortly after."
  else
    log "Webhook registered: ${WEBHOOK}"
  fi
else
  log "Webhook registered: ${WEBHOOK}"
fi

echo ""

# ============================================================
# STEP 5: Apply traces Collector CR and Instrumentation CR
# ============================================================
echo "============================================="
echo "STEP 5: Applying Collector and Instrumentation CRs..."
echo "============================================="
echo ""

TRACES_DIR="${SCRIPT_DIR}/07_OpenTelemetry_Traces/01_OpenTelemetry_Traces"

log "Applying OpenTelemetryCollector (adot-traces)..."
kubectl apply -f "${TRACES_DIR}/01_adot_collector_traces.yaml"
sleep 5

log "Applying Instrumentation CR (default-instrumentation)..."
kubectl apply -f "${TRACES_DIR}/02_adot_instrumentation_traces.yaml"
sleep 5

echo ""

# ============================================================
# STEP 6: Verify
# ============================================================
echo "============================================="
echo "STEP 6: Verifying..."
echo "============================================="
echo ""

log "OpenTelemetry Collectors:"
kubectl get opentelemetrycollector -n default

echo ""
log "Instrumentation CRs:"
kubectl get instrumentation -n default

echo ""
log "ADOT services:"
kubectl get svc | grep adot

echo ""
log "Collector pod status:"
kubectl get pods | grep adot

echo ""
echo "============================================="
echo -e "  ${GREEN}✅ OpenTelemetry ready!${NC}"
echo "============================================="
echo ""
echo "  Traces will flow to: AWS X-Ray"
echo "  Verify at: AWS Console → X-Ray → Service Map"
echo ""
echo "  Next step:"
echo -e "  ${CYAN}cd 05_RETAIL_FENIX && bash 02-install-retail-fenix.sh${NC}"
echo ""
