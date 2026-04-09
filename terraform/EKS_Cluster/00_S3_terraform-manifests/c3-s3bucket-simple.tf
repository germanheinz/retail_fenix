# ==================================================================
# VERSIÓN SIMPLIFICADA PARA ESTUDIO
# ==================================================================
# Si prefieres algo más simple, reemplaza c3-s3bucket.tf con esto

resource "random_string" "suffix" {
  length  = 6
  upper   = false
  special = false
}

# Solo el bucket básico
resource "aws_s3_bucket" "tfstate_bucket" {
  bucket = "tfstate-${var.environment_name}-${var.aws_region}-${random_string.suffix.result}"

  tags = {
    Name    = "tfstate-${var.environment_name}"
    Purpose = "terraform-backend-study"
  }
}

# OPCIONAL: Solo si quieres protección extra
# Descomenta lo que necesites:

# Versionado (recomendado - protege contra borrados)
# resource "aws_s3_bucket_versioning" "tfstate_versioning" {
#   bucket = aws_s3_bucket.tfstate_bucket.id
#   versioning_configuration {
#     status = "Enabled"
#   }
# }

# Cifrado (recomendado - es gratis)
# resource "aws_s3_bucket_server_side_encryption_configuration" "tfstate_encryption" {
#   bucket = aws_s3_bucket.tfstate_bucket.id
#   rule {
#     apply_server_side_encryption_by_default {
#       sse_algorithm = "AES256"
#     }
#   }
# }

# Bloqueo público (recomendado - seguridad básica)
# resource "aws_s3_bucket_public_access_block" "tfstate_block_public" {
#   bucket = aws_s3_bucket.tfstate_bucket.id
#   block_public_acls       = true
#   block_public_policy     = true
#   ignore_public_acls      = true
#   restrict_public_buckets = true
# }
