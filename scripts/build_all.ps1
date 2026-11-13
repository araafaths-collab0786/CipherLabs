# =============================================================================
# scripts/build_all.ps1 - Single Authoritative Release-Build Runner
# =============================================================================

$ErrorActionPreference = "Stop"
$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path

Write-Host ">>> STEP 1: Running Phase 0 Prerequisite & Config Check..." -ForegroundColor Cyan
& (Join-Path $PSScriptRoot "check_env.ps1")
if ($LASTEXITCODE -ne 0) {
    Write-Error "Prerequisite check failed. Aborting build."
    exit 1
}

Write-Host ">>> STEP 2: Building without embedded credentials..." -ForegroundColor Cyan
Write-Host "  MongoDB settings are loaded from the user's desktop config at runtime." -ForegroundColor Green

Write-Host ">>> STEP 3: Building Backend Sidecar Executable..." -ForegroundColor Cyan
& (Join-Path $PSScriptRoot "build_backend.ps1")
if ($LASTEXITCODE -ne 0) {
    Write-Error "Backend sidecar build failed."
    exit 1
}

Write-Host ">>> STEP 4: Running configured tests, if available..." -ForegroundColor Cyan
Push-Location $projectRoot
try {
    $package = Get-Content (Join-Path $projectRoot "package.json") -Raw | ConvertFrom-Json
    if ($package.scripts.test) {
        npm test
        if ($LASTEXITCODE -ne 0) {
            Write-Error "Test suite failed. Aborting packaging."
            exit 1
        }
    } else {
        Write-Host "  No test script configured; skipping tests." -ForegroundColor Yellow
    }

    Write-Host ">>> STEP 5: Compiling Frontend Distribution..." -ForegroundColor Cyan
    npm run build
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Frontend build compilation failed."
        exit 1
    }

} finally {
    Pop-Location
}

Write-Host ">>> STEP 6: Building Tauri Desktop NSIS Package..." -ForegroundColor Cyan
$tauriCli = Join-Path $projectRoot "node_modules\.bin\tauri.cmd"
Push-Location (Join-Path $projectRoot "frontend")
try {
    & $tauriCli build
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
