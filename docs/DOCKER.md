# Docker - retail_fenix

## Services

| Service   | Stack               | Local Port |
|-----------|---------------------|------------|
| ui        | Next.js             | 3000       |
| catalog   | Go 1.23             | 8081       |
| cart      | Java 21/Spring Boot | 8082       |
| orders    | Java 21/Spring Boot | 8083       |
| checkout  | NestJS              | 8084       |

---

## Prerequisites

- Docker Desktop installed and running
- Git

---

## Part 1 — Local Build

### 1. Navigate to the project root

```bash
cd retail_fenix
```

### 2. Verify the structure

Each service must have its own `Dockerfile`:

```
retail_fenix/
├── docker-compose.yml
└── src/
    ├── ui/Dockerfile
    ├── catalog/Dockerfile
    ├── cart/Dockerfile
    ├── orders/Dockerfile
    └── checkout/Dockerfile
```

### 3. Build all images

```bash
docker compose build
```

To build a single service:

```bash
docker compose build ui
docker compose build catalog
docker compose build cart
docker compose build orders
docker compose build checkout
```

### 4. Start all services

```bash
docker compose up
```

Build and start in one command:

```bash
docker compose up --build
```

Run in the background (detached mode):

```bash
docker compose up -d
```

### 5. Verify running containers

```bash
docker ps
```

Access the services:

- UI → http://localhost:3000
- Catalog → http://localhost:8081
- Cart → http://localhost:8082
- Orders → http://localhost:8083
- Checkout → http://localhost:8084

### 6. View logs

```bash
docker compose logs -f           # all services
docker compose logs -f ui        # specific service
```

### 7. Stop all services

```bash
docker compose down
```

---

## Part 2 — Publish Images to Docker Hub

### 1. Create a Docker Hub account

Go to https://hub.docker.com and create an account if you don't have one.

### 2. Login from terminal

```bash
docker login
```

Enter your username and password when prompted.

### 3. Build all images locally

You must build before you can push. From the project root:

```bash
docker compose build
```

Verify the images were created (note the exact names, you will need them in the next step):

```bash
docker images | grep retail
```

Expected output:
```
retail_fenix-ui        latest   ...
retail_fenix-catalog   latest   ...
retail_fenix-cart      latest   ...
retail_fenix-orders    latest   ...
retail_fenix-checkout  latest   ...
```

### 4. Tag the images

Replace `<your-username>` with your Docker Hub username:

```bash
docker tag retail_fenix-ui        <your-username>/retail-fenix-ui:latest
docker tag retail_fenix-catalog   <your-username>/retail-fenix-catalog:latest
docker tag retail_fenix-cart      <your-username>/retail-fenix-cart:latest
docker tag retail_fenix-orders    <your-username>/retail-fenix-orders:latest
docker tag retail_fenix-checkout  <your-username>/retail-fenix-checkout:latest
```

### 5. Push the images

```bash
docker push <your-username>/retail-fenix-ui:latest
docker push <your-username>/retail-fenix-catalog:latest
docker push <your-username>/retail-fenix-cart:latest
docker push <your-username>/retail-fenix-orders:latest
docker push <your-username>/retail-fenix-checkout:latest
```

### 6. Verify on Docker Hub

Go to https://hub.docker.com/repositories and confirm the images are listed.

---

## Part 3 — Publish to AWS ECR (optional)

### 1. Install AWS CLI

```bash
choco install awscli -y
```

### 2. Configure credentials

```bash
aws configure
```

### 3. Login to ECR

```bash
aws ecr get-login-password --region <region> | docker login --username AWS --password-stdin <account-id>.dkr.ecr.<region>.amazonaws.com
```

### 4. Create repositories in ECR (one time)

```bash
aws ecr create-repository --repository-name retail-fenix-ui
aws ecr create-repository --repository-name retail-fenix-catalog
aws ecr create-repository --repository-name retail-fenix-cart
aws ecr create-repository --repository-name retail-fenix-orders
aws ecr create-repository --repository-name retail-fenix-checkout
```

### 5. Tag and push

```bash
ECR=<account-id>.dkr.ecr.<region>.amazonaws.com

docker tag retail_fenix-ui       $ECR/retail-fenix-ui:latest
docker tag retail_fenix-catalog  $ECR/retail-fenix-catalog:latest
docker tag retail_fenix-cart     $ECR/retail-fenix-cart:latest
docker tag retail_fenix-orders   $ECR/retail-fenix-orders:latest
docker tag retail_fenix-checkout $ECR/retail-fenix-checkout:latest

docker push $ECR/retail-fenix-ui:latest
docker push $ECR/retail-fenix-catalog:latest
docker push $ECR/retail-fenix-cart:latest
docker push $ECR/retail-fenix-orders:latest
docker push $ECR/retail-fenix-checkout:latest
```

---

## Part 4 — Production Dockerfiles

### What changed from Dev to Prod

All production Dockerfiles use **Amazon Linux 2023** (`public.ecr.aws/amazonlinux/amazonlinux:2023`) as base image instead of lightweight Alpine or official language images. This ensures better compatibility with AWS services (ECS, EKS, Lambda) and aligns with the Amazon Corretto JDK distribution.

| Feature | Dev | Prod |
|---|---|---|
| Base image | `alpine` / `eclipse-temurin` / `node` | Amazon Linux 2023 |
| Runtime user | `root` | `appuser` (uid 1000, non-root) |
| Healthcheck | None | `curl -f http://localhost:<port>/health` |
| Spring profile | Default | `SPRING_PROFILES_ACTIVE=prod` |
| JVM options | Hardcoded | `$JAVA_OPTS` (configurable at runtime) |
| Dependency retry | None | 3 attempts with 10s delay |
| curl | Not available | Full curl (supports telnet/health probes) |

### Why each change matters

**Amazon Linux 2023** — AWS-optimized, security-patched, and consistent with the runtime environment in ECS/EKS. Avoids compatibility issues between Alpine musl libc and AWS SDKs.

**Non-root user (`appuser`)** — Running as root inside a container is a security risk. If the container is compromised, the attacker gets root on the host. `appuser` with uid 1000 limits the blast radius.

**Healthcheck** — Allows Docker and orchestrators (ECS, Kubernetes) to know if the service is actually ready to receive traffic, not just running.

**`SPRING_PROFILES_ACTIVE=prod`** — Activates production Spring configuration (different DB settings, logging levels, feature flags).

**`$JAVA_OPTS`** — Allows injecting JVM flags at deploy time without rebuilding the image (e.g., heap size, GC tuning, OpenTelemetry agents).

**Dependency retry** — Network timeouts during `mvn dependency:go-offline` are common in CI environments. The retry loop prevents flaky builds.

### Build time difference

Production builds are slower because:
1. `dnf install` downloads packages from the internet on every build (no pre-installed runtime)
2. Amazon Linux 2023 base image is larger than Alpine (~180MB vs ~5MB)
3. The retry logic adds potential wait time

This is a trade-off: slower builds, but a hardened and AWS-compatible runtime image.

---

## Troubleshooting

### `package-lock.json not found` (ui / checkout)

**Cause:** Amazon Linux 2023 ships Node 18 via `dnf`, but the lockfile was generated with Node 20+. `npm ci` fails due to version incompatibility.

**Fix:** Use `node:20-alpine` as the build stage and Amazon Linux 2023 only as the runtime stage.

```dockerfile
# Build Stage — use official Node 20
FROM node:20-alpine AS build-env
WORKDIR /app
COPY package*.json ./
RUN npm install
...

# Runtime Stage — use Amazon Linux 2023
FROM public.ecr.aws/amazonlinux/amazonlinux:2023
...
```

---

### `go mod download did not complete successfully` (catalog)

**Cause:** Amazon Linux 2023 ships Go 1.21 via `dnf`, but `go.mod` requires Go 1.23+.

**Fix:** Use `golang:1.23-alpine` as the build stage.

```dockerfile
# Build Stage — use official Go 1.23
FROM golang:1.23-alpine AS build-env
...

# Runtime Stage — use Amazon Linux 2023
FROM public.ecr.aws/amazonlinux/amazonlinux:2023
...
```

---

### `mvnw: Permission denied` (cart / orders)

**Cause:** The Maven wrapper script loses its executable permission on Windows filesystems.

**Fix:** Add `chmod +x mvnw` after copying it.

```dockerfile
COPY mvnw .
RUN chmod +x mvnw
```

---

### Build stage summary

All services follow this pattern — official language image for build, Amazon Linux 2023 for runtime:

| Service  | Build Stage                    | Runtime Stage          |
|----------|--------------------------------|------------------------|
| ui       | `node:20-alpine`               | Amazon Linux 2023      |
| catalog  | `golang:1.23-alpine`           | Amazon Linux 2023      |
| cart     | `maven:3.9-eclipse-temurin-21` | Amazon Linux 2023      |
| orders   | `maven:3.9-eclipse-temurin-21` | Amazon Linux 2023      |
| checkout | `node:20-alpine`               | Amazon Linux 2023      |

---

## Useful Commands

```bash
docker images                    # list local images
docker ps                        # running containers
docker ps -a                     # all containers
docker compose down --volumes    # stop services and remove volumes
docker system prune -f           # clean up unused images and containers
```
