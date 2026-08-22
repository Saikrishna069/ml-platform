variable "aws_region" {
  default = "us-east-1"
}

variable "app_name" {
  default = "ml-analyzer"
}

variable "environment" {
  default = "production"
}

variable "instance_type" {
  default = "t3.xlarge"
}

variable "db_username" {
  default   = "mlanalyzer"
  sensitive = true
}

variable "db_password" {
  default   = "ChangeMe123Secure!"
  sensitive = true
}

variable "container_image" {
  default = "ml-analyzer-backend:latest"
}

variable "db_allocated_storage" {
  default = 50
}

variable "db_backup_retention_days" {
  default = 7
}
