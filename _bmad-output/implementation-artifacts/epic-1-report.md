# Pipeline sa-quick-dev — Epic 1: Project Foundation & Application Shell

> Generado: 2026-06-21T04:53:47Z | Rama: claude/bold-wright-n4dkxq

## Resumen

- Historias procesadas: 3/3
- Exitosas (full pipeline): 1 (1.3 PASS con observaciones)
- Con fallos en Code Review: 2 (1.1 FAIL, 1.2 FAIL)
- ATDD-run bloqueadas por entorno: 2 (1.1 y 1.3 — .NET 10 no instalado)
- Quality Gate (Cobertura): CONCERNS (94% overall, P1 83%)

## Detalle por Historia

| Historia | Create | ATDD | Dev | ATDD-Run | Automate | Test Review | Code Review | Estado |
|----------|--------|------|-----|----------|----------|-------------|-------------|--------|
| 1.1 Project Initialization | ✅ | ✅ | ✅ | ⚠️ (2 intentos, 11 fallos entorno: .NET) | ✅ | ✅ 93/100 | ❌ FAIL | in-progress |
| 1.2 Frontend Navigation Shell | ✅ | ✅ | ✅ | ⚠️ (2 intentos, PASS en 2do) | ✅ | ✅ PASS | ❌ FAIL | in-progress |
| 1.3 Backend Database Foundation | ✅ | ✅ | ✅ | ⏭️ (env: .NET no instalado) | ✅ | ✅ 97/100 A+ | ✅ PASS | review |

## Quality Gate

| Gate | Status | Detalle |
|------|--------|---------|
| Coverage P0 | ✅ PASS | 100% (5/5 criterios) |
| Coverage P1 | ⚠️ CONCERNS | 83% (5/6) — bajo umbral 90% |
| Coverage Overall | ⚠️ CONCERNS | 94% (16/17 criterios) |

## Historias que requieren atención manual

### Story 1.1 — Project Initialization & Repository Structure (Code Review FAIL)
- **[CRÍTICO]** `SolutionInitializationTests.cs` es un placeholder sin valor real — debe reemplazarse con tests unitarios de la solución
- **[CRÍTICO]** Falta patrón DDD factory en `Entity.cs` base — agregar método estático `Create()` según estándar de la empresa
- **[HIGH]** 2 issues adicionales de test accuracy (CORS acepta `*`, AC5 no verifica capas reales)
- **Estado:** in-progress, requiere corrección antes de merge

### Story 1.2 — Frontend Navigation Shell (Code Review FAIL)
- **[HIGH]** `LayoutBase` de siesa-ui-kit no se usa — AC#1 lo requiere explícitamente; el fix de ATDD lo reemplazó con layout custom. Evaluar `navigationRailProps` para exponer `data-testid` sin abandonar el kit
- **[HIGH]** AC#8 sin cobertura E2E — agregar test Playwright para ruta `/ruta-inexistente` → 404 con shell persistente
- **Estado:** in-progress, requiere corrección antes de merge

### Gap Quality Gate (CONCERNS)
- **AC-1.2.8** (NotFound route): falta E2E Playwright test — solo cubierto a nivel de componente. Misma causa que el HIGH de Story 1.2.
