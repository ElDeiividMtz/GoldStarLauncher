# GoldStar Launcher - Task List

## ✅ COMPLETADO

### Sesión #1 (2026-04-09)
- [x] CLEANUP-001: Revertir Electron v32→v39
- [x] CLEANUP-002: Remover cross-env
- [x] CLEANUP-003: Restaurar orden imports index.js
- [x] CLEANUP-004: Eliminar index_backup.js
- [x] LAUNCHER-001: Crear launch.bat
- [x] ANALYSIS-001: Comparar contra HeliosLauncher original

### Sesión #2 (2026-04-10)
- [x] MOD-001: Implementar ExclusionManager
- [x] MOD-002: Implementar AutoUpdateManager
- [x] MOD-003: Crear generate-manifest.js
- [x] MOD-004: Integrar AutoUpdateManager en landing.js dlAsync()
- [x] MOD-005: Agregar modpackUrl a ConfigManager
- [x] SEC-001: Bloqueo de DevTools en producción (index.js)
- [x] UI-001: Crear responsive.css con 4 breakpoints
- [x] UI-002: Agregar hamburger toggle (app.ejs + uicore.js)
- [x] DOCS-001: Actualizar STATUS.md y TASKS.md

---

## ⏳ BLOQUEADO

```
AWAIT-001: Esperar aprobación Mojang AppID Review
  Estado: Formulario enviado ~2026-04-09
  Revisión: Semanal (3-7 días)
  Bloqueador: Necesario para Xbox Live API
```

---

## 🔄 EN PROGRESO

```
AUTH-001: Configurar Azure permisos Xbox Live
  Requisito: AWAIT-001
  Pasos:
    [ ] Recibir email de Mojang
    [ ] Azure → API Permissions → Xbox Live Services
    [ ] Grant admin consent
    [ ] Verificar redirect URI
    [ ] Testear login end-to-end

TEST-001: Probar AutoUpdateManager con servidor real
  Pasos:
    [ ] Configurar servidor HTTPS con mods de prueba
    [ ] Ejecutar generate-manifest.js en servidor
    [ ] Configurar modpackUrl en ConfigManager
    [ ] Ejecutar launcher y verificar sincronización
    [ ] Probar: añadir, modificar, eliminar archivos

TEST-002: Testear CSS responsivo
  Pasos:
    [ ] Verificar en 1280px+ (layout completo)
    [ ] Verificar en 1024-1279px (sidebar reducida)
    [ ] Verificar en 768-1023px (sidebar colapsable)
    [ ] Verificar en <768px (sidebar overlay)
    [ ] Probar hamburger toggle
```

---

## 📋 BACKLOG

```
BUILD-001: Build distribución Windows
  npm run dist:win
  Verificar instalador NSIS

BUILD-002: Build distribución macOS
  npm run dist:mac

DIST-001: GitHub Actions para builds automáticos

FEATURE-001: Configurar modpackUrl desde UI settings
  Agregar campo en settings.ejs para que el admin configure la URL

FEATURE-002: Indicador visual de sincronización de mods
  Mostrar progreso detallado durante sync en landing

FEATURE-003: Sistema de notificaciones de actualización
  Mostrar cuántos mods se actualizaron al finalizar sync
```

---

## Critical Path

```
AWAIT-001 (3-7d) → AUTH-001 (1d) → TEST login → BUILD-001 → RELEASE v1.0.0
                    TEST-001 (1d) → TEST-002 (1d) ↗
```
