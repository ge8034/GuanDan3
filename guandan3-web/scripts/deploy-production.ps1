# Production Deployment Script (PowerShell)
# For deploying to Fly.io

$ErrorActionPreference = "Stop"

Write-Host "Starting production deployment..." -ForegroundColor Green

# Check if flyctl is installed
if (-not (Get-Command flyctl -ErrorAction SilentlyContinue)) {
    Write-Host "ERROR: flyctl not installed, please install Fly.io CLI first" -ForegroundColor Red
    Write-Host "   Visit: https://fly.io/docs/hands-on/install-flyctl/" -ForegroundColor Yellow
    exit 1
}

# Check if logged in
try {
    $null = flyctl auth whoami 2>&1
} catch {
    Write-Host "Please login to Fly.io..." -ForegroundColor Yellow
    flyctl auth login
}

# Build production version
Write-Host "Building production version..." -ForegroundColor Cyan
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Build failed" -ForegroundColor Red
    exit 1
}

# Deploy to Fly.io
Write-Host "Deploying to Fly.io..." -ForegroundColor Cyan
flyctl deploy

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Deployment failed" -ForegroundColor Red
    exit 1
}

# Configure environment variables
Write-Host "Configuring environment variables..." -ForegroundColor Cyan
flyctl secrets set NEXT_PUBLIC_SUPABASE_URL=https://rzzywltxlfgucngfiznx.supabase.co
flyctl secrets set NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ6enl3bHR4bGZndWNuZ2Zpem54Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwNTM1NjksImV4cCI6MjA4NDYyOTU2OX0.Upn1XmBZPQxYPl2UAVpGOtWim3Pf3yeeGNNMQm0idtM

# Open application
Write-Host "Opening application..." -ForegroundColor Cyan
flyctl open

Write-Host "Production deployment completed!" -ForegroundColor Green
Write-Host "View app status: flyctl status" -ForegroundColor Cyan
Write-Host "View logs: flyctl logs" -ForegroundColor Cyan
