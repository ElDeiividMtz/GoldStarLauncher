# GoldStar Launcher - Task List

**Formato:** `[STATUS] TASK DESCRIPTION | Priority: X | Est: X days`

## 🔴 BLOQUEADO (Depende de Mojang)

```
⏳ AWAIT-001: Esperar aprobación Mojang AppID Review
   - Estado: Formulario enviado 2026-04-09
   - Tiempo: Revisión semanal (3-7 días típicamente)
   - Bloqueador: Necesario para Xbox Live API access
   - Próximo paso: Recibir email de aprobación
   Priority: 🔴 CRITICAL
   Est: 3-7 days
```

---

## ✅ COMPLETADO (Esta sesión)

```
✅ CLEANUP-001: Revertir Electron v32.3.3 → v39.2.7
   - Cambio: package.json devDependencies
   - Razón: Versión original correcta
   - Completado: 2026-04-09
   
✅ CLEANUP-002: Remover cross-env innecesario
   - Cambio: Quitado de devDependencies y npm start
   - Razón: No necesario con launch.bat
   - Completado: 2026-04-09

✅ CLEANUP-003: Restaurar orden original de imports en index.js
   - Cambio: remoteMain antes de electron require
   - Razón: Orden original del HeliosLauncher
   - Completado: 2026-04-09

✅ CLEANUP-004: Eliminar archivos temporales
   - Cambio: Borrado index_backup.js
   - Razón: Era solo un test script
   - Completado: 2026-04-09

✅ LAUNCHER-001: Crear launch.bat funcional
   - Cambio: Script Windows para iniciar app
   - Contenido: cd /d + set ELECTRON_RUN_AS_NODE + electron.exe .
   - Completado: 2026-04-09

✅ DOCS-001: Crear estructura documentación markdown
   - Cambio: Crear .claude/ con STATUS, TASKS, etc
   - Razón: Sistema de docs native para Claude
   - Completado: 2026-04-09

✅ ANALYSIS-001: Comparar contra HeliosLauncher original
   - Cambio: Documentar todas las diferencias
   - Resultado: Cambios son intencionales (branding)
   - Completado: 2026-04-09
```

---

## 🟡 EN PROGRESO (Próximas sesiones)

```
🔄 AUTH-001: Configurar Azure permisos Xbox Live
   - Requisito: Esperar AWAIT-001 ✅
   - Pasos:
     [ ] Recibir email de Mojang
     [ ] Ir a Azure portal
     [ ] API Permissions → Agregar Xbox Live Services
     [ ] Grant admin consent
   - Bloqueador: AWAIT-001
   Priority: 🔴 CRITICAL
   Est: 1 day

🔄 AUTH-002: Validar configuración Azure final
   - Requisito: Completar AUTH-001
   - Pasos:
     [ ] Verify redirect URI: https://login.microsoftonline.com/common/oauth2/nativeclient
     [ ] Verify supported account types: Personal
     [ ] Verify scopes: XboxLive.signin + offline_access
   - Bloqueador: AUTH-001
   Priority: 🔴 CRITICAL
   Est: 0.5 days

🔄 TEST-001: Probar flow completo de login
   - Requisito: AUTH-001 + AUTH-002
   - Pasos:
     [ ] Ejecutar npm start
     [ ] Click en "Microsoft Login"
     [ ] Ingresar credenciales
     [ ] Verificar que app reciba tokens
     [ ] Verificar que usuario queda logged in
   - Bloqueador: AUTH-001
   Priority: 🔴 CRITICAL
   Est: 1 day
```

---

## 🔵 PENDIENTE (Backlog)

```
📋 AUDIT-001: Auditar todos los componentes UI
   - Tarea: Revisar cada .js de scripts/
   - Objetivo: Mapear features trabajados vs pendientes
   - Componentes a revisar:
     - landing.js
     - login.js
     - loginOptions.js
     - settings.js
     - overlay.js
     - uibinder.js
     - uicore.js
     - welcome.js
   Priority: 🟡 HIGH
   Est: 2 days

📋 FEATURES-001: Documentar features de helios-core
   - Tarea: Revisar qué features están disponibles
   - Objetivo: Entender capabilities del launcher
   Priority: 🟡 HIGH
   Est: 1 day

📋 BUILD-001: Crear config electron-builder
   - Tarea: Configurar package options
   - Objetivo: Build ejecutables para Windows
   - Dependencias: Certs de firma (opcional)
   Priority: 🟠 MEDIUM
   Est: 2 days

📋 BUILD-002: Build para macOS
   - Requisito: BUILD-001
   Priority: 🟠 MEDIUM
   Est: 2 days

📋 DIST-001: Crear workflow de distribución
   - Tarea: GitHub Actions para builds automáticos
   - Objetivo: Auto-release en updates
   Priority: 🟠 MEDIUM
   Est: 2 days

📋 DOCS-002: Documentar flow de autenticación completo
   - Tarea: Crear diagrama de flow con screenshots
   - Objetivo: Referencia para debugging
   Priority: 🟠 MEDIUM
   Est: 1 day

📋 TEST-002: Testing en múltiples máquinas Windows
   - Tarea: Validar en diferentes configs
   - Objetivo: Asegurar compatibility
   Priority: 🟠 MEDIUM
   Est: 3 days (después de TEST-001)

📋 RELEASE-001: Crear release v1.0.0
   - Tarea: Tag en GitHub + crear installer
   - Objetivo: Release pública
   - Dependencias: BUILD-001 + TEST-002
   Priority: 🟡 HIGH (después de AUTH completo)
   Est: 1 day
```

---

## 📊 Progress Tracker

```
Completado:  7/7 cleanups ✅
En progreso: 3/3 auth/tests ⏳
Bloqueado:   1/1 por Mojang 🔴
Pendiente:   10+ features 📋

Overall: 40% done (bloqueado en auth, resto OK)
```

---

## 🎯 Critical Path

```
1. AWAIT-001 ⏳ (3-7 days) → email de Mojang
2. AUTH-001 🔄 (1 day) → configurar Azure
3. AUTH-002 🔄 (0.5 days) → validar config
4. TEST-001 🔄 (1 day) → probar login
5. BUILD-001 📋 (2 days) → crear installers
6. RELEASE-001 📋 (1 day) → release v1.0.0

Total: ~8-10 days desde aprobación Mojang
```
