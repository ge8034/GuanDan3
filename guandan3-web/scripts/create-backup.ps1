param(
    [string]$BackupType = "pre-deploy",
    [switch]$IncludeDatabase = $false
)

$ErrorActionPreference = "Stop"
$ScriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptPath
$BackupDir = Join-Path $ProjectRoot "backups"
$Timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$BackupName = "${BackupType}-${Timestamp}"
$BackupPath = Join-Path $BackupDir $BackupName

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Creating backup: $BackupName" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

New-Item -ItemType Directory -Path $BackupPath -Force | Out-Null
Write-Host "Backup directory created: $BackupPath" -ForegroundColor Green

$BackupItems = @(
    @{Source = "package.json"; Dest = "package.json"},
    @{Source = "package-lock.json"; Dest = "package-lock.json"},
    @{Source = "next.config.js"; Dest = "next.config.js"},
    @{Source = "Dockerfile"; Dest = "Dockerfile"},
    @{Source = "fly.toml"; Dest = "fly.toml"},
    @{Source = ".env.production"; Dest = ".env.production"},
    @{Source = "src"; Dest = "src"},
    @{Source = "supabase\migrations"; Dest = "supabase-migrations"}
)

foreach ($Item in $BackupItems) {
    $SourcePath = Join-Path $ProjectRoot $Item.Source
    $DestPath = Join-Path $BackupPath $Item.Dest
    
    if (Test-Path $SourcePath) {
        Copy-Item -Path $SourcePath -Destination $DestPath -Recurse -Force
        Write-Host "Backed up: $($Item.Source)" -ForegroundColor Green
    } else {
        Write-Host "Skipped: $($Item.Source) (not found)" -ForegroundColor Yellow
    }
}

if ($IncludeDatabase) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "Database backup" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    
    $DbBackupPath = Join-Path $BackupPath "database-backup.sql"
    
    if (Get-Command supabase -ErrorAction SilentlyContinue) {
        Write-Host "Backing up database..." -ForegroundColor Yellow
        supabase db dump -f $DbBackupPath
        if ($LASTEXITCODE -eq 0) {
            Write-Host "Database backup completed: $DbBackupPath" -ForegroundColor Green
        } else {
            Write-Host "Database backup failed" -ForegroundColor Red
        }
    } else {
        Write-Host "Supabase CLI not installed, skipping database backup" -ForegroundColor Yellow
        Write-Host "Manual backup command: supabase db dump -f $DbBackupPath" -ForegroundColor Gray
    }
}

$BackupInfo = @{
    BackupName = $BackupName
    Timestamp = $Timestamp
    BackupType = $BackupType
    GitCommit = git rev-parse --short HEAD 2>$null
    GitBranch = git rev-parse --abbrev-ref HEAD 2>$null
    CreatedBy = $env:USERNAME
    CreatedAt = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
}

$InfoPath = Join-Path $BackupPath "backup-info.json"
$BackupInfo | ConvertTo-Json -Depth 3 | Out-File -FilePath $InfoPath -Encoding utf8
Write-Host "Backup info saved: $InfoPath" -ForegroundColor Green

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Backup completed!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Backup location: $BackupPath" -ForegroundColor White
Write-Host "Backup size: $((Get-ChildItem -Path $BackupPath -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB) MB" -ForegroundColor White
