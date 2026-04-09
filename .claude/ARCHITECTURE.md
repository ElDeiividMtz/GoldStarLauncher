# GoldStar Launcher - Arquitectura Técnica

**Estado: Basado en análisis 2026-04-09**

---

## 📐 Componentes Principales

### ✅ [CHECKED] Electron Main Process (index.js)

```javascript
✅ Inicialización
   ├─ remoteMain.initialize()
   ├─ LangLoader.setupLanguage()
   └─ app.disableHardwareAcceleration()

✅ Auto-updater
   ├─ initAutoUpdater() function
   ├─ Event handlers (update-available, update-downloaded)
   └─ Platform-specific logic (macOS auto-download disabled)

✅ Microsoft Auth
   ├─ msftAuthWindow para login
   ├─ msftLogoutWindow para logout
   ├─ did-navigate listener para capture redirect
   └─ IPC reply handlers

✅ IPC Handlers
   ├─ autoUpdateAction (check, install, allow prerelease)
   ├─ distributionIndexDone (relay event)
   ├─ TRASH_ITEM (move to trash)
   └─ Responden a eventos del renderer

✅ Window Management
   ├─ createWindow()
   │  ├─ Size: 980x552 (fixed, no resize)
   │  ├─ Frame: false (frameless)
   │  ├─ Preload: ./app/assets/js/preloader.js
   │  └─ Node integration: disabled ✅
   ├─ macOS Menu setup
   └─ Window lifecycle (ready, activate, all-closed)

❌ [PENDING] Login Session Validation
   └─ Requiere AppID approval para testear
```

---

### ✅ [CHECKED] Authentication Module (authmanager.js)

```javascript
✅ Microsoft Auth Flow
   ├─ MicrosoftAuth from helios-core
   ├─ OAuth 2.0 implementation
   ├─ Error handling
   │  ├─ MicrosoftErrorCode mapping
   │  ├─ No profile
   │  ├─ No Xbox account
   │  ├─ XBL Banned
   │  └─ Under 18
   └─ Display messages via Lang

✅ Mojang Auth Flow
   ├─ MojangRestAPI from helios-core
   ├─ Legacy Yggdrasil support
   ├─ Error handling
   │  ├─ Invalid credentials
   │  ├─ Rate limit
   │  ├─ Method not allowed
   │  └─ Account migrated
   └─ Display messages via Lang

❌ [PENDING] Token Persistence
   └─ ConfigManager integration needed
   
❌ [PENDING] Actual API Calls
   └─ Bloqueado por AppID approval
```

---

### ✅ [CHECKED] Configuration System (configmanager.js)

```javascript
✅ ConfigManager exists and exports
   ├─ Load configuration
   ├─ Save user settings
   ├─ Account management
   └─ Launcher settings

⏳ [PARTIAL] Integration status unknown
   └─ Needs code audit (no lectura actual)
```

---

### ✅ [CHECKED] Distribution Manager (distromanager.js)

```javascript
✅ Estructura existe
   ├─ Distribution index parsing
   ├─ Server listing
   └─ Asset management

⏳ [PARTIAL] Status desconocido
   └─ Needs full code review
```

---

### ✅ [CHECKED] UI Components (app/assets/js/scripts/)

```javascript
⏳ [NEEDS AUDIT] Componentes:
   ├─ landing.js - Landing page
   ├─ login.js - Login UI
   ├─ loginOptions.js - Login method selection
   ├─ settings.js - Settings panel
   ├─ overlay.js - Overlay elements
   ├─ uibinder.js - Event binding
   ├─ uicore.js - Core UI logic
   └─ welcome.js - Welcome screen

Acción pendiente: Auditar cada componente para estado
```

---

### ✅ [CHECKED] Supporting Modules

```javascript
✅ langloader.js
   ├─ Language loading
   ├─ Translation system
   └─ setupLanguage() called at startup

✅ ipcconstants.js
   ├─ AZURE_CLIENT_ID: cce7f44e-d28e-4b8f-a863-f41338d46753
   ├─ MSFT_OPCODE (IPC channel names)
   ├─ MSFT_REPLY_TYPE (SUCCESS/ERROR)
   ├─ MSFT_ERROR codes
   └─ SHELL_OPCODE (trash operation)

✅ preloader.js
   ├─ Security: Context isolation
   ├─ Limited API surface
   └─ IPC bridge to main

✅ isdev.js
   ├─ Dev/Prod detection
   └─ Used in auto-updater config

⏳ [PARTIAL] discordwrapper.js
   ├─ Discord RPC integration
   └─ Needs testing

⏳ [PARTIAL] dropinmodutil.js
   ├─ Mod utilities
   └─ Needs review

⏳ [PARTIAL] processbuilder.js
   ├─ Process execution
   └─ Needs review
```

---

## 🔄 Flujos Principales

### Authentication Flow

```
[LOGIN BUTTON] (UI)
      ↓
[Renderer IPC] → MSFT_AUTH_OPEN_LOGIN
      ↓
[Main Process] → Crea BrowserWindow
      ↓
[Microsoft Login URL]
      ├─ Client ID: cce7f44e-d28e-4b8f-a863-f41338d46753
      ├─ Redirect: https://login.microsoftonline.com/common/oauth2/nativeclient
      └─ Scopes: XboxLive.signin offline_access
      ↓
[User enters credentials]
      ↓
[Capture redirect URI]
      ├─ Extract authorization code
      └─ Extract state parameter
      ↓
[AuthManager.getAccessToken(code)]
      ├─ MicrosoftAuth.getAccessToken() [helios-core]
      ├─ Get Xbox Live token
      └─ Get Minecraft profile
      ↓
[IPC REPLY] ← SUCCESS / ERROR
      ↓
[Renderer] updates UI
      ↓
[User logged in]

❌ [PENDING] Pasos 5-7 requieren AppID approval
```

---

### Auto-updater Flow

```
[App startup]
      ↓
[initAutoUpdater() called]
      ↓
[autoUpdater.checkForUpdates()]
      ├─ GitHub releases feed
      ├─ Compara versiones
      └─ allowPrerelease config
      ↓
[Update available?]
      ├─ YES → download + notify
      ├─ NO → stay current
      └─ macOS: manual download (auto-download disabled)
      ↓
[On quit] → autoInstallOnAppQuit
      ↓
[Restart with new version]
```

---

## 📦 Dependencias Clave

### Runtime
| Paquete | Versión | Uso | Status |
|---------|---------|-----|--------|
| electron | 39.2.7 | Desktop runtime | ✅ |
| @electron/remote | 2.1.3 | IPC bridge | ✅ |
| helios-core | ~2.3.0 | Launcher core | ✅ |
| ejs | 3.1.10 | Template engine | ✅ |
| got | 11.8.5 | HTTP client | ✅ |
| fs-extra | 11.3.3 | File operations | ✅ |
| discord-rpc-patch | 4.0.1 | Discord integration | ⏳ |
| electron-updater | 6.7.3 | Auto-updates | ✅ |

### Development
| Paquete | Versión | Uso | Status |
|---------|---------|-----|--------|
| electron-builder | 26.4.0 | Build tool | ✅ |
| eslint | 9.39.2 | Linting | ✅ |

---

## 🔐 Security Checklist

```
✅ Context Isolation: true
✅ Node Integration: false
✅ Preload script: configured
✅ IPC whitelist: explicit handlers
✅ ClientID: public (standard for OAuth)
❌ Code signing: Not implemented (optional for v1.0.0)
❌ Updates verification: Depends on GitHub release integrity
```

---

## ⚠️ Known Issues & Blockers

### 🔴 Critical Blockers
```
1. AppID Review pending
   - Impact: Cannot test Microsoft login
   - Solution: Esperar email de Mojang
   - Timeline: 3-7 days
```

### 🟡 Known Limitations
```
1. discord-rpc-patch no testado
   - Status: Código presente, no verificado
   - Action: Testear después de Azure setup
   
2. Config persistence no documentado
   - Status: ConfigManager existe pero no auditado
   - Action: Revisar authmanager.js completo
```

### 🟠 Technical Debt
```
1. Falta UI audit completo
   - 8 componentes JS no revisados
   - Action: Auditar landing.js, login.js, etc.
   
2. Docs incompletas
   - Action: Documentar Microsoft auth flow completo
```

---

## 🎯 Próximos Pasos Arquitectónicos

1. **POST AppID Approval:**
   - [ ] Agregar Xbox Live permisos en Azure
   - [ ] Testear flow completo login
   - [ ] Auditar Discord RPC integration

2. **Pre-Release:**
   - [ ] Auditar todos componentes UI
   - [ ] Test end-to-end en múltiples máquinas
   - [ ] Configurar electron-builder options

3. **Distribution:**
   - [ ] Crear GitHub Actions para builds
   - [ ] Configurar auto-updates
   - [ ] Create installers for Windows/macOS/Linux
