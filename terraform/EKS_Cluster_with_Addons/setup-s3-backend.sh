#!/bin/bash
# ============================================================
# Script: setup-s3-backend.sh
# Purpose: Create S3 bucket via Terraform and update all
#          backend references across the project
# Usage:   ./setup-s3-backend.sh
# ============================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
S3_MODULE="${SCRIPT_DIR}/00_S3_terraform-manifests"

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
echo "  Retail Fenix — S3 Terraform Backend Setup"
echo "============================================="
echo ""

# ============================================================
# STEP 1: Prerequisites
# ============================================================
echo "============================================="
echo "STEP 1: Checking prerequisites..."
echo "============================================="
echo ""

for cmd in terraform aws; do
  if ! command -v "$cmd" &>/dev/null; then
    error "'$cmd' not found. Please install it before continuing."
  fi
done

if ! aws sts get-caller-identity &>/dev/null; then
  error "AWS credentials not configured. Run 'aws configure' first."
fi

ACCOUNT=$(aws sts get-caller-identity --query Account --output text)
REGION="us-east-1"
log "AWS Account: ${ACCOUNT} | Region: ${REGION}"
echo ""

# ============================================================
# STEP 2: Create S3 bucket via Terraform
# ============================================================
echo "============================================="
echo "STEP 2: Creating S3 bucket via Terraform..."
echo "============================================="
echo ""

cd "${S3_MODULE}"

log "Initializing Terraform..."
terraform init -reconfigure -input=false > /dev/null

log "Applying S3 module..."
terraform apply -auto-approve -input=false

echo ""

# ============================================================
# STEP 3: Extract the created bucket name
# ============================================================
echo "============================================="
echo "STEP 3: Reading bucket name from state..."
echo "============================================="
echo ""

BUCKET_NAME=$(aws s3api list-buckets \
  --query "Buckets[?starts_with(Name,'tfstate-dev-us-east-1-')].Name" \
  --output text 2>/dev/null | tr '\t' '\n' | head -1)

if [ -z "$BUCKET_NAME" ]; then
  error "Could not find the created bucket. Check AWS console."
fi

log "Bucket found: ${CYAN}${BUCKET_NAME}${NC}"
echo ""

# ============================================================
# STEP 4: Find all files with old bucket references
# ============================================================
echo "============================================="
echo "STEP 4: Finding files to update..."
echo "============================================="
echo ""

cd "${SCRIPT_DIR}"

# Collect all files containing any tfstate-dev-us-east-1-* bucket reference
FILES=$(grep -rl 'tfstate-dev-us-east-1-' "${SCRIPT_DIR}" \
  --include="*.tf" --include="*.md" 2>/dev/null \
  | grep -v "\.terraform/" \
  | grep -v "\.tfstate" || true)

if [ -z "$FILES" ]; then
  warn "No files found with old bucket references — may already be up to date."
  echo ""
else
  FILE_COUNT=$(echo "$FILES" | wc -l | tr -d ' ')
  echo -e "Found ${YELLOW}${FILE_COUNT}${NC} file(s) to update:"
  echo ""
  echo "$FILES"
  echo ""
fi

# ============================================================
# STEP 5: Replace old bucket name with new one
# ============================================================
echo "============================================="
echo "STEP 5: Updating references..."
echo "============================================="
echo ""

if [ -n "$FILES" ]; then
  for file in $FILES; do
    # Replace any tfstate-dev-us-east-1-XXXXXX with the new bucket name
    if [[ "$OSTYPE" == "darwin"* ]]; then
      sed -i '' "s|tfstate-dev-us-east-1-[a-z0-9]*|${BUCKET_NAME}|g" "$file"
    else
      sed -i "s|tfstate-dev-us-east-1-[a-z0-9]*|${BUCKET_NAME}|g" "$file"
    fi
    echo -e "  ${GREEN}✓${NC} Updated: $file"
  done
fi

echo ""

# ============================================================
# STEP 6: Verify
# ============================================================
echo "============================================="
echo "STEP 6: Verifying..."
echo "============================================="
echo ""

# Check no old patterns remain (other than the new one itself)
OLD_REFS=$(grep -rl 'tfstate-dev-us-east-1-' "${SCRIPT_DIR}" \
  --include="*.tf" --include="*.md" 2>/dev/null \
  | grep -v "\.terraform/" \
  | grep -v "\.tfstate" \
  | xargs grep -l "tfstate-dev-us-east-1-" 2>/dev/null \
  | xargs grep -v "${BUCKET_NAME}" 2>/dev/null || true)

if [ -z "$OLD_REFS" ]; then
  log "All references updated to: ${CYAN}${BUCKET_NAME}${NC}"
else
  warn "Some files may still contain stale references:"
  echo "$OLD_REFS"
fi

echo ""
echo "============================================="
echo -e "  ${GREEN}✅ S3 Backend ready!${NC}"
echo "============================================="
echo ""
echo "  Bucket: ${CYAN}${BUCKET_NAME}${NC}"
echo ""
echo "  Next step:"
echo -e "  ${CYAN}bash create-cluster.sh${NC}"
echo ""
