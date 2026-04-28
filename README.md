# Retail Fenix — Real-World DevOps on AWS

A production-grade, fully automated **Retail Store Microservices Platform** deployed on **Amazon EKS** using **Terraform**, **Helm**, and a complete **AWS Data Plane**.

---

## Architecture Overview

### Application with Persistent Dataplane on Kubernetes
The Retail Fenix platform runs five microservices on EKS, each backed by a dedicated AWS managed data service — no in-cluster databases, no credentials in code.

| Microservice | Language | Data Store | ECR Image | Tag |
|---|---|---|---|---|
| **Catalog** | Go | Amazon RDS MySQL | `public.ecr.aws/i5b4r2o0/retail-fenix/catalog` | `1.0.0` |
| **Cart** | Java / Spring Boot | Amazon DynamoDB | `public.ecr.aws/i5b4r2o0/retail-fenix/cart` | `1.0.0` |
| **Checkout** | Node.js / TypeScript | Amazon ElastiCache (Redis) | `public.ecr.aws/i5b4r2o0/retail-fenix/checkout` | `1.0.0` |
| **Orders** | Java / Spring Boot | Amazon RDS PostgreSQL + SQS | `public.ecr.aws/i5b4r2o0/retail-fenix/orders` | `1.0.1` |
| **UI** | Node.js / React | — (frontend aggregator) | `public.ecr.aws/i5b4r2o0/retail-fenix/ui` | `1.0.1` |

### Security Model
All AWS access is handled via **EKS Pod Identity Associations (PIA)** — pods assume scoped IAM roles at runtime. No AWS credentials are stored in Kubernetes Secrets, environment variables, or application code.

### Observability Stack
- **AWS Distro for OpenTelemetry (ADOT)** — metrics, logs, traces collector
- **Amazon Managed Prometheus (AMP)** — metrics storage
- **Amazon Managed Grafana (AMG)** — dashboards and alerting

### Container & Helm Registry
All application images and Helm charts are hosted on **AWS ECR Public** (`public.ecr.aws/i5b4r2o0/retail-fenix`). No Docker Hub account required.

---

## Folder Structure

```
retail_fenix/
│
├── terraform/
│   ├── EKS_Cluster/                          # Basic EKS cluster (no addons)
│   │   ├── 00_S3_terraform-manifests/        # S3 backend bootstrap
│   │   ├── 01_VPC_terraform-manifests/       # VPC + subnets + NAT
│   │   ├── 02_EKS_terraform-manifests/       # EKS cluster + node group
│   │   ├── create-cluster.sh
│   │   └── destroy-cluster.sh
│   │
│   └── EKS_Cluster_with_Addons/              # Production EKS cluster (full)
│       ├── 00_S3_terraform-manifests/        # S3 backend bootstrap
│       ├── 01_VPC_terraform-manifests/       # VPC + subnets + NAT
│       ├── 02_EKS_terraform-manifests_with_addons/  # EKS + LBC + EBS CSI + External DNS
│       ├── 03_KARPENTER_terraform-manifests/ # Karpenter autoscaler
│       ├── 05_RETAIL_FENIX/                  # App deploy/uninstall scripts
│       ├── 06_OPENTELEMTRY_terraform-manifests/  # ADOT + AMP + AMG
│       ├── 07_OpenTelemetry_AMP_AMG/
│       ├── 07_OpenTelemetry_Logs/
│       ├── 07_OpenTelemetry_Traces/
│       ├── create-cluster.sh
│       ├── destroy-cluster.sh
│       ├── deploy-all.sh
│       ├── setup-s3-backend.sh
│       ├── setup-karpenter.sh
│       └── setup-opentelemetry.sh
│
├── helm/
│   └── retailstore-apps/
│       ├── charts/
│       │   ├── cart/                         # Helm chart — Cart
│       │   ├── catalog/                      # Helm chart — Catalog
│       │   ├── checkout/                     # Helm chart — Checkout
│       │   ├── orders/                       # Helm chart — Orders
│       │   └── ui/                           # Helm chart — UI
│       ├── values-cart.yaml
│       ├── values-catalog.yaml
│       ├── values-checkout.yaml
│       ├── values-orders.yaml
│       ├── values-ui.yaml
│       ├── install-retail-apps.sh
│       ├── uninstall-retail-apps.sh
│       └── package-and-push.sh
│
├── k8s/
│   └── catalog/                              # Raw K8s manifests (catalog dev reference)
│       ├── 1_deployment.yaml
│       ├── 2_clusterip_service.yaml
│       ├── 3_configmap.yaml
│       ├── 4_statefulset.yaml
│       ├── 5_mysql_headless_service.yaml
│       ├── 6_mysql_secrets.yaml
│       ├── 7_catalog_secretproviderclass.yaml
│       ├── 8_catalog_mysql_service_accout.yaml
│       ├── 9_storage_class_ebs.yaml
│       ├── 10_catalog_mysql_externalname_service.yaml
│       └── policies/                         # IAM policy JSON files
│
├── src/
│   ├── cart/                                 # Java / Spring Boot
│   ├── catalog/                              # Go
│   ├── checkout/                             # Node.js / TypeScript
│   ├── orders/                               # Java / Spring Boot
│   ├── ui/                                   # Node.js / React
│   ├── load-generator/                       # k6 load test
│   └── e2e/                                  # End-to-end tests
│
├── docs/
│   ├── architecture.md
│   ├── DOCKER.md
│   ├── helm/
│   └── k8s/                                  # 12 step-by-step K8s guides
│
├── docker-compose.yaml                       # Local full-stack (prod-like)
├── docker-compose.dev.yml                    # Local full-stack (dev)
├── init-catalog.sql                          # Catalog DB seed data
└── README.md
```

---

## Step-01: Bootstrap — S3 Remote Backend

Before provisioning any infrastructure, create the S3 bucket used as the Terraform remote state backend.

```bash
cd terraform/EKS_Cluster_with_Addons
./setup-s3-backend.sh
```

Or manually:

```bash
cd terraform/EKS_Cluster_with_Addons/00_S3_terraform-manifests
terraform init
terraform apply -auto-approve
```

| File | Purpose |
|---|---|
| `c1-versions.tf` | Provider and backend version constraints |
| `c2-variables.tf` | Region and bucket name variables |
| `c3-s3bucket-simple.tf` | S3 bucket with versioning enabled |

---

## Step-02: VPC

Provisions a production VPC with public/private subnets, NAT Gateway, and all required tagging for EKS and the Load Balancer Controller.

```bash
cd terraform/EKS_Cluster_with_Addons/01_VPC_terraform-manifests
terraform init
terraform plan
terraform apply -auto-approve
```

| File | Purpose |
|---|---|
| `c1-versions.tf` | Terraform and AWS provider |
| `c2-variables.tf` | Region, environment, CIDR ranges |
| `c3-vpc.tf` | VPC module invocation |
| `c4-outputs.tf` | Exports VPC ID, subnet IDs for downstream modules |
| `modules/vpc/` | Reusable VPC module (datasources, main, outputs, variables) |

**Outputs consumed by EKS, Karpenter, and Data Plane modules via remote state.**

---

## Step-03: EKS Cluster with Addons

Provisions the EKS control plane, managed node group, and all production addons via Pod Identity.

```bash
cd terraform/EKS_Cluster_with_Addons/02_EKS_terraform-manifests_with_addons
terraform init
terraform plan
terraform apply -auto-approve
```

### Foundation

| File | Purpose |
|---|---|
| `c1_versions.tf` | Terraform, AWS, Helm, Kubernetes providers |
| `c2_variables.tf` | Cluster name, region, K8s version |
| `c3_remote-state.tf` | Reads VPC remote state |
| `c4_datasources_and_locals.tf` | Account ID, AZs, common locals/tags |
| `c5_eks_tags.tf` | Subnet tags required by EKS |

### Cluster & Node Group

| File | Purpose |
|---|---|
| `c6_eks_cluster_iamrole.tf` | IAM role for EKS control plane |
| `c7_eks_cluster.tf` | EKS cluster resource |
| `c8_eks_nodegroup_iamrole.tf` | IAM role for worker nodes |
| `c9_eks_nodegroup_private.tf` | Managed node group in private subnets |
| `c10_eks_outputs.tf` | OIDC URL, cluster name, endpoint |

### Pod Identity Agent

| File | Purpose |
|---|---|
| `c11-podidentityagent-eksaddon.tf` | Installs EKS Pod Identity Agent addon |
| `c12-helm-and-kubernetes-providers.tf` | Configures Helm/K8s providers with cluster auth |
| `c13-podidentity-assumerole.tf` | Generic assume-role trust policy for Pod Identity |

### AWS Load Balancer Controller (LBC)

| File | Purpose |
|---|---|
| `c14-01-lbc-iam-policy-datasources.tf` | Downloads official AWS LBC IAM policy |
| `c14-02-lbc-iam-policy-and-role.tf` | Creates IAM policy + role |
| `c14-03-lbc-eks-pod-identity-association.tf` | Associates LBC service account with IAM role |
| `c14-04-lbc-helm-install.tf` | Installs LBC via Helm |

### EBS CSI Driver

| File | Purpose |
|---|---|
| `c15-01-ebscsi-iam-policy-and-role.tf` | IAM policy + role for EBS CSI |
| `c15-02-ebscsi-eks-pod-identity-association.tf` | Pod Identity for EBS CSI |
| `c15-03-ebscsi-eksaddon.tf` | Installs EBS CSI Driver addon |

### Secrets Store CSI Driver

| File | Purpose |
|---|---|
| `c16-01-secretstorecsi-helm-install.tf` | Installs Secrets Store CSI Driver |
| `c16-02-secretstorecsi-ascp-helm-install.tf` | Installs AWS Secrets Manager provider (ASCP) |

### External DNS

| File | Purpose |
|---|---|
| `c17-01-externaldns-iam-policy-and-role.tf` | IAM policy + role for External DNS |
| `c17-02-externaldns-pod-identity-association.tf` | Pod Identity for External DNS |
| `c17-03-externaldns-eksaddon.tf` | Installs External DNS addon |

### Metrics Server

| File | Purpose |
|---|---|
| `c18_eksaddon_metrics_server.tf` | Installs Metrics Server addon (required for HPA) |

---

## Step-04: Karpenter (Node Autoscaling)

Karpenter replaces the Cluster Autoscaler with event-driven, just-in-time node provisioning.

```bash
cd terraform/EKS_Cluster_with_Addons
./setup-karpenter.sh
```

Or manually:

```bash
cd terraform/EKS_Cluster_with_Addons/03_KARPENTER_terraform-manifests
terraform init
terraform plan
terraform apply -auto-approve
```

| File | Purpose |
|---|---|
| `c6_01_karpenter_controller_iam_role.tf` | IAM role for Karpenter controller |
| `c6_02_karpenter_controller_iam_policy.tf` | Permissions: EC2, SQS, IAM PassRole |
| `c6_03_karpenter_pod_identity_association.tf` | Pod Identity for Karpenter |
| `c6_04_karpenter_node_iam_role.tf` | IAM role for nodes launched by Karpenter |
| `c6_05_karpenter_access_entry.tf` | EKS access entry for Karpenter nodes |
| `c6_06_karpenter_helm_install.tf` | Installs Karpenter via Helm |
| `c6_07_karpenter_sqs_queue.tf` | SQS queue for Spot interruption events |
| `c6_08_karpenter_eventbridge_rules.tf` | EventBridge rules to forward EC2 events to SQS |

---

## Step-05: AWS Data Plane (RDS + DynamoDB + ElastiCache + SQS)

Provisions all AWS managed data services required by the microservices using Terraform and Pod Identity — **no credentials in Kubernetes**.

### Common IAM

| File | Purpose |
|---|---|
| `c5_01_podidentity_assumerole.tf` | Shared assume-role trust policy for Pod Identity |
| `c5_02_secretstorecsi_iam_policy.tf` | IAM policy for Secrets Store CSI to read AWS Secrets Manager |

### Catalog → Amazon RDS MySQL

| File | Purpose |
|---|---|
| `c6_01_catalog_rds_mysql_security_group.tf` | SG allowing ingress from EKS nodes |
| `c6_02_catalog_rds_mysql_dbsubnet_group.tf` | DB subnet group in private subnets |
| `c6_03_catalog_rds_mysql_credentials.tf` | Stores DB credentials in AWS Secrets Manager |
| `c6_04_catalog_rds_mysql_dbinstance.tf` | RDS MySQL instance |
| `c6_05_catalog_sa_iam_role.tf` | IAM role for Catalog service account |
| `c6_06_catalog_sa_eks_pod_identity_association.tf` | Pod Identity Association |

**Outcome:** Catalog reads credentials from Secrets Manager at pod startup via the CSI Driver — zero secrets in YAML.

### Cart → Amazon DynamoDB

| File | Purpose |
|---|---|
| `c7_01_cart_dynamoDB_iam_policy_and_role.tf` | IAM policy + role for full DynamoDB access |
| `c7_02_cart_eks_pod_identity_association.tf` | Pod Identity for Cart |
| `c7_03_cart_dynamodb_table.tf` | DynamoDB `Items` table |

**Outcome:** Cart reads/writes cart data directly to DynamoDB — fully serverless, no DB to manage.

### Checkout → Amazon ElastiCache (Redis / Valkey)

| File | Purpose |
|---|---|
| `c8_01_checkout_redis_security_group.tf` | SG allowing access from EKS worker nodes |
| `c8_02_checkout_redis_subnet_group.tf` | Subnet group in private subnets |
| `c8_03_checkout_redis_cluster.tf` | ElastiCache Redis cluster |

**Outcome:** Checkout service uses Redis for session and cart state caching.

### Orders → Amazon RDS PostgreSQL

| File | Purpose |
|---|---|
| `c9_01_orders_postgresql_security_group.tf` | SG for RDS PostgreSQL |
| `c9_02_orders_postgresql_db_subnet_group.tf` | Subnet group |
| `c9_03_orders_postgresql_dbinstance.tf` | RDS PostgreSQL instance |
| `c9_04_orders_postgresql_sa_iam_role.tf` | IAM role for Orders service account |
| `c9_05_orders_postgresql_sa_eks_pod_identity_association.tf` | Pod Identity Association |

**Outcome:** Orders connects to PostgreSQL via Secrets Manager + Pod Identity.

### Orders → Amazon SQS

| File | Purpose |
|---|---|
| `c9_06_orders_aws_sqs_queue.tf` | SQS queue `retail-dev-orders-queue` |
| `c9_07_orders_aws_sqs_iam_policy.tf` | SQS send/receive permissions for Orders role |

**Outcome:** Orders publishes events to SQS for asynchronous order processing.

---

## Step-06: ECR Public — Container Images & Helm Charts

All application container images and Helm charts are hosted on **AWS ECR Public**. No Docker Hub account is required.

### ECR Public Registry

| Resource | Registry Path |
|---|---|
| Container images | `public.ecr.aws/i5b4r2o0/retail-fenix` |
| Helm charts | `public.ecr.aws/i5b4r2o0/retail-fenix/charts` |

### Application Container Images

| Microservice | ECR Image | Tag |
|---|---|---|
| **Catalog** | `public.ecr.aws/i5b4r2o0/retail-fenix/catalog` | `1.0.0` |
| **Cart** | `public.ecr.aws/i5b4r2o0/retail-fenix/cart` | `1.0.0` |
| **Checkout** | `public.ecr.aws/i5b4r2o0/retail-fenix/checkout` | `1.0.0` |
| **Orders** | `public.ecr.aws/i5b4r2o0/retail-fenix/orders` | `1.0.1` |
| **UI** | `public.ecr.aws/i5b4r2o0/retail-fenix/ui` | `1.0.1` |

### Third-Party Images (ECR Public Mirror)

| Component | ECR Image |
|---|---|
| MySQL 8.0 | `public.ecr.aws/docker/library/mysql:8.0` |
| PostgreSQL 16.1 | `public.ecr.aws/docker/library/postgres:16.1` |
| RabbitMQ | `public.ecr.aws/docker/library/rabbitmq:3-management` |
| DynamoDB Local | `public.ecr.aws/aws-dynamodb-local/aws-dynamodb-local:1.25.1` |

### Helm Charts on ECR (OCI)

| Chart | OCI Path | Version |
|---|---|---|
| catalog | `oci://public.ecr.aws/i5b4r2o0/retail-fenix/charts/catalog` | `1.1.0` |
| cart | `oci://public.ecr.aws/i5b4r2o0/retail-fenix/charts/cart` | `1.1.0` |
| checkout | `oci://public.ecr.aws/i5b4r2o0/retail-fenix/charts/checkout` | `1.1.0` |
| orders | `oci://public.ecr.aws/i5b4r2o0/retail-fenix/charts/orders` | `1.1.0` |
| ui | `oci://public.ecr.aws/i5b4r2o0/retail-fenix/charts/ui` | `1.1.0` |

### Authenticate to ECR Public

ECR Public requires authentication before pushing charts or pulling private images. Run this once per session:

```bash
ECR_TOKEN=$(aws ecr-public get-login-password --region us-east-1)
docker login public.ecr.aws --username AWS --password "$ECR_TOKEN"
```

> **Note:** `aws ecr-public` commands must use `--region us-east-1` regardless of your cluster region.

### Package and Push Helm Charts

Use the provided script to package all five charts and push them to ECR:

```bash
cd helm/retailstore-apps
./package-and-push.sh
```

The script:
1. Authenticates to ECR Public
2. Runs `helm package` for each chart
3. Pushes each `.tgz` to `oci://public.ecr.aws/i5b4r2o0/retail-fenix/charts`

To do it manually for a single chart:

```bash
helm package helm/catalog
helm push catalog-1.1.0.tgz oci://public.ecr.aws/i5b4r2o0/retail-fenix/charts
```

---

## Step-07: Deploy Retail Fenix Application (Helm)

```bash
cd terraform/EKS_Cluster_with_Addons/05_RETAIL_FENIX
./02-install-retail-fenix.sh
```

Or directly with Helm:

```bash
cd helm/retailstore-apps
./install-retail-apps.sh
```

Each service is deployed as an independent Helm chart with:
- `Deployment` — application pods
- `Service` — ClusterIP for internal communication
- `ConfigMap` — environment configuration
- `HorizontalPodAutoscaler` — auto-scaling rules

**UI chart additionally includes:**
- `Ingress` — AWS ALB via Load Balancer Controller

### Verify Deployment

```bash
kubectl get pods -n retail-fenix
kubectl get ingress -n retail-fenix
```

---

## Step-07: Observability — OpenTelemetry + AMP + AMG

```bash
cd terraform/EKS_Cluster_with_Addons
./setup-opentelemetry.sh
```

Or manually:

```bash
cd terraform/EKS_Cluster_with_Addons/06_OPENTELEMTRY_terraform-manifests
terraform init
terraform plan
terraform apply -auto-approve
```

### ADOT Collector

| File | Purpose |
|---|---|
| `c6_01_adot_collector_iam_role.tf` | IAM role for ADOT collector |
| `c6_02_adot_collector_iam_policy.tf` | Permissions for AMP remote write + CloudWatch |
| `c6_03_adot_pod_identity_association.tf` | Pod Identity for ADOT |
| `c6_04_eks_addon_certmanager.tf` | cert-manager (ADOT dependency) |
| `c6_05_eks_addon_adot.tf` | ADOT EKS addon |
| `c6_06_eks_addon_prometheus_node_exporter.tf` | Node-level metrics |
| `c6_07_eks_addon_kube_state_metrics.tf` | K8s object metrics |
| `c6_09_adot_k8s_cluster_role_and_rolebinding.tf` | RBAC for ADOT |

### Metrics & Dashboards

| File | Purpose |
|---|---|
| `c7_amp_prometheus_workspace.tf` | Amazon Managed Prometheus workspace |
| `c8_01_amg_grafana_iam_policy.tf` | Grafana IAM policy (AMP datasource) |
| `c8_02_amg_grafana_iam_role.tf` | Grafana IAM role |
| `c8_03_amg_grafana.tf` | Amazon Managed Grafana workspace |

### Verify Metrics

```bash
cd terraform/EKS_Cluster_with_Addons/07_OpenTelemetry_AMP_AMG
./verify_amp_metrics.sh
```

---

## Step-08: Local Development

Run the full stack locally with Docker Compose:

```bash
# Production-like
docker compose up

# Development (hot reload)
docker compose -f docker-compose.dev.yml up
```

Services exposed locally:

| Service | Port |
|---|---|
| UI | 8888 |
| Catalog | 8081 |
| Cart | 8082 |
| Checkout | 8083 |
| Orders | 8084 |

---

## Step-09: Load Testing

```bash
cd src/load-generator
./scripts/run-docker.sh
```

The load generator uses **k6** with the scenario defined in `scenario.yml`. It simulates browse, add-to-cart, checkout, and order flows.

---

## Step-10: Verify All Resources (AWS Console)

After full deployment, verify the following:

- **EKS** → Cluster active, all addons green
- **RDS** → `catalog-mysql` and `orders-postgresql` instances available
- **DynamoDB** → `Items` table created
- **ElastiCache** → Redis cluster available
- **SQS** → `retail-dev-orders-queue` visible
- **IAM** → Pod Identity roles for each service
- **Secrets Manager** → DB credentials stored
- **Grafana** → Dashboards showing application metrics

---

## Step-11: Tear Down

### Remove Application

```bash
cd terraform/EKS_Cluster_with_Addons/05_RETAIL_FENIX
./01-uninstall-retail-fenix.sh
```

### Destroy All Infrastructure

```bash
cd terraform/EKS_Cluster_with_Addons
./destroy-cluster.sh
```

Or destroy module by module in reverse order:

```bash
# 1. OpenTelemetry
cd 06_OPENTELEMTRY_terraform-manifests && terraform destroy -auto-approve

# 2. Karpenter
cd ../03_KARPENTER_terraform-manifests && terraform destroy -auto-approve

# 3. EKS
cd ../02_EKS_terraform-manifests_with_addons && terraform destroy -auto-approve

# 4. VPC
cd ../01_VPC_terraform-manifests && terraform destroy -auto-approve

# 5. S3 backend (only after all state is gone)
cd ../00_S3_terraform-manifests && terraform destroy -auto-approve
```

---

## Technology Stack

| Layer | Technology |
|---|---|
| Infrastructure as Code | Terraform |
| Container Orchestration | Amazon EKS (Kubernetes) |
| Package Management (K8s) | Helm |
| Node Autoscaling | Karpenter |
| Ingress | AWS Load Balancer Controller (ALB) |
| Storage | Amazon EBS (EBS CSI Driver) |
| Secrets | AWS Secrets Manager + Secrets Store CSI Driver |
| IAM | EKS Pod Identity Associations |
| DNS | External DNS |
| Databases | Amazon RDS MySQL, Amazon RDS PostgreSQL |
| NoSQL | Amazon DynamoDB |
| Cache | Amazon ElastiCache (Redis / Valkey) |
| Messaging | Amazon SQS |
| Metrics | Amazon Managed Prometheus (AMP) |
| Traces & Logs | AWS Distro for OpenTelemetry (ADOT) |
| Dashboards | Amazon Managed Grafana (AMG) |
| Languages | Go, Java (Spring Boot), Node.js / TypeScript |
| Local Dev | Docker Compose |
| Load Testing | k6 |

---

## Summary

Retail Fenix is a reference implementation of a **production-ready microservices platform on AWS**. It covers the full DevOps lifecycle:

- Automated infrastructure provisioning with Terraform (VPC → EKS → Data Plane)
- Secure IAM via Pod Identity — no static credentials anywhere
- Application packaging and deployment via Helm
- Event-driven node autoscaling with Karpenter
- Full observability with OpenTelemetry, Prometheus, and Grafana
- Local development parity with Docker Compose
