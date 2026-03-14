param(
    [Parameter(Mandatory=$true)]
    [string]$AppUrl,
    
    [switch]$SkipPerformanceTests = $false,
    [switch]$Verbose = $false
)

$ErrorActionPreference = "Stop"
$ScriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptPath
$LogFile = Join-Path $ProjectRoot "logs\post-deploy-verify-$(Get-Date -Format 'yyyyMMdd-HHmmss').log"

New-Item -ItemType Directory -Force -Path (Split-Path -Parent $LogFile) | Out-Null

function Log {
    param([string]$Message, [string]$Level = "INFO")
    $Timestamp = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
    $LogEntry = "[$Timestamp] [$Level] $Message"
    Write-Host $LogEntry
    Add-Content -Path $LogFile -Value $LogEntry
}

function Test-Url {
    param([string]$Url, [int]$Timeout = 30)
    try {
        $response = Invoke-WebRequest -Uri $Url -Method GET -TimeoutSec $Timeout -UseBasicParsing
        return @{
            Success = $true
            StatusCode = $response.StatusCode
            ResponseTime = $response.Headers.'X-Response-Time'
        }
    } catch {
        return @{
            Success = $false
            Error = $_.Exception.Message
        }
    }
}

$ChecksPassed = 0
$ChecksFailed = 0
$Warnings = 0

Log "========================================="
Log "部署后验证开始"
Log "========================================="
Log "应用 URL: $AppUrl"

try {
    Set-Location $ProjectRoot

    Log ""
    Log "========================================="
    Log "1. 健康检查"
    Log "========================================="

    $HealthUrl = "$AppUrl/api/health"
    Log "检查健康端点: $HealthUrl"
    
    $healthResult = Test-Url $HealthUrl
    if ($healthResult.Success) {
        Log "✅ 健康检查通过 (HTTP $($healthResult.StatusCode))"
        $ChecksPassed++
    } else {
        Log "❌ 健康检查失败: $($healthResult.Error)" "ERROR"
        $ChecksFailed++
    }

    Log ""
    Log "========================================="
    Log "2. 页面访问检查"
    Log "========================================="

    $Pages = @(
        @{Path = ""; Description = "首页"},
        @{Path = "/history"; Description = "历史记录页"},
        @{Path = "/practice"; Description = "练习模式页"}
    )

    foreach ($page in $Pages) {
        $PageUrl = "$AppUrl$($page.Path)"
        Log "检查 $($page.Description): $PageUrl"
        
        $pageResult = Test-Url $PageUrl
        if ($pageResult.Success) {
            Log "✅ $($page.Description) 可访问 (HTTP $($pageResult.StatusCode))"
            $ChecksPassed++
        } else {
            Log "❌ $($page.Description) 访问失败: $($pageResult.Error)" "ERROR"
            $ChecksFailed++
        }
    }

    Log ""
    Log "========================================="
    Log "3. API 端点检查"
    Log "========================================="

    $ApiEndpoints = @(
        @{Path = "/api/health"; Description = "健康检查 API"},
        @{Path = "/api/games"; Description = "游戏列表 API"}
    )

    foreach ($endpoint in $ApiEndpoints) {
        $ApiUrl = "$AppUrl$($endpoint.Path)"
        Log "检查 $($endpoint.Description): $ApiUrl"
        
        $apiResult = Test-Url $ApiUrl
        if ($apiResult.Success) {
            Log "✅ $($endpoint.Description) 可访问 (HTTP $($apiResult.StatusCode))"
            $ChecksPassed++
        } else {
            Log "⚠️  $($endpoint.Description) 访问失败: $($apiResult.Error)" "WARN"
            $Warnings++
        }
    }

    Log ""
    Log "========================================="
    Log "4. 静态资源检查"
    Log "========================================="

    $StaticResources = @(
        @{Path = "/_next/static"; Description = "Next.js 静态资源"},
        @{Path = "/favicon.ico"; Description = "网站图标"}
    )

    foreach ($resource in $StaticResources) {
        $ResourceUrl = "$AppUrl$($resource.Path)"
        Log "检查 $($resource.Description): $ResourceUrl"
        
        $resourceResult = Test-Url $ResourceUrl
        if ($resourceResult.Success) {
            Log "✅ $($resource.Description) 可访问"
            $ChecksPassed++
        } else {
            Log "⚠️  $($resource.Description) 访问失败" "WARN"
            $Warnings++
        }
    }

    Log ""
    Log "========================================="
    Log "5. 性能测试"
    Log "========================================="

    if (-not $SkipPerformanceTests) {
        if (Check-Command "k6") {
            $K6Dir = "k6"
            if (Test-Path $K6Dir) {
                Log "运行烟雾测试..."
                Set-Location $K6Dir
                try {
                    $k6Result = k6 run smoke-test.js 2>&1
                    if ($LASTEXITCODE -eq 0) {
                        Log "✅ 烟雾测试通过"
                        $ChecksPassed++
                    } else {
                        Log "❌ 烟雾测试失败" "ERROR"
                        $ChecksFailed++
                        if ($Verbose) {
                            Log $k6Result "DEBUG"
                        }
                    }
                } catch {
                    Log "❌ 烟雾测试失败: $_" "ERROR"
                    $ChecksFailed++
                }
                Set-Location $ProjectRoot
            } else {
                Log "⚠️  k6 目录不存在，跳过性能测试" "WARN"
                $Warnings++
            }
        } else {
            Log "⚠️  k6 未安装，跳过性能测试" "WARN"
            $Warnings++
        }
    } else {
        Log "跳过性能测试（-SkipPerformanceTests 参数）"
    }

    Log ""
    Log "========================================="
    Log "6. 数据库连接检查"
    Log "========================================="

    if (Check-Command "supabase") {
        Log "检查 Supabase 连接..."
        try {
            $supabaseStatus = supabase status 2>&1
            if ($LASTEXITCODE -eq 0) {
                Log "✅ Supabase 连接正常"
                $ChecksPassed++
            } else {
                Log "⚠️  Supabase 连接检查失败" "WARN"
                $Warnings++
                if ($Verbose) {
                    Log $supabaseStatus "DEBUG"
                }
            }
        } catch {
            Log "⚠️  Supabase 连接检查失败: $_" "WARN"
            $Warnings++
        }
    } else {
        Log "⚠️  Supabase CLI 未安装，跳过数据库检查" "WARN"
        $Warnings++
    }

    Log ""
    Log "========================================="
    Log "7. Fly.io 部署状态检查"
    Log "========================================="

    if (Check-Command "flyctl") {
        Log "检查 Fly.io 部署状态..."
        try {
            $flyStatus = flyctl status 2>&1
            if ($LASTEXITCODE -eq 0) {
                Log "✅ Fly.io 部署状态正常"
                $ChecksPassed++
                
                if ($flyStatus -match "Running") {
                    Log "✅ 应用正在运行"
                } else {
                    Log "⚠️  应用状态异常" "WARN"
                    $Warnings++
                }
            } else {
                Log "⚠️  Fly.io 状态检查失败" "WARN"
                $Warnings++
                if ($Verbose) {
                    Log $flyStatus "DEBUG"
                }
            }
        } catch {
            Log "⚠️  Fly.io 状态检查失败: $_" "WARN"
            $Warnings++
        }
    } else {
        Log "⚠️  Fly.io CLI 未安装，跳过部署状态检查" "WARN"
        $Warnings++
    }

    Log ""
    Log "========================================="
    Log "8. 环境变量验证"
    Log "========================================="

    $EnvFile = ".env.production"
    if (Test-Path $EnvFile) {
        $EnvContent = Get-Content $EnvFile
        $CriticalEnvVars = @(
            "NEXT_PUBLIC_SUPABASE_URL",
            "NEXT_PUBLIC_SUPABASE_ANON_KEY",
            "NEXT_PUBLIC_APP_URL"
        )

        $allConfigured = $true
        foreach ($var in $CriticalEnvVars) {
            $match = $EnvContent | Where-Object { $_ -match "^$var=" }
            if ($match) {
                $value = ($match -split '=')[1]
                if ($value -eq 'your_' -or $value -eq 'https://your' -or $value -eq 'https://example.com') {
                    Log "⚠️  $var 需要设置实际值" "WARN"
                    $Warnings++
                    $allConfigured = $false
                }
            } else {
                Log "❌ $var 未配置" "ERROR"
                $ChecksFailed++
                $allConfigured = $false
            }
        }

        if ($allConfigured) {
            Log "✅ 关键环境变量已正确配置"
            $ChecksPassed++
        }
    } else {
        Log "❌ .env.production 文件不存在" "ERROR"
        $ChecksFailed++
    }

    Log ""
    Log "========================================="
    Log "9. 日志检查"
    Log "========================================="

    if (Check-Command "flyctl") {
        Log "检查应用日志..."
        try {
            $logs = flyctl logs --limit 50 2>&1
            $errorCount = ($logs | Select-String -Pattern "ERROR|error|Error" -CaseSensitive:$false).Count
            $warnCount = ($logs | Select-String -Pattern "WARN|warn|Warning" -CaseSensitive:$false).Count
            
            Log "📊 日志统计: $errorCount 个错误, $warnCount 个警告"
            
            if ($errorCount -eq 0) {
                Log "✅ 日志中未发现错误"
                $ChecksPassed++
            } else {
                Log "⚠️  日志中发现 $errorCount 个错误" "WARN"
                $Warnings++
                if ($Verbose) {
                    $logs | Select-String -Pattern "ERROR|error|Error" -CaseSensitive:$false | ForEach-Object {
                        Log $_.Line "DEBUG"
                    }
                }
            }
        } catch {
            Log "⚠️  日志检查失败: $_" "WARN"
            $Warnings++
        }
    } else {
        Log "⚠️  Fly.io CLI 未安装，跳过日志检查" "WARN"
        $Warnings++
    }

    Log ""
    Log "========================================="
    Log "10. 监控集成检查"
    Log "========================================="

    $SentryDsn = [Environment]::GetEnvironmentVariable("NEXT_PUBLIC_SENTRY_DSN")
    if ([string]::IsNullOrEmpty($SentryDsn)) {
        Log "⚠️  Sentry DSN 未配置，错误监控可能未启用" "WARN"
        $Warnings++
    } else {
        Log "✅ Sentry 已配置"
        $ChecksPassed++
    }

} catch {
    Log "❌ 验证过程中发生错误: $_" "ERROR"
    $ChecksFailed++
}

Log ""
Log "========================================="
Log "验证结果汇总"
Log "========================================="
Log "✅ 通过: $ChecksPassed"
Log "❌ 失败: $ChecksFailed"
Log "⚠️  警告: $Warnings"
Log "📄 日志文件: $LogFile"

if ($ChecksFailed -gt 0) {
    Log ""
    Log "❌ 部署后验证失败！请检查错误项。" "ERROR"
    exit 1
} elseif ($Warnings -gt 0) {
    Log ""
    Log "⚠️  部署后验证通过，但有警告。请检查警告项。" "WARN"
    exit 0
} else {
    Log ""
    Log "✅ 部署后验证全部通过！部署成功。" "INFO"
    exit 0
}
