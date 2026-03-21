# 输出变量定义

output "application_url" {
  description = "URL of the deployed application"
  value       = try("https://${vercel_project_domain.main.name}", "https://${vercel_project.main.name}.vercel.app")
}

output "supabase_project_url" {
  description = "URL of the Supabase project"
  value       = supabase_project.main.anon_key
  sensitive   = true
}

output "supabase_database_host" {
  description = "Hostname of the Supabase database"
  value       = supabase_project.main.database.host
  sensitive   = true
}

output "supabase_database_port" {
  description = "Port of the Supabase database"
  value       = supabase_project.main.database.port
}

output "supabase_database_name" {
  description = "Name of the Supabase database"
  value       = supabase_project.main.database.name
}

output "vercel_project_id" {
  description = "ID of the Vercel project"
  value       = vercel_project.main.id
}

output "vercel_team_id" {
  description = "Team ID associated with the Vercel project"
  value       = vercel_project.main.team_id
}

output "deployment_environment" {
  description = "Current deployment environment"
  value       = var.environment
}

output "deployment_region" {
  description = "Deployment region"
  value       = var.region
}

output "monitoring_enabled" {
  description = "Whether monitoring is enabled"
  value       = var.enable_monitoring
}

output "backup_enabled" {
  description = "Whether backups are enabled"
  value       = var.enable_backup
}

output "backup_retention_days" {
  description = "Number of days backups are retained"
  value       = var.backup_retention_days
}

output "infrastructure_summary" {
  description = "Summary of deployed infrastructure"
  value = {
    project_name    = var.project_name
    environment     = var.environment
    region          = var.region
    application_url = try("https://${vercel_project_domain.main.name}", "https://${vercel_project.main.name}.vercel.app")
    has_custom_domain = var.domain_name != ""
    monitoring      = var.enable_monitoring
    backups         = var.enable_backup
    terraform_state = "managed"
  }
}

output "next_steps" {
  description = "Next steps after infrastructure deployment"
  value = <<-EOT
  Infrastructure deployment complete!

  Next steps:
  1. Configure GitHub Secrets with the following values:
     - VERCEL_TOKEN: ${var.vercel_api_token}
     - VERCEL_ORG_ID: ${var.vercel_team_id}
     - SUPABASE_ACCESS_TOKEN: ${var.supabase_access_token}
     - SUPABASE_SERVICE_ROLE_KEY: [从Supabase控制台获取]

  2. Set up environment variables in Vercel:
     - NEXT_PUBLIC_SUPABASE_URL: ${supabase_project.main.anon_key}
     - NEXT_PUBLIC_SUPABASE_ANON_KEY: ${supabase_project.main.anon_key}

  3. Run database migrations:
     - Navigate to Supabase SQL Editor
     - Execute migrations from supabase/migrations/

  4. Configure monitoring and alerts:
     - Set up performance monitoring
     - Configure error tracking
     - Set up usage analytics

  5. Test the deployment:
     - Visit: ${try("https://${vercel_project_domain.main.name}", "https://${vercel_project.main.name}.vercel.app")}
     - Run smoke tests
     - Verify database connectivity
  EOT
}

output "security_recommendations" {
  description = "Security recommendations for the deployment"
  value = <<-EOT
  Security Recommendations:

  1. Database Security:
     - Rotate database passwords regularly
     - Enable SSL for database connections
     - Restrict database access by IP

  2. Application Security:
     - Enable CSP headers
     - Implement rate limiting
     - Set up WAF rules

  3. Monitoring:
     - Set up alerting for security events
     - Monitor failed login attempts
     - Track suspicious activity

  4. Access Control:
     - Use least privilege principle
     - Rotate API keys regularly
     - Audit access logs
  EOT
}

output "maintenance_tasks" {
  description = "Regular maintenance tasks"
  value = <<-EOT
  Regular Maintenance Tasks:

  Daily:
  - Check application health
  - Review error logs
  - Monitor performance metrics

  Weekly:
  - Review security scans
  - Check backup status
  - Update dependencies

  Monthly:
  - Rotate credentials
  - Review access logs
  - Update infrastructure
  - Test disaster recovery

  Quarterly:
  - Security audit
  - Performance review
  - Cost optimization
  - Compliance check
  EOT
}