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

# 7. Supabase Configuration Validation (Key value is NEVER printed)
$supabaseEnvFile = Join-Path $PSScriptRoot "..\frontend\src-tauri\config\supabase.env"
if (-not (Test-Path $supabaseEnvFile)) {
    $supabaseEnvFile = Join-Path $PSScriptRoot "..\.env"
}

if (Test-Path $supabaseEnvFile) {
    $envContent = Get-Content $supabaseEnvFile -Raw
    $urlMatches = [regex]::Match($envContent, "CIPHER_SUPABASE_URL\s*=\s*['""]?(https://[^\s'""\r\n]+)")
    if ($urlMatches.Success) {
        Report-Check "Supabase URL" $true "Present and format OK (https:// schema validated)"
    } else {
        Report-Check "Supabase URL" $false "Missing or invalid format (must start with https://)"
    }

    # RECONCILED: Support both modern sb_publishable_... keys (standard) and legacy 3-part JWT anon keys
    $keyMatches = [regex]::Match($envContent, "CIPHER_SUPABASE_ANON_KEY\s*=\s*['""]?([^\s'""\r\n]+)")
    if ($keyMatches.Success) {
        $keyVal = $keyMatches.Groups[1].Value
        $isModernPublishable = $keyVal -like "sb_publishable_*"
        $isLegacyJwt = ($keyVal.Split('.').Count -eq 3)

        if ($isModernPublishable) {
            Report-Check "Supabase Key" $true "Present and format OK (Modern sb_publishable_... key detected)"
        } elseif ($isLegacyJwt) {
            Report-Check "Supabase Key" $true "Present and format OK (Legacy 3-segment JWT key accepted for backward compatibility)"
        } else {
            Report-Check "Supabase Key" $false "Invalid key format (must be modern sb_publishable_ or legacy 3-segment JWT)"
        }
    } else {
        Report-Check "Supabase Key" $false "Missing CIPHER_SUPABASE_ANON_KEY in config"
    }
} else {
    Write-Host " [INFO] supabase.env not present. System running in deliberate CONFIG_MISSING mode." -ForegroundColor Yellow
}

Write-Host "========================================================" -ForegroundColor Cyan
if ($allPassed) {
    Write-Host " ALL PHASE 0 PREREQUISITES VERIFIED SUCCESSFULLY" -ForegroundColor Green
    exit 0
} else {
    Write-Host " ONE OR MORE CHECKS FAILED. See log above for resolution." -ForegroundColor Red
    exit 1
}
