# PowerShell Master Launcher for H2S Guard System
# Location: Safe-Band/start-all.ps1 (also works when called from project root)

param(
    [switch]$SkipFrontend = $false,
    [switch]$NoBrowser = $false,
    [switch]$KeepAlive = $false
)

$ErrorActionPreference = "Continue"

$RootPath = $PSScriptRoot
if (-not $RootPath -or -not (Test-Path $RootPath)) {
    $RootPath = Get-Location
}

# Resolve paths whether running inside Safe-Band or parent directory
if (Test-Path (Join-Path $RootPath "backend\api-gateway")) {
    $SafeBandDir = $RootPath
} elseif (Test-Path (Join-Path $RootPath "Safe-Band\backend\api-gateway")) {
    $SafeBandDir = Join-Path $RootPath "Safe-Band"
} else {
    $SafeBandDir = $RootPath
}

$BackendPath = Join-Path $SafeBandDir "backend"
$FrontendPath = $SafeBandDir
$LogsPath = Join-Path $SafeBandDir "logs"

if (-not (Test-Path $LogsPath)) {
    New-Item -ItemType Directory -Path $LogsPath -Force | Out-Null
}

# Resolve AI Service directory (check ai-service, then root src)
if (Test-Path (Join-Path $SafeBandDir "ai-service\src\api_server.py")) {
    $AiServiceDir = Join-Path $SafeBandDir "ai-service"
} elseif (Test-Path (Join-Path $RootPath "src\api_server.py")) {
    $AiServiceDir = $RootPath
} elseif (Test-Path (Join-Path $RootPath "Safe-Band\ai-service\src\api_server.py")) {
    $AiServiceDir = Join-Path $RootPath "Safe-Band\ai-service"
} else {
    $AiServiceDir = $SafeBandDir
}

$PidFile = Join-Path $SafeBandDir ".launcher-pids.json"
$startedProcesses = [System.Collections.Generic.List[PSObject]]::new()

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "       H2S GUARD - UNIFIED APPLICATION LAUNCHER             " -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "Project Root: $SafeBandDir" -ForegroundColor Gray
Write-Host "AI Service:   $AiServiceDir" -ForegroundColor Gray
Write-Host "Time:         $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')`n" -ForegroundColor Gray

# ------------------------------------------------------------
# 1. PREREQUISITE: MySQL DATABASE CHECK
# ------------------------------------------------------------
Write-Host "[1/4] Verifying MySQL Database on port 3306..." -ForegroundColor Yellow
$mysqlCheck = Test-NetConnection -ComputerName localhost -Port 3306 -WarningAction SilentlyContinue -InformationLevel Quiet
if (-not $mysqlCheck) {
    Write-Host "  [!] MySQL is not listening on port 3306. Attempting to start MySQL service..." -ForegroundColor Yellow
    try {
        Start-Service -Name "MySQL80" -ErrorAction Stop
        Start-Sleep -Seconds 2
        $mysqlCheck = Test-NetConnection -ComputerName localhost -Port 3306 -WarningAction SilentlyContinue -InformationLevel Quiet
    } catch {
        Write-Host "  [ERROR] Could not start MySQL80 service automatically." -ForegroundColor Red
        Write-Host "  Please ensure MySQL Server is installed and running on port 3306." -ForegroundColor Red
        exit 1
    }
}

if ($mysqlCheck) {
    Write-Host "  [+] MySQL Database is READY on port 3306" -ForegroundColor Green
} else {
    Write-Host "  [ERROR] MySQL verification failed. Aborting startup." -ForegroundColor Red
    exit 1
}

# ------------------------------------------------------------
# 2. RESOLVE TOOLS (Maven, Python, Node)
# ------------------------------------------------------------
$mvnCmd = "mvn"
if (-not (Get-Command "mvn" -ErrorAction SilentlyContinue)) {
    $potentialMvn = "C:\Users\siddh\git\AgriSmart-main\maven\apache-maven-3.9.6\bin\mvn.cmd"
    if (Test-Path $potentialMvn) {
        $mvnCmd = $potentialMvn
    }
}

$pythonCmd = "python"
if (-not (Get-Command "python" -ErrorAction SilentlyContinue)) {
    $potentialPy = "C:\Users\siddh\AppData\Local\Programs\Python\Python311\python.exe"
    if (Test-Path $potentialPy) {
        $pythonCmd = $potentialPy
    }
}

# ------------------------------------------------------------
# 3. DEFINE SERVICES AND DEPENDENCY ORDER
# ------------------------------------------------------------
$services = @(
    @{
        Name = "ai-service"
        Display = "FastAPI AI Analysis"
        Port = 5000
        Dir = $AiServiceDir
        Args = "`"$pythonCmd`" src/api_server.py"
        Log = Join-Path $LogsPath "ai-service.log"
        HealthUrl = "http://localhost:5000/api/health"
    },
    @{
        Name = "auth-service"
        Display = "Auth Microservice"
        Port = 8081
        Dir = (Join-Path $BackendPath "auth-service")
        Args = "`"$mvnCmd`" spring-boot:run"
        Log = Join-Path $LogsPath "auth-service.log"
        HealthUrl = "http://localhost:8081/actuator/health"
    },
    @{
        Name = "user-service"
        Display = "User Microservice"
        Port = 8082
        Dir = (Join-Path $BackendPath "user-service")
        Args = "`"$mvnCmd`" spring-boot:run"
        Log = Join-Path $LogsPath "user-service.log"
        HealthUrl = "http://localhost:8082/actuator/health"
    },
    @{
        Name = "notification-service"
        Display = "Notification Microservice"
        Port = 8084
        Dir = (Join-Path $BackendPath "notification-service")
        Args = "`"$mvnCmd`" spring-boot:run"
        Log = Join-Path $LogsPath "notification-service.log"
        HealthUrl = "http://localhost:8084/actuator/health"
    },
    @{
        Name = "exposure-service"
        Display = "Exposure Microservice"
        Port = 8083
        Dir = (Join-Path $BackendPath "exposure-service")
        Args = "`"$mvnCmd`" spring-boot:run"
        Log = Join-Path $LogsPath "exposure-service.log"
        HealthUrl = "http://localhost:8083/actuator/health"
    },
    @{
        Name = "ai-analysis-service"
        Display = "AI Bridge Microservice"
        Port = 8085
        Dir = (Join-Path $BackendPath "ai-analysis-service")
        Args = "`"$mvnCmd`" spring-boot:run"
        Log = Join-Path $LogsPath "ai-analysis-service.log"
        HealthUrl = "http://localhost:8085/actuator/health"
    },
    @{
        Name = "api-gateway"
        Display = "Spring Cloud Gateway"
        Port = 8080
        Dir = (Join-Path $BackendPath "api-gateway")
        Args = "`"$mvnCmd`" spring-boot:run"
        Log = Join-Path $LogsPath "api-gateway.log"
        HealthUrl = "http://localhost:8080/actuator/health"
    }
)

if (-not $SkipFrontend) {
    $services += @{
        Name = "expo-frontend"
        Display = "Expo App & Web Bundler"
        Port = 8088
        Dir = $FrontendPath
        Args = "npx expo start --web --port 8088"
        Log = Join-Path $LogsPath "expo-frontend.log"
        HealthUrl = "http://localhost:8088"
    }
}

# ------------------------------------------------------------
# 4. START SERVICES
# ------------------------------------------------------------
Write-Host "`n[2/4] Starting Services in Dependency Order..." -ForegroundColor Yellow

foreach ($svc in $services) {
    $name = $svc.Name
    $display = $svc.Display
    $port = $svc.Port
    $log = $svc.Log
    $workDir = $svc.Dir

    $alreadyListening = Test-NetConnection -ComputerName localhost -Port $port -WarningAction SilentlyContinue -InformationLevel Quiet

    if ($alreadyListening) {
        Write-Host "  [+] $display is already running on port $port" -ForegroundColor Green
    } else {
        Write-Host "  [>] Launching $display (port $port)..." -ForegroundColor Cyan
        
        # Clear old log file
        if (Test-Path $log) {
            Remove-Item $log -Force -ErrorAction SilentlyContinue
        }

        # Start process redirecting output to log file
        $pinfo = New-Object System.Diagnostics.ProcessStartInfo
        $pinfo.FileName = "cmd.exe"
        $pinfo.Arguments = "/c cd /d `"$workDir`" && $($svc.Args) > `"$log`" 2>&1"
        $pinfo.WindowStyle = [System.Diagnostics.ProcessWindowStyle]::Hidden
        $pinfo.CreateNoWindow = $true
        $pinfo.UseShellExecute = $true

        $process = [System.Diagnostics.Process]::Start($pinfo)
        if ($process) {
            $startedProcesses.Add([PSCustomObject]@{
                Name = $name
                Pid = $process.Id
                Port = $port
            })
        }
    }
}

# Save started PIDs
if ($startedProcesses.Count -gt 0) {
    $startedProcesses | ConvertTo-Json | Set-Content -Path $PidFile -Force
}

# ------------------------------------------------------------
# 5. HEALTH CHECKS & READINESS POLLING
# ------------------------------------------------------------
Write-Host "`n[3/4] Performing Service Health Checks (waiting for all endpoints)..." -ForegroundColor Yellow

$maxAttempts = 40
$allHealthy = $false
$attempt = 0

while ($attempt -lt $maxAttempts -and -not $allHealthy) {
    Start-Sleep -Seconds 2
    $attempt++
    $pending = 0

    foreach ($svc in $services) {
        $p = $svc.Port
        $check = Test-NetConnection -ComputerName localhost -Port $p -WarningAction SilentlyContinue -InformationLevel Quiet
        if (-not $check) {
            $pending++
        }
    }

    if ($pending -eq 0) {
        $allHealthy = $true
    } else {
        Write-Host -NoNewline "." -ForegroundColor Gray
    }
}
Write-Host ""

# ------------------------------------------------------------
# 6. SYSTEM STATUS DASHBOARD
# ------------------------------------------------------------
Write-Host "`n============================================================" -ForegroundColor Cyan
Write-Host "             H2S GUARD SYSTEM STATUS SUMMARY                " -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan

$hasFailures = $false

foreach ($svc in $services) {
    $display = $svc.Display.PadRight(28)
    $port = "$($svc.Port)".PadRight(6)
    $isUp = Test-NetConnection -ComputerName localhost -Port $svc.Port -WarningAction SilentlyContinue -InformationLevel Quiet

    if ($isUp) {
        Write-Host "  $display | Port $port | " -NoNewline -ForegroundColor White
        Write-Host "[ ONLINE  ]" -ForegroundColor Green
    } else {
        $hasFailures = $true
        Write-Host "  $display | Port $port | " -NoNewline -ForegroundColor White
        Write-Host "[ OFFLINE ]" -ForegroundColor Red
        Write-Host "    -> Log File: $($svc.Log)" -ForegroundColor DarkGray
        if (Test-Path $svc.Log) {
            $recentLog = Get-Content $svc.Log -Tail 10 -ErrorAction SilentlyContinue
            if ($recentLog) {
                Write-Host "    -> Recent Error Output:" -ForegroundColor Red
                $recentLog | ForEach-Object { Write-Host "       $_" -ForegroundColor DarkRed }
            }
        }
    }
}

Write-Host "============================================================" -ForegroundColor Cyan

if (-not $hasFailures) {
    Write-Host "`n[4/4] All H2S Guard services are healthy and synchronized!" -ForegroundColor Green
    Write-Host "`nAccess URLs:" -ForegroundColor Cyan
    Write-Host "  Web Dashboard:        http://localhost:8088" -ForegroundColor White
    Write-Host "  Expo Mobile Bundler:  http://localhost:8088" -ForegroundColor White
    Write-Host "  API Gateway:          http://localhost:8080" -ForegroundColor White
    Write-Host "  AI Spring Service:    http://localhost:8085/actuator/health" -ForegroundColor White
    Write-Host "  AI FastAPI Server:    http://localhost:5000/api/health" -ForegroundColor White
    Write-Host "  Stop All Services:    .\stop-all.ps1`n" -ForegroundColor Gray

    if (-not $NoBrowser -and -not $SkipFrontend) {
        Start-Process "http://localhost:8088" -ErrorAction SilentlyContinue
    }
} else {
    Write-Host "`n[!] Some services failed to start. Review the log details above or check logs/ folder." -ForegroundColor Yellow
}

if ($KeepAlive) {
    Write-Host "`n[KeepAlive] Launcher monitoring active. Press Ctrl+C or run stop-all to stop services." -ForegroundColor Cyan
    while ($true) {
        Start-Sleep -Seconds 10
    }
}
