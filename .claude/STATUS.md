# GoldStar Launcher - Estado General

**Última actualización:** 2026-04-10
**Sesión actual:** Claude Code Session #2

## Resumen Ejecutivo

| Aspecto | Estado | Detalles |
|---------|--------|----------|
| **Código Base** | ✅ Limpio | Revertido a v39, imports restaurados |
| **Build** | ✅ Funcional | npm run dist:win/mac/linux compilable |
| **Launcher App** | ✅ Inicia | Window abre correctamente |
| **Microsoft Auth** | ⏳ Bloqueado | AppID Review pending en Mojang |
| **Auto-Update Mods** | ✅ Implementado | ExclusionManager + AutoUpdateManager |
| **DevTools Block** | ✅ Implementado | Solo en producción (app.isPackaged) |
| **CSS Responsivo** | ✅ Implementado | 4 breakpoints + hamburger toggle |
| **Manifest Generator** | ✅ Implementado | tools/generate-manifest.js |

---

## Hito Actual: Espera de AppID Approval

### Qué está esperando:
1. **Mojang AppID Review Form** - Enviado ~2026-04-09
   - Nombre: "GoldStar Launcher"
   - Review: Semanal
   - Tiempo estimado: 3-7 días

---

## Módulos Implementados (Sesión #2)

### 1. ExclusionManager (`app/assets/js/exclusionManager.js`)
- Lista por defecto: options.txt, screenshots, journeymap, logs, crash-reports
- Descarga `exclusions.json` remoto si existe (con reintentos exponenciales)
- API: `init(baseUrl)`, `isExcluded(path)`, `getActivePatterns()`

### 2. AutoUpdateManager (`app/assets/js/autoUpdateManager.js`)
- Descarga manifest.json del servidor, compara hashes SHA-256
- Añade, actualiza, elimina archivos automáticamente
- Respeta ExclusionManager antes de cualquier escritura/borrado
- Descargas concurrentes (4 simultáneas) con reintentos exponenciales
- Integrado en `landing.js` → `dlAsync()` antes de validación de archivos
- Se activa si `ConfigManager.getModpackUrl()` tiene valor

### 3. DevTools Blocking (`index.js`)
- Solo en producción: `app.isPackaged === true`
- Bloquea: F12, Ctrl+Shift+I/J/C, Ctrl+U
- Cierra DevTools si se abren por otro medio
- Deshabilita menú contextual
- `asar: true` ya configurado en electron-builder.yml

### 4. Manifest Generator (`tools/generate-manifest.js`)
- Script CLI: `node tools/generate-manifest.js <carpeta> [salida]`
- Genera manifest.json con hash SHA-256, tamaño y ruta de cada archivo
- Resumen por carpeta en consola

### 5. CSS Responsivo (`app/assets/css/responsive.css`)
- Breakpoints: >=1280px, 1024-1279px, 768-1023px, <768px
- Hamburger toggle para sidebar colapsable
- Integrado en app.ejs después de launcher.css

---

## Estado por Área

### Core Electron (index.js)
```
✅ BrowserWindow creation
✅ IPC handlers
✅ Auto-updater setup
✅ Menu setup (macOS)
✅ Microsoft Auth windows
✅ Preloader security
✅ DevTools blocking (producción)
❌ Login validation (AppID pending)
```

### Mod Sync System
```
✅ ExclusionManager
✅ AutoUpdateManager
✅ Manifest generator
✅ Integración con landing.js
⏳ Testing con servidor real
```

### UI/CSS
```
✅ Responsive breakpoints
✅ Hamburger toggle
✅ Sidebar colapsable
⏳ Testing visual en diferentes resoluciones
```

---

## Archivos Modificados (Sesión #2)

| Archivo | Cambio |
|---------|--------|
| `index.js` | +DevTools blocking en producción |
| `app/app.ejs` | +responsive.css, +hamburger toggle |
| `app/assets/js/scripts/landing.js` | +AutoUpdateManager sync en dlAsync |
| `app/assets/js/scripts/uicore.js` | +hamburger toggle bindings |
| `app/assets/js/configmanager.js` | +modpackUrl getter/setter |

## Archivos Nuevos (Sesión #2)

| Archivo | Descripción |
|---------|-------------|
| `app/assets/js/exclusionManager.js` | Gestión de exclusiones |
| `app/assets/js/autoUpdateManager.js` | Auto-actualización de mods |
| `app/assets/css/responsive.css` | CSS responsivo |
| `tools/generate-manifest.js` | Generador de manifest |
| `tools/exclusions.example.json` | Ejemplo de exclusiones remotas |

---

## Próximas Acciones

1. Esperar aprobación Mojang (email)
2. Configurar servidor HTTPS con archivos de mods + manifest.json
3. Probar AutoUpdateManager con servidor real
4. Testear CSS responsivo en distintas resoluciones
5. Build de distribución `npm run dist:win`
