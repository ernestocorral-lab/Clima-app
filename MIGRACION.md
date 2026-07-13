# Migrar Clima-app a otro PC (3 pasos)

## En este PC (antes de irte)

**Opción A — Zip (más fácil, no necesitas GitHub):**

Doble clic en `scripts\pack-for-migration.bat`  
(o en Cursor: *"Ejecuta scripts/pack-for-migration.ps1"*)

Se crea `weather-app-migracion.zip` en la carpeta padre del proyecto (~250 MB).  
Cópialo al otro PC (USB, OneDrive, etc.).

**Opción B — GitHub:**

```powershell
git push
```

En el otro PC: `git clone https://github.com/ernestocorral-lab/Clima-app.git weather-app`  
*(Necesitarás copiar también la carpeta `android` o dejar que el script la regenere.)*

---

## En el PC nuevo

### 1. Instalar (solo una vez)

- [Cursor](https://cursor.com/)
- [Node.js LTS](https://nodejs.org/)
- **JDK 17** → [Adoptium](https://adoptium.net/temurin/releases/?version=17)  
  Sugerencia: `C:\Users\TU_USUARIO\dev-tools\jdk-17`
- **Android SDK** (Android Studio o solo SDK)  
  Sugerencia: `C:\Users\TU_USUARIO\dev-tools\android-sdk`  
  En SDK Manager: Platform **36**, Build-Tools **36**, **NDK 27.x**

### 2. Descomprimir / clonar el proyecto

Abre la carpeta del proyecto en **Cursor** (*File → Open Folder*).

### 3. Ejecutar el configurador automático

Doble clic en:

```
scripts\setup-dev-environment.bat
```

**O** dile a Cursor en el chat:

```
Ejecuta scripts/setup-dev-environment.ps1 y corrige cualquier error que salga.
```

El script hace solo:

- `npm install`
- Genera `android/` si falta
- Configura SDK y Gradle
- Verifica TypeScript

---

## Después

```powershell
npm start           # desarrollo
npm run build:apk   # compilar APK
```

---

## Contexto para el agente de Cursor (pegar en el primer chat)

```
Proyecto: Clima multiciudad — Expo 57, React Native, solo Android.
Repo: ernestocorral-lab/Clima-app
APIs: Open-Meteo + Nominatim (GPS). Sin API key.
Reglas: leer AGENTS.md y docs Expo v57 antes de codificar.
APK: npm run build:apk (arm64, ~12 MB). Releases en GitHub v1.0.0.
```
