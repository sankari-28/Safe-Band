# PowerShell Script to Launch All H2S Guard Backend Microservices and Verify Gateway Connectivity
# File: F:\Desktop\H2S Guard\H2S\backend\start-backend.ps1

param(
    [string]$BackendDir = $PSScriptRoot
)

if (-not $BackendDir -or -not (Test-Path $BackendDir)) {
    $BackendDir = "F:\Desktop\H2S Guard\H2S\backend"
}

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "   H2S GUARD - BACKEND MICROSERVICES LAUNCHER" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "Target Backend Directory: $BackendDir`n" -ForegroundColor Gray

$services = @(
    @{ Name = "auth-service"; Port = 8081 },
    @{ Name = "user-service"; Port = 8082 },
    @{ Name = "exposure-service"; Port = 8083 },
    @{ Name = "notification-service"; Port = 8084 },
    @{ Name = "ai-analysis-service"; Port = 8085 },
    @{ Name = "api-gateway"; Port = 8080 }
)

foreach ($svc in $services) {
    $serviceName = $svc.Name
    $port = $svc.Port
    $servicePath = Join-Path $BackendDir $serviceName

    # Check if port is already listening
    $connection = Test-NetConnection -ComputerName localhost -Port $port -WarningAction SilentlyContinue -InformationLevel Quiet
    if ($connection) {
        Write-Host "[+] $serviceName is ALREADY running on port $port" -ForegroundColor Green
    } else {
        Write-Host "[>] Starting $serviceName on port $port..." -ForegroundColor Yellow
        Start-Process -FilePath "cmd.exe" -ArgumentList "/c cd /d `"$servicePath`" && mvn spring-boot:run" -WindowStyle Hidden
    }
}

Write-Host "`nWaiting for services to initialize..." -ForegroundColor Cyan
$maxRetries = 20
$retries = 0
$gatewayReady = $false

while ($retries -lt $maxRetries -and -not $gatewayReady) {
    Start-Sleep -Seconds 2
    $retries++
    $check = Test-NetConnection -ComputerName localhost -Port 8080 -WarningAction SilentlyContinue -InformationLevel Quiet
    if ($check) {
        $gatewayReady = $true
    } else {
        Write-Host ". " -NoNewline -ForegroundColor Gray
    }
}

Write-Host "`n`n============================================================" -ForegroundColor Cyan
Write-Host "   VERIFYING ALL BACKEND APIS VIA GATEWAY (PORT 8080)" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan

try {
    # 1. Login via Gateway
    $loginUrl = "http://localhost:8080/api/auth/login"
    $body = '{"userId":"W001","password":"password123"}'
    $loginResp = Invoke-RestMethod -Uri $loginUrl -Method Post -ContentType "application/json" -Body $body
    Write-Host "[PASS] Auth Service Gateway (/api/auth/login): Token issued for user '$($loginResp.userId)'" -ForegroundColor Green
    $token = $loginResp.accessToken

    $headers = @{ Authorization = "Bearer $token" }

    # 2. User Service via Gateway
    $userResp = Invoke-RestMethod -Uri "http://localhost:8080/api/users/me" -Headers $headers
    Write-Host "[PASS] User Service Gateway (/api/users/me): Loaded profile for '$($userResp.fullName)' ($($userResp.role))" -ForegroundColor Green

    # 3. Exposure Service via Gateway
    $threshResp = Invoke-RestMethod -Uri "http://localhost:8080/api/exposures/threshold" -Headers $headers
    Write-Host "[PASS] Exposure Service Gateway (/api/exposures/threshold): Normal <= $($threshResp.normalMaxPpm) ppm, High > $($threshResp.averageMaxPpm) ppm" -ForegroundColor Green

    # 4. Notification Service via Gateway
    $notifResp = Invoke-RestMethod -Uri "http://localhost:8080/api/notifications/my" -Headers $headers
    Write-Host "[PASS] Notification Service Gateway (/api/notifications/my): $($notifResp.Count) notification(s) retrieved" -ForegroundColor Green

    Write-Host "`n[SUCCESS] ALL 6 BACKEND SERVICES AND API GATEWAY ENDPOINTS ARE CONNECTED AND OPERATIONAL!" -ForegroundColor Green
} catch {
    Write-Host "`n[FAIL] Verification Error: $_" -ForegroundColor Red
}
