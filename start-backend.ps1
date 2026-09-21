# PowerShell Script to Launch All H2S Guard Backend Microservices and Verify Gateway Connectivity
# File: F:\Desktop\H2S Guard\H2S\start-backend.ps1

$BackendDir = "F:\Desktop\H2S Guard\H2S\backend"
& "$BackendDir\start-backend.ps1" -BackendDir $BackendDir
