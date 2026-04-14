#!/bin/bash
# ============================================================
# Script: deploy-all.sh
# Purpose: Full Retail Fenix deployment from scratch
#          S3 → VPC → EKS → Karpenter → OpenTelemetry → App
# Usage:   ./deploy-all.sh
# ============================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

log()     { echo -e "${GREEN}[INFO]${NC} $1"; }
warn()    { echo -e "${YELLOW}[WARN]${NC} $1"; }
error()   { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }
header()  { echo ""; echo "============================================="; echo "  $1"; echo "============================================="; echo ""; }

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
# BANNER
# ============================================================
echo ""
echo "╔═════════════════════════════════════════════╗"
echo "║       Retail Fenix — Full Deployment        ║"
echo "║                                             ║"
echo "║   S3 → VPC+EKS → Karpenter → OTel → App    ║"
echo "╚═════════════════════════════════════════════╝"
echo ""

# ============================================================
# CONFIRM
# ============================================================
warn "This will deploy the FULL stack to AWS (incurs costs)."
echo ""
read -p "Continue? Type 'yes' to proceed: " confirm
if [[ "$confirm" != "yes" ]]; then
  log "Aborted."
  exit 0
fi

# ============================================================
# PREREQUISITES CHECK
# ============================================================
header "Checking prerequisites..."

for cmd in terraform aws kubectl helm docker; do
  if ! command -v "$cmd" &>/dev/null; then
    error "'$cmd' not found. Please install it before continuing."
  fi
  log "  ✓ $cmd"
done

if ! aws sts get-caller-identity &>/dev/null; then
  error "AWS credentials not configured. Run 'aws configure' first."
fi

ACCOUNT=$(aws sts get-caller-identity --query Account --output text)
log "  ✓ AWS Account: ${ACCOUNT}"
echo ""

# ============================================================
# STEP 1: S3 Backend
# ============================================================
header "STEP 1/5 — S3 Terraform Backend"
STEP_START=$(date +%s)

bash "${SCRIPT_DIR}/setup-s3-backend.sh"

record_step "S3 Backend" "$STEP_START"
log "✅ S3 done."

# ============================================================
# STEP 2: VPC + EKS
# ============================================================
header "STEP 2/5 — VPC + EKS Cluster + Addons"
STEP_START=$(date +%s)

bash "${SCRIPT_DIR}/create-cluster.sh"

record_step "VPC + EKS" "$STEP_START"
log "✅ Cluster done."

# ============================================================
# STEP 3: Karpenter
# ============================================================
header "STEP 3/5 — Karpenter"
STEP_START=$(date +%s)

bash "${SCRIPT_DIR}/setup-karpenter.sh"

record_step "Karpenter" "$STEP_START"
log "✅ Karpenter done."

# ============================================================
# STEP 4: OpenTelemetry
# ============================================================
header "STEP 4/5 — OpenTelemetry"
STEP_START=$(date +%s)

bash "${SCRIPT_DIR}/setup-opentelemetry.sh"

record_step "OpenTelemetry" "$STEP_START"
log "✅ OpenTelemetry done."

# ============================================================
# STEP 5: Retail Fenix App
# ============================================================
header "STEP 5/5 — Retail Fenix Application"
STEP_START=$(date +%s)

bash "${SCRIPT_DIR}/05_RETAIL_FENIX/02-install-retail-fenix.sh"

record_step "Retail Fenix App" "$STEP_START"
log "✅ Application installed."

# ============================================================
# SUMMARY
# ============================================================
TOTAL_END=$(date +%s)
TOTAL_ELAPSED=$(format_elapsed $((TOTAL_END - TOTAL_START)))

echo ""
echo "╔═════════════════════════════════════════════╗"
echo "║            Deployment Summary               ║"
echo "╠═════════════════════════════════════════════╣"
for i in "${!STEP_NAMES[@]}"; do
  printf "║  ✅  %-28s %8s  ║\n" "${STEP_NAMES[$i]}" "${STEP_TIMES[$i]}"
done
echo "╠═════════════════════════════════════════════╣"
printf "║  ⏱   %-28s %8s  ║\n" "Total time" "$TOTAL_ELAPSED"
echo "╚═════════════════════════════════════════════╝"
echo ""

# ============================================================
# FINAL INFO
# ============================================================
echo "  Access the application:"
echo ""
kubectl get ingress 2>/dev/null || warn "Could not retrieve ingress."
echo ""
echo "  Observe traces:"
echo -e "  ${CYAN}AWS Console → X-Ray → Service Map${NC}"
echo ""
echo "  Destroy everything when done:"
echo -e "  ${CYAN}bash destroy-cluster.sh${NC}"
echo ""
