# GoldStar Launcher - Documentation Index

**Sistema de documentación Claude-native**  
**Última actualización:** 2026-04-09

---

## 📄 Archivos Disponibles

### 🔴 [STATUS.md](STATUS.md) - Resumen Ejecutivo
- Estado general del proyecto
- Hito actual
- Checklist de componentes
- Próximas acciones

**Cuándo leer:** Al inicio de cada sesión

---

### 📋 [TASKS.md](TASKS.md) - Task Tracking
- Tareas completadas (7)
- En progreso (3)
- Bloqueadas (1)
- Backlog (10+)
- Progress tracker

**Cuándo usar:** Para planificar sesiones, markear progreso

---

### 🏗️ [ARCHITECTURE.md](ARCHITECTURE.md) - Análisis Técnico
- Componentes principales
  - ✅ Electron Main Process
  - ✅ Authentication Module
  - ✅ Configuration System
  - ⏳ UI Components (pending audit)
- Flujos principales (Auth, Auto-updater)
- Dependencias
- Security checklist
- Known issues

**Cuándo usar:** Para entender cómo funciona, debugging

---

### 🎯 [DECISIONS.md](DECISIONS.md) - Decisiones Arquitectónicas
- Decisiones tomadas (5):
  1. Cliente ID público
  2. Esperar Mojang vs usar heredado
  3. Revertir Electron v32→v39
  4. Remover cross-env
  5. Usar .claude/ markdown docs
- Futuras decisiones (4) pendientes:
  1. Code signing
  2. Updates
  3. Analytics
  4. Distribution

**Cuándo usar:** Entender contexto de cambios, validar decisiones

---

### 📝 [SESSION_LOG.md](SESSION_LOG.md) - Logs de Sesiones
- Session actual (2026-04-09)
  - Work done
  - Decisions made
  - Current status
  - Next steps
  - Learnings

**Cuándo usar:** Histórico de trabajo, continuidad entre sesiones

---

### 📍 [INDEX.md](INDEX.md) - Este Archivo
Mapa de documentación completa

---

## 🗂️ Estructura Carpeta

```
h:\launcher\.claude/
├── INDEX.md (este archivo)
├── STATUS.md (estado general)
├── TASKS.md (task tracking)
├── DECISIONS.md (decisiones)
├── ARCHITECTURE.md (análisis técnico)
└── SESSION_LOG.md (histórico)
```

---

## 🎯 Workflow Sugerido

### Al iniciar sesión
1. Leer [STATUS.md](STATUS.md) (2 min)
2. Revisar [TASKS.md](TASKS.md) (2 min)
3. Identificar bloqueadores

### Durante la sesión
1. Trabajar en tarea
2. Markear en [TASKS.md](TASKS.md)
3. Si nueva decisión → agregar a [DECISIONS.md](DECISIONS.md)

### Al terminar sesión
1. Actualizar [STATUS.md](STATUS.md) si hay cambios
2. Completar [SESSION_LOG.md](SESSION_LOG.md) con nueva entrada
3. Commit todo a Git

---

## 📊 Quick Status

| Métrica | Valor |
|---------|-------|
| Código completado | 40% |
| Código limpio | ✅ |
| Docs status | ✅ Creadas |
| Bloqueadores | 1 (Mojang AppID) |
| Ready to proceed | ⏳ Esperando AppID |

---

## 🔍 How to Find Things

### Por tarea
→ Ir a [TASKS.md](TASKS.md)

### Por componente técnico
→ Ir a [ARCHITECTURE.md](ARCHITECTURE.md)

### Por decisión/contexto
→ Ir a [DECISIONS.md](DECISIONS.md)

### Por estado general
→ Ir a [STATUS.md](STATUS.md)

### Por histórico
→ Ir a [SESSION_LOG.md](SESSION_LOG.md)

---

## ✅ Checklist para Nueva Sesión

- [ ] Leer STATUS.md
- [ ] Revisar TASKS.md
- [ ] Identificar bloqueadores
- [ ] Planificar sesión
- [ ] Trabajar
- [ ] Actualizar docs
- [ ] Commit a Git

---

## 📞 Contact / Notes

Para mantener estos docs actualizados:
- Leer archivos existentes antes de modificar
- Mantener formato consistente
- Marcar [✅ CHECKED], [⏳ PENDING], [❌ BLOCKED]
- Documentar decisiones cuando se tomen

---

**Last sync:** 2026-04-09 by Claude  
**Next review:** Cuando llegue email de Mojang
