# infrastructure/terraform/variables.tf
# #terraform-variables

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

variable "ecr_registry" {
  description = "ECR registry URL"
  type        = string
}

variable "image_tag" {
  description = "Docker image tag"
  type        = string
  default     = "latest"
}

variable "db_username" {
  description = "RDS master username"
  type        = string
  sensitive   = true
}

variable "db_password" {
  description = "RDS master password"
  type        = string
  sensitive   = true
}

variable "docdb_username" {
  description = "DocumentDB master username"
  type        = string
  sensitive   = true
}

variable "docdb_password" {
  description = "DocumentDB master password"
  type        = string
  sensitive   = true
}

variable "jwt_private_key_arn" {
  description = "SSM Parameter ARN for JWT private key"
  type        = string
}

variable "jwt_public_key_arn" {
  description = "SSM Parameter ARN for JWT public key"
  type        = string
}

variable "service_discovery_namespace" {
  description = "Service discovery namespace"
  type        = string
  default     = "cafe.local"
}
