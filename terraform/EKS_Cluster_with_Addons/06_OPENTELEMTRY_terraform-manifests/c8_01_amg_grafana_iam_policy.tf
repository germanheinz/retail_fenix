# DISABLED: IAM Policies for Amazon Managed Grafana (AMG) — not needed for traces-only setup.
# AMG is a paid service. Traces are visualized directly in AWS X-Ray console (free tier).
# Re-enable if you want a Grafana dashboard for traces/metrics.

# resource "aws_iam_policy" "amg_prometheus_policy" {
#   name        = "${local.cluster_name}-amg-prometheus-policy"
#   description = "IAM policy for Grafana to access Amazon Managed Prometheus"
#   policy = jsonencode({
#     Version = "2012-10-17"
#     Statement = [{
#       Effect   = "Allow"
#       Action   = ["aps:ListWorkspaces", "aps:DescribeWorkspace", "aps:QueryMetrics",
#                   "aps:GetLabels", "aps:GetSeries", "aps:GetMetricMetadata"]
#       Resource = "*"
#     }]
#   })
#   tags = var.tags
# }

# resource "aws_iam_policy" "amg_sns_policy" {
#   name        = "${local.cluster_name}-amg-sns-policy"
#   description = "IAM policy for Grafana to publish AWS SNS notifications"
#   policy = jsonencode({
#     Version = "2012-10-17"
#     Statement = [{
#       Effect   = "Allow"
#       Action   = ["sns:Publish"]
#       Resource = ["arn:aws:sns:*:${local.account_id}:grafana*"]
#     }]
#   })
#   tags = var.tags
# }

# data "aws_iam_policy" "xray_readonly" {
#   arn = "arn:aws:iam::aws:policy/AWSXrayReadOnlyAccess"
# }

