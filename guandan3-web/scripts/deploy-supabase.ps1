# Supabase Deployment Script (PowerShell)
# For deploying database migrations and configuring Supabase

$ErrorActionPreference = "Stop"

Write-Host "Starting Supabase deployment..." -ForegroundColor Green

# Check if supabase CLI is installed
if (-not (Get-Command supabase -ErrorAction SilentlyContinue)) {
    Write-Host "ERROR: supabase CLI not installed" -ForegroundColor Red
    Write-Host "   Install with: npm install -g supabase" -ForegroundColor Yellow
    exit 1
}

# Check if logged in
try {
    $null = supabase status 2>&1
} catch {
    Write-Host "Please login to Supabase..." -ForegroundColor Yellow
    supabase login
}

# Link to Supabase project
Write-Host "Linking to Supabase project..." -ForegroundColor Cyan
supabase link --project-ref rzzywltxlfgucngfiznx

# Push database migrations
Write-Host "Pushing database migrations..." -ForegroundColor Cyan
supabase db push

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Database migration failed" -ForegroundColor Red
    exit 1
}

# Generate TypeScript types
Write-Host "Generating TypeScript types..." -ForegroundColor Cyan
supabase gen types typescript --local > src/lib/supabase/types.ts

Write-Host "Supabase deployment completed!" -ForegroundColor Green
Write-Host "View project: https://supabase.com/dashboard/project/rzzywltxlfgucngfiznx" -ForegroundColor Cyan
Write-Host "View database: supabase db remote commit" -ForegroundColor Cyan
