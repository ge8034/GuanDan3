terraform {
  required_version = ">= 1.5.0"

  required_providers {
    vercel = {
      source  = "vercel/vercel"
      version = "~> 1.0"
    }

    supabase = {
      source  = "supabase/supabase"
      version = "~> 1.0"
    }

    github = {
      source  = "integrations/github"
      version = "~> 6.0"
    }

    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }

    null = {
      source  = "hashicorp/null"
      version = "~> 3.0"
    }

    random = {
      source  = "hashicorp/random"
      version = "~> 3.0"
    }
  }

  # 后端配置 - 使用本地状态文件
  backend "local" {
    path = "terraform.tfstate"
  }

  # 或者使用远程后端（推荐用于团队协作）
  # backend "s3" {
  #   bucket         = "guandan3-terraform-state"
  #   key            = "terraform.tfstate"
  #   region         = "us-east-1"
  #   encrypt        = true
  #   dynamodb_table = "guandan3-terraform-locks"
  # }
}

# 提供商配置
provider "vercel" {
  # 通过环境变量或变量提供
  # api_token = var.vercel_api_token
  # team      = var.vercel_team_id
}

provider "supabase" {
  # 通过环境变量或变量提供
  # access_token = var.supabase_access_token
}

provider "github" {
  # 通过环境变量提供
  # token = var.github_token
  owner = "your-github-username"
}

provider "aws" {
  region = "us-east-1"
  # 仅当使用S3后端或AWS资源时需要
  # access_key = var.aws_access_key
  # secret_key = var.aws_secret_key
}

# 实验性功能配置
terraform {
  experiments = [module_variable_optional_attrs]
}