# DISABLED: Kube State Metrics — only needed for metrics pipeline (AMP).
# Using X-Ray for traces only (free tier). Re-enable if metrics collection is needed.

# data "aws_eks_addon_version" "kube_state_metrics_default" {
#   addon_name         = "kube-state-metrics"
#   kubernetes_version = data.terraform_remote_state.eks.outputs.eks_cluster_version
# }

# data "aws_eks_addon_version" "kube_state_metrics_latest" {
#   addon_name         = "kube-state-metrics"
#   kubernetes_version = data.terraform_remote_state.eks.outputs.eks_cluster_version
#   most_recent        = true
# }

# resource "aws_eks_addon" "kube_state_metrics" {
#   cluster_name  = data.terraform_remote_state.eks.outputs.eks_cluster_id
#   addon_name    = "kube-state-metrics"
#   addon_version = data.aws_eks_addon_version.kube_state_metrics_latest.version
#   resolve_conflicts_on_create = "OVERWRITE"
#   resolve_conflicts_on_update = "OVERWRITE"
#   tags = var.tags
# }

# output "kube_state_metrics_addon_id" {
#   value = aws_eks_addon.kube_state_metrics.id
# }

# output "kube_state_metrics_version" {
#   value = aws_eks_addon.kube_state_metrics.addon_version
# }
