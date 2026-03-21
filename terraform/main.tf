terraform {
  required_version = ">= 1.0"
  required_providers {
    vercel = {
      source  = "vercel/vercel"
      version = "~> 1.0"
    }
    supabase = {
      source  = "supabase/supabase"
      version = "~> 1.0"
    }
  }
}

# 配置提供商
provider "vercel" {
  api_token = var.vercel_api_token
  team      = var.vercel_team_id
}

provider "supabase" {
  access_token = var.supabase_access_token
}

# 变量定义
variable "vercel_api_token" {
  type        = string
  description = "Vercel API token"
  sensitive   = true
}

variable "vercel_team_id" {
  type        = string
  description = "Vercel team ID"
  default     = ""
}

variable "supabase_access_token" {
  type        = string
  description = "Supabase access token"
  sensitive   = true
}

variable "project_name" {
  type        = string
  description = "Project name"
  default     = "guandan3-web"
}

variable "environment" {
  type        = string
  description = "Environment (dev/staging/prod)"
  default     = "prod"
}

variable "region" {
  type        = string
  description = "Deployment region"
  default     = "hkg1"
}

# 创建Supabase项目
resource "supabase_project" "main" {
  name           = "${var.project_name}-${var.environment}"
  organization_id = var.supabase_org_id
  region         = var.region
  plan           = "free"  # 或 "pro" 根据需求

  # 数据库配置
  database = {
    password = var.supabase_db_password
  }
}

# 创建Vercel项目
resource "vercel_project" "main" {
  name      = "${var.project_name}-${var.environment}"
  framework = "nextjs"

  # Git集成
  git_repository = {
    type = "github"
    repo = var.github_repo
  }

  # 环境变量
  environment = [
    {
      key    = "NEXT_PUBLIC_SUPABASE_URL"
      value  = supabase_project.main.anon_key
      target = ["production", "preview", "development"]
    },
    {
      key    = "NEXT_PUBLIC_SUPABASE_ANON_KEY"
      value  = supabase_project.main.anon_key
      target = ["production", "preview", "development"]
    },
    {
      key    = "NEXT_PUBLIC_APP_URL"
      value  = "https://${vercel_project_domain.main.name}"
      target = ["production"]
    }
  ]
}

# 配置自定义域名
resource "vercel_project_domain" "main" {
  project_id = vercel_project.main.id
  domain     = var.domain_name

  # 重定向配置
  redirects = [
    {
      source      = "/api/:path*"
      destination = "/api/:path*"
      permanent   = false
    }
  ]
}

# 配置部署保护规则
resource "vercel_deployment_protection_rule" "main" {
  project_id = vercel_project.main.id
  type       = "checks"

  rule = {
    checks = {
      required = ["ci", "security-scan"]
    }
  }
}

# 输出
output "vercel_project_url" {
  value = "https://${vercel_project_domain.main.name}"
}

output "supabase_project_url" {
  value = supabase_project.main.anon_key
}

output "supabase_database_url" {
  value = supabase_project.main.database.host
  sensitive = true
}