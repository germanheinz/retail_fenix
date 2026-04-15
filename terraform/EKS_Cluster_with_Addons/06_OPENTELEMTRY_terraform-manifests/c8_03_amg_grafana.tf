# DISABLED: Amazon Managed Grafana (AMG) — paid service, not needed for traces-only setup.
# Traces are visible directly in the AWS X-Ray console at no extra cost.
# Re-enable together with c8_01 and c8_02 if you want Grafana dashboards later.

# resource "aws_grafana_workspace" "main" {
#   name                     = "${local.cluster_name}-amg"
#   description              = "Grafana workspace for ${local.cluster_name} EKS cluster monitoring"
#   account_access_type      = "CURRENT_ACCOUNT"
#   authentication_providers = ["AWS_SSO"]
#   permission_type          = "CUSTOMER_MANAGED"
#   role_arn                 = aws_iam_role.amg_iam_role.arn
#   data_sources             = ["PROMETHEUS", "CLOUDWATCH", "XRAY"]
#   notification_destinations = ["SNS"]
#   configuration = jsonencode({
#     plugins         = { pluginAdminEnabled = true }
#     unifiedAlerting = { enabled = true }
#   })
#   tags = var.tags
# }

# output "amg_workspace_id" {
#   value = aws_grafana_workspace.main.id
# }

# output "amg_workspace_arn" {
#   value = aws_grafana_workspace.main.arn
# }

# output "amg_workspace_endpoint" {
#   value = aws_grafana_workspace.main.endpoint
# }

# output "amg_workspace_url" {
#   value = "https://${aws_grafana_workspace.main.endpoint}"
# }

