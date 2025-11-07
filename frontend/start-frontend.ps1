Write-Host "Starting Taskee Frontend"

$frontendPort = 4001

# 1. Check if port is already used and stop the process if needed
Write-Host "Checking if port $frontendPort is in use..."
$connection = Get-NetTCPConnection -LocalPort $frontendPort -State Listen -ErrorAction SilentlyContinue
if ($connection) {
  Write-Host "Port $frontendPort is in use (PID $($connection.OwningProcess)). Stopping process..."
  Stop-Process -Id $connection.OwningProcess -Force
  Start-Sleep -Seconds 1
  Write-Host "Port $frontendPort freed."
} else {
  Write-Host "Port already free." 
}

# 2. Install dependencies if node_modules is missing
if (!(Test-Path "node_modules")) {
  Write-Host "node_modules missing – running pnpm install..."
  pnpm install
}

# 3. Start frontend on the fixed port
Write-Host "Starting frontend at http://localhost:$frontendPort ..."
pnpm run dev
