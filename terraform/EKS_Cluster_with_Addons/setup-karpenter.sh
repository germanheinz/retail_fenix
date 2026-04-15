#!/bin/bash
# ============================================================
# Script: setup-karpenter.sh
# Purpose: Install Karpenter (Terraform IAM/SQS/Helm)
#          and apply NodeClass + NodePools
# Usage:   ./setup-karpenter.sh
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
echo "  Retail Fenix — Karpenter Setup"
echo "============================================="
echo ""

# ============================================================
# STEP 1: Prerequisites
# ============================================================
echo "============================================="
echo "STEP 1: Checking prerequisites..."
echo "============================================="
echo ""

for cmd in terraform aws kubectl helm; do
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

log "Cluster '${CLUSTER_NAME}' found."

if ! kubectl get nodes &>/dev/null; then
  log "Configuring kubectl..."
  aws eks update-kubeconfig --name "$CLUSTER_NAME" --region "$AWS_REGION"
fi

log "kubectl connected."
echo ""

# ============================================================
# STEP 2: Terraform — Karpenter IAM + SQS + EventBridge + Helm
# ============================================================
echo "============================================="
echo "STEP 2: Terraform — Karpenter infrastructure..."
echo "============================================="
echo ""

log "Authenticating Helm to ECR Public (required for Karpenter chart)..."
# Use docker login — avoids Git Bash (MINGW64) pipe corruption on Windows.
# Helm 3 automatically uses Docker's credential store for OCI registries.
ECR_TOKEN=$(aws ecr-public get-login-password --region us-east-1 2>/dev/null)
if [[ -n "$ECR_TOKEN" ]] && docker login --username AWS --password "$ECR_TOKEN" public.ecr.aws 2>/dev/null; then
  log "ECR Public authenticated."
else
  warn "ECR Public auth failed — Karpenter chart may already be cached."
fi
unset ECR_TOKEN

echo ""
cd "${SCRIPT_DIR}/03_KARPENTER_terraform-manifests"

log "Initializing Terraform..."
terraform init -reconfigure -input=false

log "Applying Karpenter infrastructure..."
terraform apply -auto-approve -input=false

log "Karpenter Terraform done."
echo ""

# ============================================================
# STEP 3: Wait for Karpenter controller to be ready
# ============================================================
echo "============================================="
echo "STEP 3: Waiting for Karpenter controller..."
echo "============================================="
echo ""

log "Waiting for Karpenter deployment to be available..."
kubectl wait --for=condition=available deployment \
  -l app.kubernetes.io/name=karpenter \
  -n kube-system \
  --timeout=120s || warn "Karpenter pod not ready yet — continuing anyway."

echo ""

# ============================================================
# STEP 4: Apply Karpenter k8s manifests
# ============================================================
echo "============================================="
echo "STEP 4: Applying EC2NodeClass and NodePools..."
echo "============================================="
echo ""

cd "${SCRIPT_DIR}/04_KARPENTER_k8s-manifests"

log "Applying EC2NodeClass..."
kubectl apply -f 01_ec2nodeclass.yaml
sleep 5

log "Applying OnDemand NodePool..."
kubectl apply -f 02_nodepool_ondemand.yaml
sleep 5

log "Applying Spot NodePool..."
kubectl apply -f 03_nodepool_spot.yaml
sleep 5

echo ""

# ============================================================
# STEP 5: Verify
# ============================================================
echo "============================================="
echo "STEP 5: Verifying..."
echo "============================================="
echo ""

log "Karpenter pods:"
kubectl get pods -n kube-system -l app.kubernetes.io/name=karpenter

echo ""
log "NodeClasses:"
kubectl get ec2nodeclasses 2>/dev/null || warn "EC2NodeClass CRD not found yet."

echo ""
log "NodePools:"
kubectl get nodepools 2>/dev/null || warn "NodePool CRD not found yet."

echo ""
echo "============================================="
echo -e "  ${GREEN}✅ Karpenter ready!${NC}"
echo "============================================="
echo ""
echo "  Next step:"
echo -e "  ${CYAN}bash setup-opentelemetry.sh${NC}"
echo ""
