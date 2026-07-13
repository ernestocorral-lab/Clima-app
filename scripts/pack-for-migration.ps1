# Empaqueta el proyecto para migrar a otro PC (sin node_modules ni builds).
# Genera weather-app-migracion.zip en la carpeta padre del proyecto.

$ErrorActionPreference = 'Stop'

$root = Resolve-Path (Join-Path $PSScriptRoot '..')
$parent = Split-Path $root -Parent
$zipPath = Join-Path $parent 'weather-app-migracion.zip'

$skipTopLevel = @('node_modules', '.expo', 'dist', 'web-build')
$skipFiles = @('Clima.apk', 'weather-app-migracion.zip')
$skipInAndroid = @('build', '.gradle', '.cxx')

if (Test-Path $zipPath) {
  Remove-Item $zipPath -Force
}

$staging = Join-Path $env:TEMP "weather-app-migracion-$(Get-Random)"
New-Item -ItemType Directory -Path $staging -Force | Out-Null

function Copy-Tree {
  param(
    [string]$Source,
    [string]$Dest,
    [string[]]$SkipDirs = @()
  )

  New-Item -ItemType Directory -Path $Dest -Force | Out-Null
  Get-ChildItem $Source -Force | ForEach-Object {
    if ($_.PSIsContainer -and $SkipDirs -contains $_.Name) { return }
    $target = Join-Path $Dest $_.Name
    if ($_.PSIsContainer) {
      Copy-Tree -Source $_.FullName -Dest $target -SkipDirs $SkipDirs
    } else {
      Copy-Item $_.FullName $target -Force
    }
  }
}

Write-Host "Copiando proyecto..." -ForegroundColor Cyan

Get-ChildItem $root -Force | ForEach-Object {
  if ($skipFiles -contains $_.Name) { return }
  if ($_.PSIsContainer -and $skipTopLevel -contains $_.Name) { return }

  $target = Join-Path $staging $_.Name
  if ($_.Name -eq 'android') {
    Copy-Tree -Source $_.FullName -Dest $target -SkipDirs $skipInAndroid
  } elseif ($_.PSIsContainer) {
    Copy-Tree -Source $_.FullName -Dest $target
  } else {
    Copy-Item $_.FullName $target -Force
  }
}

Write-Host "Comprimiendo..." -ForegroundColor Cyan
Compress-Archive -Path (Join-Path $staging '*') -DestinationPath $zipPath -Force
Remove-Item $staging -Recurse -Force

$sizeMb = [math]::Round((Get-Item $zipPath).Length / 1MB, 1)
Write-Host ""
Write-Host "Listo: $zipPath ($sizeMb MB)" -ForegroundColor Green
Write-Host ""
Write-Host "En el PC nuevo: descomprime, abre en Cursor, ejecuta scripts\setup-dev-environment.bat"
Write-Host ""
