# GoldStar Launcher - Decisiones Arquitectónicas

**Registro de decisiones importantes y su contexto**

---

## 🔴 DECISIÓN: Usar Cliente ID Público (GoldStar Studios)

**Fecha:** 2026-04-09  
**Resultado:** ✅ IMPLEMENTADO

### Problema
¿Dónde guardar el Azure Client ID? ¿Encriptado en el código?

### Análisis
- **Encriptación:** Requeriría master password → insegura si está en el código
- **Variables de entorno:** No funciona en apps distribuidas
- **Public ID:** El estándar OAuth permite que Client IDs sean públicos

### Decisión
**Usar Client ID público en el código.** Es seguro porque:
1. Los IDs públicos OAuth son designed para ser público
2. El ID solo funciona con redirect URIs específicas
3. No se pueden obtener secretos sin MFA
4. Es el patrón usado por Electron Launcher original

### Implementación
- Client ID guardado en `app/assets/js/ipcconstants.js`
- Público en GitHub (normal)
- No requiere encriptación

### Implicaciones
- ✅ Simplifica deployment
- ✅ No hay secretos en el repo
- ❌ Client ID es de GoldStar Studios (no transferible)

---

## 🟡 DECISIÓN: Esperar Aprobación Mojang vs Usar Heredado

**Fecha:** 2026-04-09  
**Resultado:** ⏳ EN PROGRESO

### Problema
AppID Review toma 3-7 días. ¿Usar Client ID del HeliosLauncher original mientras esperamos?

### Opciones Consideradas
1. **Usar Client ID HeliosLauncher original**
   - Pro: Funciona ahora
   - Con: Viola ToS (shared credentials)
   - Con: Podría ser revocado por cambios en original

2. **Esperar Mojang + usar GoldStar ID**
   - Pro: Es lo correcto
   - Pro: Futuro-proof
   - Con: 3-7 días de espera

### Decisión
**Esperar Mojang + usar GoldStar ID.** Razones:
- Es lo técnicamente correcto
- Única solución a largo plazo
- 3-7 días es aceptable para desarrollo

### Próximos Pasos
1. Esperar email de Mojang ✅
2. Cuando apruebe, agregar permisos Xbox Live en Azure

---

## ✅ DECISIÓN: Revertir Electron v32 → v39

**Fecha:** 2026-04-09  
**Resultado:** ✅ IMPLEMENTADO

### Problema
package.json tenía `electron ^32.3.3` pero original es `^39.2.7`.

### Análisis
- v32 → v39 es downgrade de 7 versiones
- Downgrade fue probablemente intento fallido de arreglar un bug
- Problema real: `ELECTRON_RUN_AS_NODE` en env (ya arreglado)

### Decisión
**Revertir a v39.2.7.** Razones:
- Es la versión del original HeliosLauncher
- v39 es más reciente y segura
- Todas las dependencias soportan v39
- Problem (ELECTRON_RUN_AS_NODE) está en launch.bat

### Implementación
- package.json: `"electron": "^39.2.7"`
- npm install actualizado

### Implicaciones
- ✅ Versión más segura
- ✅ Mejor compatibility con nuevas features
- ✅ Matches original

---

## ✅ DECISIÓN: Remover cross-env

**Fecha:** 2026-04-09  
**Resultado:** ✅ IMPLEMENTADO

### Problema
package.json tenía `cross-env ^10.1.0` en devDependencies y npm start usaba `cross-env ELECTRON_RUN_AS_NODE=`.

### Análisis
- `cross-env` es necesario para cross-platform env vars (Windows/Linux/macOS)
- Pero ELECTRON_RUN_AS_NODE puede manejarse en `launch.bat`
- npm start es usado en desarrollo local (puedo manejar con bat)

### Decisión
**Remover cross-env.** Razones:
- launch.bat maneja ELECTRON_RUN_AS_NODE mejor
- npm start puede ser simple: `electron .`
- Menos dependencias dev
- Matches original HeliosLauncher

### Implementación
- Removido de package.json
- npm start vuelve a: `electron .`
- launch.bat maneja env setup

### Implicaciones
- ✅ Menos dependencias
- ✅ Código más simple
- ⚠️ launch.bat solo para Windows (es Windows launcher)

---

## ✅ DECISIÓN: Sistema de Docs .claude/ en Markdown

**Fecha:** 2026-04-09  
**Resultado:** ✅ IMPLEMENTADO

### Problema
¿Cómo documentar el proyecto para mantener memoria entre sesiones?

### Opciones
1. **Obsidian vault** - Bonito UI pero separate tool
2. **Notion** - Web-based pero requiere login
3. **Markdown en .claude/** - Native, versionable, simple

### Decisión
**Markdown en .claude/** (STATUS.md, TASKS.md, etc). Razones:
- Compatible con mis lecturas/escrituras
- Versionable en Git
- Puedo iterar sobre archivos fácilmente
- Legible como plain text
- Integrado con el proyecto

### Implementación
- .claude/ folder en root
- STATUS.md (resumen general)
- TASKS.md (task tracking)
- DECISIONS.md (este archivo)
- ARCHITECTURE.md (diseño técnico)

### Implicaciones
- ✅ Fácil acceso para Claude
- ✅ Version control built-in
- ✅ Puede ser parte del repo
- ✅ Itera seamlessly

---

## ⏳ DECISIÓN: Cliente ID Público vs Private en GitHub

**Fecha:** 2026-04-09  
**Resultado:** ⏳ PENDING DECISION

### Contexto
Cliente ID está público en ipcconstants.js y GitHub.

### Consideraciones
- OAuth Client IDs son designed para ser públicos
- No hay secretos que proteger (no hay API keys)
- Matches original HeliosLauncher
- Pero: Es specific a GoldStar, cambios impactarían la empresa

### Opciones
1. **Dejar público** - Standard para OAuth, simple
2. **Usar .env.example** - Más control pero más complejo
3. **Usar formato obfuscado** - No necesario para OAuth

### Recomendación
**Dejar público** por ahora. Es standard para Electron launchers.

---

## 📋 DECISIONES FUTURAS (Pendientes)

### 1. Firma de executables Windows
**Pregunta:** ¿Usar certificado de firma?
- Pro: Evita "Unknown Publisher" warnings
- Con: Costo ($$$)
- Con: Necesita renovación anual

**Recomendación:** Hacer sin firma para v1.0.0, agregar después

### 2. Updates automáticos
**Pregunta:** ¿Usar GitHub releases o servidor propio?
- GitHub releases: Simple, gratis
- Servidor: Más control

**Recomendación:** GitHub releases (matches HeliosLauncher)

### 3. Analytics/Telemetry
**Pregunta:** ¿Recolectar datos de uso?
- Discord webhook: Simple
- Analytics service: Más robusto

**Recomendación:** Discord webhook para inicio (Discord está en deps)

### 4. Distribución
**Pregunta:** ¿Solo .exe o también portable?
- Standalone .exe: Más professional
- Portable: Más control de usuarios

**Recomendación:** .exe installer (matches original)
