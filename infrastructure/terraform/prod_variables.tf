variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "app_name" {
  description = "Application name"
  type        = string
  default     = "ml-platform"
}

variable "environment" {
  description = "Environment"
  type        = string
  default     = "production"
}

variable "vpc_cidr" {
  description = "VPC CIDR"
  type        = string
  default     = "10.0.0.0/16"
}

variable "container_port" {
  description = "Container port"
  type        = number
  default     = 8000
}

variable "task_cpu" {
  description = "Task CPU"
  type        = string
  default     = "2048"
}

variable "task_memory" {
  description = "Task memory"
  type        = string
  default     = "4096"
}

variable "desired_count" {
  description = "Desired task count"
  type        = number
  default     = 3
}

variable "min_capacity" {
  description = "Minimum capacity"
  type        = number
  default     = 3
}

variable "max_capacity" {
  description = "Maximum capacity"
  type        = number
  default     = 10
}

variable "database_name" {
  description = "Database name"
  type        = string
  default     = "mlplatform"
}

variable "database_username" {
  description = "Database username"
  type        = string
  default     = "postgres"
}

variable "tags" {
  description = "Common tags"
  type        = map(string)
  default = {
    Project     = "ml-platform"
    Environment = "production"
  }
}
