Write-Host "🚀 Taskee Backend Starter"

# --- 1. Controleer .env en voeg JWT secrets toe indien ontbrekend ---
$envPath = ".env"
if (Test-Path $envPath) {
    $envContent = Get-Content $envPath -Raw
    if ($envContent -notmatch "JWT_SECRET") {
        Write-Host "✅ JWT vars ontbreken, worden automatisch toegevoegd..."
        Add-Content $envPath @" 

# Auto-injected fallback secrets
JWT_SECRET=superveiliggeheim123
JWT_EXPIRES_IN=7d
REFRESH_SECRET=refreshsupersecret456
REFRESH_EXPIRES_IN=30d
"@
    } else {
        Write-Host "✅ JWT vars aanwezig"
    }
} else {
    Write-Host "❌ .env ontbreekt - kan niet starten!"
    exit
}

# --- 2. Stop poort 4000 als iets blokkeert ---
Write-Host "🔍 Controleren of poort 4000 bezet is..."
$port = Get-NetTCPConnection -LocalPort 4000 -ErrorAction SilentlyContinue
if ($port) {
    Write-Host "🛑 Poort 4000 bezet, proces wordt gestopt..."
    Stop-Process -Id $port.OwningProcess -Force
    Start-Sleep -Seconds 1
    Write-Host "✅ Poort vrij"
} else {
    Write-Host "✅ Poort was al vrij"
}

# --- 3. Installeer dependencies indien nodig ---
if (!(Test-Path "node_modules")) {
    Write-Host "📦 node_modules ontbreken — pnpm install running..."
    pnpm install
}

# --- 4. Start backend in dev mode ---
Write-Host "🚀 Backend starten op http://localhost:4000 ..."
Start-Process powershell -ArgumentList "pnpm run start:dev"

# --- 5. Wacht 2 seconden en open swagger ---
Start-Sleep -Seconds 3
Start-Process "http://localhost:4000/swagger"

Write-Host "✅ Backend draait en Swagger geopend!"
