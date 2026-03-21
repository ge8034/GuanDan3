# 列出所有已安装的 Claude 技能

Write-Host "=== 已安装的 Claude 技能 ===" -ForegroundColor Cyan
Write-Host ""

$skillsPath = Join-Path $HOME ".claude\skills"
if (Test-Path $skillsPath) {
    $skills = Get-ChildItem -Path $skillsPath -Directory | ForEach-Object {
        $skillPath = Join-Path $_.FullName "skill.md"
        if (Test-Path $skillPath) {
            $skillInfo = Get-Content $skillPath -Raw | Select-String -Pattern "TRIGGER|DO NOT TRIGGER" -Context 0,3
            $triggerLine = if ($skillInfo) { $skillInfo[0].Line.Trim() } else { "未找到 TRIGGER 信息" }
            $doNotTriggerLine = if ($skillInfo -and $skillInfo.Count -gt 1) { $skillInfo[1].Line.Trim() } else { "无" }

            [PSCustomObject]@{
                Name = $_.Name
                Trigger = $triggerLine
                "Do Not Trigger" = $doNotTriggerLine
            }
        } else {
            [PSCustomObject]@{
                Name = $_.Name
                Trigger = "未找到 skill.md"
                "Do Not Trigger" = "无"
            }
        }
    }

    $skills | Format-Table -AutoSize
    Write-Host ""
    Write-Host "总计: $($skills.Count) 个技能" -ForegroundColor Green
} else {
    Write-Host "❌ 未找到技能目录: $skillsPath" -ForegroundColor Red
}
Write-Host ""
