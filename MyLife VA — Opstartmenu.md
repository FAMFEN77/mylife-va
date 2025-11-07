✅ Optie 1 — Alleen Backend starten (poort 4000)
cd "D:\Taskee\backend"
pnpm install
pnpm run start:dev


➡ Backend beschikbaar op:
http://localhost:4000

✅ Optie 2 — Backend starten + Swagger automatisch openen
cd "D:\Taskee\backend"
pnpm install
pnpm run start:dev &
Start-Process "http://localhost:4000/swagger"


➡ Swagger documentatie:
http://localhost:4000/swagger

✅ Optie 3 — Alleen Frontend starten (poort 4001)
cd "D:\Taskee\frontend"
pnpm install
pnpm run dev


➡ Frontend beschikbaar op:
http://localhost:4001

✅ Optie 4 — Backend + Frontend tegelijk starten
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'D:\Taskee\backend'; pnpm install; pnpm run start:dev"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'D:\Taskee\frontend'; pnpm install; pnpm run dev"


✅ Backend: http://localhost:4000

✅ Frontend: http://localhost:4001

✅ Optie 5 — Backend + Swagger + Frontend + API-Test
Write-Host "🚀 Starting Taskee..."

# BACKEND
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'D:\Taskee\backend'; pnpm install; pnpm run start:dev"
Start-Sleep -Seconds 6

# OPEN SWAGGER
Start-Process "http://localhost:4000/swagger"

# FRONTEND
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'D:\Taskee\frontend'; pnpm install; pnpm run dev"
Start-Sleep -Seconds 4

# API TEST
try {
    $result = Invoke-WebRequest -Uri "http://localhost:4000/api/health" -Method GET -UseBasicParsing
    Write-Host "✅ API responded OK:" $result.StatusCode
} catch {
    Write-Host "❌ API unreachable — check backend logs"
}

Write-Host "✅ Taskee is fully running!"


✔ Opent Swagger
✔ Start backend én frontend
✔ Test of API werkt

✅ Optie 6 — Alles starten met 1 script

Voeg dit bestand toe als start-mylife.ps1:

Write-Host "🚀 Starting Taskee..."

Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'D:\Taskee\backend'; pnpm run start:dev"
Start-Sleep -Seconds 6
Start-Process "http://localhost:4000/swagger"

Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'D:\Taskee\frontend'; pnpm run dev"
Start-Sleep -Seconds 4

try {
    $result = Invoke-WebRequest -Uri "http://localhost:4000/api/health" -Method GET -UseBasicParsing
    Write-Host "✅ API responded OK:" $result.StatusCode
} catch {
    Write-Host "❌ API unreachable"
}

Write-Host "✅ Taskee is running on ports 4000 + 4001!"


Run dit met:

cd "D:\Taskee"
./start-mylife.ps1

taskkill /PID 12552 /F
taskkill /PID 14496 /F
netstat -ano | findstr :4000

 .\restart-all.ps1 -All
