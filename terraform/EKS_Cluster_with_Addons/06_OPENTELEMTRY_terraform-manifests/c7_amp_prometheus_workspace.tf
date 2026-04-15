# DISABLED: Amazon Managed Prometheus (AMP) — not needed for traces-only setup.
# AMP is a paid service. Using X-Ray for traces (free tier).
# Re-enable if you need metrics collection with Prometheus.

# resource "aws_prometheus_workspace" "amp" {
#   alias = "${local.cluster_name}-amp"
#   tags  = var.tags
# }

# output "amp_workspace_id" {
#   description = "AMP Workspace ID"
#   value       = aws_prometheus_workspace.amp.id
# }

# output "amp_endpoint" {
#   description = "AMP Remote Write Endpoint"
#   value       = "${aws_prometheus_workspace.amp.prometheus_endpoint}api/v1/remote_write"
# }

# output "amp_query_endpoint" {
#   description = "AMP Query Endpoint"
#   value       = "${aws_prometheus_workspace.amp.prometheus_endpoint}api/v1/query"
# }
