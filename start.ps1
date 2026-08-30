Set-Location $PSScriptRoot
if (-not (Test-Path node_modules)) {
  Write-Host "Installing Callboard..."
  npm.cmd install
}
Write-Host "Callboard — http://localhost:3200"
npm.cmd run dev
