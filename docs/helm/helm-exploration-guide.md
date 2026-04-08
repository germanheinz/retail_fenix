# Helm Exploration Guide — Retail Fenix
> All Helm capabilities applied to the retail_fenix project.
> Based on demos 12-01 to 12-05 from the course.

---

## 1. Helm Basics (12-01)

### Install a chart from ECR Public (OCI)
```powershell
# Login (Windows - use docker login due to pipe bug in Windows)
$token = & "C:\Program Files\Amazon\AWSCLIV2\aws.exe" ecr-public get-login-password --region us-east-1
docker login public.ecr.aws --username AWS --password $token

# Install catalog chart from ECR Public
helm install catalog oci://public.ecr.aws/i5b4r2o0/retail-fenix/catalog --version 1.0.0
```

### List releases
```bash
helm list
helm ls

# YAML or JSON output
helm list --output=yaml
helm list --output=json

# Specific namespace
helm list -n default
```

### Verify K8s resources created
```bash
kubectl get pods
kubectl get svc

# Port-forward to access locally
kubectl port-forward svc/catalog 8080:8080
# http://localhost:8080/health
```

### Upgrade a release
```bash
# Upgrade to a new chart version
helm upgrade catalog oci://public.ecr.aws/i5b4r2o0/retail-fenix/catalog --version 1.1.0

# Check revision history
helm history catalog

# Watch pods during rollout
kubectl get pods -w
```

### Inspect release values and manifests
```bash
# Only overridden values
helm get values catalog

# All values (defaults + overrides)
helm get values catalog --all

# Applied K8s manifests
helm get manifest catalog
```

### Rollback
```bash
# Show release history
helm history catalog

# Rollback to previous revision
helm rollback catalog

# Rollback to specific revision
helm rollback catalog 1

# Preview without applying
helm rollback catalog 1 --dry-run

# Verify
helm list
helm history catalog
kubectl get pods -w
```

### Uninstall
```bash
helm list
helm uninstall catalog
```

---

## 2. Custom Values (12-02)

### Values precedence (highest to lowest)
1. `--set key=value` (highest priority)
2. `-f values-file.yaml` (last file wins for the same key)
3. Chart's default `values.yaml`

### View chart default values
```bash
# From ECR (without downloading)
helm show values oci://public.ecr.aws/i5b4r2o0/retail-fenix/catalog --version 1.0.0

# From local copy
cat C:\Users\ESE564242\dev\devops\retail_fenix\helm\catalog\values.yaml
```

### Install with a custom values file
```bash
cd C:\Users\ESE564242\dev\devops\retail_fenix\helm

# Install with custom values
helm install catalog ./catalog -f my-custom-values.yaml

# Dry-run preview
helm install catalog ./catalog -f my-custom-values.yaml --dry-run --debug
```

### Override with --set (quick one-off changes)
```bash
# Change image tag
helm upgrade catalog ./catalog --set image.tag=1.1.0

# Change replica count
helm upgrade catalog ./catalog --set replicaCount=3

# Multiple values at once
helm upgrade catalog ./catalog --set image.tag=1.1.0 --set replicaCount=2
```

### Reuse previous values
```bash
# Keeps previous release values + applies new ones
helm upgrade catalog ./catalog --reuse-values --set image.tag=1.1.0
```

### Pods not restarting after ConfigMap/env change
```bash
kubectl rollout restart deployment/catalog
```

### Install with ALB Ingress (for UI)
Create `values-ui-ingress.yaml`:
```yaml
ingress:
  enabled: true
  className: alb
  annotations:
    alb.ingress.kubernetes.io/scheme: internet-facing
    alb.ingress.kubernetes.io/target-type: ip
    alb.ingress.kubernetes.io/healthcheck-path: /api/health
  tls: []
  hosts: []
```

```bash
helm install ui ./ui -f values-ui-ingress.yaml

# Get ALB DNS name (takes 2-6 min to provision)
kubectl get ingress ui
# Access: http://<ALB-DNS>
```

---

## 3. Explore Charts (12-03)

### Download and explore an OCI chart
```bash
mkdir -p charts && cd charts

# Download and unpack the chart
helm pull oci://public.ecr.aws/i5b4r2o0/retail-fenix/catalog \
  --version 1.0.0 \
  --untar

ls -la
```

### Inspect chart metadata
```bash
# Chart metadata (Chart.yaml)
helm show chart oci://public.ecr.aws/i5b4r2o0/retail-fenix/catalog --version 1.0.0

# Default values
helm show values oci://public.ecr.aws/i5b4r2o0/retail-fenix/catalog --version 1.0.0

# README (if exists)
helm show readme oci://public.ecr.aws/i5b4r2o0/retail-fenix/catalog --version 1.0.0
```

### Lint — validate the chart
```bash
cd C:\Users\ESE564242\dev\devops\retail_fenix\helm

helm lint catalog
helm lint cart
helm lint checkout
helm lint orders
helm lint ui
```

### Template — render YAML without installing
```bash
cd C:\Users\ESE564242\dev\devops\retail_fenix\helm

# Render with default values
helm template catalog ./catalog

# Render with custom values
helm template catalog ./catalog -f my-values.yaml

# With debug output
helm template catalog ./catalog --debug

# Search for a specific value in output (Git Bash)
helm template catalog ./catalog | grep -i image

# Windows PowerShell
helm template catalog ./catalog | Select-String "image"
```

### Install from local source (to test changes)
```bash
cd C:\Users\ESE564242\dev\devops\retail_fenix\helm

# Use a different release name to avoid overwriting production
helm install catalog-local ./catalog

# Check resources
helm status catalog-local --show-resources
kubectl get pods,svc
```

### Helm Test
```bash
# Run chart tests (templates/tests/test-connection.yaml)
helm test catalog-local

# Uninstall after testing
helm uninstall catalog-local
```

---

## 4. Package & Publish (12-04)

### Release Info ConfigMap (advanced feature)
Add to `templates/release-info.yaml` in any chart:
```yaml
{{- if .Values.releaseInfo.enabled }}
apiVersion: v1
kind: ConfigMap
metadata:
  name: {{ include "retail-fenix.fullname" . }}-release-info
  labels:
    {{- include "retail-fenix.labels" . | nindent 4 }}
data:
  chartName: "{{ .Chart.Name }}"
  chartVersion: "{{ .Chart.Version }}"
  appVersion: "{{ .Chart.AppVersion }}"
  releaseName: "{{ .Release.Name }}"
  releaseNamespace: "{{ .Release.Namespace }}"
  releaseRevision: "{{ .Release.Revision }}"
  releaseTime: "{{ now | date "2006-01-02T15:04:05Z07:00" }}"
{{- end }}
```

Add to `values.yaml`:
```yaml
releaseInfo:
  enabled: false
```

Enable at install time:
```bash
helm install catalog ./catalog --set releaseInfo.enabled=true

# Verify the ConfigMap
kubectl get cm
kubectl get cm catalog-release-info -o yaml
kubectl describe cm catalog-release-info
```

### Image tag fallback to Chart.Version
If the deployment template has:
```yaml
image: "{{ .Values.image.repository }}:{{ .Values.image.tag | default .Chart.Version }}"
```
When `image.tag` is not set, Helm falls back to `Chart.Version`. Always be explicit:
```yaml
image:
  repository: public.ecr.aws/i5b4r2o0/retail-fenix/catalog
  tag: "1.0.0"
```

### Package all charts
```bash
cd C:\Users\ESE564242\dev\devops\retail_fenix\helm

helm package catalog    # → catalog-1.0.0.tgz
helm package cart       # → cart-1.0.0.tgz
helm package checkout   # → checkout-1.0.0.tgz
helm package orders     # → orders-1.0.0.tgz
helm package ui         # → ui-1.0.0.tgz
```

### Push to ECR Public (Windows)
```powershell
# Login — use docker login due to Windows pipe bug with helm registry login
$token = & "C:\Program Files\Amazon\AWSCLIV2\aws.exe" ecr-public get-login-password --region us-east-1
docker login public.ecr.aws --username AWS --password $token

# Push all charts
helm push catalog-1.0.0.tgz  oci://public.ecr.aws/i5b4r2o0/retail-fenix
helm push cart-1.0.0.tgz     oci://public.ecr.aws/i5b4r2o0/retail-fenix
helm push checkout-1.0.0.tgz oci://public.ecr.aws/i5b4r2o0/retail-fenix
helm push orders-1.0.0.tgz   oci://public.ecr.aws/i5b4r2o0/retail-fenix
helm push ui-1.0.0.tgz       oci://public.ecr.aws/i5b4r2o0/retail-fenix

# Verify
aws ecr-public describe-image-tags --repository-name retail-fenix/catalog --region us-east-1
```

### Push to ECR Private
```bash
REGION=us-east-1
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
REGISTRY="${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com"

aws ecr get-login-password --region "$REGION" \
  | helm registry login -u AWS --password-stdin "$REGISTRY"

helm push catalog-1.0.0.tgz oci://"$REGISTRY"
```

### Install directly from ECR
```bash
# From ECR Public
helm install catalog \
  oci://public.ecr.aws/i5b4r2o0/retail-fenix/catalog \
  --version 1.0.0

# Upgrade from ECR Public
helm upgrade --install catalog \
  oci://public.ecr.aws/i5b4r2o0/retail-fenix/catalog \
  --version 1.0.0
```

---

## 5. Full Deploy — All Services (12-05)

### Install in order (catalog first, ui last)
```bash
cd C:\Users\ESE564242\dev\devops\retail_fenix\helm

helm install catalog  oci://public.ecr.aws/i5b4r2o0/retail-fenix/catalog  --version 1.0.0
helm install cart     oci://public.ecr.aws/i5b4r2o0/retail-fenix/cart     --version 1.0.0
helm install checkout oci://public.ecr.aws/i5b4r2o0/retail-fenix/checkout --version 1.0.0
helm install orders   oci://public.ecr.aws/i5b4r2o0/retail-fenix/orders   --version 1.0.0
helm install ui       oci://public.ecr.aws/i5b4r2o0/retail-fenix/ui       --version 1.0.0
```

### Verify everything
```bash
helm list

kubectl get pods
kubectl get svc
kubectl get ingress

helm status ui       --show-resources
helm status catalog  --show-resources
helm status cart     --show-resources
helm status checkout --show-resources
helm status orders   --show-resources
```

### View logs per service
```bash
# By deployment
kubectl logs -f deploy/catalog
kubectl logs -f deploy/cart
kubectl logs -f deploy/checkout
kubectl logs -f deploy/orders
kubectl logs -f deploy/ui

# By release label (last 200 lines)
kubectl logs -l app.kubernetes.io/instance=catalog -f --tail=200
kubectl logs -l app.kubernetes.io/instance=cart    -f --tail=200
kubectl logs -l app.kubernetes.io/instance=ui      -f --tail=200
```

### Increase log level at runtime (no redeploy needed)
```bash
# Increase log level
kubectl set env deployment/cart LOGGING_LEVEL_ROOT=DEBUG
kubectl rollout status deployment/cart
kubectl logs -l app.kubernetes.io/instance=cart -f --tail=200

# Restore
kubectl set env deployment/cart LOGGING_LEVEL_ROOT=INFO
kubectl rollout status deployment/cart
```

### Uninstall everything
```bash
helm uninstall ui orders checkout cart catalog
```

---

## 6. General Cheat Sheet

```bash
# --- INSPECTION ---
helm show chart   oci://...    # chart metadata
helm show values  oci://...    # default values
helm show readme  oci://...    # chart README

# --- LOCAL VALIDATION ---
helm lint <chart-dir>
helm template <release> <chart-dir>
helm template <release> <chart-dir> --debug
helm install <release> <chart-dir> --dry-run --debug

# --- RELEASE MANAGEMENT ---
helm install   <release> <chart> -f values.yaml
helm upgrade   <release> <chart> -f values.yaml
helm upgrade --install <release> <chart>        # install if not exists
helm rollback  <release> [revision]
helm uninstall <release>

# --- RELEASE INSPECTION ---
helm list
helm history    <release>
helm status     <release> --show-resources
helm get values <release> --all
helm get manifest <release>

# --- TEST ---
helm test <release>

# --- PACKAGING ---
helm package <chart-dir>
helm push    <chart.tgz> oci://<registry>
helm pull    oci://<registry>/<chart> --version x.x.x --untar
```
