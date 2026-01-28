Param(
    [string]$CommitMessage = "chore: auto deploy",
    [string]$VersionType = "patch"
)

Write-Host "=== Quantum Finance Engine: Auto Deploy Script ==="

node ./scripts/version-bump.cjs $VersionType

git add .
git commit -m $CommitMessage
git push origin main

Write-Host "Deploying web app to Vercel..."
vercel --prod --cwd ./apps/web

Write-Host "Deploying api app to Vercel..."
vercel --prod --cwd ./apps/api

Write-Host "=== Deployment complete ==="
