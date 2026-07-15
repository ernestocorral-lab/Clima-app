# Configura el entorno de desarrollo de Clima-app en un PC nuevo.
# Uso: powershell -ExecutionPolicy Bypass -File scripts/setup-dev-environment.ps1

$ErrorActionPreference = 'Stop'

function Write-Step([string]$Message) {
  Write-Host ""
  Write-Host "==> $Message" -ForegroundColor Cyan
}

function Write-Ok([string]$Message) {
  Write-Host "OK  $Message" -ForegroundColor Green
}

function Write-Warn([string]$Message) {
  Write-Host "!!  $Message" -ForegroundColor Yellow
}

function Write-Err([string]$Message) {
  Write-Host "ERR $Message" -ForegroundColor Red
}

function Find-FirstExistingPath([string[]]$Candidates) {
  foreach ($candidate in $Candidates) {
    if (-not $candidate) { continue }
    $resolved = $candidate.TrimEnd('\')
    if (Test-Path $resolved) {
      return (Resolve-Path $resolved).Path
    }
  }
  return $null
}

function Ensure-UserEnvVar([string]$Name, [string]$Value) {
  $current = [Environment]::GetEnvironmentVariable($Name, 'User')
  if (-not $current) {
    [Environment]::SetEnvironmentVariable($Name, $Value, 'User')
    Write-Ok "Variable de usuario $Name = $Value"
  } elseif ($current -ne $Value) {
    Write-Warn "$Name ya existe ($current). No se ha cambiado."
  } else {
    Write-Ok "$Name ya estaba configurada"
  }
  Set-Item -Path "env:$Name" -Value $Value
}

$root = Resolve-Path (Join-Path $PSScriptRoot '..')
Set-Location $root

Write-Host ""
Write-Host "Clima-app — configuracion automatica del entorno" -ForegroundColor White
Write-Host "Carpeta del proyecto: $root" -ForegroundColor DarkGray

Write-Step "1/6 Comprobando herramientas basicas"

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  Write-Err "Node.js no encontrado. Instalalo desde https://nodejs.org/ y vuelve a ejecutar este script."
  exit 1
}
$nodeVersion = (node -v) -replace 'v', ''
Write-Ok "Node.js $nodeVersion"

if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
  Write-Err "npm no encontrado."
  exit 1
}
Write-Ok "npm $(npm -v)"

if (Get-Command git -ErrorAction SilentlyContinue) {
  Write-Ok "git $(git --version)"
} else {
  Write-Warn "git no encontrado (opcional para clonar; recomendado)."
}

Write-Step "2/6 Buscando JDK 17 y Android SDK"

$jdkCandidates = @(
  $env:JAVA_HOME,
  "$env:USERPROFILE\dev-tools\jdk-17",
  "$env:USERPROFILE\dev-tools\jdk-17.0.13+11",
  'C:\Program Files\Eclipse Adoptium\jdk-17.0.13.11-hotspot',
  'C:\Program Files\Java\jdk-17'
)
$jdkHome = Find-FirstExistingPath $jdkCandidates
if (-not $jdkHome) {
  $adoptium = Get-ChildItem 'C:\Program Files\Eclipse Adoptium' -Directory -Filter 'jdk-17*' -ErrorAction SilentlyContinue |
    Select-Object -First 1
  if ($adoptium) { $jdkHome = $adoptium.FullName }
}

$sdkCandidates = @(
  $env:ANDROID_HOME,
  $env:ANDROID_SDK_ROOT,
  "$env:USERPROFILE\dev-tools\android-sdk",
  "$env:LOCALAPPDATA\Android\Sdk"
)
$androidHome = Find-FirstExistingPath $sdkCandidates

if (-not $jdkHome) {
  Write-Err "JDK 17 no encontrado."
  Write-Host "  Instala Temurin 17: https://adoptium.net/temurin/releases/?version=17"
  Write-Host "  Sugerencia: extraelo en $env:USERPROFILE\dev-tools\jdk-17"
  exit 1
}
Write-Ok "JDK: $jdkHome"

if (-not $androidHome) {
  Write-Err "Android SDK no encontrado."
  Write-Host "  Instala Android Studio o solo el SDK."
  Write-Host "  Sugerencia: $env:USERPROFILE\dev-tools\android-sdk"
  Write-Host "  En SDK Manager instala: Platform 36, Build-Tools 36, NDK 27.x"
  exit 1
}
Write-Ok "Android SDK: $androidHome"

Ensure-UserEnvVar 'JAVA_HOME' $jdkHome
Ensure-UserEnvVar 'ANDROID_HOME' $androidHome
Ensure-UserEnvVar 'ANDROID_SDK_ROOT' $androidHome

$env:PATH = "$jdkHome\bin;$androidHome\platform-tools;$androidHome\cmdline-tools\latest\bin;$env:PATH"

Write-Step "3/6 Instalando dependencias npm"
if (Test-Path 'node_modules') {
  Write-Warn "node_modules ya existe; ejecutando npm install por si acaso..."
}
npm install
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
Write-Ok "Dependencias instaladas"

Write-Step "4/6 Proyecto Android nativo"
if (-not (Test-Path 'android\gradlew.bat')) {
  Write-Warn "Carpeta android no encontrada. Generando con Expo prebuild..."
  npx expo prebuild --platform android --no-install
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
  Write-Ok "android/ generado"
} else {
  Write-Ok "android/ ya presente"
}

node scripts/prepare-android-release.js
Write-Ok "local.properties y gradle.properties preparados"

Write-Step "5/6 Verificando TypeScript"
npx tsc --noEmit
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
Write-Ok "TypeScript sin errores"

Write-Step "6/6 Listo"

Write-Host ""
Write-Host "Entorno configurado correctamente." -ForegroundColor Green
Write-Host ""
Write-Host "Comandos utiles:" -ForegroundColor White
Write-Host "  npm start          — servidor de desarrollo Expo"
Write-Host "  npm run android    — instalar en dispositivo/emulador"
Write-Host "  npm run build:apk  — generar APK de release"
Write-Host ""
Write-Host "Si acabas de instalar JDK/SDK, cierra y reabre la terminal o el editor para cargar las variables." -ForegroundColor DarkGray
Write-Host ""
