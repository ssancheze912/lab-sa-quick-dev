---
description: 'Pipeline secuencial de sub-agentes por épica: crea, desarrolla y revisa TODAS las historias de una o varias épicas usando sub-agentes aislados con integración TEA completa (ATDD + Automate + Review + Test Design + Trace). Acepta una épica individual (ej: 3) o un rango (ej: 1-4).'
---

## PASO 0 — Identificar las épicas a procesar

### 0.1 — Parsear $ARGUMENTS y construir la lista de épicas

Lee `$ARGUMENTS` y determina el modo:

- **Sin argumentos**: pregunta al usuario:
  ```
  ¿Qué épica(s) deseas procesar? Puedes ingresar una épica (ej: 3) o un rango (ej: 1-4)
  ```
  **ESPERA** la respuesta antes de continuar.

- **Número simple** (ej: `3`): lista de épicas = `[3]`

- **Rango** (ej: `1-4`): expande el rango inclusive. Ejemplo: `1-4` → `[1, 2, 3, 4]`

Guarda esta lista como `EPIC_LIST`. Todas las épicas se procesarán secuencialmente en orden ascendente.

Informa al usuario:
```
Épicas a procesar: {EPIC_LIST}
Se procesarán en orden. El estado se lee de sprint-status.yaml — las épicas y stories ya en estado "done" se omiten automáticamente.
```

---

A partir de aquí, para **cada épica N en EPIC_LIST**, ejecuta los pasos 0.2 al PASO 2 completos antes de pasar a la siguiente épica.

---

### 0.2 — Leer sprint-status.yaml

Lee el archivo `_bmad-output/implementation-artifacts/sprint-status.yaml`. Este es la fuente de verdad para el estado del proyecto.

Extrae de la sección `development_status`:
- El status de la épica actual (`epic-N: {status}`)
- El status de cada story de esa épica (entradas `{N}-{M}-{slug}: {status}`)

Si el status de la épica N es `done`, **omítela completamente** e informa:
```
Épica N: ya completada (done) — omitida.
```
Continúa con la siguiente épica de EPIC_LIST.

### 0.3 — Resolver la fuente de la épica

Con la épica N seleccionada, determina dónde están los detalles:

1. Busca en `sprint-status.yaml` si existe el marcador `epic-N-source` (ej: `epic-3-source: _bmad-output/planning-artifacts/epics/epic-02-metodos.md`)
2. **Si existe `epic-N-source`**: la fuente es el archivo shardeado indicado en ese marcador. Léelo para obtener las historias de la épica.
3. **Si NO existe `epic-N-source`**: la fuente es el archivo consolidado `_bmad-output/planning-artifacts/epics.md`. Léelo y extrae la sección de la épica N.

### 0.4 — Identificar historias pendientes

Con la fuente de la épica resuelta y el `sprint-status.yaml`:
- Cruza las historias definidas en la fuente de la épica con los estados del `sprint-status.yaml`
- Las historias pendientes son aquellas cuyo status NO es `done`
- Ordénalas por su número de historia (N-M)

Informa al usuario cuántas historias se van a procesar y cuáles son, con su status actual.

### 0.5 — Integración TEA

El pipeline siempre ejecuta el módulo TEA completo (ATDD + Automate + Review + Test Design + Trace). No hay modos opcionales.

---

> Los pasos 0.6 y 0.7 siempre se ejecutan.

### 0.6 — Verificar Test Framework

Verifica si existe `playwright.config.ts`, `playwright.config.js`, `cypress.config.ts` o `cypress.config.js` en el proyecto.

- **Si existe**: el framework ya está configurado. Continúa al paso 0.7.
- **Si NO existe**: usa el sub-agente `sa-tea-framework` para inicializarlo.

```
Proyecto: {PROJECT_NAME}
Directorio raíz: {PROJECT_ROOT}
```

**ESPERA** a que complete antes de continuar.

### 0.7 — Test Design de la épica

Ejecuta el sub-agente `sa-tea-test-design` pasando:

```
Épica: {EPIC_NUMBER} - {EPIC_TITLE}
Fuente de la épica: {EPIC_SOURCE_FILE_PATH}
Modo: epic-level
```

**ESPERA** a que complete antes de iniciar el loop de historias.

---

## PASO 1 — Loop de procesamiento por historia

Para CADA historia pendiente de la épica seleccionada, ejecuta secuencialmente los sub-agentes dedicados. Cada historia completa su ciclo completo antes de pasar a la siguiente.

Los sub-agentes están definidos en `.claude/agents/` y DEBES invocarlos por nombre usando la herramienta Agent con `subagent_type`.

---

### SUB-AGENTE A — Create Story

Usa la herramienta Agent con `subagent_type: "sa-create-story"` y pasa como prompt:

```
Épica: {EPIC_NUMBER} - {EPIC_TITLE}
Fuente de la épica: {EPIC_SOURCE_FILE_PATH}
Historia a crear: Story {N}.{M}: {STORY_TITLE}
Descripción: {STORY_DESCRIPTION_FROM_EPICS_FILE}
```

**ESPERA** a que complete. Si falla, registra el fallo y pasa a la siguiente historia.

---

### SUB-AGENTE A.5 — ATDD

Solo si el SUB-AGENTE A fue exitoso, usa la herramienta Agent con `subagent_type: "sa-tea-atdd"` y pasa como prompt:

```
Historia a procesar: {STORY_FILE_PATH}
Épica: {EPIC_NUMBER} - {EPIC_TITLE}
Fuente de la épica: {EPIC_SOURCE_FILE_PATH}
```

**ESPERA** a que complete.

> Si falla, registra el fallo como no-bloqueante y **CONTINÚA** con el SUB-AGENTE B. Los tests ATDD no son prerequisito para la implementación.

---

### SUB-AGENTE B — Dev Story

Solo si el SUB-AGENTE A fue exitoso, usa la herramienta Agent con `subagent_type: "sa-dev-story"` y pasa como prompt:

```
Historia a implementar: {STORY_FILE_PATH}
Épica: {EPIC_NUMBER} - {EPIC_TITLE}
Fuente de la épica: {EPIC_SOURCE_FILE_PATH}
```

**ESPERA** a que complete. Si falla, registra el fallo y pasa a la siguiente historia.

---

### SUB-AGENTE B.1 — ATDD Verify (loop de corrección)

Solo si el SUB-AGENTE B fue exitoso Y el SUB-AGENTE A.5 generó tests, ejecuta este loop.
Si A.5 falló o no generó tests, omite este paso y continúa con B.5.

Ejecuta hasta **3 intentos en total** (1 inicial + 2 reintentos):

#### Intento N:

Usa la herramienta Agent con `subagent_type: "sa-tea-atdd-run"` y pasa como prompt:

```
Historia: {STORY_FILE_PATH}
Archivos de test ATDD: {ATDD_TEST_FILES_PATH}
Épica: {EPIC_NUMBER} - {EPIC_TITLE}
```

**ESPERA** a que complete y evalúa el resultado:

- **PASS** → todos los tests en GREEN. Continúa con el SUB-AGENTE B.5.
- **SKIP** → no se encontraron los archivos. Registra como advertencia y continúa con B.5.
- **FAIL** (y quedan reintentos) → re-invoca el SUB-AGENTE B con contexto adicional:

```
Historia a implementar: {STORY_FILE_PATH}
Épica: {EPIC_NUMBER} - {EPIC_TITLE}
Fuente de la épica: {EPIC_SOURCE_FILE_PATH}
CORRECCIÓN REQUERIDA — Tests ATDD fallidos (intento {N}/3):
{OUTPUT_COMPLETO_DE_ATDD_RUN con nombres de tests fallidos y mensajes de error}
Corrige la implementación para que estos tests pasen a GREEN.
```

- **FAIL** (sin reintentos restantes, tras 3 intentos) → registra la historia como FAIL con motivo "ATDD no pasaron a GREEN tras 3 intentos" y pasa a la siguiente historia. No ejecuta B.5, B.6 ni C.

---

### SUB-AGENTE B.5 — Test Automate

Solo si el SUB-AGENTE B fue exitoso, usa la herramienta Agent con `subagent_type: "sa-tea-automate"` y pasa como prompt:

```
Historia a procesar: {STORY_FILE_PATH}
Épica: {EPIC_NUMBER} - {EPIC_TITLE}
Fuente de la épica: {EPIC_SOURCE_FILE_PATH}
Tests ATDD generados: {ATDD_TEST_FILES_PATH_OR_"ninguno si A.5 falló"}
```

**ESPERA** a que complete. Si falla, registra el fallo y continúa con el SUB-AGENTE B.6 / C.

---

### SUB-AGENTE B.6 — Test Review

Solo si el SUB-AGENTE B.5 fue exitoso, usa la herramienta Agent con `subagent_type: "sa-tea-review"` y pasa como prompt:

```
Historia revisada: {STORY_FILE_PATH}
Épica: {EPIC_NUMBER} - {EPIC_TITLE}
Directorio de tests de la historia: {STORY_TEST_DIR}
```

**ESPERA** a que complete. Si falla, registra el fallo y continúa con el SUB-AGENTE C.

---

### SUB-AGENTE C — Code Review

Solo si el SUB-AGENTE B fue exitoso, usa la herramienta Agent con `subagent_type: "sa-code-review"` y pasa como prompt:

```
Historia a revisar: {STORY_FILE_PATH}
Épica: {EPIC_NUMBER} - {EPIC_TITLE}
Fuente de la épica: {EPIC_SOURCE_FILE_PATH}
```

**ESPERA** a que complete.

---

### Feedback intermedio por historia

Después de completar todos los sub-agentes para una historia, muestra al usuario un resumen breve de UNA línea.

```
✅ Story {N}.{M} [{título}]: create ✅ → atdd ✅ → dev ✅ → atdd-run ✅ → automate ✅ → test-review ✅ → review ✅ (PASS)
```

Si hubo reintentos en atdd-run, indica cuántos:
```
✅ Story {N}.{M} [{título}]: create ✅ → atdd ✅ → dev ✅ → atdd-run ⚠️(2 intentos) → automate ✅ → test-review ✅ → review ✅ (PASS)
```

En caso de fallo:
```
❌ Story {N}.{M} [{título}]: create ✅ → atdd ✅ → dev ✅ → atdd-run ❌(3/3) → (FAIL: ATDD no pasaron a GREEN)
```

Luego continúa con la siguiente historia.

---

## PASO 2 — Quality Gate TEA y Reporte Final

### Quality Gate TEA

Al completar el loop de todas las historias, ejecuta el gate de la épica.

#### Gate — Traceability + Quality Gate

Usa la herramienta Agent con `subagent_type: "sa-tea-trace"` y pasa como prompt:

```
Épica: {EPIC_NUMBER} - {EPIC_TITLE}
Fuente de la épica: {EPIC_SOURCE_FILE_PATH}
Historias procesadas: {LISTA_DE_STORY_FILE_PATHS}
```

**ESPERA** a que complete.

---

### Reporte Final

Al completar TODAS las historias y el gate TEA, genera el archivo de reporte en:

```
_bmad-output/implementation-artifacts/epic-{N}-report.md
```

El contenido del archivo debe seguir esta estructura:

```markdown
# Pipeline sa-quick-dev — Epic {N}: {título}

> Generado: {FECHA_ISO} | Rama: {GIT_BRANCH}

## Resumen
- Historias procesadas: X/Y
- Exitosas (full pipeline): X
- Con fallos: X
- Quality Gate (Cobertura): PASS / CONCERNS / FAIL

## Detalle por Historia

| Historia | Create | ATDD | Dev | ATDD-Run | Automate | Test Review | Code Review | Estado |
|----------|--------|------|-----|----------|----------|-------------|-------------|--------|
| {N}.1    | ✅     | ✅   | ✅  | ✅ (1)   | ✅       | ✅          | ✅ PASS      | Completada |
| {N}.2    | ✅     | ✅   | ✅  | ⚠️ (2)  | ✅       | ⏭️         | ✅ PASS      | Completada |
| {N}.3    | ✅     | ❌   | ✅  | ⏭️      | ✅       | ✅          | ✅ PASS      | Completada |

## Quality Gate

| Gate | Status | Detalle |
|------|--------|---------|
| Coverage P0 | ✅ PASS | 100% cubierto |
| Coverage Overall | ⚠️ CONCERNS | 78% (mínimo 80%) |

## Historias que requieren atención manual
- [lista de historias con fallos y razón, o "Ninguna" si todas pasaron]
```

Una vez escrito el archivo, informa al usuario:

```
Reporte guardado en: _bmad-output/implementation-artifacts/epic-{N}-report.md
```

Si TODAS las historias pasaron y el gate TEA es PASS, confirma al usuario que la épica está completa.
Si alguna falló o el gate está en CONCERNS/FAIL, indica cuáles requieren intervención manual y por qué.

Luego **continúa con la siguiente épica de EPIC_LIST** repitiendo desde el PASO 0.2.

---

## PASO 3 — Resumen global del rango (solo si EPIC_LIST tiene más de una épica)

Al completar el procesamiento de TODAS las épicas de EPIC_LIST, muestra un resumen consolidado:

```
## Resumen del pipeline — Épicas {EPIC_LIST_START}-{EPIC_LIST_END}

| Épica | Historias | Exitosas | Con fallos | Gate TEA | Reporte |
|-------|-----------|----------|------------|----------|---------|
| N     | X/Y       | X        | X          | PASS/CONCERNS/FAIL | epic-N-report.md |
| ...   | ...       | ...      | ...        | ...      | ...     |

Total: X épicas procesadas. X completadas, X con atención manual requerida.
```

Si hay épicas con fallos o gates en CONCERNS/FAIL, lista los archivos de reporte para revisión manual.
