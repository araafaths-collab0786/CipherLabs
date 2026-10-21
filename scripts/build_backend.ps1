# =============================================================================
# scripts/build_backend.ps1 - FastAPI Sidecar Packaging
# =============================================================================

$ErrorActionPreference = "Stop"

$backendDir = Join-Path $PSScriptRoot "..\backend"
$targetDir = Join-Path $PSScriptRoot "..\frontend\src-tauri\binaries"

if (-not (Test-Path $targetDir)) {
    New-Item -ItemType Directory -Path $targetDir -Force | Out-Null
}

Push-Location $backendDir
try {
    Write-Host "Packaging FastAPI backend sidecar with PyInstaller..." -ForegroundColor Cyan

    $py = "python"
    if (Test-Path ".\.venv\Scripts\python.exe") {
        $py = ".\.venv\Scripts\python.exe"
    }

    & $py -m PyInstaller --clean --noconfirm --onefile --noconsole `
        --name "cipher-backend" `
        --hidden-import "uvicorn.logging" `
        --hidden-import "uvicorn.loops" `
        --hidden-import "uvicorn.loops.auto" `
        --hidden-import "uvicorn.protocols" `
        --hidden-import "uvicorn.protocols.http" `
        --hidden-import "uvicorn.protocols.http.auto" `
        --hidden-import "uvicorn.lifespan" `
        --hidden-import "uvicorn.lifespan.on" `
        --hidden-import "reportlab" `
        --hidden-import "sklearn" `
        cipher_backend_entry.py

    $binarySource = Join-Path $backendDir "dist\cipher-backend.exe"
    $binaryDest = Join-Path $targetDir "cipher-backend-x86_64-pc-windows-msvc.exe"

    if (Test-Path $binarySource) {
        Copy-Item -Path $binarySource -Destination $binaryDest -Force
        Write-Host "Sidecar successfully copied to $binaryDest" -ForegroundColor Green
    } else {
        Write-Error "PyInstaller failed to output $binarySource"
        exit 1
    }
} finally {
    Pop-Location
}
