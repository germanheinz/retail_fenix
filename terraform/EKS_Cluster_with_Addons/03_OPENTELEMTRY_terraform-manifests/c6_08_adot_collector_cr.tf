# OpenTelemetry Collector Custom Resource
# This is the ACTUAL collector pipeline that the ADOT operator (installed via addon) will deploy.
# Without this resource, the ADOT addon is installed but no metrics/traces are collected.
#
# Pipeline:
#   Metrics: prometheus scrape → batch → Amazon Managed Prometheus (AMP)
#   Traces:  otlp → batch → AWS X-Ray

resource "kubernetes_manifest" "adot_collector" {
  # The ADOT addon must be ready before the operator can handle this CR
  depends_on = [
    aws_eks_addon.adot,
    kubernetes_cluster_role_binding_v1.otel_collector,
    aws_prometheus_workspace.amp
  ]

  manifest = {
    apiVersion = "opentelemetry.io/v1alpha1"
    kind       = "OpenTelemetryCollector"

    metadata = {
      name      = "adot-collector"
      namespace = "default"
    }

    spec = {
      serviceAccount = "adot-collector"
      mode           = "deployment"
      replicas       = 1

      resources = {
        requests = {
          cpu    = "200m"
          memory = "256Mi"
        }
        limits = {
          cpu    = "500m"
          memory = "512Mi"
        }
      }

      # OTEL Collector pipeline configuration
      config = <<-EOT
        extensions:
          sigv4auth:
            region: ${data.aws_region.current.name}
            service: aps

        receivers:
          # Scrape Kubernetes pod metrics via Prometheus
          prometheus:
            config:
              scrape_configs:
                - job_name: kubernetes-pods
                  sample_limit: 10000
                  kubernetes_sd_configs:
                    - role: pod
                  relabel_configs:
                    - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_scrape]
                      action: keep
                      regex: "true"
                    - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_path]
                      action: replace
                      target_label: __metrics_path__
                      regex: (.+)
                    - source_labels: [__address__, __meta_kubernetes_pod_annotation_prometheus_io_port]
                      action: replace
                      regex: ([^:]+)(?::\d+)?;(\d+)
                      replacement: $$1:$$2
                      target_label: __address__
                    - action: labelmap
                      regex: __meta_kubernetes_pod_label_(.+)
                    - source_labels: [__meta_kubernetes_namespace]
                      action: replace
                      target_label: kubernetes_namespace
                    - source_labels: [__meta_kubernetes_pod_name]
                      action: replace
                      target_label: kubernetes_pod_name

          # Receive traces from applications via OTLP (gRPC and HTTP)
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
          # Send metrics to Amazon Managed Prometheus
          prometheusremotewrite:
            endpoint: ${aws_prometheus_workspace.amp.prometheus_endpoint}api/v1/remote_write
            auth:
              authenticator: sigv4auth
            resource_to_telemetry_conversion:
              enabled: true

          # Send traces to AWS X-Ray
          awsxray:
            region: ${data.aws_region.current.name}
            indexed_attributes:
              - aws.operation
              - aws.remote.target
              - http.url
              - http.method

        service:
          extensions: [sigv4auth]
          pipelines:
            metrics:
              receivers: [prometheus]
              processors: [batch]
              exporters: [prometheusremotewrite]
            traces:
              receivers: [otlp]
              processors: [batch]
              exporters: [awsxray]
      EOT
    }
  }
}

# Outputs
output "adot_collector_name" {
  description = "Name of the ADOT OpenTelemetryCollector CR"
  value       = "adot-collector"
}
