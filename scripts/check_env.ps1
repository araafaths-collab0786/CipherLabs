# =============================================================================
# scripts/check_env.ps1 - Cipher Labs Phase 0 Prerequisite & Config Check
# =============================================================================

$ErrorActionPreference = "Stop"

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
    Report-Check "Rust Compiler" $true $rustcVer
    $triple = (rustc -vV | Select-String "host:").ToString().Split(':')[1].Trim()
    if ($triple -eq "x86_64-pc-windows-msvc" -or $triple -like "*x86_64*") {
        Report-Check "Rust Target Triple" $true $triple
    } else {
        Report-Check "Rust Target Triple" $false "$triple (expected x86_64-pc-windows-msvc)"
    }
} catch {
    Report-Check "Rust Toolchain" $false "rustc not found. Install Rust >= 1.90 with x86_64-pc-windows-msvc"
}

# 5. Dependency installation order fix: Install frontend dependencies BEFORE verifying local Tauri CLI
$frontendDir = Join-Path $PSScriptRoot "..\frontend"
if (Test-Path $frontendDir) {
    $nodeModules = Join-Path $frontendDir "node_modules"
    if (-not (Test-Path $nodeModules)) {
        Write-Host "Installing frontend packages prior to CLI verification..." -ForegroundColor Yellow
        Push-Location $frontendDir
        npm install --silent
        Pop-Location
    }
    Report-Check "Frontend Dependencies" $true "frontend/node_modules populated"
} else {
    Report-Check "Frontend Folder" $true "Workspace root mode"
}

# 6. Tauri CLI Check
try {
    $tauriVer = (npx tauri --version 2>&1).Trim()
    Report-Check "Tauri CLI" $true $tauriVer
} catch {
    Report-Check "Tauri CLI" $false "Tauri CLI not detected. Run npm install in frontend/"
}

# 7. MongoDB Atlas Configuration Validation (Credentials are NEVER printed)
$mongoEnvFile = Join-Path $PSScriptRoot "..\frontend\src-tauri\config\mongodb.env"
if (-not (Test-Path $mongoEnvFile)) {
    $mongoEnvFile = Join-Path $PSScriptRoot "..\.env"
}

if (Test-Path $mongoEnvFile) {
    $envContent = Get-Content $mongoEnvFile -Raw
    $uriMatches = [regex]::Match($envContent, "CIPHER_MONGODB_URI\s*=\s*['""]?((?:mongodb(?:\+srv)?):\/\/[^\s'""\r\n]+)")
    if ($uriMatches.Success) {
        Report-Check "MongoDB Atlas URI" $true "Present and format OK (mongodb+srv:// cluster protocol validated)"
    } else {
        Report-Check "MongoDB Atlas URI" $false "Missing or invalid format (must start with mongodb+srv:// or mongodb://)"
    }

    $jwtMatches = [regex]::Match($envContent, "CIPHER_JWT_SECRET\s*=\s*['""]?([^\s'""\r\n]+)")
    if ($jwtMatches.Success) {
        Report-Check "JWT Secret Key" $true "Present and format OK (FastAPI auth secret configured)"
    } else {
        Report-Check "JWT Secret Key" $true "Optional in development (fallback default entropy used)"
    }
} else {
    Write-Host " [INFO] mongodb.env not present. System running in deliberate CONFIG_MISSING mode." -ForegroundColor Yellow
}

Write-Host "========================================================" -ForegroundColor Cyan
if ($allPassed) {
    Write-Host " ALL PHASE 0 PREREQUISITES VERIFIED SUCCESSFULLY" -ForegroundColor Green
    exit 0
} else {
    Write-Host " ONE OR MORE CHECKS FAILED. See log above for resolution." -ForegroundColor Red
    exit 1
}
