Clear-Host
Write-Host "=== Taskee Backend Start ==="

# 1. Check port 4000
Write-Host "Checking if port 4000 is in use..."
$port = Get-NetTCPConnection -State Listen -LocalPort 4000 -ErrorAction SilentlyContinue

if ($port) {
    Write-Host "Port 4000 is in use. Stopping the process..."
    try {
        Stop-Process -Id $port.OwningProcess -Force
        Write-Host "Process stopped."
    } catch {
        Write-Host "Could not stop process: $_"
    }
} else {
    Write-Host "Port 4000 is free."
}

# 2. Start backend
Write-Host "Starting backend on http://localhost:4000 ..."
Start-Process powershell -ArgumentList "pnpm run start:dev"

# 3. Open Swagger after a short wait
Start-Sleep -Seconds 3
Write-Host "Opening Swagger UI..."
Start-Process "http://localhost:4000/swagger"

Write-Host "Backend is running and Swagger is open."
