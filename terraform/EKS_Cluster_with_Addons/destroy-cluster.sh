#!/bin/bash
# ============================================================
# Script: destroy-cluster.sh
# Purpose: Destroy FULL Retail Fenix stack in reverse order
#          App → OTel → Karpenter → EKS → VPC → (S3 optional)
# Usage:   ./destroy-cluster.sh
# ============================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CLUSTER_NAME="retail-dev-eksdemo1"
AWS_REGION="us-east-1"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'

log()    { echo -e "${GREEN}[INFO]${NC} $1"; }
warn()   { echo -e "${YELLOW}[WARN]${NC} $1"; }
error()  { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }
header() { echo ""; echo "============================================="; echo "  $1"; echo "============================================="; echo ""; }

# ============================================================
# TIMER HELPERS
# ============================================================
format_elapsed() {
  local seconds=$1
  printf "%02dm %02ds" $((seconds / 60)) $((seconds % 60))
}

STEP_TIMES=()
STEP_NAMES=()
TOTAL_START=$(date +%s)

record_step() {
  local name="$1"
  local start="$2"
  local end=$(date +%s)
  STEP_NAMES+=("$name")
  STEP_TIMES+=("$(format_elapsed $((end - start)))")
}

# ============================================================
# HELPERS
# ============================================================
cluster_exists() {
  aws eks describe-cluster --name "$CLUSTER_NAME" --region "$AWS_REGION" &>/dev/null
}

kubectl_connected() {
  kubectl get nodes &>/dev/null 2>&1
}

tf_destroy_if_exists() {
  local dir="$1"
  local step="$2"

  cd "$SCRIPT_DIR/$dir"

  log "Initializing Terraform in $dir..."
  terraform init -reconfigure -input=false > /dev/null

  set +e
  terraform plan -destroy -detailed-exitcode -input=false -out=tfplan > /dev/null 2>&1
  local plan_exit=$?
  set -e

  case $plan_exit in
    0)
      log "✅ $step — nothing to destroy, skipping."
      rm -f tfplan
      ;;
    2)
      log "Destroying $step..."
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

ensure_kubectl() {
  if ! kubectl_connected; then
    if cluster_exists; then
      log "Configuring kubectl..."
      aws eks update-kubeconfig --name "$CLUSTER_NAME" --region "$AWS_REGION" &>/dev/null
    fi
  fi
}

# ============================================================
# STEP 0: Confirm
# ============================================================
echo ""
echo "╔═════════════════════════════════════════════╗"
echo "║       Retail Fenix — Full Destroy           ║"
echo "║                                             ║"
echo "║   App → OTel → Karpenter → EKS → VPC       ║"
echo "╚═════════════════════════════════════════════╝"
echo ""
warn "This will DESTROY ALL resources: app, Karpenter, OpenTelemetry, EKS, VPC, and IAM roles."
echo ""
read -p "Are you sure? Type 'yes' to continue: " confirm
if [[ "$confirm" != "yes" ]]; then
  log "Aborted."
  exit 0
fi

# ============================================================
# STEP 1: Retail Fenix App (Helm)
# ============================================================
header "STEP 1/7 — Retail Fenix App (Helm)"
STEP_START=$(date +%s)

ensure_kubectl

if ! cluster_exists; then
  warn "Cluster not found, skipping app uninstall."
else
  APP_RELEASES=$(helm list --short 2>/dev/null | grep -E "^(ui|orders|checkout|carts|catalog)$" || true)
  if [[ -z "$APP_RELEASES" ]]; then
    log "No app Helm releases found."
  else
    log "Uninstalling app releases: $APP_RELEASES"
    for release in $APP_RELEASES; do
      helm uninstall "$release" --wait --timeout 3m 2>/dev/null || warn "Could not uninstall $release, may already be gone."
    done
    log "✅ App releases uninstalled."
  fi

  # Wait for ALBs/NLBs created by LBC to be gone (they block subnet deletion)
  log "Waiting for Load Balancers to be released..."
  retries=0
  while [[ $retries -lt 18 ]]; do
    lbs=$(aws elbv2 describe-load-balancers \
      --query "LoadBalancers[?contains(LoadBalancerName,'k8s')].LoadBalancerArn" \
      --output text 2>/dev/null || echo "")
    if [[ -z "$lbs" ]]; then
      log "✅ No pending Load Balancers."
      break
    fi
    warn "Load Balancers still exist, waiting 10s... ($retries/18)"
    sleep 10
    retries=$((retries + 1))
  done
fi

record_step "App (Helm)" "$STEP_START"

# ============================================================
# STEP 2: OpenTelemetry k8s CRs
# ============================================================
header "STEP 2/7 — OpenTelemetry CRs (kubectl)"
STEP_START=$(date +%s)

TRACES_DIR="${SCRIPT_DIR}/07_OpenTelemetry_Traces/01_OpenTelemetry_Traces"

if ! cluster_exists; then
  warn "Cluster not found, skipping OTel CRs cleanup."
elif [[ ! -d "$TRACES_DIR" ]]; then
  warn "OTel manifests directory not found, skipping."
else
  ensure_kubectl
  log "Deleting Instrumentation CR..."
  kubectl delete -f "${TRACES_DIR}/02_adot_instrumentation_traces.yaml" --ignore-not-found=true
  log "Deleting OpenTelemetryCollector CR..."
  kubectl delete -f "${TRACES_DIR}/01_adot_collector_traces.yaml" --ignore-not-found=true
  log "✅ OTel CRs deleted."
fi

record_step "OTel CRs" "$STEP_START"

# ============================================================
# STEP 3: Karpenter k8s manifests (NodePools + EC2NodeClass)
# ============================================================
header "STEP 3/7 — Karpenter NodePools + EC2NodeClass (kubectl)"
STEP_START=$(date +%s)

KARPENTER_K8S_DIR="${SCRIPT_DIR}/04_KARPENTER_k8s-manifests"

if ! cluster_exists; then
  warn "Cluster not found, skipping Karpenter k8s cleanup."
else
  ensure_kubectl
  log "Deleting NodePools..."
  kubectl delete -f "${KARPENTER_K8S_DIR}/03_nodepool_spot.yaml"     --ignore-not-found=true || true
  kubectl delete -f "${KARPENTER_K8S_DIR}/02_nodepool_ondemand.yaml" --ignore-not-found=true || true

  # Wait up to 2 minutes for Karpenter-managed nodes to drain
  log "Waiting for Karpenter nodes to drain (max 2m)..."
  retries=0
  while [[ $retries -lt 12 ]]; do
    karp_nodes=$(kubectl get nodes -l karpenter.sh/nodepool &>/dev/null 2>&1 | grep -v "No resources" | grep -v "NAME" || true)
    if [[ -z "$karp_nodes" ]]; then
      log "✅ Karpenter nodes drained."
      break
    fi
    warn "Karpenter nodes still present, waiting 10s... ($retries/12)"
    sleep 10
    retries=$((retries + 1))
  done

  log "Deleting EC2NodeClass..."
  kubectl delete -f "${KARPENTER_K8S_DIR}/01_ec2nodeclass.yaml" --ignore-not-found=true || true
  log "✅ Karpenter k8s manifests deleted."
fi

record_step "Karpenter k8s" "$STEP_START"

# ============================================================
# STEP 4: OpenTelemetry Terraform
# ============================================================
header "STEP 4/7 — OpenTelemetry (Terraform)"
STEP_START=$(date +%s)

tf_destroy_if_exists "06_OPENTELEMTRY_terraform-manifests" "OpenTelemetry"

record_step "OpenTelemetry (TF)" "$STEP_START"

# ============================================================
# STEP 5: Karpenter Terraform
# ============================================================
header "STEP 5/7 — Karpenter (Terraform)"
STEP_START=$(date +%s)

tf_destroy_if_exists "03_KARPENTER_terraform-manifests" "Karpenter"

record_step "Karpenter (TF)" "$STEP_START"

# ============================================================
# STEP 6: EKS Cluster + Addons
# ============================================================
header "STEP 6/7 — EKS Cluster + Addons (Terraform)"
STEP_START=$(date +%s)

tf_destroy_if_exists "02_EKS_terraform-manifests_with_addons" "EKS Cluster + Addons"

record_step "EKS (TF)" "$STEP_START"

# ============================================================
# STEP 7: VPC
# ============================================================
header "STEP 7/7 — VPC (Terraform)"
STEP_START=$(date +%s)

tf_destroy_if_exists "01_VPC_terraform-manifests" "VPC"

record_step "VPC (TF)" "$STEP_START"

# ============================================================
# S3 BACKEND (optional — skipped by default)
# ============================================================
echo ""
echo "============================================="
warn "S3 Terraform backend was NOT destroyed."
warn "It holds all Terraform state files."
warn "To destroy it manually:"
echo -e "  ${CYAN}cd ${SCRIPT_DIR}/00_S3_terraform-manifests${NC}"
echo -e "  ${CYAN}terraform destroy -auto-approve${NC}"
echo "============================================="

# ============================================================
# VERIFY
# ============================================================
echo ""
echo "============================================="
echo "  Verification"
echo "============================================="
echo ""

issues=0

if cluster_exists; then
  warn "EKS cluster still exists!"
  issues=$((issues + 1))
else
  log "✅ EKS cluster: deleted"
fi

vpcs=$(aws ec2 describe-vpcs \
  --filters "Name=tag:Name,Values=*retail*" \
  --query "Vpcs[].VpcId" --output text 2>/dev/null || echo "")
if [[ -n "$vpcs" ]]; then
  warn "VPC still exists: $vpcs"
  issues=$((issues + 1))
else
  log "✅ VPC: deleted"
fi

roles=$(aws iam list-roles \
  --query "Roles[?contains(RoleName,'retail-dev')].RoleName" \
  --output text 2>/dev/null || echo "")
if [[ -n "$roles" ]]; then
  warn "IAM roles still exist: $roles"
  issues=$((issues + 1))
else
  log "✅ IAM roles: deleted"
fi

# ============================================================
# SUMMARY
# ============================================================
TOTAL_END=$(date +%s)
TOTAL_ELAPSED=$(format_elapsed $((TOTAL_END - TOTAL_START)))

echo ""
echo "╔═════════════════════════════════════════════╗"
echo "║            Destroy Summary                  ║"
echo "╠═════════════════════════════════════════════╣"
for i in "${!STEP_NAMES[@]}"; do
  printf "║  🗑️   %-28s %8s  ║\n" "${STEP_NAMES[$i]}" "${STEP_TIMES[$i]}"
done
echo "╠═════════════════════════════════════════════╣"
printf "║  ⏱   %-28s %8s  ║\n" "Total time" "$TOTAL_ELAPSED"
echo "╚═════════════════════════════════════════════╝"
echo ""

if [[ $issues -eq 0 ]]; then
  echo -e "${GREEN}✅ All resources destroyed successfully.${NC}"
else
  warn "$issues resource(s) may still exist. Check the AWS console."
fi
echo ""
