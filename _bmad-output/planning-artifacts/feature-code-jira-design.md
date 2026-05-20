# Diseño: Gestión del Marcador FEATURE_CODE_JIRA

## Archivos Modificados

| Archivo | Tipo |
|---------|------|
| `_siesa-agents/bmm/workflows/2-plan-workflows/prd/workflow_ext.md` | Extensión de workflow PRD |
| `.claude/commands/jira_sync/feature_sync.md` | Skill extensión — inyecta el Paso 0 en el workflow base |
| `_bmad/bmm/workflows/sync-epics-stories` | Workflow base de sincronización Jira |

---

## Qué Implementamos

### 1. Marcador `FEATURE_CODE_JIRA=` en shards del PRD

Cada shard de feature (`prd/f{N}-*.md` y `epics/f{N}-*.md`) debe contener el marcador `FEATURE_CODE_JIRA=` con uno de dos formatos:

| Formato | Significado |
|---------|-------------|
| `FEATURE_CODE_JIRA=PROY-123` | Feature ya existe en Jira — ID real |
| `FEATURE_CODE_JIRA=PENDING:mi-feature` | Feature creado localmente — aún no existe en Jira |

**Cuándo se asigna cada uno:**
- **Viene de Jira** (`get-features`) en la creación inicial del PRD → se asigna el `ISSUE_KEY` real directamente.
- **Shard nuevo agregado a PRD ya shardeado** → ver flujo de resolución abajo.
- **No se encontró correspondencia en Jira** → se asigna `PENDING:{feature-slug}`.

#### Flujo de resolución al agregar un nuevo feature a un PRD ya shardeado

Cuando el PRD ya fue shardeado y el ingeniero agrega un nuevo feature por prompting, **no se asigna PENDING directamente**. En cambio:

1. Ejecutar el skill `get-features` para traer el árbol actualizado de features desde Jira.
2. Mostrar al ingeniero la lista de features disponibles en Jira que aún **no tienen shard local** (es decir, cuyo `ISSUE_KEY` no aparece en ningún `prd/f{N}-*.md` existente).
3. Preguntar al ingeniero:
   > *"Se encontraron los siguientes features en Jira sin shard local. ¿Alguno corresponde al feature que acabas de crear?"*
   - Listar los features con su KEY y nombre.
   - Opción adicional: **"Ninguno — es un feature completamente nuevo"**.
4. **Si el ingeniero selecciona un feature de Jira** → crear el shard con `FEATURE_CODE_JIRA={ISSUE_KEY}` del feature seleccionado.
5. **Si el ingeniero elige "Ninguno"** → crear el shard con `FEATURE_CODE_JIRA=PENDING:{feature-slug}`.

Este flujo evita crear duplicados en Jira cuando el feature ya existe allí pero aún no tiene shard local.

---

### 2. Paso 0 en `sync-epics-stories` — Gestión del Ciclo de Vida de Features

Definido en `.claude/commands/jira_sync/feature_sync.md` (skill de extensión) e inyectado al inicio del workflow base `_bmad/bmm/workflows/sync-epics-stories`. Se ejecuta **siempre** antes de cualquier sincronización de épicas. Cubre 4 casos:

---

#### Caso 1 — Feature PENDING (no existe en Jira)
**Trigger:** `FEATURE_CODE_JIRA=PENDING:{slug}`

**Comportamiento:**
1. Informa al usuario los features que serán creados.
2. Crea el feature en Jira bajo el padre correcto (jerarquía personalizada o raíz).
3. Obtiene el `ISSUE_KEY` real y actualiza **todos** los shards `prd/` y `epics/` del feature.
4. Si la creación falla → omite las épicas de ese feature y avisa al usuario.

---

#### Caso 2 — Conflicto de marcadores entre shards
**Trigger:** `prd/f{N}` tiene `PENDING:{slug}` y `epics/f{N}` tiene KEY real (o viceversa).

**Comportamiento:**
1. Detiene el procesamiento de ese feature.
2. Notifica al ingeniero mostrando exactamente qué shard tiene qué valor.
3. Pregunta al ingeniero cuál valor es el correcto:
   - **Usar KEY real** → actualiza el shard con PENDING.
   - **Usar PENDING** → limpia el KEY incorrecto, el feature se creará en Jira en el paso siguiente.

---

#### Caso 3 — Feature con KEY real que ya no existe en Jira
**Trigger:** `FEATURE_CODE_JIRA=PROY-123` pero el issue fue borrado de Jira.

**Comportamiento:**
1. Verifica existencia del issue via API.
2. Si no existe → detiene la sincronización de ese feature y avisa al ingeniero con el KEY afectado.
3. Las épicas del feature afectado son omitidas hasta que el ingeniero corrija el marcador.

**También en este paso:** si el issue SÍ existe pero su nombre cambió en el shard → actualiza el issue en Jira (`PUT`) automáticamente.

---

#### Caso 4 — Shard eliminado localmente
**Trigger:** Un feature estaba en `synced_features` del `project_config.yaml` pero ya no tiene shard local.

**Comportamiento:**
1. Detecta el feature huérfano comparando el registro histórico contra los shards actuales.
2. Pregunta al ingeniero qué hacer con el issue en Jira:
   - **Archivar** — transiciona a estado archivado/cancelado.
   - **Cerrar** — transiciona a "Done" o "Closed".
   - **Ignorar** — no toca Jira, solo elimina del registro local.

---

### 3. Registro `synced_features` en `project_config.yaml`

Al finalizar el Paso 0, `sync-epics-stories` mantiene un historial actualizado en `_bmad-output/jira_docs/project_config.yaml`:

```yaml
synced_features:
  - key: "PROY-123"
    name: "Nombre del Feature A"
    shard: "f1"
  - key: "PROY-456"
    name: "Nombre del Feature B"
    shard: "f2"
```

Este registro es la fuente de verdad para detectar el **Caso 4** (shards eliminados) en ejecuciones futuras.

---

---

## Plan de Implementación

### Archivos a crear / modificar

| Acción | Archivo | Detalle |
|--------|---------|---------|
| **Crear** | `_bmad/bmm/workflows/sync-epics-stories/step-00-feature-lifecycle.md` | Nuevo step con la lógica completa de los 4 casos |
| **Modificar** | `_bmad/bmm/workflows/sync-epics-stories/workflow.md` | Inyectar llamada a step-00 entre step-02 y step-03 |
| **Modificar** | `.claude/commands/jira_sync/feature_sync.md` | Reemplazar la descripción del Paso 0 por referencia al step formal |

### Punto de inyección en el workflow

El Paso 0 requiere autenticación Jira para los casos 1, 3 y 4. Por eso debe ejecutarse **después de step-02** (auth + config) y **antes de step-03** (selección de alcance):

```
step-01-init.md       (detección de estado / continuación)
step-01b-continue.md  (reanudar desde checkpoint)
step-02-setup.md      (auth Jira MCP + config project_config.yaml)
    ↓
step-00-feature-lifecycle.md  ← NUEVO (necesita auth ya lista)
    ↓
step-03-scope.md      (selección de alcance — extendido por feature_sync.md)
step-04-epics.md      (sincroniza épicas)
step-05-stories.md    (sincroniza historias)
```

### Por qué después de step-02

| Sub-paso | Necesita auth Jira |
|----------|--------------------|
| 0.1 Inventario local + detectar conflictos | ❌ |
| 0.2 Crear features PENDING en Jira | ✅ |
| 0.3 Verificar/actualizar KEY reales en Jira | ✅ |
| 0.4 Archivar/cerrar features eliminados en Jira | ✅ |
| 0.5 Actualizar `synced_features` en YAML | ❌ |

Tres de los cinco sub-pasos necesitan Jira → el step completo va post-auth.

### Rol de `feature_sync.md` tras la implementación

Deja de contener la lógica del Paso 0. Pasa a ser un activador que:
1. Configura jerarquía personalizada (Paso 1 actual — sin cambios)
2. Extiende el menú de alcance en step-03 (Paso 2 actual — sin cambios)

La lógica de ciclo de vida de features queda centralizada en `step-00-feature-lifecycle.md`.

---

## Flujo Completo

```
create-prd
  ├─ Opción Jira (get-features)   → FEATURE_CODE_JIRA=PROY-123
  └─ Opción Manual (prompting)    → FEATURE_CODE_JIRA=PENDING:mi-feature

        ↓ (más adelante)

sync-epics-stories
  ├─ step-01  Inicialización / continuación
  ├─ step-02  Auth Jira + config
  ├─ step-00  Ciclo de vida de features         ← NUEVO
  │    ├─ 0.1  Inventario + detectar conflictos   → Caso 2: pregunta al ingeniero
  │    ├─ 0.2  Resolver PENDING                   → Caso 1: crea en Jira, actualiza shards
  │    ├─ 0.3  Verificar/actualizar KEY reales     → Caso 3: falla si no existe; PUT si cambió nombre
  │    ├─ 0.4  Detectar shards eliminados          → Caso 4: pregunta archivar/cerrar/ignorar
  │    └─ 0.5  Actualizar synced_features en YAML
  ├─ step-03  Selección de alcance (extendido por feature_sync.md)
  ├─ step-04  Sync épicas
  └─ step-05  Sync historias
```
