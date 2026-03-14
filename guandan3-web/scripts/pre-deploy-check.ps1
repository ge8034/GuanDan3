param(
    [switch]$SkipTests = $false,
    [switch]$Verbose = $false
)

$ErrorActionPreference = "Stop"
$ScriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptPath
$LogFile = Join-Path $ProjectRoot "logs\pre-deploy-check-$(Get-Date -Format 'yyyyMMdd-HHmmss').log"

New-Item -ItemType Directory -Force -Path (Split-Path -Parent $LogFile) | Out-Null

function Log {
    param([string]$Message, [string]$Level = "INFO")
    $Timestamp = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
    $LogEntry = "[$Timestamp] [$Level] $Message"
    Write-Host $LogEntry
    Add-Content -Path $LogFile -Value $LogEntry
}

function Check-Command {
    param([string]$Command)
    try {
        $null = Get-Command $Command -ErrorAction Stop
        return $true
    } catch {
        return $false
    }
}

function Test-EnvironmentVariable {
    param([string]$VarName)
    $value = [Environment]::GetEnvironmentVariable($VarName)
    
    if ([string]::IsNullOrEmpty($value)) {
        $envFile = Join-Path $ProjectRoot ".env.production"
        if (Test-Path $envFile) {
            $envContent = Get-Content $envFile
            foreach ($line in $envContent) {
                if ($line -match "^$VarName=(.+)$") {
                    $value = $matches[1].Trim()
                    break
                }
            }
        }
    }
    
    if ([string]::IsNullOrEmpty($value)) {
        return $false
    }
    return $true
}

function Check-FileExists {
    param([string]$FilePath)
    return Test-Path $FilePath -PathType Leaf
}

function Check-DirectoryExists {
    param([string]$DirPath)
    return Test-Path $DirPath -PathType Container
}

$ChecksPassed = 0
$ChecksFailed = 0
$Warnings = 0

Log "========================================="
Log "Pre-deployment check started"
Log "========================================="

try {
    Set-Location $ProjectRoot
    Log "Project root: $ProjectRoot"

    Log ""
    Log "========================================="
    Log "1. Checking required tools"
    Log "========================================="

    $RequiredTools = @(
        @{Name = "node"; Description = "Node.js"},
        @{Name = "npm"; Description = "npm"},
        @{Name = "git"; Description = "Git"}
    )

    foreach ($tool in $RequiredTools) {
        if (Check-Command $tool.Name) {
            $version = & $tool.Name --version 2>&1
            Log "✓ $($tool.Description) installed: $version"
            $ChecksPassed++
        } else {
            Log "✗ $($tool.Description) not installed" "ERROR"
            $ChecksFailed++
        }
    }

    $OptionalTools = @(
        @{Name = "flyctl"; Description = "Fly.io CLI"},
        @{Name = "supabase"; Description = "Supabase CLI"},
        @{Name = "docker"; Description = "Docker"}
    )

    foreach ($tool in $OptionalTools) {
        if (Check-Command $tool.Name) {
            $version = & $tool.Name --version 2>&1
            Log "✓ $($tool.Description) installed: $version"
            $ChecksPassed++
        } else {
            Log "⚠ $($tool.Description) not installed (optional)" "WARN"
            $Warnings++
        }
    }

    Log ""
    Log "========================================="
    Log "2. Checking project files"
    Log "========================================="

    $RequiredFiles = @(
        @{Path = "package.json"; Description = "package.json"},
        @{Path = "next.config.js"; Description = "Next.js config"},
        @{Path = "Dockerfile"; Description = "Dockerfile"},
        @{Path = "fly.toml"; Description = "Fly.io config"},
        @{Path = ".env.production"; Description = "Production env"}
    )

    foreach ($file in $RequiredFiles) {
        if (Check-FileExists $file.Path) {
            Log "✓ $($file.Description) exists"
            $ChecksPassed++
        } else {
            Log "✗ $($file.Description) missing" "ERROR"
            $ChecksFailed++
        }
    }

    $RequiredDirs = @(
        @{Path = "supabase\migrations"; Description = "Database migrations"},
        @{Path = "src\app"; Description = "App source code"},
        @{Path = "docs"; Description = "Documentation"}
    )

    foreach ($dir in $RequiredDirs) {
        if (Check-DirectoryExists $dir.Path) {
            Log "✓ $($dir.Description) exists"
            $ChecksPassed++
        } else {
            Log "✗ $($dir.Description) missing" "ERROR"
            $ChecksFailed++
        }
    }

    Log ""
    Log "========================================="
    Log "3. Checking environment variables"
    Log "========================================="

    $EnvVars = @(
        "NEXT_PUBLIC_SUPABASE_URL",
        "NEXT_PUBLIC_SUPABASE_ANON_KEY",
        "NEXT_PUBLIC_APP_URL"
    )

    foreach ($var in $EnvVars) {
        if (Test-EnvironmentVariable $var) {
            Log "✓ $var configured"
            $ChecksPassed++
        } else {
            Log "✗ $var not configured" "ERROR"
            $ChecksFailed++
        }
    }

    Log ""
    Log "========================================="
    Log "4. Checking database migrations"
    Log "========================================="

    $MigrationDir = Join-Path $ProjectRoot "supabase\migrations"
    if (Check-DirectoryExists $MigrationDir) {
        $migrationFiles = Get-ChildItem -Path $MigrationDir -Filter "*.sql"
        $migrationCount = $migrationFiles.Count
        Log "✓ Found $migrationCount migration files"
        $ChecksPassed++
    } else {
        Log "✗ Migration directory not found" "ERROR"
        $ChecksFailed++
    }

    Log ""
    Log "========================================="
    Log "5. Checking dependencies"
    Log "========================================="

    if (Check-FileExists "package-lock.json") {
        Log "✓ package-lock.json exists"
        $ChecksPassed++
    } else {
        Log "✗ package-lock.json missing" "ERROR"
        $ChecksFailed++
    }

    if (Check-DirectoryExists "node_modules") {
        Log "✓ node_modules directory exists"
        $ChecksPassed++
    } else {
        Log "✗ node_modules directory missing" "ERROR"
        $ChecksFailed++
    }

    Log ""
    Log "========================================="
    Log "6. Checking code quality"
    Log "========================================="

    Log "Running lint check..."
    try {
        $lintResult = npm run lint 2>&1
        if ($LASTEXITCODE -eq 0) {
            Log "✓ Lint check passed"
            $ChecksPassed++
        } else {
            Log "✗ Lint check failed" "ERROR"
            $ChecksFailed++
            if ($Verbose) {
                Log $lintResult "DEBUG"
            }
        }
    } catch {
        Log "✗ Lint check failed: $_" "ERROR"
        $ChecksFailed++
    }

    Log "Running type check..."
    try {
        $typeCheckResult = npm run typecheck 2>&1
        if ($LASTEXITCODE -eq 0) {
            Log "✓ Type check passed"
            $ChecksPassed++
        } else {
            Log "✗ Type check failed" "ERROR"
            $ChecksFailed++
            if ($Verbose) {
                Log $typeCheckResult "DEBUG"
            }
        }
    } catch {
        Log "✗ Type check failed: $_" "ERROR"
        $ChecksFailed++
    }

    Log "Running security audit..."
    try {
        $auditResult = npm audit --production 2>&1
        if ($LASTEXITCODE -eq 0) {
            Log "✓ Security audit passed"
            $ChecksPassed++
        } else {
            Log "⚠ Security audit found vulnerabilities" "WARN"
            $Warnings++
            if ($Verbose) {
                Log $auditResult "DEBUG"
            }
        }
    } catch {
        Log "⚠ Security audit failed: $_" "WARN"
        $Warnings++
    }

    Log ""
    Log "========================================="
    Log "7. Checking build"
    Log "========================================="

    Log "Running production build..."
    try {
        $buildResult = npm run build 2>&1
        if ($LASTEXITCODE -eq 0) {
            Log "✓ Production build successful"
            $ChecksPassed++
        } else {
            Log "✗ Production build failed" "ERROR"
            $ChecksFailed++
            if ($Verbose) {
                Log $buildResult "DEBUG"
            }
        }
    } catch {
        Log "✗ Production build failed: $_" "ERROR"
        $ChecksFailed++
    }

    Log ""
    Log "========================================="
    Log "8. Checking backup directory"
    Log "========================================="

    $BackupDir = Join-Path $ProjectRoot "backups"
    if (Check-DirectoryExists $BackupDir) {
        Log "✓ Backup directory exists"
        $ChecksPassed++
        
        $BackupReadme = Join-Path $BackupDir "README.md"
        if (Check-FileExists $BackupReadme) {
            Log "✓ Backup README exists"
            $ChecksPassed++
        } else {
            Log "⚠ Backup README missing" "WARN"
            $Warnings++
        }
    } else {
        Log "⚠ Backup directory not found" "WARN"
        $Warnings++
    }

    if (-not $SkipTests) {
        Log ""
        Log "========================================="
        Log "9. Running tests"
        Log "========================================="

        Log "Running unit tests..."
        try {
            $testResult = npm run test 2>&1
            if ($LASTEXITCODE -eq 0) {
                Log "✓ Unit tests passed"
                $ChecksPassed++
            } else {
                Log "⚠ Unit tests failed" "WARN"
                $Warnings++
                if ($Verbose) {
                    Log $testResult "DEBUG"
                }
            }
        } catch {
            Log "⚠ Unit tests failed: $_" "WARN"
            $Warnings++
        }

        Log "Running E2E tests..."
        try {
            $e2eResult = npm run test:e2e 2>&1
            if ($LASTEXITCODE -eq 0) {
                Log "✓ E2E tests passed"
                $ChecksPassed++
            } else {
                Log "⚠ E2E tests failed" "WARN"
                $Warnings++
                if ($Verbose) {
                    Log $e2eResult "DEBUG"
                }
            }
        } catch {
            Log "⚠ E2E tests failed: $_" "WARN"
            $Warnings++
        }
    } else {
        Log ""
        Log "Tests skipped (-SkipTests flag)"
    }

    Log ""
    Log "========================================="
    Log "10. Checking documentation"
    Log "========================================="

    $RequiredDocs = @(
        @{Path = "docs\DEPLOYMENT_CHECKLIST.md"; Description = "Deployment checklist"},
        @{Path = "docs\ROLLBACK_PLAN.md"; Description = "Rollback plan"},
        @{Path = "docs\DEPLOYMENT_VALIDATION.md"; Description = "Deployment validation"},
        @{Path = "docs\ENVIRONMENT_VARIABLES_GUIDE.md"; Description = "Environment variables guide"}
    )

    foreach ($doc in $RequiredDocs) {
        if (Check-FileExists $doc.Path) {
            Log "✓ $($doc.Description) exists"
            $ChecksPassed++
        } else {
            Log "⚠ $($doc.Description) missing" "WARN"
            $Warnings++
        }
    }

} catch {
    Log "✗ Unexpected error: $_" "ERROR"
    $ChecksFailed++
}

Log ""
Log "========================================="
Log "Pre-deployment check summary"
Log "========================================="
Log "Passed: $ChecksPassed"
Log "Failed: $ChecksFailed"
Log "Warnings: $Warnings"
Log "========================================="

if ($ChecksFailed -eq 0) {
    Log "✓ All critical checks passed! Ready for deployment." "INFO"
    exit 0
} else {
    Log "✗ Some critical checks failed. Please fix before deployment." "ERROR"
    exit 1
}
