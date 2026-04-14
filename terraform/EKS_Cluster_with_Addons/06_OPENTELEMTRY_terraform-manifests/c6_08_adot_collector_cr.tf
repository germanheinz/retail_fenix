# OpenTelemetry Collector Custom Resource
# This is the ACTUAL collector pipeline that the ADOT operator (installed via addon) will deploy.
# Without this resource, the ADOT addon is installed but no metrics/traces are collected.
#
# Pipeline:
#   Metrics: prometheus scrape → batch → Amazon Managed Prometheus (AMP)
#   Traces:  otlp → batch → AWS X-Ray
#
# NOTE: Uses local_file + terraform_data instead of kubernetes_manifest to avoid
# plan-time CRD validation failure. kubernetes_manifest validates the CR against
# the live API during plan, but the ADOT addon (which registers the CRD) hasn't
# been applied yet at that point — causing "no matches for kind OpenTelemetryCollector".

# Step 1: Write the manifest to disk with Terraform-interpolated values
resource "local_file" "adot_collector_manifest" {
  filename        = "${path.module}/adot-collector-cr.yaml"
  file_permission = "0600"

  content = <<-YAML
    apiVersion: opentelemetry.io/v1alpha1
    kind: OpenTelemetryCollector
    metadata:
      name: adot-collector
      namespace: default
    spec:
      serviceAccount: adot-collector
      mode: deployment
      replicas: 1
      resources:
        requests:
          cpu: "200m"
          memory: "256Mi"
        limits:
          cpu: "500m"
          memory: "512Mi"
      config: |
        receivers:
          otlp:
            protocols:
              grpc:
                endpoint: 0.0.0.0:4317
              http:
                endpoint: 0.0.0.0:4318

        processors:
          batch:
            timeout: 30s
            send_batch_size: 10000

        exporters:
          awsxray:
            region: ${data.aws_region.current.name}
            indexed_attributes:
              - aws.operation
              - aws.remote.target
              - http.url
              - http.method

        service:
          pipelines:
            traces:
              receivers: [otlp]
              processors: [batch]
              exporters: [awsxray]
  YAML
}

# Step 2: Apply the manifest via kubectl after ADOT addon is ready and CRD is registered
resource "terraform_data" "adot_collector" {
  depends_on = [
    aws_eks_addon.adot,
    kubernetes_cluster_role_binding_v1.otel_collector,
    local_file.adot_collector_manifest,
  ]

  # Re-apply if AMP endpoint or region changes
  triggers_replace = [local_file.adot_collector_manifest.content]

  provisioner "local-exec" {
    interpreter = ["bash", "-c"]
    command     = "kubectl apply -f ${local_file.adot_collector_manifest.filename}"
  }
}

# Outputs
output "adot_collector_name" {
  description = "Name of the ADOT OpenTelemetryCollector CR"
  value       = "adot-collector"
}
