# 输入变量定义
variable "vercel_api_token" {
  type        = string
  description = "Vercel API token for authentication"
  sensitive   = true
}

variable "vercel_team_id" {
  type        = string
  description = "Vercel team ID (optional)"
  default     = ""
  sensitive   = false
}

variable "supabase_access_token" {
  type        = string
  description = "Supabase access token for authentication"
  sensitive   = true
}

variable "supabase_org_id" {
  type        = string
  description = "Supabase organization ID"
  sensitive   = true
}

variable "supabase_db_password" {
  type        = string
  description = "Supabase database password"
  sensitive   = true
}

variable "project_name" {
  type        = string
  description = "Name of the project"
  default     = "guandan3-web"
  validation {
    condition     = length(var.project_name) >= 3 && length(var.project_name) <= 50
    error_message = "Project name must be between 3 and 50 characters."
  }
}

variable "environment" {
  type        = string
  description = "Deployment environment"
  default     = "prod"

  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be one of: dev, staging, prod."
  }
}

variable "region" {
  type        = string
  description = "Deployment region for resources"
  default     = "hkg1"

  validation {
    condition     = contains(["hkg1", "sin1", "nrt1", "syd1", "fra1", "iad1"], var.region)
    error_message = "Region must be one of: hkg1, sin1, nrt1, syd1, fra1, iad1."
  }
}

variable "domain_name" {
  type        = string
  description = "Custom domain name for the application"
  default     = ""

  validation {
    condition     = var.domain_name == "" || can(regex("^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]\\.[a-zA-Z]{2,}$", var.domain_name))
    error_message = "Domain name must be a valid domain."
  }
}

variable "github_repo" {
  type        = string
  description = "GitHub repository in format 'owner/repo'"
  default     = ""

  validation {
    condition     = var.github_repo == "" || can(regex("^[a-zA-Z0-9_-]+/[a-zA-Z0-9_-]+$", var.github_repo))
    error_message = "GitHub repository must be in format 'owner/repo'."
  }
}

variable "enable_monitoring" {
  type        = bool
  description = "Enable monitoring resources"
  default     = true
}

variable "enable_backup" {
  type        = bool
  description = "Enable database backups"
  default     = true
}

variable "backup_retention_days" {
  type        = number
  description = "Number of days to retain backups"
  default     = 30

  validation {
    condition     = var.backup_retention_days >= 1 && var.backup_retention_days <= 365
    error_message = "Backup retention days must be between 1 and 365."
  }
}

variable "performance_metrics_retention_days" {
  type        = number
  description = "Number of days to retain performance metrics"
  default     = 30

  validation {
    condition     = var.performance_metrics_retention_days >= 7 && var.performance_metrics_retention_days <= 365
    error_message = "Performance metrics retention days must be between 7 and 365."
  }
}

variable "error_logs_retention_days" {
  type        = number
  description = "Number of days to retain error logs"
  default     = 90

  validation {
    condition     = var.error_logs_retention_days >= 30 && var.error_logs_retention_days <= 365
    error_message = "Error logs retention days must be between 30 and 365."
  }
}

# 本地变量
locals {
  # 资源命名前缀
  name_prefix = "${var.project_name}-${var.environment}"

  # 标签
  common_tags = {
    Project     = var.project_name
    Environment = var.environment
    ManagedBy   = "Terraform"
    Repository  = var.github_repo
  }

  # 环境特定的配置
  environment_config = {
    dev = {
      instance_size = "small"
      auto_scaling  = false
      min_instances = 1
      max_instances = 2
    }
    staging = {
      instance_size = "medium"
      auto_scaling  = true
      min_instances = 1
      max_instances = 3
    }
    prod = {
      instance_size = "large"
      auto_scaling  = true
      min_instances = 2
      max_instances = 5
    }
  }

  # 当前环境的配置
  current_env_config = local.environment_config[var.environment]
}