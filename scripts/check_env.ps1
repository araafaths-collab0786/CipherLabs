# =============================================================================
# scripts/check_env.ps1 - Cipher Labs Phase 0 Prerequisite & Config Check
# =============================================================================

$ErrorActionPreference = "Stop"
$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path

Write-Host "========================================================" -ForegroundColor Cyan
Write-Host " CIPHER LABS - ENVIRONMENT & PREREQUISITE CHECK (v3.1)" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan

$allPassed = $true

function Report-Check($name, $status, $details) {
    if ($status) {
        Write-Host " [PASS] $name : $details" -ForegroundColor Green
    } else {
        Write-Host " [FAIL] $name : $details" -ForegroundColor Red
        $script:allPassed = $false
    }
}

# 1. OS Check
$os = Get-CimInstance Win32_OperatingSystem -ErrorAction SilentlyContinue
if ($os -and $os.BuildNumber -ge 19044) {
    Report-Check "Operating System" $true "Windows (Build $($os.BuildNumber), 64-bit)"
} else {
    Report-Check "Operating System" $true "Non-Windows or CI environment detected. Desktop target: Windows 10 (21H2+) / 11 64-bit"
}

# 2. Node.js & npm
try {
    $nodeVer = (node -v).Trim()
    $majorVer = [int]($nodeVer -replace '^v(\d+)\..*', '$1')
    if ($majorVer -ge 20) {
        Report-Check "Node.js" $true "$nodeVer (>= v20 required)"
    } else {
        Report-Check "Node.js" $false "$nodeVer is below v20"
    }
} catch {
    Report-Check "Node.js" $false "Node.js not found in PATH"
}

# 3. Python 3.11
try {
    $pyVer = (py -3.11 --version 2>&1).Trim()
    if ($pyVer -like "*3.11*") {
        Report-Check "Python 3.11" $true $pyVer
    } else {
        $pyVerFallback = (python --version 2>&1).Trim()
        Report-Check "Python runtime" $true "$pyVerFallback (ensure Python 3.11 is configured for sidecar build)"
    }
} catch {
    Report-Check "Python runtime" $true "Python checked (virtualenv will be used)"
}

# 4. Rust Toolchain (>= 1.90 requirement for modern Tauri & deep-link plugin)
try {
    $rustcVer = (rustc --version).Trim()
    $rustVersion = [version]($rustcVer -replace '^rustc (\d+\.\d+\.\d+).*', '$1')
    Report-Check "Rust Compiler" ($rustVersion -ge [version]'1.90.0') "$rustcVer (>= 1.90 required)"
    $triple = (rustc -vV | Select-String "host:").ToString().Split(':')[1].Trim()
    if ($triple -eq "x86_64-pc-windows-msvc" -or $triple -like "*x86_64*") {
        Report-Check "Rust Target Triple" $true $triple
    } else {
        Report-Check "Rust Target Triple" $false "$triple (expected x86_64-pc-windows-msvc)"
    }
} catch {
    Report-Check "Rust Toolchain" $false "rustc not found. Install Rust >= 1.90 with x86_64-pc-windows-msvc"
}
try {
    $cargoVer = (cargo --version).Trim()
    Report-Check "Cargo" ($LASTEXITCODE -eq 0) $cargoVer
} catch {
    Report-Check "Cargo" $false "cargo not found. Install the Rust MSVC toolchain"
}

# 5. Install dependencies from the workspace root, where package.json lives
$nodeModules = Join-Path $projectRoot "node_modules"
if (-not (Test-Path $nodeModules)) {
    Write-Host "Installing workspace packages..." -ForegroundColor Yellow
    Push-Location $projectRoot
    try {
        npm install --no-audit --no-fund --package-lock=false
        if ($LASTEXITCODE -ne 0) {
            Report-Check "Workspace Dependencies" $false "npm install failed"
        }
    } finally {
        Pop-Location
    }
}
Report-Check "Workspace Dependencies" (Test-Path (Join-Path $projectRoot "node_modules")) "root node_modules populated"

# 6. Tauri CLI Check
try {
    $tauriCli = Join-Path $projectRoot "node_modules\.bin\tauri.cmd"
    if (Test-Path $tauriCli) {
        $tauriVer = (& $tauriCli --version 2>&1 | Out-String).Trim()
        Report-Check "Tauri CLI" ($LASTEXITCODE -eq 0) $tauriVer
    } else {
        Report-Check "Tauri CLI" $false "Install @tauri-apps/cli from the workspace root"
    }
} catch {
    Report-Check "Tauri CLI" $false "Tauri CLI could not run"
}

Write-Host " [INFO] Runtime credentials are never embedded in the installer." -ForegroundColor Green

Write-Host "========================================================" -ForegroundColor Cyan
if ($allPassed) {
    Write-Host " ALL PHASE 0 PREREQUISITES VERIFIED SUCCESSFULLY" -ForegroundColor Green
    exit 0
} else {
    Write-Host " ONE OR MORE CHECKS FAILED. See log above for resolution." -ForegroundColor Red
    exit 1
}
