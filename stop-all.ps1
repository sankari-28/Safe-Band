# PowerShell script to stop all H2S Guard services cleanly
# Location: Safe-Band/stop-all.ps1

$ErrorActionPreference = "SilentlyContinue"

Write-Host "`n============================================================" -ForegroundColor Cyan
Write-Host "   STOPPING H2S GUARD SERVICES" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan

$RootPath = $PSScriptRoot
if (-not $RootPath) { $RootPath = Get-Location }
$PidFile = Join-Path $RootPath ".launcher-pids.json"

# 1. Stop tracked PIDs from launcher file
if (Test-Path $PidFile) {
    try {
        $pidsJson = Get-Content $PidFile -Raw | ConvertFrom-Json
        foreach ($proc in $pidsJson) {
            $pidToKill = $proc.Pid
            $pName = $proc.Name
            $p = Get-Process -Id $pidToKill -ErrorAction SilentlyContinue
            if ($p) {
                Write-Host "[-] Terminating $pName (PID: $pidToKill)..." -ForegroundColor Yellow
                Stop-Process -Id $pidToKill -Force -ErrorAction SilentlyContinue
            }
        }
        Remove-Item $PidFile -Force -ErrorAction SilentlyContinue
    } catch {
        Write-Host "Notice reading PID file: $($_.Exception.Message)" -ForegroundColor Gray
    }
}

# 2. Check and stop any remaining processes listening on H2S Guard ports
# Ports: AI Python (5000), Gateway (8080), Auth (8081), User (8082), Exposure (8083), Notification (8084), AI Spring (8085), Frontend (8088), Expo (8090)
$targetPorts = @(5000, 8080, 8081, 8082, 8083, 8084, 8085, 8088, 8090)

foreach ($port in $targetPorts) {
    try {
        $connections = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
        foreach ($conn in $connections) {
            $owningPid = $conn.OwningProcess
            # Ensure we do not kill MySQL (3306) or system processes
            if ($owningPid -and $owningPid -gt 4) {
                $proc = Get-Process -Id $owningPid -ErrorAction SilentlyContinue
                if ($proc -and $proc.ProcessName -ne "mysqld") {
                    Write-Host "[-] Freeing port $($port): Terminating $($proc.ProcessName) (PID: $owningPid)..." -ForegroundColor Yellow
                    Stop-Process -Id $owningPid -Force -ErrorAction SilentlyContinue
                }
            }
        }
    } catch {}
}

Start-Sleep -Seconds 1
Write-Host "`n[+] All H2S Guard application services have been stopped." -ForegroundColor Green
Write-Host "============================================================`n" -ForegroundColor Cyan
