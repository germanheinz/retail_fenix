#!/bin/bash
# create-cluster.sh
# Creates VPC + EKS Cluster with Addons using Terraform
# Idempotent: skips steps where no changes are detected
set -euo pipefail

# ============================================================
# CONFIG
# ============================================================
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CLUSTER_NAME="retail-dev-eksdemo1"
AWS_REGION="us-east-1"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log()     { echo -e "${GREEN}[INFO]${NC} $1"; }
warn()    { echo -e "${YELLOW}[WARN]${NC} $1"; }
error()   { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

# ============================================================
# HELPERS
# ============================================================

# Runs terraform init + plan. Returns 0=no changes, 2=has changes
tf_plan() {
  local dir="$1"
  cd "$SCRIPT_DIR/$dir"
  log "Initializing Terraform in $dir..."
  terraform init -reconfigure -input=false > /dev/null

  log "Planning $dir..."
  terraform plan -detailed-exitcode -input=false -out=tfplan 2>&1
  return $?
}

# Applies only if plan detected changes
tf_apply_if_needed() {
  local dir="$1"
  local step="$2"

  cd "$SCRIPT_DIR/$dir"

  set +e
  tf_plan "$dir"
  local plan_exit=$?
  set -e

  case $plan_exit in
    0)
      log "✅ $step — already up to date, skipping apply."
      rm -f tfplan
      ;;
    2)
      log "🔄 $step — changes detected, applying..."
      terraform apply -auto-approve -input=false tfplan
      rm -f tfplan
      log "✅ $step — done."
      ;;
    *)
      rm -f tfplan
      error "$step — plan failed. Check errors above."
      ;;
  esac
}

# ============================================================
# PREREQUISITES CHECK
# ============================================================
check_prerequisites() {
  log "Checking prerequisites..."

  for cmd in terraform aws kubectl helm; do
    if ! command -v "$cmd" &>/dev/null; then
      error "'$cmd' is not installed or not in PATH."
    fi
  done

  # Check AWS credentials
  if ! aws sts get-caller-identity &>/dev/null; then
    error "AWS credentials not configured. Run 'aws configure' first."
  fi

  local account
  account=$(aws sts get-caller-identity --query Account --output text)
  log "AWS Account: $account | Region: $AWS_REGION"
  log "Prerequisites OK."
}

# ============================================================
# STEPS
# ============================================================

step_vpc() {
  echo
  echo "========================================"
  echo "STEP 1: VPC"
  echo "========================================"
  tf_apply_if_needed "01_VPC_terraform-manifests" "VPC"
}

step_eks() {
  echo
  echo "========================================"
  echo "STEP 2: EKS Cluster + Addons"
  echo "========================================"
  tf_apply_if_needed "02_EKS_terraform-manifests_with_addons" "EKS Cluster + Addons"
}

step_kubeconfig() {
  echo
  echo "========================================"
  echo "STEP 3: Configure kubectl"
  echo "========================================"

  # Check if cluster exists before configuring
  if ! aws eks describe-cluster --name "$CLUSTER_NAME" --region "$AWS_REGION" &>/dev/null; then
    warn "Cluster '$CLUSTER_NAME' not found, skipping kubectl config."
    return
  fi

  aws eks update-kubeconfig \
    --name "$CLUSTER_NAME" \
    --region "$AWS_REGION"

  log "✅ kubectl configured for cluster '$CLUSTER_NAME'."
}

step_verify() {
  echo
  echo "========================================"
  echo "STEP 4: Verify"
  echo "========================================"

  log "Cluster status:"
  aws eks describe-cluster \
    --name "$CLUSTER_NAME" \
    --query "cluster.{Status:status,Version:version,Endpoint:endpoint}" \
    --output table

  log "Nodes:"
  kubectl get nodes -o wide 2>/dev/null || warn "Could not list nodes."

  log "System pods:"
  kubectl get pods -n kube-system 2>/dev/null || warn "Could not list pods."
}

# ============================================================
# MAIN
# ============================================================
main() {
  echo "========================================"
  echo "  Retail Fenix — EKS Cluster Setup"
  echo "========================================"
  echo

  check_prerequisites
  step_vpc
  step_eks
  step_kubeconfig
  step_verify

  echo
  echo "========================================"
  echo -e "${GREEN}✅ Cluster ready!${NC}"
  echo "========================================"
  echo
  echo "Next steps:"
  echo "  kubectl get nodes"
  echo "  cd 04_LOW_COST_retailstore_HELM && ./03-v1.0.0-install-local-helm-charts.sh"
}

main
