#!/bin/bash
# destroy-cluster.sh
# Destroys EKS Cluster + Addons and VPC in the correct order
# Idempotent: skips steps where resources don't exist
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

log()   { echo -e "${GREEN}[INFO]${NC} $1"; }
warn()  { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

# ============================================================
# HELPERS
# ============================================================

cluster_exists() {
  aws eks describe-cluster --name "$CLUSTER_NAME" --region "$AWS_REGION" &>/dev/null
}

tf_destroy_if_exists() {
  local dir="$1"
  local step="$2"

  cd "$SCRIPT_DIR/$dir"

  log "Initializing Terraform in $dir..."
  terraform init -reconfigure -input=false > /dev/null

  # Check if there's anything to destroy
  set +e
  terraform plan -destroy -detailed-exitcode -input=false -out=tfplan 2>&1
  local plan_exit=$?
  set -e

  case $plan_exit in
    0)
      log "✅ $step — nothing to destroy, skipping."
      rm -f tfplan
      ;;
    2)
      log "🗑️  $step — destroying..."
      terraform destroy -auto-approve -input=false
      rm -f tfplan
      log "✅ $step — destroyed."
      ;;
    *)
      rm -f tfplan
      warn "$step — plan failed. Resources may already be gone or state is inconsistent."
      ;;
  esac
}

# ============================================================
# STEPS
# ============================================================

step_confirm() {
  echo
  warn "This will DESTROY all resources: EKS cluster, node groups, VPC, subnets, and IAM roles."
  read -p "Are you sure? Type 'yes' to continue: " confirm
  if [[ "$confirm" != "yes" ]]; then
    log "Aborted."
    exit 0
  fi
}

step_helm_cleanup() {
  echo
  echo "========================================"
  echo "STEP 1: Uninstall Helm releases"
  echo "========================================"

  if ! cluster_exists; then
    warn "Cluster not found, skipping Helm cleanup."
    return
  fi

  # Configure kubectl
  aws eks update-kubeconfig --name "$CLUSTER_NAME" --region "$AWS_REGION" &>/dev/null || true

  # Uninstall app releases — prevents LBC from creating ALBs that block subnet deletion
  local releases
  releases=$(helm list --short 2>/dev/null || echo "")

  if [[ -z "$releases" ]]; then
    log "No Helm releases found."
  else
    log "Uninstalling: $releases"
    helm uninstall $releases --wait --timeout 3m 2>/dev/null || true
    log "✅ Helm releases uninstalled."
  fi

  # Wait for Load Balancers created by LBC to be deleted (prevents ENI dependency errors)
  log "Waiting for Load Balancers to be deleted..."
  local retries=0
  while [[ $retries -lt 12 ]]; do
    local lbs
    lbs=$(aws elbv2 describe-load-balancers \
      --query "LoadBalancers[?contains(LoadBalancerName,'k8s')].LoadBalancerArn" \
      --output text 2>/dev/null || echo "")
    if [[ -z "$lbs" ]]; then
      log "✅ No Load Balancers pending deletion."
      break
    fi
    warn "Load Balancers still exist, waiting 10s... ($retries/12)"
    sleep 10
    retries=$((retries + 1))
  done
}

step_eks() {
  echo
  echo "========================================"
  echo "STEP 2: Destroy EKS Cluster + Addons"
  echo "========================================"
  tf_destroy_if_exists "02_EKS_terraform-manifests_with_addons" "EKS Cluster + Addons"
}

step_vpc() {
  echo
  echo "========================================"
  echo "STEP 3: Destroy VPC"
  echo "========================================"
  tf_destroy_if_exists "01_VPC_terraform-manifests" "VPC"
}

step_verify() {
  echo
  echo "========================================"
  echo "STEP 4: Verify cleanup"
  echo "========================================"

  local issues=0

  # Check cluster
  if cluster_exists; then
    warn "EKS cluster still exists!"
    issues=$((issues + 1))
  else
    log "✅ EKS cluster: deleted"
  fi

  # Check VPC
  local vpcs
  vpcs=$(aws ec2 describe-vpcs \
    --filters "Name=tag:Name,Values=*retail*" \
    --query "Vpcs[].VpcId" --output text 2>/dev/null || echo "")
  if [[ -n "$vpcs" ]]; then
    warn "VPC still exists: $vpcs"
    issues=$((issues + 1))
  else
    log "✅ VPC: deleted"
  fi

  # Check IAM roles
  local roles
  roles=$(aws iam list-roles \
    --query "Roles[?contains(RoleName,'retail-dev')].RoleName" \
    --output text 2>/dev/null || echo "")
  if [[ -n "$roles" ]]; then
    warn "IAM roles still exist: $roles"
    issues=$((issues + 1))
  else
    log "✅ IAM roles: deleted"
  fi

  if [[ $issues -eq 0 ]]; then
    echo
    echo "========================================"
    echo -e "${GREEN}✅ All resources destroyed successfully!${NC}"
    echo "========================================"
  else
    echo
    warn "$issues resource(s) may still exist. Check AWS console."
  fi
}

# ============================================================
# MAIN
# ============================================================
main() {
  echo "========================================"
  echo "  Retail Fenix — Destroy Cluster"
  echo "========================================"

  step_confirm
  step_helm_cleanup
  step_eks
  step_vpc
  step_verify
}

main
