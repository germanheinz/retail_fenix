# ADOT Collector IAM Policy — X-Ray traces + CloudWatch Logs
# AMP (Prometheus) disabled — not needed for traces-only setup.
resource "aws_iam_policy" "adot_collector" {
  name        = "${local.name}-adot-collector-policy"
  description = "IAM policy for ADOT collector to send traces to X-Ray and logs to CloudWatch"
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      # X-Ray Permissions (traces)
      {
        Effect = "Allow"
        Action = [
          "xray:PutTraceSegments",
          "xray:PutTelemetryRecords",
          "xray:GetSamplingRules",
          "xray:GetSamplingTargets",
          "xray:GetSamplingStatisticSummaries"
        ]
        Resource = "*"
      },
      # CloudWatch Logs Permissions
      {
        Effect = "Allow"
        Action = [
          "logs:PutLogEvents",
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:DescribeLogStreams",
          "logs:DescribeLogGroups",
          "logs:GetLogEvents",
          "logs:FilterLogEvents"
        ]
        Resource = [
          "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:log-group:/aws/*",
          "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:log-group:/aws/*:*"
        ]
      }
      # DISABLED: Amazon Managed Prometheus (AMP) — paid service, not needed for traces-only
      # {
      #   Effect   = "Allow"
      #   Action   = ["aps:RemoteWrite", "aps:QueryMetrics", "aps:GetSeries",
      #               "aps:GetLabels", "aps:GetMetricMetadata"]
      #   Resource = aws_prometheus_workspace.amp.arn
      # }
    ]
  })

  tags = var.tags
}

# Attach IAM Policy to IAM Role
resource "aws_iam_role_policy_attachment" "adot_collector" {
  policy_arn = aws_iam_policy.adot_collector.arn
  role       = aws_iam_role.adot_collector.name
}