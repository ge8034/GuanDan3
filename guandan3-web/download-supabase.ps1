$ProgressPreference = 'SilentlyContinue'
$url = "https://github.com/supabase/cli/releases/download/v1.191.3/supabase_1.191.3_windows_amd64.zip"
$output = "supabase.zip"

Write-Host "Downloading Supabase CLI from $url..."
try {
    Invoke-WebRequest -Uri $url -OutFile $output -UseBasicParsing
    Write-Host "Download completed successfully!" -ForegroundColor Green
    Write-Host "Extracting and installing..."
    Expand-Archive -Path $output -DestinationPath "temp_supabase" -Force

    $installPath = "$env:USERPROFILE\AppData\Local\Programs\supabase"
    New-Item -ItemType Directory -Force -Path $installPath | Out-Null
    Move-Item -Path "temp_supabase\supabase.exe" -Destination "$installPath\supabase.exe" -Force

    Write-Host "Adding to PATH..."
    $path = [Environment]::GetEnvironmentVariable("Path", "User")
    if ($path -notlike "*$installPath*") {
        [Environment]::SetEnvironmentVariable("Path", "$path;$installPath", "User")
        Write-Host "Added to PATH. Please restart your terminal." -ForegroundColor Yellow
    } else {
        Write-Host "Already in PATH" -ForegroundColor Green
    }

    Remove-Item -Path $output -Force -ErrorAction SilentlyContinue
    Remove-Item -Path "temp_supabase" -Recurse -Force -ErrorAction SilentlyContinue

    Write-Host "Supabase CLI installed successfully!" -ForegroundColor Green
    & "$installPath\supabase.exe" --version
} catch {
    Write-Host "Failed to download: $_" -ForegroundColor Red
    exit 1
}
