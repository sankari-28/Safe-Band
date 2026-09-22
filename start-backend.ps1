# PowerShell Script to Launch All H2S Guard Backend Microservices and Verify Gateway Connectivity
# File: F:\Desktop\H2S Guard\H2S\start-backend.ps1

$BackendDir = "$PSScriptRoot\backend"
if (Test-Path "$BackendDir\start-backend.ps1") {
    & "$BackendDir\start-backend.ps1" -BackendDir $BackendDir
} else {
    Write-Host "Backend directory not found at $BackendDir" -ForegroundColor Red
}
