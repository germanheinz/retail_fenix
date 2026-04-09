# Install Metrics Server (required for HPA)
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

# Outputs

output "helm_metrics_server_metadata" {
  description = "Metadata for the Metrics Server Helm release"
  value       = helm_release.metrics_server.metadata
}
