# Escenarios de Prueba: Gestión del Marcador FEATURE_CODE_JIRA

## Cobertura

| Área | Escenarios |
|------|------------|
| A. create-prd — creación inicial | 3 |
| B. create-prd — agregar feature a PRD shardeado | 4 |
| C. sync-epics-stories step-00 — PENDING (Caso 1) | 3 |
| D. sync-epics-stories step-00 — Conflicto (Caso 2) | 3 |
| E. sync-epics-stories step-00 — KEY huérfano (Caso 3) | 3 |
| F. sync-epics-stories step-00 — Shard eliminado (Caso 4) | 3 |
| G. Flujo completo end-to-end | 2 |

---

## A. create-prd — Creación inicial del PRD

### A-01: Features traídos desde Jira (opción 1)
**Precondición:** Jira tiene features `PROY-10 Gestión de Clientes`, `PROY-11 Reportes`.

**Pasos:**
1. Ejecutar `/create-prd`
2. En el paso de descubrimiento elegir **opción 1 (Jira)**
3. Seleccionar el proyecto en Jira

**Resultado esperado:**
- El PRD contiene secciones `### feature — Gestión de Clientes` y `### feature — Reportes`
- Cada sección incluye `FEATURE_CODE_JIRA=PROY-10` y `FEATURE_CODE_JIRA=PROY-11` respectivamente
- NO aparece ningún `PENDING:` en el documento

---

### A-02: Features ingresados manualmente (opción 2)
**Precondición:** ninguna.

**Pasos:**
1. Ejecutar `/create-prd`
2. En el paso de descubrimiento elegir **opción 2 (Manual)**
3. Ingresar: "Gestión de Clientes, Reportes Financieros"

**Resultado esperado:**
- El PRD contiene `### feature — Gestión de Clientes` con `FEATURE_CODE_JIRA=PENDING:gestion-de-clientes`
- El PRD contiene `### feature — Reportes Financieros` con `FEATURE_CODE_JIRA=PENDING:reportes-financieros`
- NO aparece ningún KEY real de Jira

---

### A-03: PRD shardeado tras creación — marcadores preservados en shards
**Precondición:** PRD maestro creado con A-01 (tiene KEYs reales).

**Pasos:**
1. Ejecutar `/shard-doc` sobre el PRD maestro
2. Verificar los shards generados en `prd/`

**Resultado esperado:**
- `prd/f1-gestion-de-clientes.md` contiene `FEATURE_CODE_JIRA=PROY-10`
- `prd/f2-reportes.md` contiene `FEATURE_CODE_JIRA=PROY-11`
- Los marcadores no fueron alterados por el sharding

---

## B. create-prd — Agregar feature a PRD ya shardeado

### B-01: Nuevo feature que ya existe en Jira
**Precondición:** PRD ya shardeado con `f1`, `f2`. Jira tiene `PROY-15 Portal de Pagos` sin shard local.

**Pasos:**
1. Ejecutar `/create-prd` y solicitar agregar un nuevo feature "Portal de Pagos"
2. El workflow ejecuta `get-features`
3. Se muestra la lista de features de Jira sin shard local
4. Seleccionar `PROY-15 Portal de Pagos`

**Resultado esperado:**
- Se crea `prd/f3-portal-de-pagos.md`
- El shard contiene `FEATURE_CODE_JIRA=PROY-15`
- NO se modifica el PRD maestro original
- NO se crea `PENDING:`

---

### B-02: Nuevo feature que NO existe en Jira
**Precondición:** PRD ya shardeado con `f1`, `f2`. Jira no tiene el feature nuevo.

**Pasos:**
1. Ejecutar `/create-prd` y solicitar agregar "Integraciones Externas"
2. El workflow ejecuta `get-features`
3. Se muestra la lista filtrada
4. Elegir **"Ninguno — es un feature completamente nuevo"**

**Resultado esperado:**
- Se crea `prd/f3-integraciones-externas.md`
- El shard contiene `FEATURE_CODE_JIRA=PENDING:integraciones-externas`
- NO se modifica el PRD maestro original

---

### B-03: Todos los features de Jira ya tienen shard local
**Precondición:** PRD shardeado donde todos los features de Jira tienen su `f{N}` correspondiente.

**Pasos:**
1. Solicitar agregar nuevo feature "Analytics Avanzados"
2. El workflow ejecuta `get-features`
3. La lista filtrada (features sin shard local) queda vacía

**Resultado esperado:**
- El workflow muestra únicamente la opción **"Ninguno — es un feature completamente nuevo"**
- Se crea el shard con `PENDING:analytics-avanzados`

---

### B-04: Numeración secuencial correcta
**Precondición:** PRD shardeado con `f1`, `f2`, `f3`.

**Pasos:**
1. Agregar dos nuevos features consecutivos

**Resultado esperado:**
- Primer nuevo feature → `f4-*.md`
- Segundo nuevo feature → `f5-*.md`
- No hay saltos ni repeticiones en la numeración

---

## C. step-00 — Caso 1: Features PENDING

### C-01: PENDING creado exitosamente en Jira
**Precondición:** `prd/f3-integraciones-externas.md` tiene `FEATURE_CODE_JIRA=PENDING:integraciones-externas`. Jerarquía personalizada configurada con `hierarchy_level_2_name`.

**Pasos:**
1. Ejecutar `/sync-epics-stories`
2. Completar step-02 (auth + config)
3. El step-00 detecta el PENDING

**Resultado esperado:**
- Se informa al usuario que se creará el feature en Jira
- Se crea el issue en Jira bajo el padre del Nivel 2
- Se obtiene el ISSUE_KEY real (ej: `PROY-25`)
- `prd/f3-integraciones-externas.md` queda con `FEATURE_CODE_JIRA=PROY-25`
- Si existe `epics/f3-*.md`, también se actualiza
- El resumen final muestra "Features creados en Jira: 1"

---

### C-02: PENDING con jerarquía estándar (sin Nivel 2)
**Precondición:** `project_config.yaml` sin campos `hierarchy_level_*`. Feature con PENDING.

**Pasos:**
1. Ejecutar `/sync-epics-stories`

**Resultado esperado:**
- El feature se crea en Jira directamente bajo el proyecto raíz
- El tipo de issue es `Epic` (no Feature personalizado)
- Los shards se actualizan con el KEY real

---

### C-03: Falla la creación del PENDING en Jira
**Precondición:** Feature con PENDING. El padre del Nivel 2 no existe en Jira (fue borrado).

**Pasos:**
1. Ejecutar `/sync-epics-stories`

**Resultado esperado:**
- El workflow advierte: `⚠️ No se pudo crear '{slug}' en Jira`
- Las épicas del `f{N}` afectado son omitidas en esta sincronización
- Los demás features continúan sincronizándose normalmente
- El resumen final muestra "Features bloqueados: 1"

---

## D. step-00 — Caso 2: Conflicto de marcadores

### D-01: prd tiene PENDING, epics tiene KEY real
**Precondición:**
- `prd/f2-reportes.md` → `FEATURE_CODE_JIRA=PENDING:reportes`
- `epics/f2-reportes.md` → `FEATURE_CODE_JIRA=PROY-11`

**Pasos:**
1. Ejecutar `/sync-epics-stories`
2. El step-00 detecta el conflicto en `f2`
3. El ingeniero elige **[1] Usar PROY-11**

**Resultado esperado:**
- `prd/f2-reportes.md` se actualiza a `FEATURE_CODE_JIRA=PROY-11`
- El feature NO entra al flujo de creación PENDING
- La sincronización continúa normalmente con `PROY-11`

---

### D-02: epics tiene PENDING, prd tiene KEY real — el ingeniero elige PENDING
**Precondición:**
- `prd/f2-reportes.md` → `FEATURE_CODE_JIRA=PROY-11`
- `epics/f2-reportes.md` → `FEATURE_CODE_JIRA=PENDING:reportes`

**Pasos:**
1. Ejecutar `/sync-epics-stories`
2. El step-00 detecta el conflicto
3. El ingeniero elige **[2] Usar PENDING:reportes**

**Resultado esperado:**
- `prd/f2-reportes.md` se actualiza a `FEATURE_CODE_JIRA=PENDING:reportes`
- El feature entra al flujo de creación (sección 0.3)
- Se crea un nuevo issue en Jira y se actualizan ambos shards con el KEY nuevo

---

### D-03: Múltiples conflictos — se resuelven uno a uno
**Precondición:** `f2` y `f4` tienen conflicto. `f1` y `f3` están limpios.

**Pasos:**
1. Ejecutar `/sync-epics-stories`

**Resultado esperado:**
- El workflow resuelve el conflicto de `f2` primero (espera respuesta del ingeniero)
- Luego resuelve el conflicto de `f4` (espera respuesta del ingeniero)
- `f1` y `f3` se procesan sin interrupción
- El workflow NO continúa a step-03 hasta que ambos conflictos estén resueltos

---

## E. step-00 — Caso 3: KEY real huérfano en Jira

### E-01: Issue existe en Jira y el nombre coincide
**Precondición:** `prd/f1-gestion-de-clientes.md` → `FEATURE_CODE_JIRA=PROY-10`. Issue `PROY-10` existe en Jira con summary "Gestión de Clientes".

**Pasos:**
1. Ejecutar `/sync-epics-stories`

**Resultado esperado:**
- La verificación pasa silenciosamente
- No se muestra nada al usuario
- El feature procede a la sincronización de épicas normalmente

---

### E-02: Issue existe pero el nombre cambió en el shard
**Precondición:** `prd/f1-*.md` → `FEATURE_CODE_JIRA=PROY-10`, `feature_name` = "Gestión Avanzada de Clientes". Issue `PROY-10` en Jira tiene summary "Gestión de Clientes".

**Pasos:**
1. Ejecutar `/sync-epics-stories`

**Resultado esperado:**
- El step-00 detecta la diferencia de nombres
- Actualiza el issue `PROY-10` en Jira con el nuevo summary
- Confirma: `✓ Feature PROY-10 actualizado en Jira: 'Gestión de Clientes' → 'Gestión Avanzada de Clientes'`
- El feature continúa a la sincronización de épicas

---

### E-03: Issue NO existe en Jira (fue borrado)
**Precondición:** `prd/f2-reportes.md` → `FEATURE_CODE_JIRA=PROY-11`. Issue `PROY-11` fue eliminado de Jira.

**Pasos:**
1. Ejecutar `/sync-epics-stories`

**Resultado esperado:**
- El step-00 advierte: `⚠️ PROY-11 no existe en Jira`
- Las épicas de `f2` son omitidas en esta sincronización
- Los demás features continúan normalmente
- El shard NO es modificado automáticamente (el ingeniero debe corregirlo manualmente)
- El resumen final muestra "Features bloqueados: 1"

---

## F. step-00 — Caso 4: Shard eliminado localmente

### F-01: Shard eliminado — ingeniero elige Archivar
**Precondición:** `project_config.yaml` tiene `synced_features` con `PROY-10`. El archivo `prd/f1-*.md` fue borrado.

**Pasos:**
1. Ejecutar `/sync-epics-stories`
2. El step-00 detecta que `PROY-10` no tiene shard local
3. El ingeniero elige **[1] Archivar**

**Resultado esperado:**
- El issue `PROY-10` en Jira es transicionado a estado archivado/cancelado
- `PROY-10` es eliminado de `synced_features` en `project_config.yaml`
- El resumen muestra "Features eliminados resueltos: 1"

---

### F-02: Shard eliminado — ingeniero elige Ignorar
**Precondición:** igual que F-01.

**Pasos:**
1. El ingeniero elige **[3] Ignorar**

**Resultado esperado:**
- Jira NO es modificado
- `PROY-10` es eliminado de `synced_features` en `project_config.yaml`
- En la próxima ejecución del sync, `PROY-10` ya no aparecerá en la lista de huérfanos

---

### F-03: No hay synced_features en project_config.yaml (primera ejecución)
**Precondición:** `project_config.yaml` existe pero no tiene el campo `synced_features`.

**Pasos:**
1. Ejecutar `/sync-epics-stories`

**Resultado esperado:**
- La sección 0.5 (detección de shards eliminados) se omite silenciosamente
- El workflow continúa sin preguntar nada al usuario sobre este punto
- Al finalizar el step-00, `synced_features` es creado en `project_config.yaml` con los features actuales

---

## G. Flujo completo end-to-end

### G-01: Proyecto nuevo — desde cero hasta sync
**Precondición:** Proyecto sin ningún artefacto previo. Jira tiene features `PROY-10` y `PROY-11`.

**Pasos:**
1. `/create-prd` → opción Jira → genera PRD con `FEATURE_CODE_JIRA=PROY-10` y `PROY-11`
2. `/shard-doc` → genera `prd/f1-*.md` y `prd/f2-*.md` con marcadores preservados
3. `/create-epics-and-stories` → genera `epics/f1-*.md` y `epics/f2-*.md`
4. `/sync-epics-stories` → step-00 verifica KEYs (existen, nombres coinciden), step-03 → step-04 sincroniza épicas

**Resultado esperado:**
- step-00 completa sin interrupciones (todos los KEYs son válidos)
- `synced_features` en `project_config.yaml` queda con `PROY-10` y `PROY-11`
- Las épicas quedan sincronizadas en Jira bajo sus features correspondientes

---

### G-02: Feature nuevo agregado post-sharding + sync completo
**Precondición:** Estado final de G-01. Se quiere agregar un tercer feature.

**Pasos:**
1. `/create-prd` → agregar feature "Notificaciones" → `get-features` ejecutado → feature no existe en Jira → elegir "Ninguno" → se crea `prd/f3-notificaciones.md` con `PENDING:notificaciones`
2. Crear épicas para el nuevo feature → `epics/f3-notificaciones.md` también con `PENDING:notificaciones`
3. `/sync-epics-stories`:
   - step-00 detecta PENDING en `f3`
   - Crea `PROY-30 Notificaciones` en Jira
   - Actualiza `prd/f3-*.md` y `epics/f3-*.md` con `FEATURE_CODE_JIRA=PROY-30`
   - step-04 sincroniza las épicas de `f3` bajo `PROY-30`

**Resultado esperado:**
- `PROY-30` creado en Jira correctamente
- Épicas de `f3` sincronizadas bajo `PROY-30`
- `synced_features` en `project_config.yaml` ahora tiene `PROY-10`, `PROY-11` y `PROY-30`
- Los features `f1` y `f2` no fueron re-creados (idempotencia preservada)
