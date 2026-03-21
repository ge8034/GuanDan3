# Simple Claude Skills Repo Setup
$GITHUB_USERNAME = Read-Host "Enter your GitHub username"

# Create directory
cd ~
New-Item -ItemType Directory -Force -Path my-claude-skills | Out-Null
cd my-claude-skills

# Init git
git init

# Create README
"# My Claude Skills
" | Out-File -FilePath README.md -Encoding UTF8

# Create .claude directory
New-Item -ItemType Directory -Force -Path ".claude\skills" | Out-Null

# Copy skills
$source = Join-Path $HOME ".claude\skills"
if (Test-Path $source) {
    Copy-Item -Recurse -Force "$source\*" ".claude\skills\"
    $count = (Get-ChildItem ".claude\skills" -Directory).Count
    Write-Host "Copied $count skills" -ForegroundColor Green
}

# Commit
git add .
git commit -m "Initial commit"

Write-Host ""
Write-Host "Repo created!" -ForegroundColor Green
Write-Host "Next:"
Write-Host "git remote add origin https://github.com/$GITHUB_USERNAME/my-claude-skills.git"
Write-Host "git branch -M main"
Write-Host "git push -u origin main"
