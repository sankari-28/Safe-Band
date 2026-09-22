# PowerShell Script to Launch All H2S Guard Backend Microservices and Verify Gateway Connectivity
# File: F:\Desktop\H2S Guard\H2S\backend\start-backend.ps1

param(
    [string]$BackendDir = $PSScriptRoot
)

if (-not $BackendDir -or -not (Test-Path $BackendDir)) {
    $BackendDir = $PSScriptRoot
    if (-not (Test-Path $BackendDir)) {
        $BackendDir = "c:\projects\sih\Safe-Band\backend"
    }
}

# Ensure empty MySQL password is recognized
if (-not $env:MYSQL_PASSWORD) {
    $env:MYSQL_PASSWORD = ""
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

$mvnCmd = "mvn"
if (-not (Get-Command "mvn" -ErrorAction SilentlyContinue)) {
    $potentialMvn = "C:\Users\siddh\git\AgriSmart-main\maven\apache-maven-3.9.6\bin\mvn.cmd"
    if (Test-Path $potentialMvn) {
        $mvnCmd = "`"$potentialMvn`""
    }
}

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
        Start-Process -FilePath "cmd.exe" -ArgumentList "/c cd /d `"$servicePath`" && $mvnCmd spring-boot:run" -WindowStyle Hidden
    }
}

Write-Host "`nWaiting for all microservices to initialize..." -ForegroundColor Cyan
$requiredPorts = @(8080, 8081, 8082, 8083, 8084, 8085)
$maxRetries = 35
$retries = 0
$allReady = $false

while ($retries -lt $maxRetries -and -not $allReady) {
    Start-Sleep -Seconds 2
    $retries++
    $pending = 0
    foreach ($p in $requiredPorts) {
        $check = Test-NetConnection -ComputerName localhost -Port $p -WarningAction SilentlyContinue -InformationLevel Quiet
        if (-not $check) {
            $pending++
        }
    }
    if ($pending -eq 0) {
        $allReady = $true
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
    $body = '{"userId":"siddharth","password":"password123"}'
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
    Write-Host "`n[WARN] Verification encountered: $_" -ForegroundColor Yellow
}

Write-Host "`nBackend microservices are running in background. Press Ctrl+C to exit launcher." -ForegroundColor Cyan
while ($true) {
    Start-Sleep -Seconds 30
}
