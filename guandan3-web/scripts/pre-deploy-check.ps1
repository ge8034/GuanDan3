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
Log "部署前检查开始"
Log "========================================="

try {
    Set-Location $ProjectRoot
    Log "项目根目录: $ProjectRoot"

    Log ""
    Log "========================================="
    Log "1. 检查必需的工具"
    Log "========================================="

    $RequiredTools = @(
        @{Name = "node"; Description = "Node.js"},
        @{Name = "npm"; Description = "npm"},
        @{Name = "git"; Description = "Git"}
    )

    foreach ($tool in $RequiredTools) {
        if (Check-Command $tool.Name) {
            $version = & $tool.Name --version 2>&1
            Log "✅ $($tool.Description) 已安装: $version"
            $ChecksPassed++
        } else {
            Log "❌ $($tool.Description) 未安装" "ERROR"
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
            Log "✅ $($tool.Description) 已安装: $version"
            $ChecksPassed++
        } else {
            Log "⚠️  $($tool.Description) 未安装（可选）" "WARN"
            $Warnings++
        }
    }

    Log ""
    Log "========================================="
    Log "2. 检查项目文件"
    Log "========================================="

    $RequiredFiles = @(
        @{Path = "package.json"; Description = "package.json"},
        @{Path = "next.config.js"; Description = "Next.js 配置"},
        @{Path = "Dockerfile"; Description = "Dockerfile"},
        @{Path = "fly.toml"; Description = "Fly.io 配置"},
        @{Path = ".env.production"; Description = "生产环境变量"}
    )

    foreach ($file in $RequiredFiles) {
        if (Check-FileExists $file.Path) {
            Log "✅ $($file.Description) 存在"
            $ChecksPassed++
        } else {
            Log "❌ $($file.Description) 不存在" "ERROR"
            $ChecksFailed++
        }
    }

    $RequiredDirs = @(
        @{Path = "supabase\migrations"; Description = "数据库迁移目录"},
        @{Path = "src\app"; Description = "应用源代码目录"},
        @{Path = "docs"; Description = "文档目录"}
    )

    foreach ($dir in $RequiredDirs) {
        if (Check-DirectoryExists $dir.Path) {
            Log "✅ $($dir.Description) 存在"
            $ChecksPassed++
        } else {
            Log "❌ $($dir.Description) 不存在" "ERROR"
            $ChecksFailed++
        }
    }

    Log ""
    Log "========================================="
    Log "3. 检查环境变量"
    Log "========================================="

    $EnvFile = ".env.production"
    if (Check-FileExists $EnvFile) {
        $EnvContent = Get-Content $EnvFile
        $RequiredEnvVars = @(
            "NEXT_PUBLIC_SUPABASE_URL",
            "NEXT_PUBLIC_SUPABASE_ANON_KEY",
            "NEXT_PUBLIC_APP_URL"
        )

        foreach ($var in $RequiredEnvVars) {
            $match = $EnvContent | Where-Object { $_ -match "^$var=" }
            if ($match) {
                $value = ($match -split '=')[1]
                if ($value -eq 'your_' -or $value -eq 'https://your' -or $value -eq 'https://example.com') {
                    Log "⚠️  $var 需要设置实际值" "WARN"
                    $Warnings++
                } else {
                    Log "✅ $var 已配置"
                    $ChecksPassed++
                }
            } else {
                Log "❌ $var 未配置" "ERROR"
                $ChecksFailed++
            }
        }
    } else {
        Log "❌ .env.production 文件不存在" "ERROR"
        $ChecksFailed++
    }

    Log ""
    Log "========================================="
    Log "4. 检查数据库迁移"
    Log "========================================="

    $MigrationsDir = "supabase\migrations"
    if (Check-DirectoryExists $MigrationsDir) {
        $MigrationFiles = Get-ChildItem -Path $MigrationsDir -Filter "*.sql"
        $MigrationCount = $MigrationFiles.Count
        Log "✅ 找到 $MigrationCount 个迁移文件"
        $ChecksPassed++

        if ($MigrationCount -lt 20) {
            Log "⚠️  迁移文件数量较少（预期至少 20 个）" "WARN"
            $Warnings++
        }
    } else {
        Log "❌ 数据库迁移目录不存在" "ERROR"
        $ChecksFailed++
    }

    Log ""
    Log "========================================="
    Log "5. 检查依赖"
    Log "========================================="

    if (Check-FileExists "package-lock.json") {
        Log "✅ package-lock.json 存在"
        $ChecksPassed++
    } else {
        Log "⚠️  package-lock.json 不存在，建议运行 npm install" "WARN"
        $Warnings++
    }

    if (Check-DirectoryExists "node_modules") {
        Log "✅ node_modules 目录存在"
        $ChecksPassed++
    } else {
        Log "⚠️  node_modules 目录不存在，需要运行 npm install" "WARN"
        $Warnings++
    }

    Log ""
    Log "========================================="
    Log "6. 检查代码质量"
    Log "========================================="

    if (-not $SkipTests) {
        Log "运行 lint 检查..."
        try {
            $lintResult = npm run lint 2>&1
            if ($LASTEXITCODE -eq 0) {
                Log "✅ Lint 检查通过"
                $ChecksPassed++
            } else {
                Log "❌ Lint 检查失败" "ERROR"
                $ChecksFailed++
                if ($Verbose) {
                    Log $lintResult "DEBUG"
                }
            }
        } catch {
            Log "❌ Lint 检查失败: $_" "ERROR"
            $ChecksFailed++
        }

        Log "运行类型检查..."
        try {
            $typeCheckResult = npm run type-check 2>&1
            if ($LASTEXITCODE -eq 0) {
                Log "✅ 类型检查通过"
                $ChecksPassed++
            } else {
                Log "❌ 类型检查失败" "ERROR"
                $ChecksFailed++
                if ($Verbose) {
                    Log $typeCheckResult "DEBUG"
                }
            }
        } catch {
            Log "❌ 类型检查失败: $_" "ERROR"
            $ChecksFailed++
        }

        Log "运行安全审计..."
        try {
            $auditResult = npm audit --production 2>&1
            if ($LASTEXITCODE -eq 0) {
                Log "✅ 安全审计通过"
                $ChecksPassed++
            } else {
                Log "⚠️  安全审计发现潜在问题" "WARN"
                $Warnings++
                if ($Verbose) {
                    Log $auditResult "DEBUG"
                }
            }
        } catch {
            Log "⚠️  安全审计失败: $_" "WARN"
            $Warnings++
        }
    } else {
        Log "跳过代码质量检查（-SkipTests 参数）"
    }

    Log ""
    Log "========================================="
    Log "7. 检查构建"
    Log "========================================="

    if (-not $SkipTests) {
        Log "运行生产构建..."
        try {
            $buildResult = npm run build 2>&1
            if ($LASTEXITCODE -eq 0) {
                Log "✅ 生产构建成功"
                $ChecksPassed++

                if (Check-DirectoryExists ".next") {
                    $buildSize = (Get-ChildItem -Path ".next" -Recurse -File | Measure-Object -Property Length -Sum).Sum / 1MB
                    Log "📦 构建大小: $([math]::Round($buildSize, 2)) MB"
                }
            } else {
                Log "❌ 生产构建失败" "ERROR"
                $ChecksFailed++
                if ($Verbose) {
                    Log $buildResult "DEBUG"
                }
            }
        } catch {
            Log "❌ 生产构建失败: $_" "ERROR"
            $ChecksFailed++
        }
    } else {
        Log "跳过构建检查（-SkipTests 参数）"
    }

    Log ""
    Log "========================================="
    Log "8. 检查 Git 状态"
    Log "========================================="

    try {
        $gitStatus = git status --porcelain 2>&1
        if ([string]::IsNullOrEmpty($gitStatus)) {
            Log "✅ 工作目录干净"
            $ChecksPassed++
        } else {
            Log "⚠️  工作目录有未提交的更改" "WARN"
            $Warnings++
            if ($Verbose) {
                Log $gitStatus "DEBUG"
            }
        }

        $gitBranch = git branch --show-current 2>&1
        Log "📌 当前分支: $gitBranch"

        $gitCommit = git log -1 --format="%h %s" 2>&1
        Log "📝 最新提交: $gitCommit"
    } catch {
        Log "⚠️  无法检查 Git 状态: $_" "WARN"
        $Warnings++
    }

    Log ""
    Log "========================================="
    Log "9. 检查文档"
    Log "========================================="

    $RequiredDocs = @(
        @{Path = "docs\DEPLOYMENT_CHECKLIST.md"; Description = "部署检查清单"},
        @{Path = "docs\ROLLBACK_PLAN.md"; Description = "回滚计划"},
        @{Path = "docs\DEPLOYMENT_VALIDATION.md"; Description = "部署验证报告"},
        @{Path = "docs\ENVIRONMENT_VARIABLES_GUIDE.md"; Description = "环境变量指南"}
    )

    foreach ($doc in $RequiredDocs) {
        if (Check-FileExists $doc.Path) {
            Log "✅ $($doc.Description) 存在"
            $ChecksPassed++
        } else {
            Log "⚠️  $($doc.Description) 不存在" "WARN"
            $Warnings++
        }
    }

    Log ""
    Log "========================================="
    Log "10. 检查备份"
    Log "========================================="

    $BackupDir = "backups"
    if (Check-DirectoryExists $BackupDir) {
        $Backups = Get-ChildItem -Path $BackupDir -File | Sort-Object LastWriteTime -Descending | Select-Object -First 5
        if ($Backups.Count -gt 0) {
            Log "✅ 找到 $($Backups.Count) 个备份文件"
            $ChecksPassed++
            foreach ($backup in $Backups) {
                Log "   - $($backup.Name) ($($backup.LastWriteTime))"
            }
        } else {
            Log "⚠️  备份目录为空" "WARN"
            $Warnings++
        }
    } else {
        Log "⚠️  备份目录不存在" "WARN"
        $Warnings++
    }

} catch {
    Log "❌ 检查过程中发生错误: $_" "ERROR"
    $ChecksFailed++
}

Log ""
Log "========================================="
Log "检查结果汇总"
Log "========================================="
Log "✅ 通过: $ChecksPassed"
Log "❌ 失败: $ChecksFailed"
Log "⚠️  警告: $Warnings"
Log "📄 日志文件: $LogFile"

if ($ChecksFailed -gt 0) {
    Log ""
    Log "❌ 部署前检查失败！请修复错误后再部署。" "ERROR"
    exit 1
} elseif ($Warnings -gt 0) {
    Log ""
    Log "⚠️  部署前检查通过，但有警告。请检查警告项。" "WARN"
    exit 0
} else {
    Log ""
    Log "✅ 部署前检查全部通过！可以开始部署。" "INFO"
    exit 0
}
