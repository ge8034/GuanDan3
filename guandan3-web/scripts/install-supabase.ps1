$ErrorActionPreference = "Stop"

Write-Host "Installing Supabase CLI..." -ForegroundColor Green

$version = "v1.191.3"
$url = "https://github.com/supabase/cli/releases/download/$version/supabase_1.191.3_windows_amd64.zip"
$zipPath = "$env:TEMP\supabase.zip"
$extractPath = "$env:TEMP\supabase_extract"
$installPath = "$env:USERPROFILE\AppData\Local\Programs\supabase"

Write-Host "Downloading Supabase CLI from $url..." -ForegroundColor Cyan
try {
    Invoke-WebRequest -Uri $url -OutFile $zipPath -UseBasicParsing
    Write-Host "Download completed successfully" -ForegroundColor Green
} catch {
    Write-Host "Failed to download: $_" -ForegroundColor Red
    exit 1
}

Write-Host "Extracting files..." -ForegroundColor Cyan
New-Item -ItemType Directory -Force -Path $extractPath | Out-Null
Expand-Archive -Path $zipPath -DestinationPath $extractPath -Force

Write-Host "Installing to $installPath..." -ForegroundColor Cyan
New-Item -ItemType Directory -Force -Path $installPath | Out-Null
Move-Item -Path "$extractPath\supabase.exe" -Destination "$installPath\supabase.exe" -Force

Write-Host "Adding to PATH..." -ForegroundColor Cyan
$path = [Environment]::GetEnvironmentVariable("Path", "User")
if ($path -notlike "*$installPath*") {
    [Environment]::SetEnvironmentVariable("Path", "$path;$installPath", "User")
    Write-Host "Added to PATH. Please restart your terminal to use the new PATH." -ForegroundColor Yellow
} else {
    Write-Host "Already in PATH" -ForegroundColor Green
}

Write-Host "Cleaning up..." -ForegroundColor Cyan
Remove-Item -Path $zipPath -Force -ErrorAction SilentlyContinue
Remove-Item -Path $extractPath -Recurse -Force -ErrorAction SilentlyContinue

Write-Host "Supabase CLI installed successfully!" -ForegroundColor Green
Write-Host "Installation path: $installPath" -ForegroundColor Cyan
Write-Host "Version: " -NoNewline
& "$installPath\supabase.exe" --version