[CmdletBinding()]
param(
    [switch]$All,
    [switch]$Backend,
    [switch]$Frontend,
    [switch]$Status,
    [switch]$Force
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$script:RepositoryRoot = $PSScriptRoot
$script:BackendPath    = Join-Path $script:RepositoryRoot 'backend'
$script:FrontendPath   = Join-Path $script:RepositoryRoot 'frontend'
$script:LogFile        = Join-Path $script:RepositoryRoot 'logs\restart.log'

function Initialize-Logger {
    $directory = Split-Path $script:LogFile
    if (-not (Test-Path $directory)) {
        New-Item -ItemType Directory -Path $directory -Force | Out-Null
    }
    $header = "`n[{0}] === Restart session started ===" -f (Get-Date -Format 'yyyy-MM-dd HH:mm:ss')
    Add-Content -Path $script:LogFile -Value $header
}

function Log-Message {
    param([string]$Message)
    $entry = "[{0}] {1}" -f (Get-Date -Format 'yyyy-MM-dd HH:mm:ss'), $Message
    Add-Content -Path $script:LogFile -Value $entry
}

function Write-Status {
    param(
        [string]$Message,
        [ConsoleColor]$Color = [ConsoleColor]::White
    )
    Write-Host $Message -ForegroundColor $Color
    Log-Message $Message
}

function Get-PortProcess {
    param([int]$Port)

    try {
        $connections = Get-NetTCPConnection -LocalPort $Port -ErrorAction Stop
        $processIds = $connections | Select-Object -ExpandProperty OwningProcess -Unique
    } catch {
        $processIds = @()
    }

    $processIds = @($processIds)

    if ($processIds.Count -eq 0) {
        try {
            $lines = netstat -ano | Select-String ":$Port\s"
            $processIds = @()
            foreach ($line in $lines) {
                if ($line.Line -match '\s+(LISTENING|ESTABLISHED)\s+(\d+)$') {
                    $processIds += [int]$Matches[2]
                }
            }
            $processIds = $processIds | Sort-Object -Unique
        } catch {
            return @()
        }
    }

    $results = @()
    foreach ($procId in $processIds) {
        $process = Get-Process -Id $procId -ErrorAction SilentlyContinue
        $processInfo = Get-CimInstance Win32_Process -Filter "ProcessId = $procId" -ErrorAction SilentlyContinue
        $commandLine = if ($processInfo -and $processInfo.PSObject.Properties['CommandLine']) {
            $processInfo.CommandLine
        } else {
            $null
        }
        $results += [pscustomobject]@{
            Port        = $Port
            Id          = $procId
            Name        = $process.ProcessName
            CommandLine = $commandLine
        }
    }

    return $results
}

function Kill-Port {
    param(
        [int]$Port,
        [switch]$ForceKill
    )

    $processes = @(Get-PortProcess -Port $Port)
    if ($processes.Count -eq 0) {
        Write-Status ("Port {0} is vrij." -f $Port) ([ConsoleColor]::Green)
        return
    }

    foreach ($proc in $processes) {
        $procName = if ($proc.Name) { $proc.Name } else { 'onbekend' }
        Write-Status ("Port {0} wordt gebruikt door PID {1} ({2})" -f $Port, $proc.Id, $procName) ([ConsoleColor]::Yellow)
        if ($proc.CommandLine) {
            Write-Status ("  Command line: {0}" -f $proc.CommandLine) ([ConsoleColor]::DarkGray)
        }

        $shouldKill = $ForceKill
        if (-not $shouldKill) {
            $response = Read-Host "Proces $($proc.Id) beëindigen? [y/N]"
            $shouldKill = $response -match '^(y|j|yes)$'
        }

        if ($shouldKill) {
            try {
                Stop-Process -Id $proc.Id -Force -ErrorAction Stop
                Write-Status ("Proces {0} beëindigd." -f $proc.Id) ([ConsoleColor]::Green)
            } catch {
                Write-Status ("Kon proces {0} niet beëindigen: {1}" -f $proc.Id, $_.Exception.Message) ([ConsoleColor]::Red)
            }
        } else {
            Write-Status ("Proces {0} blijft actief; poort {1} mogelijk bezet." -f $proc.Id, $Port) ([ConsoleColor]::Red)
        }
    }

    Start-Sleep -Seconds 1
    if (@(Get-PortProcess -Port $Port).Count -gt 0) {
        Write-Status ("Port {0} blijft bezet. Draai handmatig: netstat -ano | findstr :{0}" -f $Port) ([ConsoleColor]::Red)
    } else {
        Write-Status ("Port {0} is nu vrij." -f $Port) ([ConsoleColor]::Green)
    }
}

function Stop-ProcessesUnderPath {
    param([string]$Path)

    $normalized = $Path.ToLowerInvariant()
    $targets = Get-CimInstance Win32_Process -Filter "Name = 'node.exe' OR Name = 'pnpm.exe' OR Name = 'powershell.exe' OR Name = 'cmd.exe'" -ErrorAction SilentlyContinue |
        Where-Object { $_.CommandLine -and $_.CommandLine.ToLowerInvariant().Contains($normalized) }

    foreach ($proc in $targets) {
        if ($proc.ProcessId -eq $PID) { continue }
        try {
            Stop-Process -Id $proc.ProcessId -Force -ErrorAction Stop
            Write-Status ("Proces {0} ({1}) gestopt." -f $proc.ProcessId, $proc.Name) ([ConsoleColor]::Green)
        } catch {
            Write-Status ("Kon proces {0} niet stoppen: {1}" -f $proc.ProcessId, $_.Exception.Message) ([ConsoleColor]::Red)
        }
    }
}

function Wait-ForPort {
    param(
        [int]$Port,
        [int]$TimeoutSeconds = 30
    )

    $elapsed = 0
    while ($elapsed -lt $TimeoutSeconds) {
        $isOpen = Test-NetConnection -ComputerName 'localhost' -Port $Port -WarningAction SilentlyContinue -InformationLevel Quiet
        if ($isOpen) { return $true }
        Start-Sleep -Seconds 1
        $elapsed++
    }
    return $false
}

function Start-PnpmWatcher {
    param(
        [string[]]$Arguments,
        [string]$WorkingDirectory,
        [string]$Description,
        [hashtable]$EnvironmentOverrides
    )

    Write-Status ("Start {0} in nieuw venster..." -f $Description) ([ConsoleColor]::Cyan)
    $envPrefix = ''
    if ($EnvironmentOverrides) {
        foreach ($key in $EnvironmentOverrides.Keys) {
            $value = $EnvironmentOverrides[$key]
            $escapedValue = ($value -as [string]).Replace('"', '""')
            $envPrefix += "$" + "env:$key = `"$escapedValue`"; "
        }
    }

    $command = "Set-Location `"$WorkingDirectory`"; ${envPrefix}pnpm $($Arguments -join ' ');"
    Start-Process -FilePath 'powershell.exe' -ArgumentList @('-NoProfile', '-NoExit', '-Command', $command) -WorkingDirectory $WorkingDirectory | Out-Null
    Write-Status ("Opgestart: {0}" -f $Description) ([ConsoleColor]::Green)
}

function Show-Status {
    Write-Status "=== Huidige status ===" ([ConsoleColor]::White)
    foreach ($port in 4000, 4001) {
        $processes = @(Get-PortProcess -Port $port)
        if ($processes.Count -gt 0) {
            foreach ($proc in $processes) {
                $procName = if ($proc.Name) { $proc.Name } else { 'onbekend' }
                Write-Status ("Port {0}: PID {1} ({2})" -f $port, $proc.Id, $procName) ([ConsoleColor]::Yellow)
            }
        } else {
            Write-Status ("Port {0}: vrij" -f $port) ([ConsoleColor]::Green)
        }
    }
    Write-Status "======================" ([ConsoleColor]::White)
}

function Restart-Backend {
    param([switch]$ForceKill)

    Write-Status "Backend herstarten..." ([ConsoleColor]::White)
    Kill-Port -Port 4000 -ForceKill:$ForceKill
    Stop-ProcessesUnderPath -Path $script:BackendPath
    Start-PnpmWatcher -Arguments @('run','start:dev') -WorkingDirectory $script:BackendPath -Description 'Backend start:dev'

    if (-not (Wait-ForPort -Port 4000 -TimeoutSeconds 45)) {
        Write-Status "Backend lijkt niet te luisteren op poort 4000 na 45s." ([ConsoleColor]::Red)
    }
}

function Restart-Frontend {
    param([switch]$ForceKill)

    Write-Status "Frontend herstarten..." ([ConsoleColor]::White)
    Kill-Port -Port 4001 -ForceKill:$ForceKill
    Stop-ProcessesUnderPath -Path $script:FrontendPath
    Start-PnpmWatcher -Arguments @('run','dev','--','--port','4001') -WorkingDirectory $script:FrontendPath -Description 'Frontend pnpm dev' -EnvironmentOverrides @{ PORT = '4001' }
}

Initialize-Logger

if (-not ($All -or $Backend -or $Frontend -or $Status)) {
    Write-Status "Gebruik: .\restart-all.ps1 -All | -Backend | -Frontend | -Status [-Force]" ([ConsoleColor]::Yellow)
    return
}

if ($Status) {
    Show-Status
    if (-not ($All -or $Backend -or $Frontend)) {
        return
    }
}

if ($All) {
    $Backend = $true
    $Frontend = $true
}

try {
    if ($Backend) {
        Restart-Backend -ForceKill:$Force
    }

    if ($Frontend) {
        Restart-Frontend -ForceKill:$Force
    }

    if ($Backend -or $Frontend) {
        Start-Sleep -Seconds 2
        Show-Status
    }
} catch {
    Write-Status ("Herstart mislukt: {0}" -f $_.Exception.Message) ([ConsoleColor]::Red)
    throw
}
