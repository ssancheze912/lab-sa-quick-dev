# Pipeline sa-quick-dev — Epic 1: Project Foundation & Application Shell

> Generado: 2026-06-11 | Rama: claude/bold-wright-govo4l

## Resumen
- Historias procesadas: 3/3
- Exitosas (full pipeline): 2 (1.1, 1.3)
- Con fallos: 1 (1.2 — siesa-ui-kit no usado, Vitest stubs rotos)
- Quality Gate (Cobertura): CONCERNS (83% overall, 100% P0, 71% P1, 75% P2)

## Detalle por Historia

| Historia | Create | ATDD | Dev | ATDD-Run | Automate | Test Review | Code Review | Estado |
|----------|--------|------|-----|----------|----------|-------------|-------------|--------|
| 1.1 Project Init | ✅ | ✅ | ✅ | ⚠️ (2 intentos, 36/64 env-limited) | ✅ | ✅ PASS 92/100 | ✅ PASS | Completada |
| 1.2 Nav Shell | ✅ | ✅ | ✅ | ⚠️ (3 intentos, 57/60) | ✅ | ❌ FAIL | ❌ FAIL | Requiere atención |
| 1.3 DB Foundation | ✅ | ✅ | ✅ | ⏭️ SKIP (.NET env) | ✅ | ✅ PASS | ✅ PASS | Completada |

## Quality Gate

| Gate | Status | Detalle |
|------|--------|---------|
| Coverage P0 | ✅ PASS | 100% cubierto |
| Coverage P1 | ⚠️ CONCERNS | 71% (mínimo 80%) |
| Coverage P2 | ⚠️ CONCERNS | 75% (mínimo 80%) |
| Coverage Overall | ⚠️ CONCERNS | 83% |

## Historias que requieren atención manual

### Story 1.2 — Frontend Navigation Shell
1. **CRÍTICO**: `NavigationRail` y `NavigationBar` de `siesa-ui-kit` NO se usan — la implementación construyó componentes `<nav>` custom. Reemplazar con los componentes de la librería corporativa.
2. **CRÍTICO**: 20/25 tests de Vitest en `frontend/src/routes/__tests__/-navigation.test.tsx` usan `document.querySelector` sin `render()` de RTL — todos fallan. Reescribir con RTL render apropiado.
3. **MEDIO**: Test Playwright `should navigate to /contactos without full page reload` usa `framenavigated` que dispara incorrectamente en SPA pushState. Actualizar la lógica del test.

### Story 1.3 — Backend Database Foundation (observaciones no bloqueantes)
1. **WARNING**: `appsettings.Development.json` contiene `Password=postgres` hardcodeado. Usar .NET User Secrets o `appsettings.Development.local.json` gitignoreado.
2. **INFO**: `EFCore.NamingConventions` v9.0.0 con EF Core v10 preview — actualizar a v10 cuando esté disponible.

### Limitaciones ambientales (no bloqueantes)
- Backend .NET API no ejecutable en entorno CI (sin .NET 10 runtime) — tests ATDD de API fallan por `ECONNREFUSED`
- Firefox/Edge no instalados — tests Playwright de esos browsers skipped
- `dotnet ef database update` requiere PostgreSQL + .NET runtime local
