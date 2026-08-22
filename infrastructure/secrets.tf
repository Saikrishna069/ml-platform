# AWS Secrets Manager for sensitive configuration
resource "aws_secretsmanager_secret" "db_password" {
  name = "${var.app_name}-db-password"
  
  tags = {
    Name = "${var.app_name}-db-password"
  }
}

resource "aws_secretsmanager_secret_version" "db_password" {
  secret_id     = aws_secretsmanager_secret.db_password.id
  secret_string = var.db_password
}

resource "aws_secretsmanager_secret" "app_secrets" {
  name = "${var.app_name}-app-secrets"
  
  tags = {
    Name = "${var.app_name}-app-secrets"
  }
}

resource "aws_secretsmanager_secret_version" "app_secrets" {
  secret_id = aws_secretsmanager_secret.app_secrets.id
  secret_string = jsonencode({
    secret_key           = "production-super-secret-jwt-key-2026"
    jwt_algorithm        = "HS256"
    jwt_expiration_hours = 24
  })
}

output "db_password_secret_arn" {
  value = aws_secretsmanager_secret.db_password.arn
}

output "app_secrets_arn" {
  value = aws_secretsmanager_secret.app_secrets.arn
}
