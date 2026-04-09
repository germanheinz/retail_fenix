# **12-01: Horizontal Pod Autoscaler (HPA) on EKS with Helm and Terraform**

---

## **Step-01 – Learning Objectives**

By the end of this section, you will be able to:

1. Understand what **HPA** is and why it is needed in production.
2. Identify the **3 required components** for HPA to work on EKS.
3. Install **Metrics Server** on EKS using Terraform + Helm.
4. Add an **HPA template** to a Helm chart.
5. Configure `resources.requests.cpu` correctly so HPA can calculate utilization.
6. Enable and verify HPA for any Retail Fenix microservice.

---

## **Step-02 – What is HPA and Why?**

**Horizontal Pod Autoscaler (HPA)** is a Kubernetes controller that automatically adjusts the number of Pod replicas in a Deployment based on observed resource utilization (CPU, memory, or custom metrics).

### Without HPA
```
Traffic spike → Pods overloaded → Slow responses or crashes
Traffic drop  → Pods idle       → Wasted compute costs
```

### With HPA
```
Traffic spike → CPU > threshold → HPA adds Pods  → load distributed
Traffic drop  → CPU < threshold → HPA removes Pods → costs reduced
```

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    HPA Flow on EKS                          │
│                                                             │
│  Pods (running in nodes)                                    │
│    │                                                        │
│    │ kubelet exposes CPU/RAM stats                          │
│    ▼                                                        │
│  metrics-server  ──────────────────────── kube-system       │
│    │  aggregates metrics every 15s                          │
│    │  exposes /apis/metrics.k8s.io                          │
│    ▼                                                        │
│  HPA Controller  (built into kube-controller-manager)       │
│    │  reads metrics every 15s (default)                     │
│    │                                                        │
│    ├── actual CPU / requests.cpu > threshold → scale UP     │
│    └── actual CPU / requests.cpu < threshold → scale DOWN   │
│                                                             │
│  Deployment updates replicaCount automatically              │
└─────────────────────────────────────────────────────────────┘
```

---

## **Step-03 – Required Components**

HPA requires exactly **3 pieces** to work:

| Component | Purpose | Where defined |
|-----------|---------|---------------|
| `metrics-server` pod | Exposes the Kubernetes Metrics API | `terraform/.../c17-metrics-server-helm-install.tf` |
| `resources.requests.cpu` | Baseline for calculating CPU % utilization | `helm/*/values.yaml` |
| `HorizontalPodAutoscaler` manifest | Defines when and how to scale | `helm/*/templates/hpa.yaml` |

### How CPU utilization is calculated

```
% CPU = (actual CPU usage of pod) / (resources.requests.cpu) × 100

Example with cart service (requests.cpu = 256m):
  - Pod using 120m → 120/256 = 47%  → below 70% → no action
  - Pod using 185m → 185/256 = 72%  → above 70% → SCALE UP
```

> ⚠️ If `resources.requests.cpu` is not defined, HPA status will show `<unknown>` and will never scale.

---

## **Step-04 – Install Metrics Server via Terraform**

Metrics Server is installed as a Helm release inside `kube-system`, following the same pattern as other EKS addons in this project.

### **Step-04-01: Terraform file**

**File:** `terraform/EKS_Cluster_with_Addons/02_EKS_terraform-manifests_with_addons/c17-metrics-server-helm-install.tf`

```hcl
resource "helm_release" "metrics_server" {
  depends_on = [
    aws_eks_addon.podidentity,
    aws_eks_node_group.private_nodes
  ]

  name       = "metrics-server"
  repository = "https://kubernetes-sigs.github.io/metrics-server/"
  chart      = "metrics-server"
  namespace  = "kube-system"

  set = [
    {
      name  = "args[0]"
      value = "--kubelet-insecure-tls"
    },
  ]

  wait            = true
  timeout         = 300
  cleanup_on_fail = true
}
```

> **Note on `--kubelet-insecure-tls`:** EKS kubelets use self-signed certificates that Metrics Server cannot verify by default. This flag is required for Metrics Server to communicate with kubelets on EKS managed node groups.

### **Step-04-02: Apply**

```bash
cd terraform/EKS_Cluster_with_Addons/02_EKS_terraform-manifests_with_addons

terraform init
terraform plan
terraform apply
```

### **Step-04-03: Verify Metrics Server is running**

```bash
# Check the pod is Running in kube-system
kubectl get pods -n kube-system -l app.kubernetes.io/name=metrics-server

# Verify the Metrics API is available
kubectl get apiservices | grep metrics

# Test node-level metrics
kubectl top nodes

# Test pod-level metrics
kubectl top pods -A
```

Expected output for `kubectl top nodes`:
```
NAME                          CPU(cores)   CPU%   MEMORY(bytes)   MEMORY%
ip-10-0-1-45.ec2.internal     112m         5%     890Mi           23%
```

---

## **Step-05 – HPA Helm Template**

Each Retail Fenix microservice has an HPA template that is conditionally rendered based on `autoscaling.enabled`.

### **Step-05-01: Template structure**

**File:** `helm/{service}/templates/hpa.yaml`

```yaml
{{- if .Values.autoscaling.enabled }}
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: {{ include "retail-fenix.fullname" . }}
  labels:
    {{- include "retail-fenix.labels" . | nindent 4 }}
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: {{ include "retail-fenix.fullname" . }}   # must match Deployment name
  minReplicas: {{ .Values.autoscaling.minReplicas }}
  maxReplicas: {{ .Values.autoscaling.maxReplicas }}
  metrics:
    {{- if .Values.autoscaling.targetCPUUtilizationPercentage }}
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: {{ .Values.autoscaling.targetCPUUtilizationPercentage }}
    {{- end }}
    {{- if .Values.autoscaling.targetMemoryUtilizationPercentage }}
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: {{ .Values.autoscaling.targetMemoryUtilizationPercentage }}
    {{- end }}
{{- end }}
```

### **Step-05-02: How the HPA connects to the Deployment**

The `scaleTargetRef.name` uses the same Helm helper (`retail-fenix.fullname`) as the Deployment `metadata.name`. At runtime both resolve to the same string (e.g. `cart`), so Kubernetes can find the target:

```
HPA manifest → scaleTargetRef.name: "cart"
                        │
                        └── Kubernetes API → finds Deployment named "cart"
                                                    │
                                                    └── adjusts .spec.replicas
```

### **Step-05-03: Deployment replicas are controlled by HPA when enabled**

In `helm/{service}/templates/deployment.yaml`:

```yaml
spec:
  {{- if not .Values.autoscaling.enabled }}
  replicas: {{ .Values.replicaCount }}   # fixed replicas when HPA is OFF
  {{- end }}
                                          # HPA controls replicas when ON
```

---

## **Step-06 – Configure values.yaml**

### Default autoscaling configuration (all services)

```yaml
# Autoscaling is OFF by default — enable per environment
autoscaling:
  enabled: false
  minReplicas: 1
  maxReplicas: 3
  targetCPUUtilizationPercentage: 70
  # targetMemoryUtilizationPercentage: 80   # optional
```

### Resource requests — required for HPA to work

```yaml
resources:
  requests:
    cpu: "256m"      # ← HPA uses this as the 100% baseline
    memory: "512Mi"
  limits:
    memory: "512Mi"
```

---

## **Step-07 – Enable HPA**

### Option A: Override at install/upgrade time

```bash
helm upgrade --install cart ./helm/cart \
  --set autoscaling.enabled=true \
  --set autoscaling.minReplicas=1 \
  --set autoscaling.maxReplicas=5 \
  --set autoscaling.targetCPUUtilizationPercentage=70
```

### Option B: Override via values file (recommended for retailstore-apps)

Edit `helm/retailstore-apps/values-cart.yaml`:

```yaml
autoscaling:
  enabled: true
  minReplicas: 1
  maxReplicas: 5
  targetCPUUtilizationPercentage: 70
```

Then install using the retail apps script:

```bash
cd helm/retailstore-apps
./install-retail-apps.sh
```

---

## **Step-08 – Verify HPA is working**

### Check HPA status

```bash
kubectl get hpa

# Expected output
NAME       REFERENCE             TARGETS   MINPODS   MAXPODS   REPLICAS   AGE
cart       Deployment/cart       18%/70%   1         3         1          2m
catalog    Deployment/catalog    22%/70%   1         3         1          2m
```

> If TARGETS shows `<unknown>/70%` it means either metrics-server is not running or `resources.requests.cpu` is missing.

### Describe HPA for details

```bash
kubectl describe hpa cart
```

### Watch HPA scale in real time

```bash
kubectl get hpa -w
```

---

## **Step-09 – Load Test to trigger scaling**

Generate load to force HPA to scale up:

```bash
# Run a busybox pod and curl the cart service in a loop
kubectl run load-test --image=busybox --restart=Never -- \
  sh -c "while true; do wget -q -O- http://cart:8080/actuator/health; done"

# Watch HPA react in another terminal
kubectl get hpa cart -w
```

Expected behavior:
```
NAME   REFERENCE          TARGETS    MINPODS   MAXPODS   REPLICAS
cart   Deployment/cart    18%/70%    1         3         1
cart   Deployment/cart    78%/70%    1         3         1        ← CPU spike
cart   Deployment/cart    81%/70%    1         3         2        ← scale UP
cart   Deployment/cart    45%/70%    1         3         2
cart   Deployment/cart    21%/70%    1         3         1        ← scale DOWN (after ~5min)
```

Clean up the load test pod:

```bash
kubectl delete pod load-test
```

---

## **Summary**

| What | File |
|------|------|
| Metrics Server installation | `terraform/.../c17-metrics-server-helm-install.tf` |
| HPA template (cart) | `helm/cart/templates/hpa.yaml` |
| HPA template (catalog) | `helm/catalog/templates/hpa.yaml` |
| HPA template (checkout) | `helm/checkout/templates/hpa.yaml` |
| HPA template (orders) | `helm/orders/templates/hpa.yaml` |
| HPA template (ui) | `helm/ui/templates/hpa.yaml` |
| Autoscaling values | `helm/*/values.yaml` → `autoscaling` block |
