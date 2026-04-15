# DISABLED: IAM Role for Amazon Managed Grafana (AMG) — not needed for traces-only setup.
# Re-enable together with c8_01 and c8_03 if adding Grafana dashboards later.

# resource "aws_iam_role" "amg_iam_role" {
#   name               = "${local.cluster_name}-amg-service-role"
#   description        = "IAM role for Amazon Managed Grafana"
#   assume_role_policy = jsonencode({
#     Version = "2012-10-17"
#     Statement = [{
#       Action    = "sts:AssumeRole"
#       Effect    = "Allow"
#       Sid       = ""
#       Principal = { Service = "grafana.amazonaws.com" }
#     }]
#   })
#   tags = var.tags
# }

# resource "aws_iam_role_policy_attachment" "amg_prometheus_policy_attachment" {
#   role       = aws_iam_role.amg_iam_role.name
#   policy_arn = aws_iam_policy.amg_prometheus_policy.arn
# }

# resource "aws_iam_role_policy_attachment" "amg_sns_policy_attachment" {
#   role       = aws_iam_role.amg_iam_role.name
#   policy_arn = aws_iam_policy.amg_sns_policy.arn
# }

# resource "aws_iam_role_policy_attachment" "amg_xray_readonly_attachment" {
#   role       = aws_iam_role.amg_iam_role.name
#   policy_arn = data.aws_iam_policy.xray_readonly.arn
# }

# output "amg_iam_role_arn" {
#   value = aws_iam_role.amg_iam_role.arn
# }

# output "amg_iam_role_name" {
#   value = aws_iam_role.amg_iam_role.name
# }