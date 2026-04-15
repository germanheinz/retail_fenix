# DISABLED: Prometheus Node Exporter — only needed for metrics pipeline (AMP).
# Using X-Ray for traces only (free tier). Re-enable if metrics collection is needed.

# data "aws_eks_addon_version" "prometheus_node_exporter_default" {
#   addon_name         = "prometheus-node-exporter"
#   kubernetes_version = data.terraform_remote_state.eks.outputs.eks_cluster_version
# }

# data "aws_eks_addon_version" "prometheus_node_exporter_latest" {
#   addon_name         = "prometheus-node-exporter"
#   kubernetes_version = data.terraform_remote_state.eks.outputs.eks_cluster_version
#   most_recent        = true
# }

# resource "aws_eks_addon" "prometheus_node_exporter" {
#   cluster_name  = data.terraform_remote_state.eks.outputs.eks_cluster_id
#   addon_name    = "prometheus-node-exporter"
#   addon_version = data.aws_eks_addon_version.prometheus_node_exporter_latest.version
#   resolve_conflicts_on_create = "OVERWRITE"
#   resolve_conflicts_on_update = "OVERWRITE"
#   tags = var.tags
# }

# output "prometheus_node_exporter_addon_id" {
#   value = aws_eks_addon.prometheus_node_exporter.id
# }

# output "prometheus_node_exporter_addon_version" {
#   value = aws_eks_addon.prometheus_node_exporter.addon_version
# }
