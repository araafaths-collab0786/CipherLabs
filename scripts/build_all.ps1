# =============================================================================
# scripts/build_all.ps1 - Single Authoritative Release-Build Runner
# =============================================================================

$ErrorActionPreference = "Stop"

Write-Host ">>> STEP 1: Running Phase 0 Prerequisite & Config Check..." -ForegroundColor Cyan
& (Join-Path $PSScriptRoot "check_env.ps1")
if ($LASTEXITCODE -ne 0) {
    Write-Error "Prerequisite check failed. Aborting build."
    exit 1
}

Write-Host ">>> STEP 2: Loading Configuration & Exporting Build-Time Environment..." -ForegroundColor Cyan
$supabaseEnvFile = Join-Path $PSScriptRoot "..\frontend\src-tauri\config\supabase.env"
if (-not (Test-Path $supabaseEnvFile)) {
    $supabaseEnvFile = Join-Path $PSScriptRoot "..\.env"
}

if (Test-Path $supabaseEnvFile) {
    Get-Content $supabaseEnvFile | ForEach-Object {
        $line = $_.Trim()
        if ($line -and -not $line.StartsWith("#") -and $line.Contains("=")) {
            $parts = $line.Split('=', 2)
            $name = $parts[0].Trim()
            $val = $parts[1].Trim().Trim('"').Trim("'")
            [System.Environment]::SetEnvironmentVariable($name, $val, [System.EnvironmentVariableTarget]::Process)
        }
    }
    Write-Host "  Loaded environment variables into caller process." -ForegroundColor Green
} else {
    Write-Host "  No supabase.env found. Packaging in CONFIG_MISSING mode." -ForegroundColor Yellow
}

Write-Host ">>> STEP 3: Building Backend Sidecar Executable..." -ForegroundColor Cyan
& (Join-Path $PSScriptRoot "build_backend.ps1")
if ($LASTEXITCODE -ne 0) {
    Write-Error "Backend sidecar build failed."
    exit 1
}

Write-Host ">>> STEP 4: Executing Frontend Tests..." -ForegroundColor Cyan
$frontendDir = Join-Path $PSScriptRoot "..\frontend"
if (-not (Test-Path $frontendDir)) {
    $frontendDir = Join-Path $PSScriptRoot ".."
}

Push-Location $frontendDir
try {
    npm test
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Frontend test suite failed. Aborting packaging."
        exit 1
    }

    Write-Host ">>> STEP 5: Compiling Frontend Distribution..." -ForegroundColor Cyan
    npm run build
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Frontend build compilation failed."
        exit 1
    }

    Write-Host ">>> STEP 6: Building Tauri Desktop NSIS Package..." -ForegroundColor Cyan
    npm run tauri -- build
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Tauri package bundling failed."
        exit 1
    }
} finally {
    Pop-Location
}

Write-Host "========================================================" -ForegroundColor Green
Write-Host " CIPHER LABS RELEASE BUILD COMPLETED SUCCESSFULLY" -ForegroundColor Green
Write-Host " Output: frontend\src-tauri\target\release\bundle\nsis\" -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Green
